const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/User");

const isAuth = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token || token === "loggedout") {
    if (req.originalUrl.startsWith("/api")) {
      return next(new AppError("invalid token please log in"), 401);
    }

    return res.redirect("/auth/login");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  if (user) {
    req.user = user;
    res.locals.user = user;
  } else {
    console.log("no user attached");
    res.clearCookie("jwt");
  }
  next();
});

module.exports = { isAuth };
