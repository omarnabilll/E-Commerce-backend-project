const sharp = require("sharp");
const cloudinary = require("../utils/cloudinary");
const catchAsync = require("../utils/catchAsync");
const upload = require("./upload");

const uploadUserAvatar = upload.single("avatar");

const resizeAndUploadUserAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const buffer = await sharp(req.file.buffer)
    .resize(256, 256)
    .toFormat("webp")
    .webp({ quality: 90 })
    .toBuffer();

  const result = await cloudinary.uploader.upload(
    `data:image/webp;base64,${buffer.toString("base64")}`,
    {
      folder: "ecommerce/users",
    },
  );

  req.body.avatar = result.secure_url;

  next();
});

module.exports = { uploadUserAvatar, resizeAndUploadUserAvatar };
