const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { sendEmail } = require("../utils/email");
const crypto = require("crypto");

const getProfile = (req, res) => {
  res.render("auth/profile", {
    title: "My Profile",
    user: req.user,
  });
};

const getDashboard = catchAsync(async (req, res) => {
  const Order = require("../models/Order");
  const orders = await Order.find({ user: req.user._id })
    .sort("-createdAt")
    .limit(5);

  res.render("dashboard/index", {
    title: "My Dashboard",
    user: req.user,
    orders,
  });
});

const getUsers = catchAsync(async (req, res) => {
  const users = await User.find().select("-password");

  res.render("admin/users", {
    title: "Manage Users",
    users,
    user: req.user,
  });
});

const getForgotPassword = (req, res) => {
  res.status(200).render("auth/forgot-password", {
    title: "Forgot Password",
  });
};

const getResetPassword = (req, res) => {
  res.status(200).render("auth/reset-password", {
    title: "Reset Password",
    token: req.params.token,
  });
};

// REGISTER
//sign up page
const getSignUp = (req, res) => {
  return res.render("auth/signup", { title: "Sign Up" });
};

//sign up logic
const signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  if (!name || !email || !password || !passwordConfirm) {
    if (req.originalUrl.startsWith("/api")) {
      return next(new AppError("All fields are required", 400));
    }

    return res.status(400).render("auth/signup", {
      title: "Sign Up",
      error: "Please fill in all required fields.",
    });
  }

  if (password !== passwordConfirm) {
    if (req.originalUrl.startsWith("/api")) {
      return next(new AppError("Passwords do not match", 400));
    }

    return res.status(400).render("auth/signup", {
      title: "Sign Up",
      error: "Passwords do not match.",
    });
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const verifyToken = user.createVerifyToken();
  await user.save();
  const verifyURL = `http://localhost:3000/auth/verify-email/${verifyToken}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    message: `Click here to verify your email:\n${verifyURL}`,
  });

  user.password = undefined;
  if (req.originalUrl.startsWith("/api")) {
    return res.status(201).json({
      message: "User created. Please check your email to verify your account.",
      user,
    });
  }

  return res.status(201).render("auth/login", {
    title: "Log in",
    success: "Account created. Please verify your email before logging in.",
  });
});

//LOGIN

//login page
const getLogIn = (req, res) => {
  return res.render("auth/login", { title: "Log in" });
};

//log in logic
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.verifyPassword(password))) {
    if (req.originalUrl.startsWith("/api")) {
      return next(new AppError("invalid login credentials", 401));
    }

    return res.render("auth/login", {
      title: "Login",
      error: "Invalid email or password",
    });
  }

  if (!user.verified) {
    if (req.originalUrl.startsWith("/api")) {
      return next(
        new AppError("Please verify your email before logging in", 401),
      );
    }

    return res.status(401).render("auth/login", {
      title: "Login",
      error: "Please verify your email before logging in.",
    });
  }

  const token = user.generateToken();

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  });

  user.password = undefined;
  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "logged in successfully",
      user,
      token,
    });
  }

  return res.status(200).redirect("/");
});

// verify email

const verifyUser = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("invalid token or token expired", 400));
  }
  user.verified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;

  await user.save();

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "user verified successfully!",
    });
  }

  return res.status(200).render("auth/login", {
    title: "Login",
    success: "Email verified. Please login.",
  });
});

// forgot password to send reset password email
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    if (req.originalUrl.startsWith("/api")) {
      return next(new AppError("user not found", 404));
    }

    return res.status(404).render("auth/forgot-password", {
      title: "Forgot Password",
      error: "No account found with that email.",
    });
  }

  const resetToken = user.createResetToken();

  await user.save();

  const resetUrl = `http://localhost:3000/auth/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: email,
      subject: "Password reset",
      message: `Reset your password: ${resetUrl}`,
    });
  } catch (err) {
    console.error("EMAIL ERROR:", err);

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("Email could not be sent", 500));
  }

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "reset link sent to email",
    });
  }

  return res.status(200).render("auth/forgot-password", {
    title: "Forgot Password",
    success: "Password reset link sent to your email.",
  });
});

//reset password
const resetPassword = catchAsync(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;

  if (!password || !passwordConfirm) {
    if (req.originalUrl.startsWith("/api")) {
      return next(
        new AppError("Please enter and confirm your new password.", 400),
      );
    }

    return res.status(400).render("auth/reset-password", {
      title: "Reset Password",
      token: req.params.token,
      error: "Please enter and confirm your new password.",
    });
  }

  if (password !== passwordConfirm) {
    if (req.originalUrl.startsWith("/api")) {
      return next(new AppError("Passwords do not match.", 400));
    }

    return res.status(400).render("auth/reset-password", {
      title: "Reset Password",
      token: req.params.token,
      error: "Passwords do not match.",
    });
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("token is invalid or expired", 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "password reset successful",
    });
  }

  return res.status(200).render("auth/login", {
    title: "Login",
    success: "Password reset successful. Please log in.",
  });
});
//update user

const updateUser = catchAsync(async (req, res, next) => {
  const { name, email, avatar } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name, email, avatar },
    { new: true, runValidators: true },
  );

  if (req.originalUrl.startsWith("/api")) {
    res.status(200).json({
      message: "user updated",
      updatedUser,
    });
  }

  res.redirect("/profile");
});

const updateUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;

  if (req.user.id === req.params.id) {
    return next(new AppError("You cannot change your own role", 400));
  }

  await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { runValidators: true },
  );

  res.redirect("/admin/users");
});

//update password

const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  if (!(await user.verifyPassword(currentPassword, user.password))) {
    return res.render("auth/profile", {
      title: "My Profile",
      user: req.user,
      error: "Current password is incorrect",
    });
  }

  user.password = newPassword;
  await user.save();

  res.redirect("/profile");
});

//LOG OUT
const logout = (req, res) => {
  console.log("fe eh");
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "logged out successfully",
    });
  }

  return res.redirect("/");
};

//DELETE user
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new AppError("user not found", 400));
  }

  res.cookie("jwt", "deleted", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  return res.redirect("/");
});

module.exports = {
  getProfile,
  getDashboard,
  getUsers,
  getSignUp,
  getForgotPassword,
  getResetPassword,
  signup,
  verifyUser,
  getLogIn,
  login,
  forgotPassword,
  resetPassword,
  updateUser,
  updateUserRole,
  updatePassword,
  logout,
  deleteUser,
};
