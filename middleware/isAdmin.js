const AppError = require("../utils/AppError");

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("not logged in", 401));
  }

  if (req.user.role !== "admin") {
    return next(
      new AppError("you are not allowed to perform this action", 403),
    );
  }

  next();
};

module.exports = isAdmin;
