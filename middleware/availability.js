const Booking = require('../models/booking');
const TimeSlot = require('../models/timeSlot');
const SubscriptionType = require('../models/subscriptionType');
const BathroomCount = require('../models/bathroomCount');
const ServiceDuration = require('../models/serviceDuration');
const Pricing = require('../models/pricing');

// Helper to parse time string ("09:00", "09:00 AM", "01:30 PM", "14:00") into minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const cleaned = timeStr.trim().toUpperCase();

  const is12Hour = cleaned.includes('AM') || cleaned.includes('PM');
  if (is12Hour) {
    const isPM = cleaned.includes('PM');
    const timePart = cleaned.replace(/(AM|PM)/g, '').trim();
    const [hoursStr, minutesStr = '0'] = timePart.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  const [hoursStr, minutesStr = '0'] = cleaned.split(':');
  return parseInt(hoursStr, 10) * 60 + parseInt(minutesStr, 10);
};

// Helper to format minutes from midnight into "HH:mm" (24-hour format)
const formatMinutesToHHmm = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Dynamic Availability Middleware
 * Follows the 12-step availability calculation flow:
 * 1. Validate requested booking date
 * 2. Retrieve applicable subscription/plan
 * 3. Determine service duration
 * 4. Determine buffer duration
 * 5. Calculate total slot duration (service + buffer)
 * 6. Consider bathroom count
 * 7. Retrieve operating hours
 * 8. Generate possible time slots
 * 9. Check existing bookings for the requested date
 * 10. Remove/hide already-booked slots
 * 11. Mark remaining slots as available (status: 'active')
 * 12. Log availability operation and pass to controller
 */
const checkAvailability = async (req, res, next) => {
  try {
    const params = req.method === 'POST' ? req.body : req.query;
    const {
      bookingDate,
      date,
      subscriptionTypeId,
      subscriptionId,
      subscriptionName,
      bathroomCount,
      bathroomCountId,
      bathrooms,
      serviceDuration,
      serviceDurationId,
      duration,
      bufferDuration,
      bufferTime,
    } = params;

    // 1. Validate requested booking date
    const rawDateStr = bookingDate || date;
    if (!rawDateStr) {
      return res.status(400).json({
        message: 'bookingDate is required (format: YYYY-MM-DD)',
      });
    }

    const requestedDate = new Date(rawDateStr);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid bookingDate format. Please use YYYY-MM-DD.',
      });
    }

    const yyyy = requestedDate.getFullYear();
    const mm = String(requestedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(requestedDate.getDate()).padStart(2, '0');
    const normalizedDateStr = `${yyyy}-${mm}-${dd}`;

    // 2. Retrieve applicable subscription/plan
    let plan = null;
    const subRef = subscriptionTypeId || subscriptionId;
    if (subRef) {
      try {
        plan = await SubscriptionType.findById(subRef);
      } catch (err) {
        // Not a valid ObjectId, search by name
        plan = await SubscriptionType.findOne({
          subscriptionName: new RegExp(`^${subRef}$`, 'i'),
        });
      }
    } else if (subscriptionName) {
      plan = await SubscriptionType.findOne({
        subscriptionName: new RegExp(`^${subscriptionName}$`, 'i'),
      });
    }

    // 6. Consider bathroom count
    let resolvedBathroomCount = 1;
    const bathRef = bathroomCountId;
    const bathVal = bathroomCount || bathrooms;

    if (bathRef) {
      try {
        const bathDoc = await BathroomCount.findById(bathRef);
        if (bathDoc) resolvedBathroomCount = bathDoc.bathroomCount;
      } catch (err) {
        // Ignored, fallback to raw value
      }
    } else if (bathVal !== undefined && !isNaN(parseInt(bathVal, 10))) {
      resolvedBathroomCount = parseInt(bathVal, 10);
    }

    // 3. Determine service duration
    let resolvedServiceDuration = null;
    const durRef = serviceDurationId;
    const durVal = serviceDuration || duration;

    if (durVal !== undefined && !isNaN(parseInt(durVal, 10))) {
      resolvedServiceDuration = parseInt(durVal, 10);
    } else if (durRef) {
      try {
        const durDoc = await ServiceDuration.findById(durRef);
        if (durDoc) resolvedServiceDuration = durDoc.durationMinutes;
      } catch (err) {
        // Ignored
      }
    }

    // If not explicitly provided, try to look up pricing matrix for the bathroom count
    if (!resolvedServiceDuration) {
      if (bathRef) {
        const pricing = await Pricing.findOne({
          bathroomCountId: bathRef,
          isActive: true,
        }).populate('serviceDurationId');

        if (pricing && pricing.serviceDurationId) {
          resolvedServiceDuration = pricing.serviceDurationId.durationMinutes;
        }
      }
    }

    // If still not resolved, apply business rule: 60 mins per bathroom (1 bath = 60, 2 bath = 120, 3 bath = 180)
    if (!resolvedServiceDuration) {
      resolvedServiceDuration = resolvedBathroomCount * 60;
    }

    // 4. Determine buffer duration
    let resolvedBufferDuration = 30; // Default 30 mins buffer
    const bufVal = bufferDuration || bufferTime;

    if (bufVal !== undefined && !isNaN(parseInt(bufVal, 10))) {
      resolvedBufferDuration = parseInt(bufVal, 10);
    } else {
      // Check active timeSlot configuration in DB
      const configuredSlot = await TimeSlot.findOne({ bufferTime: { $gt: 0 } });
      if (configuredSlot && configuredSlot.bufferTime !== undefined) {
        resolvedBufferDuration = configuredSlot.bufferTime;
      }
    }

    // 5. Calculate total slot duration
    const totalSlotDuration = resolvedServiceDuration + resolvedBufferDuration;

    // 7. Retrieve applicable operating hours
    let operatingStartMinutes = 9 * 60; // 09:00 AM (540 mins)
    let operatingEndMinutes = 18 * 60 + 30; // 06:30 PM (1110 mins)

    const activeSlots = await TimeSlot.find();
    if (activeSlots.length > 0) {
      let minStart = Infinity;
      let maxEnd = -Infinity;
      activeSlots.forEach((slot) => {
        if (slot.startTime) {
          const s = parseTimeToMinutes(slot.startTime);
          if (s < minStart) minStart = s;
        }
        if (slot.endTime) {
          const e = parseTimeToMinutes(slot.endTime);
          if (e > maxEnd) maxEnd = e;
        }
      });
      if (minStart !== Infinity) operatingStartMinutes = minStart;
      if (maxEnd !== -Infinity && maxEnd > operatingStartMinutes) operatingEndMinutes = maxEnd;
    }

    // 8. Generate possible time slots
    const generatedSlots = [];
    let currentSlotStart = operatingStartMinutes;

    while (currentSlotStart + totalSlotDuration <= operatingEndMinutes) {
      const currentSlotEnd = currentSlotStart + totalSlotDuration;
      generatedSlots.push({
        startMinutes: currentSlotStart,
        endMinutes: currentSlotEnd,
        startTime: formatMinutesToHHmm(currentSlotStart),
        endTime: formatMinutesToHHmm(currentSlotEnd),
        serviceDuration: resolvedServiceDuration,
        bufferDuration: resolvedBufferDuration,
      });
      currentSlotStart = currentSlotEnd;
    }

    // 9. Check existing bookings for the requested date
    const startOfDay = new Date(`${normalizedDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${normalizedDateStr}T23:59:59.999Z`);

    const existingBookings = await Booking.find({
      startDateTime: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('workStatusId')
      .populate('timeSlotId');

    // Filter out cancelled bookings
    const activeBookings = existingBookings.filter((b) => {
      if (
        b.workStatusId &&
        b.workStatusId.statusName &&
        b.workStatusId.statusName.toLowerCase() === 'cancelled'
      ) {
        return false;
      }
      return true;
    });

    // 10. Remove/hide already-booked slots & 11. Mark remaining slots as available
    const availableSlots = [];
    let bookedCount = 0;

    for (const slot of generatedSlots) {
      const slotStartTimeVal = slot.startTime;
      const slotEndTimeVal = slot.endTime;

      // Construct Date objects on requestedDate for interval overlap check
      const slotStartDate = new Date(`${normalizedDateStr}T${slotStartTimeVal}:00.000Z`);
      const slotEndDate = new Date(`${normalizedDateStr}T${slotEndTimeVal}:00.000Z`);

      const isBooked = activeBookings.some((booking) => {
        // Check exact TimeSlot match
        if (booking.timeSlotId) {
          const bSlotStart = formatMinutesToHHmm(parseTimeToMinutes(booking.timeSlotId.startTime));
          if (bSlotStart === slotStartTimeVal) {
            return true;
          }
        }

        // Check time range overlap
        if (booking.startDateTime) {
          const bStart = new Date(booking.startDateTime);
          const bEnd = booking.endDateTime
            ? new Date(booking.endDateTime)
            : new Date(bStart.getTime() + totalSlotDuration * 60 * 1000);

          // Overlap condition: slotStartDate < bEnd && slotEndDate > bStart
          if (slotStartDate < bEnd && slotEndDate > bStart) {
            return true;
          }
        }

        return false;
      });

      if (isBooked) {
        bookedCount++;
      } else {
        availableSlots.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: 'active',
        });
      }
    }

    // 8. Availability Logging
    const userIdentifier = req.user ? req.user.userId : (req.headers['x-forwarded-for'] || req.ip || 'public');
    console.log(
      `[AVAILABILITY LOG] Date: ${normalizedDateStr} | Plan: ${
        plan ? plan.subscriptionName : 'None'
      } | Bathrooms: ${resolvedBathroomCount} | ServiceDur: ${resolvedServiceDuration}m | Buffer: ${resolvedBufferDuration}m | TotalDur: ${totalSlotDuration}m | Generated: ${
        generatedSlots.length
      } | Booked: ${bookedCount} | Available: ${availableSlots.length} | User: ${userIdentifier} | Timestamp: ${new Date().toISOString()}`
    );

    // Pass structured data to controller
    req.availabilityData = {
      bookingDate: normalizedDateStr,
      slots: availableSlots,
    };

    next();
  } catch (error) {
    console.error('Availability middleware error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  checkAvailability,
  parseTimeToMinutes,
  formatMinutesToHHmm,
};
