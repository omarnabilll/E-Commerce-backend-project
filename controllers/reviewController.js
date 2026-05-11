const Review = require("../models/Review");
const catchAsync = require("../utils/catchAsync");

const createReview = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return res.redirect("/auth/login");
  }

  const { rating, comment } = req.body;

  const review = await Review.create({
    product: req.params.id,
    user: req.user.id,
    rating,
    comment,
  });

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "review placed",
      review,
    });
  }

  res.redirect(`/products/${req.params.id}`);
});

module.exports = { createReview };
