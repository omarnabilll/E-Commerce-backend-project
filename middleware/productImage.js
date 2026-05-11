const sharp = require("sharp");
const cloudinary = require("../utils/cloudinary");
const catchAsync = require("../utils/catchAsync");
const upload = require("./upload");

const uploadProductImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

const resizeAndUploadProductImages = catchAsync(async (req, res, next) => {
  if (!req.files) return next();

  if (req.files.imageCover) {
    const buffer = await sharp(req.files.imageCover[0].buffer)
      .resize(800, 800)
      .toFormat("webp")
      .webp({ quality: 90 })
      .toBuffer();

    const result = await cloudinary.uploader.upload(
      `data:image/webp;base64,${buffer.toString("base64")}`,
      {
        folder: "ecommerce/products",
      },
    );

    req.body.imageCover = result.secure_url;
  }

  if (req.files.images) {
    req.body.images = [];

    for (const file of req.files.images) {
      const buffer = await sharp(file.buffer)
        .resize(800, 800)
        .toFormat("webp")
        .webp({ quality: 90 })
        .toBuffer();

      const result = await cloudinary.uploader.upload(
        `data:image/webp;base64,${buffer.toString("base64")}`,
        {
          folder: "ecommerce/products",
        },
      );

      req.body.images.push(result.secure_url);
    }
  }

  next();
});

module.exports = { uploadProductImages, resizeAndUploadProductImages };
