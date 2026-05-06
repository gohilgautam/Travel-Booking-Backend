# Phase 1 Backend Plan (Implemented)

This phase covers:
- Auth
- Package CRUD
- Booking system
- Payment

## 1) MongoDB Schema Design

### User (`models/User.js`)
- Stores both normal users and admins in one collection using `role`.
- Key fields: `name`, `email` (unique), `password` (hashed), `role`, `isBlocked`, profile fields.
- Roles: `user`, `admin`, `superadmin`.

### Package (`models/Package.js`)
- Core package data and gallery.
- Key fields: `title`, `description`, `destination`, `duration`, `price`, `images[]`, `active`.
- `active` supports enable/disable from admin panel.

### Booking (`models/Booking.js`)
- Connects user and package.
- Key fields: `user`, `package`, `travelDate`, `numberOfTravelers`, `totalAmount`, `status`.
- Optional: `payment`, `coupon`, `assignedAdmin`, cancellation metadata.

### Payment (`models/Payment.js`)
- Tracks Razorpay order/payment and refund lifecycle.
- Key fields: `booking`, `user`, `razorpayOrderId`, `razorpayPaymentId`, `status`, `amount`.
- Refund fields: `refundId`, `refundAmount`, `refundReason`, `refundedAt`.

## 2) Auth APIs

Base: `/api/auth`

- `POST /register` - user register
- `POST /login` - user login
- `POST /admin/login` - admin/superadmin login only
- `POST /logout` - JWT session logout response (client should delete token)
- `POST /forgot-password` - OTP flow start
- `POST /verify-otp` - verify OTP and receive reset token
- `POST /reset-password` - set new password with reset token
- `GET /me` - current user profile
- `PUT /profile` - update profile + avatar upload
- `PUT /change-password` - change password

## 3) Package APIs

Base: `/api/packages`

- `GET /` - list packages
- `GET /:id` - package details
- `POST /` - create package (admin)
- `PUT /:id` - update package (admin)
- `DELETE /:id` - delete package (admin)
- `PATCH /:id/enable` - activate package (admin)
- `PATCH /:id/disable` - deactivate package (admin)

## 4) Booking APIs

Base: `/api/bookings`

- `POST /` - create booking
- `GET /mine` - current user bookings
- `GET /:id` - booking details (owner/admin)
- `PUT /:id/cancel` - cancel booking

Admin-side booking management remains in `/api/admin`:
- list/filter bookings
- update booking status

## 5) Payment APIs

Base: `/api/payments`

- `POST /create-order` - create Razorpay order for booking
- `POST /verify` - verify Razorpay signature and mark booking confirmed
- `GET /mine` - current user payment history
- `GET /:id` - payment details (owner/admin)
- `GET /` - all payments (admin)
- `POST /:id/refund` - refund paid transaction (admin)

## 6) Security and Validation Included in Phase 1

- JWT auth middleware
- Role-based guards for admin-only APIs
- Express-validator checks for auth/booking/package/payment
- Rate limiting middleware
- Centralized error handling

## 7) Suggested Next Phase (Advanced Modules)

1. Category + subcategory management
2. CMS dynamic pages
3. Settings module (site/email/payment)
4. Media gallery management endpoints
5. Notification campaign templates and scheduling
