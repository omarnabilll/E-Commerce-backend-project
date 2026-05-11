const logger = (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );
  }
  next();
};
module.exports = logger;
