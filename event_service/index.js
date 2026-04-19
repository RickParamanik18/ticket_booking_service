require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const eventRoutes = require("./routes/eventRoutes");
const { Kafka } = require("kafkajs");
const Event = require("./models/Event");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI;

mongoose
    .connect(MONGO_URI)
    .then(() => console.log("Event Service: Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

//KAFKA CODE
const kafka = new Kafka({
    clientId: "ticket_booking_service",
    brokers: ["kafka:9092"],
});
const kafkaListen = async () => {
    const consumer = kafka.consumer({ groupId: "booking" });
    await consumer.connect();
    await consumer.subscribe({ topic: "booking", fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const parsedMsg = JSON.parse(message.value.toString());
            const event_id = parsedMsg.event_id;
            const seats = JSON.parse(parsedMsg.seats);
            console.log({ event_id, seats });
            const result = await Event.findByIdAndUpdate(
                event_id,
                { $push: { booked_seats: { $each: seats } } },
                { new: true },
            );
            console.log("DB Result", result);
        },
    });
};

kafkaListen();

app.use("/", eventRoutes);

app.get("/", (req, res) => {
    res.send("event service is running");
});

app.listen(PORT, () => console.log(`Event Service running on port ${PORT}`));
