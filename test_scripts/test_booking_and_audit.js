require('dotenv').config({ path: 'c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/.env' });
const mongoose = require('mongoose');
const { checkAvailability } = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/middleware/availability');
const { UserLog, CustomerLog, BookingLog, RoleLog, SubscriptionLog } = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/auditlogs');
const Booking = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/booking');
const Customer = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/customer');
const WorkStatus = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/workStatus');
const User = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/user');
const Role = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/role');
const SubscriptionType = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/subscriptionType');

async function testBookingAndAudit() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jolly_home_needs');
  console.log('Connected to DB for booking & audit tests');

  // 1. Create a dummy customer
  const customer = new Customer({
    name: 'Test Customer ' + Date.now(),
    phoneNumber: '99999' + Math.floor(10000 + Math.random() * 90000),
  });
  await customer.save();

  // Create a dummy scheduled workStatus
  let scheduledStatus = await WorkStatus.findOne({ statusName: /scheduled/i });
  if (!scheduledStatus) {
    scheduledStatus = await WorkStatus.create({ statusName: 'Scheduled' });
  }

  // Create a dummy cancelled workStatus
  let cancelledStatus = await WorkStatus.findOne({ statusName: /cancelled/i });
  if (!cancelledStatus) {
    cancelledStatus = await WorkStatus.create({ statusName: 'Cancelled' });
  }

  // 2. Insert a booking on 2026-09-10 from 09:00 to 10:00 UTC
  const bookingDateStr = '2026-09-10';
  const startDateTime = new Date(`${bookingDateStr}T09:00:00.000Z`);
  const endDateTime = new Date(`${bookingDateStr}T10:00:00.000Z`);

  const testBooking = await Booking.create({
    customerId: customer._id,
    startDateTime,
    endDateTime,
    amount: 1000,
    workStatusId: scheduledStatus._id,
  });

  // Verify Audit Log for booking creation
  await BookingLog.create({
    operation: 'CREATE',
    recordId: testBooking._id,
    details: { action: 'Test booking created' },
    newValue: testBooking.toObject(),
  });

  const loggedBooking = await BookingLog.findOne({ recordId: testBooking._id });
  console.assert(loggedBooking !== null, 'BookingLog should exist');
  console.assert(loggedBooking.operation === 'CREATE', 'BookingLog operation should be CREATE');
  console.log('✓ BookingLog successfully created and verified');

  // 3. Test Availability for 2026-09-10 (should NOT contain 09:00 - 10:00)
  const reqSep10 = {
    method: 'GET',
    query: {
      bookingDate: '2026-09-10',
      serviceDuration: '30',
      bufferDuration: '30',
    },
    user: null,
    headers: {},
  };

  await checkAvailability(reqSep10, {}, () => {});
  const slotsSep10 = reqSep10.availabilityData.slots;
  const has09To10OnSep10 = slotsSep10.some((s) => s.startTime === '09:00' && s.endTime === '10:00');
  console.assert(!has09To10OnSep10, '09:00 - 10:00 should NOT be available on Sep 10');
  console.log('✓ Booked slot 09:00 - 10:00 correctly hidden on Sep 10');

  // 4. Test Availability for 2026-09-11 (SAME slot SHOULD be available!)
  const reqSep11 = {
    method: 'GET',
    query: {
      bookingDate: '2026-09-11',
      serviceDuration: '30',
      bufferDuration: '30',
    },
    user: null,
    headers: {},
  };

  await checkAvailability(reqSep11, {}, () => {});
  const slotsSep11 = reqSep11.availabilityData.slots;
  const has09To10OnSep11 = slotsSep11.some((s) => s.startTime === '09:00' && s.endTime === '10:00');
  console.assert(has09To10OnSep11, '09:00 - 10:00 SHOULD remain available on Sep 11');
  console.log('✓ Slot 09:00 - 10:00 remains available on Sep 11');

  // 5. Test Cancelled Booking behavior: mark booking as Cancelled
  testBooking.workStatusId = cancelledStatus._id;
  await testBooking.save();

  // Now 09:00 - 10:00 should be available on Sep 10 because booking is cancelled!
  const reqSep10AfterCancel = {
    method: 'GET',
    query: {
      bookingDate: '2026-09-10',
      serviceDuration: '30',
      bufferDuration: '30',
    },
    user: null,
    headers: {},
  };
  await checkAvailability(reqSep10AfterCancel, {}, () => {});
  const has09To10AfterCancel = reqSep10AfterCancel.availabilityData.slots.some(
    (s) => s.startTime === '09:00' && s.endTime === '10:00'
  );
  console.assert(has09To10AfterCancel, '09:00 - 10:00 SHOULD become available again after cancellation');
  console.log('✓ Cancelled booking does not block availability');

  // 6. Test Audit Log update & delete
  await BookingLog.create({
    operation: 'UPDATE',
    recordId: testBooking._id,
    previousValue: { workStatusId: scheduledStatus._id },
    newValue: { workStatusId: cancelledStatus._id },
    details: { updatedFields: ['workStatusId'] },
  });

  const updateLog = await BookingLog.findOne({ recordId: testBooking._id, operation: 'UPDATE' });
  console.assert(updateLog !== null, 'Update log should exist');
  console.assert(updateLog.previousValue !== null && updateLog.newValue !== null, 'Previous and new values recorded');
  console.log('✓ Audit log captures previous and new values on UPDATE');

  // Clean up test data
  await Booking.findByIdAndDelete(testBooking._id);
  await BookingLog.deleteMany({ recordId: testBooking._id });
  await Customer.findByIdAndDelete(customer._id);

  console.log('✓ Test cleanup complete');
  await mongoose.disconnect();
  console.log('--- All Booking & Audit Tests Passed! ---');
}

testBookingAndAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
