const express = require("express");
const { createReview } = require("../controllers/reviewController");
const { isAuth } = require("../middleware/isAuth");
const router = express.Router();

router.post("/products/:id/review", isAuth, createReview);
router.post("/products/:id/reviews", isAuth, createReview);

module.exports = router;
