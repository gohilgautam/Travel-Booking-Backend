<h1 align="center">⚙️ Travelora — Backend API Server</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-5-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Razorpay-Payment-02042B?style=for-the-badge&logo=razorpay&logoColor=white" />
</p>

<p align="center">
  A production-ready RESTful API for the <strong>Travelora</strong> travel booking platform.
  Built with Express.js and MongoDB, featuring modular architecture, JWT authentication,
  Razorpay payments, Cloudinary media management, PDF invoice generation, and structured Winston logging.
</p>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📁 Project Structure](#-project-structure)
- [🌐 Environment Variables](#-environment-variables)
- [📡 API Overview](#-api-overview)
- [📄 License](#-license)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure login, registration, and OTP-based email verification |
| 👥 **Role-Based Access** | Granular `user` / `admin` / `superadmin` permission guards |
| 📦 **Package Management** | Full CRUD for travel packages with category support |
| 💳 **Razorpay Payments** | Order creation, payment verification, and webhook handling |
| 📄 **PDF Invoices** | Auto-generated booking invoices using PDFKit |
| ☁️ **Cloudinary Media** | Multer-based file upload with Cloudinary storage |
| 📧 **Email Notifications** | Booking confirmations, OTP, and alerts via Nodemailer |
| 🎟️ **Coupon System** | Discount coupon creation, validation, and management |
| ⭐ **Reviews** | User review and rating system per package |
| ❤️ **Wishlist** | Save and manage favourite travel packages |
| 📊 **Admin Dashboard API** | Aggregated analytics for bookings, revenue, and users |
| 📝 **Request Logging** | HTTP logging via Morgan + structured Winston file logs |
| 🛡️ **Rate Limiting** | Express Rate Limit to prevent abuse on sensitive routes |

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 5 | Web framework |
| **MongoDB** | Atlas / Local | Primary database |
| **Mongoose** | 9 | ODM for MongoDB |
| **JSON Web Token** | 9 | Stateless authentication |
| **BcryptJS** | 3 | Password hashing |
| **Razorpay SDK** | 2 | Payment gateway |
| **Cloudinary SDK** | 2 | Cloud media management |
| **Multer** | 2 | Multipart form / file uploads |
| **Nodemailer** | 8 | Transactional email sending |
| **PDFKit** | 0.17 | PDF invoice generation |
| **Express Validator** | 7 | Request body validation |
| **Express Rate Limit** | 8 | API rate limiting |
| **Winston** | 3 | Structured application logging |
| **Morgan** | 1 | HTTP request logger |
| **Nodemon** | 3 | Development auto-restart |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB** Atlas cluster or local instance

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/travelora.git
   cd travelora/Travel-Booking-WebApp-Backend-/Backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000`

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with Nodemon (auto-restart on changes) |
| `npm start` | Start in production mode |

---

## 📁 Project Structure

```
Travel-Booking-WebApp-Backend-/
└── Backend/
    ├── config/                             # Third-party service configurations
    │   ├── cloudinary.js                   # Cloudinary SDK setup
    │   ├── index.js                        # DB connection entry
    │   └── razorpay.js                     # Razorpay instance setup
    │
    ├── controllers/                        # Legacy / shared route controllers
    │   ├── adminController.js
    │   ├── authController.js
    │   ├── bookingController.js
    │   ├── categoryController.js
    │   ├── cmsController.js
    │   ├── packageController.js
    │   ├── paymentController.js
    │   ├── reviewController.js
    │   └── wishlistController.js
    │
    ├── docs/
    │   └── PHASE_1_API_PLAN.md             # API planning documentation
    │
    ├── logs/                               # Winston runtime log files
    │   ├── combined.log                    # All log levels
    │   └── error.log                       # Error-level logs only
    │
    ├── middleware/                         # Express middleware
    │   ├── admin.middleware.js             # Admin access guard
    │   ├── adminMiddleware.js
    │   ├── auth.middleware.js              # JWT token verification
    │   ├── authMiddleware.js
    │   ├── error.middleware.js             # Global error handler
    │   ├── errorMiddleware.js
    │   ├── rateLimiter.js                  # Rate limit config
    │   ├── rateLimiter.middleware.js
    │   ├── roleMiddleware.js               # Role-based access control
    │   ├── upload.middleware.js            # Multer file upload handler
    │   └── uploadMiddleware.js
    │
    ├── models/                             # Shared Mongoose models
    │   ├── Booking.js
    │   ├── Category.js
    │   ├── CmsPage.js
    │   ├── Coupon.js
    │   ├── Notification.js
    │   ├── Package.js
    │   ├── Payment.js
    │   ├── Review.js
    │   ├── User.js
    │   └── Wishlist.js
    │
    ├── modules/                            # Feature-based modular architecture
    │   ├── admin/
    │   │   ├── admin.controller.js         # Admin dashboard logic
    │   │   ├── admin.routes.js
    │   │   └── admin.service.js
    │   ├── auth/
    │   │   ├── auth.controller.js          # Login, register, OTP, reset
    │   │   ├── auth.model.js
    │   │   ├── auth.routes.js
    │   │   ├── auth.service.js
    │   │   └── auth.validation.js
    │   ├── booking/
    │   │   ├── booking.controller.js       # Booking CRUD logic
    │   │   ├── booking.model.js
    │   │   ├── booking.routes.js
    │   │   ├── booking.service.js
    │   │   └── booking.validation.js
    │   ├── coupon/
    │   │   ├── coupon.controller.js        # Coupon CRUD & validation
    │   │   ├── coupon.model.js
    │   │   └── coupon.routes.js
    │   ├── media/
    │   │   ├── media.controller.js         # File upload handling
    │   │   ├── media.model.js
    │   │   └── media.routes.js
    │   ├── package/
    │   │   ├── package.controller.js       # Travel package CRUD
    │   │   ├── package.model.js
    │   │   ├── package.routes.js
    │   │   ├── package.service.js
    │   │   └── package.validation.js
    │   ├── payment/
    │   │   ├── payment.controller.js       # Razorpay order & verify
    │   │   ├── payment.model.js
    │   │   ├── payment.routes.js
    │   │   ├── payment.service.js
    │   │   └── payment.validation.js
    │   ├── review/
    │   │   ├── review.controller.js        # Package review logic
    │   │   ├── review.model.js
    │   │   └── review.routes.js
    │   ├── settings/
    │   │   ├── settings.controller.js      # Platform settings
    │   │   ├── settings.model.js
    │   │   └── settings.routes.js
    │   └── wishlist/
    │       ├── wishlist.controller.js      # User wishlist logic
    │       ├── wishlist.model.js
    │       └── wishlist.routes.js
    │
    ├── routes/                             # Centralized route index
    │   ├── adminRoutes.js
    │   ├── authRoutes.js
    │   ├── bookingRoutes.js
    │   ├── categoryRoutes.js
    │   ├── cmsRoutes.js
    │   ├── index.js                        # Master router (mounts all routes)
    │   ├── packageRoutes.js
    │   ├── paymentRoutes.js
    │   ├── reviewRoutes.js
    │   └── wishlistRoutes.js
    │
    ├── services/                           # Shared business logic services
    │   ├── authService.js                  # Token & OTP logic
    │   ├── bookingService.js               # Booking business rules
    │   ├── categoryInitService.js          # Seed default categories on boot
    │   ├── emailService.js                 # Nodemailer email sending
    │   ├── invoiceService.js               # PDFKit invoice generation
    │   ├── mainAdminService.js             # Seed superadmin on boot
    │   └── paymentService.js               # Razorpay helpers
    │
    ├── shared/constants/                   # App-wide constants
    │   ├── mainAdmins.js                   # Superadmin seed data
    │   └── roles.js                        # Role enum definitions
    │
    ├── utils/                              # Utility helpers
    │   ├── generateToken.js                # JWT token generator
    │   ├── helpers.js                      # General utility functions
    │   ├── logger.js                       # Winston logger config
    │   └── sendEmail.js                    # Email dispatch helper
    │
    ├── validations/                        # Express-validator rule sets
    │   ├── authValidation.js
    │   ├── bookingValidation.js
    │   ├── packageValidation.js
    │   └── paymentValidation.js
    │
    ├── .env                                # Local environment variables (gitignored)
    ├── .env.example                        # Environment variable template
    ├── .gitignore
    ├── app.js                              # Express app setup & middleware
    ├── package-lock.json
    ├── package.json
    ├── server.js                           # Server entry point (DB connect + listen)
    └── test-rzp.js                         # Razorpay integration test script
```

---

## 🌐 Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/travel_booking

# JWT
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Travel Booking <no-reply@example.com>
```

---

## 📡 API Overview

| Module | Base Route | Description |
|---|---|---|
| **Auth** | `/api/auth` | Register, login, OTP verify, forgot/reset password |
| **Packages** | `/api/packages` | Browse, create, update, delete travel packages |
| **Bookings** | `/api/bookings` | Create and manage travel bookings |
| **Payments** | `/api/payments` | Razorpay order creation and payment verification |
| **Reviews** | `/api/reviews` | Submit and fetch package reviews |
| **Wishlist** | `/api/wishlist` | Add, remove, and list wishlisted packages |
| **Coupons** | `/api/coupons` | Admin coupon management and user validation |
| **Categories** | `/api/categories` | Travel category management |
| **CMS** | `/api/cms` | Content management for static pages |
| **Media** | `/api/media` | File upload endpoints (Cloudinary) |
| **Admin** | `/api/admin` | Dashboard analytics, user & settings management |

> 📄 See [`docs/PHASE_1_API_PLAN.md`](./docs/PHASE_1_API_PLAN.md) for the full API specification.

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  Made with ❤️ by the Travelora Team &nbsp;|&nbsp; Powered by Node.js & Express
</p>
