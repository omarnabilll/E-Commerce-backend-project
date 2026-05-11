require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const csrf = require("csurf");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const morgan = require("morgan");

const logger = require("./middleware/logger");
const { cartSession } = require("./middleware/cartSession");
const { attachUser } = require("./middleware/attachUser");

const authRouter = require("./routes/authRoutes");
const cartRouter = require("./routes/cartRoutes");
const productsRouter = require("./routes/productRoutes");
const viewRouter = require("./routes/viewRoutes");
const orderRouter = require("./routes/orderRoutes");
const reviewRouter = require("./routes/reviewRoutes");

const { stripeWebhook } = require("./controllers/paymentController");
const app = express();
const isDev = process.env.NODE_ENV !== "production";

// SECURITY MIDDLEWARE

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: isDev ? ["'self'", "http:", "https:"] : ["'self'"],
      upgradeInsecureRequests: null,
    },
  }),
);

const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
});
app.use("/api", limiter);

//STRIPE WEBHOOK
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

//BODY PARSERS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(
//   mongoSanitize({
//     onSanitize: ({ req, key }) => {
//       if (key === "query") return true; // skip sanitizing req.query
//     },
//   }),
// );
// app.use(xss());

//STATIC
app.use(express.static(path.join(__dirname, "public")));

// COOKIES + SESSION
app.use(cookieParser());

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
    },
  }),
);

// CUSTOM GLOBAL MIDDLEWARE
app.use(logger);
app.use(morgan("dev"));
app.use(cartSession);
app.use(attachUser);

//
// API ROUTES
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api", reviewRouter);

// CSRF
// const csrfProtection = csrf();
// app.use(csrfProtection);

app.use((req, res, next) => {
  try {
    res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null;
  } catch (err) {
    res.locals.csrfToken = null;
  }
  next();
});

// VIEW ROUTES
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use("/", viewRouter);

// CSRF ERROR HANDLER
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).render("error", {
      error: {
        message: "Invalid CSRF token",
        statusCode: 403,
      },
    });
  }
  next(err);
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).render("error", {
    error: {
      message: "Page Not Found",
      statusCode: 404,
    },
  });
});

module.exports = app;
