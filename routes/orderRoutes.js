const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  updateOrderStatus,
  getAllOrders,
  getOrderDetail,
} = require("../controllers/orderController");
const { isAuth } = require("../middleware/isAuth");
const isAdmin = require("../middleware/isAdmin");
const { createCheckoutSession } = require("../controllers/paymentController");

router.get("/my-orders", isAuth, getMyOrders);
router.get("/all-orders", isAuth, isAdmin, getAllOrders);
router.get("/:id", isAuth, getOrderDetail);
router.post("/create-order", isAuth, createOrder);
router.post("/update-status/:id", isAuth, isAdmin, updateOrderStatus);
router.post("/checkout/:orderId", isAuth, createCheckoutSession);

module.exports = router;
