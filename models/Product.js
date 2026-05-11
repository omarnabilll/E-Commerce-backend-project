const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, minlength: 20 },
    imageCover: { type: String, default: null },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true },
    ratings: { type: Number, default: 3 }, //avg of ratings
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
