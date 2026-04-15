require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const express = require("express");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5004;

app.use("/", notificationRoutes);

app.get("/", (req, res) => {
    res.send("notification service is running");
});

app.listen(PORT, () =>
    console.log(`Notification Service running on port ${PORT}`),
);
