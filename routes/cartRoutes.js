const express = require("express");
const router = express.Router();
const { isAuth } = require("../middleware/isAuth");

const {
  getCart,
  addToCart,
  updateCartItem,
  clearCart,
  removeCartItem,
} = require("../controllers/cartController");

router.get("/", isAuth, getCart);
router.post("/add-product", isAuth, addToCart);
router.put("/update/:id", isAuth, updateCartItem);
router.delete("/remove/:id", removeCartItem);
router.delete("/clear", isAuth, clearCart);

module.exports = router;
