require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Microservice Routes mapping
const services = {
    "/auth": "http://authentication_service:5001",
    "/events": "http://event_service:5002",
    "/bookings": "http://booking_service:5003",
    "/notifications": "http://notification_service:5004",
};

// Setup reverse proxies
for (const [route, target] of Object.entries(services)) {
    app.use(
        route,
        createProxyMiddleware({
            target,
            changeOrigin: true,
            pathRewrite: {
                [`^${route}`]: "",
            },
        }),
    );
}

app.get("/", (req, res) => {
    res.send("api gateway is running");
});

app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});
