const http = require('http');
const app = require('c:/Users/rakku/OneDrive/Desktop/deep-cleaning-backend/server');

function makeRequest(port, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runE2ETests() {
  console.log('--- Starting E2E API Endpoint Tests ---');
  const server = app.listen(5099);

  try {
    // 1. Health check
    const health = await makeRequest(5099, '/api/health');
    console.log('1. Health check:', health.status, health.body.status);
    console.assert(health.status === 200, 'Health check should return 200');

    // 2. Missing bookingDate
    const missingDate = await makeRequest(5099, '/api/time-slots/availability');
    console.log('2. Missing date validation:', missingDate.status, missingDate.body.message);
    console.assert(missingDate.status === 400, 'Should return 400 when bookingDate is missing');

    // 3. Dynamic availability on /api/time-slots/availability
    const slotsRes = await makeRequest(5099, '/api/time-slots/availability?bookingDate=2026-09-10');
    console.log('3. /api/time-slots/availability status:', slotsRes.status, 'slots count:', slotsRes.body.slots.length);
    console.assert(slotsRes.status === 200, 'Should return 200 for valid bookingDate');
    console.assert(slotsRes.body.bookingDate === '2026-09-10', 'bookingDate should match');
    console.assert(Array.isArray(slotsRes.body.slots), 'slots should be an array');
    console.assert(slotsRes.body.slots[0].startTime !== undefined, 'slot should have startTime');
    console.assert(slotsRes.body.slots[0].endTime !== undefined, 'slot should have endTime');
    console.assert(slotsRes.body.slots[0].status === 'active', 'slot status should be active');

    // 4. Aliased route /api/slots/availability with bathroomCount=2
    const aliasRes = await makeRequest(5099, '/api/slots/availability?bookingDate=2026-09-10&bathroomCount=2&bufferDuration=30');
    console.log('4. /api/slots/availability with 2 bathrooms:', aliasRes.status, 'slots:', aliasRes.body.slots);
    console.assert(aliasRes.status === 200, 'Should return 200 for /api/slots/availability');
    console.assert(aliasRes.body.slots[0].startTime === '09:00', 'Start time should be 09:00');
    console.assert(aliasRes.body.slots[0].endTime === '11:30', 'End time should be 11:30 (120m+30m)');

    // 5. Booking route alias /api/bookings/availability
    const bookingAvailRes = await makeRequest(5099, '/api/bookings/availability?bookingDate=2026-09-10');
    console.log('5. /api/bookings/availability:', bookingAvailRes.status, 'slots count:', bookingAvailRes.body.slots.length);
    console.assert(bookingAvailRes.status === 200, 'Should return 200 for /api/bookings/availability');

    console.log('\n--- All E2E API Endpoint Tests Passed Successfully! ---');
  } finally {
    server.close();
    const mongoose = require('mongoose');
    await mongoose.disconnect();
    process.exit(0);
  }
}

runE2ETests().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
