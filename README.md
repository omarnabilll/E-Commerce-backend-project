# Ecommerce Project

A full-featured ecommerce application built with Node.js, Express, and MongoDB. Features user authentication, product management, shopping cart, order processing, payment integration with Stripe, and an admin panel.

## Features

- **User Authentication**: Signup, login, email verification, password reset
- **Product Management**: CRUD operations for products with image uploads
- **Shopping Cart**: Add, update, remove items (supports both logged-in users and guests)
- **Order Processing**: Create orders, track status, payment integration
- **Payment Integration**: Stripe checkout for secure payments
- **Reviews System**: Users can leave reviews on products
- **Admin Panel**: Manage users, products, and orders
- **Responsive Design**: Pug templates with CSS styling
- **API Support**: RESTful API endpoints for all major features
- **Security**: Helmet, CSRF protection, rate limiting, input sanitization

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with cookies
- **Payments**: Stripe API
- **File Uploads**: Multer with Cloudinary integration
- **Email**: Nodemailer
- **Templating**: Pug
- **Security**: Helmet, express-rate-limit, express-mongo-sanitize, xss-clean
- **Validation**: Validator.js

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd ecommerce-project
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

   ```env
   NODE_ENV=development
   PORT=3000
   MONGO_URL=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRES_IN=7d
   SESSION_SECRET=your-session-secret
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_KEY=your-stripe-webhook-secret
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   ```

4. Start MongoDB (if running locally)

5. Run the application:
   ```bash
   npm run dev  # For development with nodemon
   npm start    # For production
   ```

The application will be available at `http://localhost:3000`

## Usage

### Web Interface

- **Home**: Browse featured products
- **Dashboard**: User dashboard with account info and recent orders
- **Products**: View all products with filtering and search
- **Cart**: Add, update, remove, and clear items (supports both logged-in users and guests)
- **Checkout**: Secure payment with Stripe
- **Profile**: Manage user account
- **Forgot Password**: Request password reset link
- **Reset Password**: Reset password with token
- **Email Verification**: Verify email with token
- **Admin Panel**: Manage products, users, and orders (admin only)

### API Endpoints

#### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET/POST /api/auth/verify-email/:token` - Email verification
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password
- `PUT /api/auth/update-user` - Update user profile
- `PUT /api/auth/update-password` - Change password
- `DELETE /api/auth/user/:id` - Delete user (admin only)

#### Products

- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products/create` - Create product (admin only)
- `PUT /api/products/update/:id` - Update product (admin only)
- `DELETE /api/products/delete/:id` - Delete product (admin only)

#### Cart

- `GET /api/cart` - Get user's cart
- `POST /api/cart/add-product` - Add item to cart
- `PUT /api/cart/update/:id` - Update cart item quantity
- `DELETE /api/cart/remove/:id` - Remove item from cart
- `DELETE /api/cart/clear` - Clear cart

#### Orders

- `GET /api/order/my-orders` - Get user's orders
- `GET /api/order/all-orders` - Get all orders (admin only)
- `GET /api/order/:id` - Get order details
- `POST /api/order/create-order` - Create manual order
- `POST /api/order/update-status/:id` - Update order status (admin only)
- `POST /api/order/checkout/:orderId` - Initiate Stripe checkout

#### Reviews

- `POST /api/reviews` - Create product review

#### Payments

- `POST /webhook/stripe` - Stripe webhook handler

## Project Structure

```
ecommerce-project/
├── controllers/          # Route handlers
├── middleware/           # Custom middleware
├── models/              # Mongoose models
├── public/              # Static assets (CSS, JS, images)
├── routes/              # API routes
├── uploads/             # Temporary file uploads
├── utils/               # Utility functions
├── views/               # Pug templates
├── app.js               # Express app setup
├── server.js            # Server entry point
└── package.json         # Dependencies and scripts
```

## Environment Variables

| Variable                | Description                          | Required |
| ----------------------- | ------------------------------------ | -------- |
| `NODE_ENV`              | Environment (development/production) | Yes      |
| `PORT`                  | Server port                          | Yes      |
| `MONGO_URL`             | MongoDB connection string            | Yes      |
| `JWT_SECRET`            | JWT signing secret                   | Yes      |
| `JWT_EXPIRES_IN`        | JWT expiration time                  | Yes      |
| `SESSION_SECRET`        | Session secret                       | Yes      |
| `STRIPE_SECRET_KEY`     | Stripe secret key                    | Yes      |
| `STRIPE_WEBHOOK_KEY`    | Stripe webhook secret                | Yes      |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                | Yes      |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                   | Yes      |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                | Yes      |
| `EMAIL_HOST`            | SMTP host                            | Yes      |
| `EMAIL_PORT`            | SMTP port                            | Yes      |
| `EMAIL_USER`            | SMTP username                        | Yes      |
| `EMAIL_PASS`            | SMTP password                        | Yes      |

## Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
