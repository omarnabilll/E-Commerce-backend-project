const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  verifyUser,
  forgotPassword,
  resetPassword,
  deleteUser,
  logout,
  updateUser,
  updatePassword,
} = require("../controllers/authController");
const { isAuth } = require("../middleware/isAuth");
const isAdmin = require("../middleware/isAdmin");

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-email/:token", verifyUser);
router.get("/verify-email/:token", verifyUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.put("/update-user", isAuth, updateUser);
router.put("/update-password", isAuth, updatePassword);
router.delete("/user/:id", isAuth, isAdmin, deleteUser);

module.exports = router;
