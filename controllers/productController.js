const Product = require("../models/Product");
const Review = require("../models/Review");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const escapeRegex = require("../utils/escapeRegex");

const getHome = catchAsync(async (req, res, next) => {
  const featuredProducts = await Product.find().sort("-createdAt").limit(4);

  res.status(200).render("home", {
    title: "Home",
    featuredProducts,
  });
});

const getAdminProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find().sort("-createdAt");

  res.status(200).render("admin/products", {
    title: "Manage Products",
    products,
  });
});

const getCreateProduct = catchAsync(async (req, res, next) => {
  res.status(200).render("admin/createProduct", {
    title: "create product",
  });
});

const getProductById = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("product not found!", 404));
  }

  const reviews = await Review.find({ product: product._id }).populate(
    "user",
    "name",
  );

  const averageRating =
    reviews.length === 0
      ? null
      : (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1);

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "product found",
      product,
      reviews,
      averageRating,
    });
  }

  return res.status(200).render("products/detail", {
    title: product.name,
    product,
    reviews,
    averageRating,
  });
});

const getProducts = catchAsync(async (req, res, next) => {
  const filter = {};

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};

    if (req.query.minPrice) {
      filter.price.$gte = Number(req.query.minPrice);
    }

    if (req.query.maxPrice) {
      filter.price.$lte = Number(req.query.maxPrice);
    }
  }

  if (req.query.search && req.query.search.trim()) {
    const escapedSearch = escapeRegex(req.query.search.trim());

    filter.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 6;
  const skip = (page - 1) * limit;

  const totalProducts = await Product.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(totalProducts / limit));

  const products = await Product.find(filter).skip(skip).limit(limit);

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "products found",
      results: products.length,
      page,
      totalPages,
      products,
    });
  }

  return res.render("products/list", {
    title: "Products",
    products,
    currentCategory: req.query.category || null,
    currentSearch: req.query.search || "",
    currentMinPrice: req.query.minPrice || "",
    currentMaxPrice: req.query.maxPrice || "",
    pagination: {
      page,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
  });
});

const createProduct = catchAsync(async (req, res, next) => {
  const product = await Product.create(req.body);

  if (req.originalUrl.startsWith("/api")) {
    return res.status(201).json({
      message: "product created",
      product,
    });
  }

  return res.redirect("/products");
});

const updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    return next(new AppError("product not found", 404));
  }

  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "product updated",
      product,
    });
  }

  return res.redirect("/products");
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return next(new AppError("product not found", 404));
  }

  if (req.originalUrl.startsWith("/api")) {
    return res.status(204).json();
  }

  return res.redirect("/admin/products");
});

module.exports = {
  getHome,
  getAdminProducts,
  getCreateProduct,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
