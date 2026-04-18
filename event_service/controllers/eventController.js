const Event = require("../models/Event");

exports.searchEvents = async (req, res) => {
    try {
        const { q } = req.query;
        let query = {};
        if (q) {
            query = {
                $or: [
                    { event_name: { $regex: q, $options: "i" } },
                    { description: { $regex: q, $options: "i" } },
                    { artist: { $regex: q, $options: "i" } },
                ],
            };
        }
        const events = await Event.find(query);
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getEventDetails = async (req, res) => {
    try {
        const event = await Event.findById(req.params.event_id);
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.seedMockEvents = async (req, res) => {
    // 5 mock events with empty booked_seats
    const mockEvents = [
        {
            event_name: "Arijit Singh Live Concert",
            description: "Soulful melodies by India's singing sensation",
            artist: "Arijit Singh",
            event_date: new Date("2026-06-15"),
            start_time: "19:00",
            end_time: "22:00",
            seat_count: 20,
            ticket_price: 1500,
            booked_seats: [],
        },
        {
            event_name: "Coldplay World Tour",
            description: "Global rock icons live in Kolkata",
            artist: "Coldplay",
            event_date: new Date("2026-07-20"),
            start_time: "20:00",
            end_time: "23:30",
            seat_count: 20,
            ticket_price: 5000,
            booked_seats: [],
        },
        {
            event_name: "Kolkata Knight Riders Match",
            description: "IPL 2026 home game vs Mumbai Indians",
            artist: "KKR vs MI",
            event_date: new Date("2026-05-10"),
            start_time: "19:30",
            end_time: "23:00",
            seat_count: 20,
            ticket_price: 800,
            booked_seats: [],
        },
        {
            event_name: "Stand-up Comedy Night",
            description: "Zakir Khan brings laughter to Kolkata",
            artist: "Zakir Khan",
            event_date: new Date("2026-05-25"),
            start_time: "18:00",
            end_time: "20:30",
            seat_count: 20,
            ticket_price: 600,
            booked_seats: [],
        },
        {
            event_name: "BTS Fan Meet",
            description: "Exclusive fan event (sold out fast!)",
            artist: "BTS",
            event_date: new Date("2026-08-05"),
            start_time: "16:00",
            end_time: "19:00",
            seat_count: 20,
            ticket_price: 3000,
            booked_seats: [],
        },
    ];

    // Insert all events atomically
    const seededEvents = await Event.insertMany(mockEvents);

    res.send(seededEvents);
};
