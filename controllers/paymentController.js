const stripe = require("../utils/stripe");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const createCheckoutSession = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate(
    "items.product",
  );

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  const { fullName, address, city, postalCode, country } = req.body;

  if (!fullName || !address || !city || !postalCode || !country) {
    return next(new AppError("All shipping fields are required", 400));
  }

  // Validate cart items still reference real products
  for (const item of cart.items) {
    if (!item.product) {
      return next(
        new AppError("One or more cart items are no longer available", 400),
      );
    }
  }

  const shippingAddress =
    `${fullName}, ${address}, ${city}, ${postalCode}, ${country}`.trim();

  // Create order BEFORE payment
  const order = await Order.create({
    user: req.user.id,
    items: cart.items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount: cart.totalPrice,
    status: "pending",
    paymentStatus: "pending",
    shippingAddress,
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: req.user.email,

    line_items: cart.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.product.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),

    success_url: `${req.protocol}://${req.get("host")}/checkout/confirmation`,
    cancel_url: `${req.protocol}://${req.get("host")}/checkout/cancel`,

    metadata: {
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
    },
  });

  order.stripeSessionId = session.id;
  await order.save({ validateBeforeSave: false });


  if (req.originalUrl.startsWith("/api")) {
    return res.status(200).json({
      message: "success",
      session,
    });
  }

  if (!session.url) {
    
    return next(new AppError("Failed to create Stripe checkout session", 500));
  }

  return res.redirect(303, session.url);
});

const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

 
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_KEY,
    );
    
  } catch (err) {
   
    return res.status(400).json({ message: "Webhook Error" });
  }

  try {
    if (event.type === "checkout.session.completed") {
     
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      const userId = session.metadata?.userId;

  

      if (!orderId || !userId) {
        
        return res.status(200).json({ received: true });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        
        return res.status(200).json({ received: true });
      }

      if (order.paymentStatus === "paid") {
        
        return res.status(200).json({ received: true });
      }

      
      for (const item of order.items) {
    
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.product,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          { new: true },
        );

        if (!updatedProduct) {
          order.paymentStatus = "failed";
          await order.save({ validateBeforeSave: false });
          return res.status(200).json({ received: true });
        }
      }

      order.paymentStatus = "paid";
      order.stripeSessionId = session.id;
      await order.save({ validateBeforeSave: false });
     
      const cart = await Cart.findOne({ user: userId });

      if (cart) {
        cart.items = [];
        cart.totalItems = 0;
        cart.totalPrice = 0;
        await cart.save();
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
   
    return res.status(500).json({ message: "Webhook handler error" });
  }
};

module.exports = { createCheckoutSession, stripeWebhook };
