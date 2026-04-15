const { Ticket } = require('../models');

exports.bookTickets = async (req, res) => {
    try {
        const { user_id, event_id, seats } = req.body;
        // seats is an array of seat_ids
        if (!Array.isArray(seats)) return res.status(400).json({ error: 'seats must be an array of seat_ids' });

        const bookings = [];
        for (const seat_id of seats) {
            bookings.push({ user_id, event_id, seat_id });
        }
        
        await Ticket.bulkCreate(bookings);
        res.status(201).json({ message: 'Tickets booked successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTicketDetails = async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.ticket_id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
