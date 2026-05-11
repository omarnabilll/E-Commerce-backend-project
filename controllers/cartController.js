const Cart = require("../models/Cart");
const Product = require("../models/Product");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const getCart = catchAsync(async (req, res) => {
  let cart;

  if (req.user) {
    cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        totalPrice: 0,
      });
      await cart.save();
    }

    cart.items = cart.items.filter((i) => i.product);
  }

  if (!req.user) {
    const sessionItems = req.session.cart.items || [];

    if (sessionItems.length > 0) {
      const productIds = sessionItems.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds } });

      const items = sessionItems
        .map((i) => {
          const product = products.find((p) => p.id === i.productId);
          if (!product) return null;

          return {
            product,
            quantity: i.quantity,
            price: product.price,
          };
        })
        .filter(Boolean);

      const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
      const totalPrice = items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );

      cart = { items, totalItems, totalPrice };
    }
  }

  if (!cart) {
    cart = { items: [], totalItems: 0, totalPrice: 0 };
  }

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      status: "success",
      cart,
    });
  }

  res.status(200).render("cart/index", {
    title: "Cart",
    cart,
  });
});

const addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const quantityNum = Number(quantity);

  if (!productId || !quantityNum) {
    return next(new AppError("please enter id and quantity", 400));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("product not found", 404));
  }

  if (product.stock < quantityNum) {
    if (req.originalUrl.startsWith("/api")) {
      return next(
        new AppError(`only ${product.stock} items available in stock`, 400),
      );
    }

    return res.status(400).render("products/detail", {
      title: product.name,
      product,
      error: `Only ${product.stock} items available in stock`,
      quantity: quantityNum,
    });
  }

  if (req.user) {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
      });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId,
    );
    if (item) {
      if (product.stock < item.quantity + quantityNum) {
        return res.status(400).render("products/detail", {
          title: product.name,
          product,
          error: `Only ${product.stock} items available in stock`,
          quantity: quantityNum,
        });
      }
      item.quantity += quantityNum;
    } else {
      cart.items.push({
        product: productId,
        quantity: quantityNum,
        price: product.price,
      });
    }

    await cart.save();
    return res.redirect("/products");
  }

  const sessionCart = req.session.cart;

  const item = sessionCart.items.find((i) => i.productId === productId);

  if (item) {
    if (product.stock < item.quantity + quantityNum) {
      return res.status(400).render("products/detail", {
        title: product.name,
        product,
        error: `Only ${product.stock} items available in stock`,
        quantity: quantityNum,
      });
    }
    item.quantity += quantityNum;
  } else {
    sessionCart.items.push({
      productId,
      quantity: quantityNum,
      price: product.price,
    });
  }

  sessionCart.totalItems = sessionCart.items.reduce(
    (sum, i) => sum + i.quantity,
    0,
  );
  sessionCart.totalPrice = sessionCart.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "product added!",
      cart: sessionCart,
    });
  }

  res.redirect("/products");
});

const updateCartItem = catchAsync(async (req, res, next) => {
  const quantity = Number(req.body.quantity);

  if (!quantity || quantity < 0) {
    return next(new AppError("invalid quantity", 400));
  }

  if (req.user) {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new AppError("cart is empty, cannot edit", 400));
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === req.params.id,
    );

    if (itemIndex === -1) {
      return next(new AppError("product not found", 404));
    }

    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) {
      return next(new AppError("product not found", 404));
    }

    if (quantity > product.stock) {
      return next(
        new AppError(`only ${product.stock} available in stock`, 400),
      );
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.product");

    if (req.originalUrl.startsWith("/api")) {
      return res.status(200).json({
        message: "quantity updated",
        cart,
      });
    }

    return res.redirect("/cart");
  }

  const sessionCart = req.session.cart;
  const itemIndex = sessionCart.items.findIndex(
    (item) => item.productId === req.params.id,
  );

  if (itemIndex === -1) {
    if (req.originalUrl.startsWith("/api")) {
      return next(new AppError("product not found", 404));
    }
    return res.redirect("/cart");
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError("product not found", 404));
  }

  if (quantity > product.stock) {
    if (req.originalUrl.startsWith("/api")) {
      return next(
        new AppError(`only ${product.stock} available in stock`, 400),
      );
    }

    return res.status(400).render("cart/index", {
      title: "Cart",
      cart: sessionCart,
      error: `Only ${product.stock} items available in stock`,
    });
  }

  if (quantity === 0) {
    sessionCart.items.splice(itemIndex, 1);
  } else {
    sessionCart.items[itemIndex].quantity = quantity;
  }

  sessionCart.totalItems = sessionCart.items.reduce(
    (sum, i) => sum + i.quantity,
    0,
  );
  sessionCart.totalPrice = sessionCart.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "quantity updated",
      cart: sessionCart,
    });
  }

  return res.redirect("/cart");
});

const removeCartItem = catchAsync(async (req, res, next) => {
  if (req.user) {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return next(new AppError("cart not found", 404));
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.id,
    );

    await cart.save();

    if (req.originalUrl.startsWith("/api")) {
      return res.status(200).json({
        message: "product removed from cart",
        cart,
      });
    }

    return res.redirect("/cart");
  }

  const sessionCart = req.session.cart;
  sessionCart.items = sessionCart.items.filter(
    (item) => item.productId !== req.params.id,
  );
  sessionCart.totalItems = sessionCart.items.reduce(
    (sum, i) => sum + i.quantity,
    0,
  );
  sessionCart.totalPrice = sessionCart.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "product removed from cart",
      cart: sessionCart,
    });
  }

  return res.redirect("/cart");
});

const clearCart = catchAsync(async (req, res, next) => {
  if (req.user) {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
      });
    } else {
      cart.items = [];
    }

    await cart.save();

    if (req.originalUrl.startsWith("/api")) {
      return res.status(200).json({
        message: "Cart cleared",
        cart,
      });
    }

    return res.redirect("/cart");
  }

  req.session.cart.items = [];
  req.session.cart.totalItems = 0;
  req.session.cart.totalPrice = 0;

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "Cart cleared",
      cart: req.session.cart,
    });
  }

  return res.redirect("/cart");
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
