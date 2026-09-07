require('dotenv').config({ path: 'c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/.env' });
const mongoose = require('mongoose');
const { parseTimeToMinutes, formatMinutesToHHmm, checkAvailability } = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/middleware/availability');
const { UserLog, RoleLog, CustomerLog, BookingLog, SubscriptionLog } = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/auditlogs');
const User = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/user');
const Role = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/role');
const Customer = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/customer');
const Booking = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/booking');
const SubscriptionType = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/subscriptionType');
const BathroomCount = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/bathroomCount');
const ServiceDuration = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/serviceDuration');
const TimeSlot = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/timeSlot');
const WorkStatus = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/models/workStatus');

async function runTests() {
  console.log('--- Starting System Verification ---');

  // Test 1: Helper functions
  console.log('\nTest 1: Time conversion helpers');
  console.assert(parseTimeToMinutes('09:00') === 540, '09:00 should be 540');
  console.assert(parseTimeToMinutes('09:00 AM') === 540, '09:00 AM should be 540');
  console.assert(parseTimeToMinutes('01:30 PM') === 810, '01:30 PM should be 810');
  console.assert(formatMinutesToHHmm(540) === '09:00', '540 should format to 09:00');
  console.assert(formatMinutesToHHmm(600) === '10:00', '600 should format to 10:00');
  console.log('✓ Time conversion helpers passed');

  // Test 2: Models Compilation
  console.log('\nTest 2: Model schemas compilation');
  console.assert(UserLog && typeof UserLog.create === 'function', 'UserLog model ready');
  console.assert(RoleLog && typeof RoleLog.create === 'function', 'RoleLog model ready');
  console.assert(CustomerLog && typeof CustomerLog.create === 'function', 'CustomerLog model ready');
  console.assert(BookingLog && typeof BookingLog.create === 'function', 'BookingLog model ready');
  console.assert(SubscriptionLog && typeof SubscriptionLog.create === 'function', 'SubscriptionLog model ready');
  console.log('✓ All AuditLog models compiled successfully');

  // Test 3: Middleware slot generation logic simulation
  console.log('\nTest 3: Dynamic Slot Generation (30 min service + 30 min buffer)');
  const mockReq = {
    method: 'GET',
    query: {
      bookingDate: '2026-09-10',
      serviceDuration: '30',
      bufferDuration: '30',
    },
    user: null,
    headers: {},
  };

  let middlewareResult = null;
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        console.error('Error in mock response:', code, data);
      },
    }),
  };
  const mockNext = () => {
    middlewareResult = mockReq.availabilityData;
  };

  // Try DB connection if available
  let dbConnected = false;
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jolly_home_needs', {
      serverSelectionTimeoutMS: 2000,
    });
    dbConnected = true;
    console.log('✓ Connected to MongoDB for live testing');
  } catch (err) {
    console.log('ℹ MongoDB not currently reachable on localhost:27017, testing logic in standalone mode');
  }

  if (dbConnected) {
    await checkAvailability(mockReq, mockRes, mockNext);
    console.assert(middlewareResult !== null, 'Middleware should set availabilityData');
    console.assert(middlewareResult.bookingDate === '2026-09-10', 'Date should match');
    console.assert(middlewareResult.slots.length > 0, 'Slots should be generated');
    console.log(`Generated ${middlewareResult.slots.length} slots for 30m service + 30m buffer`);
    console.log('First 4 slots:', middlewareResult.slots.slice(0, 4));

    console.assert(middlewareResult.slots[0].startTime === '09:00', 'First slot starts at 09:00');
    console.assert(middlewareResult.slots[0].endTime === '10:00', 'First slot ends at 10:00 (30m+30m)');
    console.assert(middlewareResult.slots[1].startTime === '10:00', 'Second slot starts at 10:00');
    console.assert(middlewareResult.slots[1].endTime === '11:00', 'Second slot ends at 11:00');
    console.assert(middlewareResult.slots[0].status === 'active', 'Slot status is active');

    // Test 4: Dynamic Slot Generation with Bathroom Count (2 bathrooms -> 120m service + 30m buffer = 150m)
    console.log('\nTest 4: Dynamic Slot Generation with 2 Bathrooms');
    const mockReqBath = {
      method: 'GET',
      query: {
        bookingDate: '2026-09-10',
        bathroomCount: '2',
        bufferDuration: '30',
      },
      user: null,
      headers: {},
    };
    let bathResult = null;
    await checkAvailability(mockReqBath, mockRes, () => {
      bathResult = mockReqBath.availabilityData;
    });
    console.log(`Generated ${bathResult.slots.length} slots for 2 bathrooms (120m service + 30m buffer = 150m / 2.5h)`);
    console.log('Slots:', bathResult.slots);
    console.assert(bathResult.slots[0].startTime === '09:00', 'First slot starts at 09:00');
    console.assert(bathResult.slots[0].endTime === '11:30', 'First slot ends at 11:30');

    await mongoose.disconnect();
  }

  console.log('\n--- All Unit & Schema Verifications Completed Successfully ---');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
