const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
      },
      quantity: { type: Number, default: 1 },
      price: { type: Number, default: 0 },
    },
  ],
  totalPrice: { type: Number, default: 0 },
  totalItems: { type: Number, default: 0 },
});

cartSchema.pre("save", function () {
  this.totalItems = this.items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  this.totalPrice = this.items.reduce((total, item) => {
    return (total += item.price * item.quantity);
  }, 0);
});

module.exports = mongoose.model("Cart", cartSchema);
