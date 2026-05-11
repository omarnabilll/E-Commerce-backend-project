const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { isEmail } = require("validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: { validator: isEmail, message: "invalid email format" },
    },
    password: { type: String, required: true, minlength: 6 },
    passwordResetToken: { type: String, default: undefined },
    passwordResetExpires: { type: Date, default: undefined },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    avatar: { type: String, default: null },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String, default: undefined },
    verificationExpires: { type: Date, default: undefined },
  },
  { timestamps: true },
);

// password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);
});

//token generator
userSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );
};

//verification token
userSchema.methods.createVerifyToken = function () {
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");

  this.verificationToken = crypto
    .createHash("sha256")
    .update(emailVerificationToken)
    .digest("hex");

  this.verificationExpires = Date.now() + 1000 * 60 * 60;

  return emailVerificationToken;
};

//reset token

userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// password verify

userSchema.methods.verifyPassword = async function (enteredPass) {
  return await bcrypt.compare(enteredPass, this.password);
};

module.exports = mongoose.model("User", userSchema);
