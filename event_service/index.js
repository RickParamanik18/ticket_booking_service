require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const eventRoutes = require("./routes/eventRoutes");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI;

mongoose
    .connect(MONGO_URI)
    .then(() => console.log("Event Service: Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

app.use("/", eventRoutes);

app.get("/", (req, res) => {
    res.send("event service is running");
});

app.listen(PORT, () => console.log(`Event Service running on port ${PORT}`));
