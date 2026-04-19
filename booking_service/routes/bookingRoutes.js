const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

router.post("/book", bookingController.bookTickets);
router.get("/:user_id", bookingController.getTicketDetails);

module.exports = router;
