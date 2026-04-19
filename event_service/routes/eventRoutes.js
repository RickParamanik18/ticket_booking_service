const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

router.get("/search", eventController.searchEvents);
router.get("/:event_id", eventController.getEventDetails);
router.post("/multiple_events", eventController.getMultipleEvents);
// router.post("/seed", eventController.seedMockEvents);

module.exports = router;
