const Order = require("../models/Order");
const Cart = require("../models/Cart");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { sendEmail } = require("../utils/email");

const getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt");

  if (!orders) {
    return res.status(200).json({
      message: "No Orders yet!",
    });
  }

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: `${orders.length} orders found`,
      orders,
    });
  }

  return res.status(200).render("orders/my-orders", {
    title: "My Orders",
    orders,
  });
});

const getOrderDetail = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("items.product")
    .populate("user");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("You are not allowed to view this order", 403));
  }

  res.status(200).render("orders/detail", {
    title: "Order Detail",
    order,
  });
});

const getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: `${orders.length} orders found`,
      orders,
    });
  }

  res.status(200).render("admin/orders", {
    title: "Manage Orders",
    orders,
  });
});

const createOrder = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate(
    "items.product",
  );

  if (!cart || cart.items.length === 0) {
    return next(new AppError("cart is empty", 400));
  }

  const order = await Order.create({
    user: req.user.id,
    items: cart.items,
    totalAmount: cart.totalPrice,
    shippingAddress: req.body.address,
  });

  for (const item of cart.items) {
    item.product.stock -= item.quantity;
    await item.product.save();
  }

  cart.items = [];
  await cart.save();

  try {
    await sendEmail({
      to: req.user.email,
      subject: "order placed",
      message: `
Thank you for your order!

Order ID: ${order._id}
Total: $${order.totalAmount}
Status: ${order.status}
Date: ${order.createdAt.toDateString()}

`,
    });
  } catch (err) {
    console.error("order email error:", err);
  }

  if (req.originalUrl.startsWith("/api")) {
    return res.status(201).json({
      message: "order placed",
      order,
    });
  }

  return res.redirect("/products");
});

const updateOrderStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("items.product");

  if (!order) {
    return next(new AppError("order not found!", 404));
  }

  order.status = req.body.status;
  order.save();

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "order status updated",
      order,
    });
  }
  res.redirect("/admin/orders");
});

const getCheckout = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
  );

  if (!cart || cart.items.length === 0) {
    return res.redirect("/cart");
  }

  res.render("orders/checkout", {
    title: "Checkout",
    cart,
  });
});

module.exports = {
  getCheckout,
  getOrderDetail,
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};
