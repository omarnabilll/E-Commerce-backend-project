const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, enum: [1, 2, 3, 4, 5] },
    comment: { type: String, default: "No Comment" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
