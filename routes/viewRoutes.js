const express = require("express");
const router = express.Router();
const {
  getSignUp,
  signup,
  getLogIn,
  login,
  logout,
  getProfile,
  updatePassword,
  updateUser,
  getUsers,
  updateUserRole,
  getDashboard,
  getForgotPassword,
  getResetPassword,
  forgotPassword,
  resetPassword,
  verifyUser,
} = require("../controllers/authController");
const { isAuth } = require("../middleware/isAuth");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");
const {
  getProducts,
  getProductById,
  createProduct,
  getAdminProducts,
  getCreateProduct,
  getHome,
} = require("../controllers/productController");
const { attachUser } = require("../middleware/attachUser");
const { createReview } = require("../controllers/reviewController");
const { createCheckoutSession } = require("../controllers/paymentController");
const isAdmin = require("../middleware/isAdmin");
const {
  uploadProductImages,
  resizeAndUploadProductImages,
} = require("../middleware/productImage");
const {
  uploadUserAvatar,
  resizeAndUploadUserAvatar,
} = require("../middleware/userImages");
const {
  getMyOrders,
  getOrderDetail,
  getAllOrders,
  updateOrderStatus,
  getCheckout,
} = require("../controllers/orderController");
const catchAsync = require("../utils/catchAsync");

//home route
router.get("/", attachUser, getHome);

//auth routes
router.get("/profile", isAuth, getProfile);
router.post(
  "/profile/update-info",
  isAuth,
  uploadUserAvatar,
  resizeAndUploadUserAvatar,
  updateUser,
);

router.post("/profile/update-password", isAuth, updatePassword);

router.get("/dashboard", isAuth, getDashboard);

router.get("/auth/signup", getSignUp);
router.post("/auth/signup", signup);

router.get("/auth/login", getLogIn);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/forgot-password", getForgotPassword);
router.post("/auth/forgot-password", forgotPassword);
router.get("/auth/reset-password/:token", getResetPassword);
router.post("/auth/reset-password/:token", resetPassword);
router.get("/auth/verify-email/:token", verifyUser);

//products routes
router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.get("/admin/products", isAuth, isAdmin, getAdminProducts);
router.get("/admin/products/create", isAuth, isAdmin, getCreateProduct);
router.post(
  "/admin/products/create",
  isAuth,
  isAdmin,
  uploadProductImages,
  resizeAndUploadProductImages,
  createProduct,
);
//review
router.post("/products/:id/reviews", isAuth, createReview);

//cart routes
router.get("/cart", getCart);
router.post("/cart/add-to-cart", addToCart);
router.post("/cart/update/:id", updateCartItem);
router.post("/cart/clear", clearCart);
router.post("/cart/remove/:id", removeCartItem);

//order routes
router.get("/orders", isAuth, getMyOrders);
router.get("/orders/:id", isAuth, getOrderDetail);
router.get("/admin/orders", isAuth, isAdmin, getAllOrders);
router.post("/admin/orders/:id/status", isAuth, isAdmin, updateOrderStatus);

//checkout
router.get("/checkout", isAuth, getCheckout);
router.post("/checkout", isAuth, createCheckoutSession);
router.get("/checkout/confirmation", (req, res) => {
  res.render("orders/confirmation", { title: "Order Placed" });
});
router.get("/checkout/cancel", isAuth, (req, res) => {
  res.render("orders/cancel", { title: "Payment Cancelled" });
});

//admin

router.get("/admin/users", isAuth, isAdmin, getUsers);
router.post("/users/:id/role", isAuth, isAdmin, updateUserRole);

module.exports = router;
