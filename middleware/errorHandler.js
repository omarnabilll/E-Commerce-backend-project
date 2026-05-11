module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    if (req.originalUrl.startsWith("/api")) {
      console.log(err.stack);
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        //stack: err.stack,
      });
    } else {
      console.log(err.stack);
      return res.status(err.statusCode).render("error", {
        error: err,
      });
    }
  }

  if (process.env.NODE_ENV === "production") {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.isOperational ? err.message : "something went wrong",
      });
    }
    return res.status(err.statusCode).render("error", {
      error: {
        message: err.isOperational ? err.message : "please try again",
        statusCode: err.statusCode,
      },
    });
  }
};
