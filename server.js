require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const activeStatusRoutes = require('./routes/activeStatusRoutes');
const customerRoutes = require('./routes/customerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const serviceDurationRoutes = require('./routes/serviceDurationRoutes');
const serviceFrequencyRoutes = require('./routes/serviceFrequencyRoutes');
const subscriptionTypeRoutes = require('./routes/subscriptionTypeRoutes');
const timeSlotRoutes = require('./routes/timeSlotRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const paymentAccountRoutes = require('./routes/paymentAccountRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const bathroomCountRoutes = require('./routes/bathroomCountRoutes');
const workStatusRoutes = require('./routes/workStatusRoutes');
const bookingDateRoutes = require('./routes/bookingDateRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Jolly Home Needs API is running', timestamp: new Date() });
});

// API Routes
app.use(['/api/users', '/api/user'], userRoutes);
app.use(['/api/roles', '/api/role'], roleRoutes);
app.use(['/api/permissions', '/api/permission'], permissionRoutes);
app.use(['/api/active-statuses', '/api/active-status', '/api/activestatuses', '/api/statuses'], activeStatusRoutes);
app.use(['/api/customers', '/api/customer'], customerRoutes);
app.use(['/api/bookings', '/api/booking'], bookingRoutes);
app.use(['/api/service-durations', '/api/service-duration', '/api/servicedurations', '/api/durations'], serviceDurationRoutes);
app.use(['/api/service-frequencies', '/api/service-frequency', '/api/servicefrequencies', '/api/frequencies'], serviceFrequencyRoutes);
app.use(['/api/subscription-types', '/api/subscription-type', '/api/subscriptiontypes', '/api/subscriptions'], subscriptionTypeRoutes);
app.use(['/api/time-slots', '/api/time-slot', '/api/timeslots', '/api/slots'], timeSlotRoutes);
app.use(['/api/payments', '/api/payment-methods', '/api/payment-method', '/api/methods'], paymentMethodRoutes);
app.use(['/api/accounts', '/api/payment-accounts', '/api/payment-account'], paymentAccountRoutes);
app.use(['/api/invoices', '/api/invoice'], invoiceRoutes);
app.use('/api/pricing', pricingRoutes);
app.use(['/api/bathroom-counts', '/api/bathroom-count', '/api/bathroomcounts', '/api/bathrooms'], bathroomCountRoutes);
app.use(['/api/work-statuses', '/api/work-status', '/api/workstatuses'], workStatusRoutes);
app.use(['/api/dates', '/api/date', '/api/booking-dates', '/api/booking-date'], bookingDateRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

module.exports = app;
