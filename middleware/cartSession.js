const cartSession = (req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = { items: [] };
  }
  next();
};

module.exports = { cartSession };
