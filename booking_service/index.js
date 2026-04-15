require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const express = require("express");
const { sequelize } = require("./models");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5003;

app.use("/", bookingRoutes);

app.get("/", (req, res) => {
    res.send("booking service is running");
});

sequelize
    .sync()
    .then(() => {
        app.listen(PORT, () =>
            console.log(`Booking Service running on port ${PORT}`),
        );
    })
    .catch((err) => console.error("Database connection error:", err));
