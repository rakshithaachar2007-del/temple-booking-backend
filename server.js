const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// In-memory Database
let slots = [
  { id: 101, temple: "Sri Krishna Temple", date: "2026-08-20", time: "06:00 AM - 08:00 AM", capacity: 50, booked: 42 },
  { id: 102, temple: "Sri Krishna Temple", date: "2026-08-20", time: "09:00 AM - 11:00 AM", capacity: 50, booked: 50 }, // Fully booked
  { id: 103, temple: "Sri Krishna Temple", date: "2026-08-20", time: "04:00 PM - 06:00 PM", capacity: 60, booked: 20 },
  { id: 104, temple: "Sri Krishna Temple", date: "2026-08-21", time: "06:00 AM - 08:00 AM", capacity: 50, booked: 10 }
];

let bookings = [];
let nextBookingId = 1001;

// GET /api/slots - Fetch available slots
app.get('/api/slots', (req, res) => {
  try {
  
    res.status(200).json(slots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// POST /api/bookings - Create new booking
app.post('/api/bookings', (req, res) => {
  try {
    // Check if body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body cannot be empty. Send JSON data." });
    }

    const { visitorName, email, phone, slotId, visitorCount } = req.body;

    // Basic Validation
    if (!visitorName || !email || !phone || !slotId || !visitorCount) {
      return res.status(400).json({ message: "All fields are required: visitorName, email, phone, slotId, visitorCount" });
    }

    const numVisitors = parseInt(visitorCount, 10);
    if (isNaN(numVisitors) || numVisitors < 1) {
      return res.status(400).json({ message: "Visitor count must be at least 1." });
    }

    const slot = slots.find(s => s.id === parseInt(slotId, 10));
    if (!slot) {
      return res.status(404).json({ message: "Selected time slot not found." });
    }

    if (slot.booked + numVisitors > slot.capacity) {
      return res.status(400).json({ 
        message: `Capacity exceeded. Only ${slot.capacity - slot.booked} spots remaining for this slot.` 
      });
    }

    // Deduct capacity
    slot.booked += numVisitors;

    const newBooking = {
      id: nextBookingId++,
      visitorName,
      email,
      phone,
      slotId: slot.id,
      temple: slot.temple,
      date: slot.date,
      time: slot.time,
      visitorCount: numVisitors,
      status: "Confirmed",
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    res.status(201).json({ message: "Booking confirmed successfully!", booking: newBooking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// GET /api/bookings - Fetch all bookings
 app.get('/api/bookings', (req, res) => {
  try{
    res.status(200).json(bookings);
} catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }  
});

// GET /api/bookings/:id - Fetch individual booking details
app.get('/api/bookings/:id', (req, res) => {
  try {
    const booking = bookings.find(b => b.id === parseInt(req.params.id, 10));
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// PUT /api/bookings/:id - Modify booking details
app.put('/api/bookings/:id', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const { visitorName, phone, status } = req.body;
    if (visitorName) booking.visitorName = visitorName;
    if (phone) booking.phone = phone;
    if (status) booking.status = status;

    res.status(200).json({ message: "Booking updated successfully.", booking });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// DELETE /api/bookings/:id - Cancel booking
app.delete('/api/bookings/:id', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const index = bookings.findIndex(b => b.id === bookingId);

    if (index === -1) {
      return res.status(404).json({ message: "Booking reference not found." });
    }

    const booking = bookings[index];
    const slot = slots.find(s => s.id === booking.slotId);
    
    // Reclaim capacity if slot exists
    if (slot) {
      slot.booked = Math.max(0, slot.booked - booking.visitorCount);
    }

    bookings.splice(index, 1);
    res.status(200).json({ message: `Booking #${bookingId} successfully canceled.` });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

const PORT = 5000;

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));