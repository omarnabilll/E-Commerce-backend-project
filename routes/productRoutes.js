const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const isAdmin = require("../middleware/isAdmin");
const { isAuth } = require("../middleware/isAuth");
const {
  uploadProductImages,
  resizeAndUploadProductImages,
} = require("../middleware/productImage");

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post(
  "/create",
  isAuth,
  isAdmin,
  uploadProductImages,
  resizeAndUploadProductImages,
  createProduct,
);
router.put("/update/:id", isAuth, isAdmin, updateProduct);
router.delete("/delete/:id", isAuth, isAdmin, deleteProduct);

module.exports = router;
