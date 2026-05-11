const jwt = require("jsonwebtoken");
const User = require("../models/User");

const attachUser = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token || token === "loggedout") {
    req.user = null;
    res.locals.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    req.user = user || null;
    res.locals.user = user || null;
  } catch (err) {
    req.user = null;
    res.locals.user = null;
  }

  next();
};

module.exports = { attachUser };
