require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;
console.log(process.env.PORT);
mongoose
    .connect(MONGO_URI)
    .then(() => console.log("Auth Service: Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

app.use("/", authRoutes);

app.get("/", (req, res) => {
    res.send("authentication service is running");
});

app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
