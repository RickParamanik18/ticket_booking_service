const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

router.get("/search", eventController.searchEvents);
router.get("/:event_id", eventController.getEventDetails);

module.exports = router;
