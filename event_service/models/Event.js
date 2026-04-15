const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    event_name: String,
    description: String,
    artist: String,
    event_date: Date,
    start_time: String,
    end_time: String,
    seat_count: Number,
    booked_seats: [String],
});

EventSchema.index({ event_name: "text", description: "text", artist: "text" });

module.exports = mongoose.model("Event", EventSchema);
