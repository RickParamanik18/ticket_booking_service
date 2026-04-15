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
