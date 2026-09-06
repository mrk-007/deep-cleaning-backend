# Jolly Home Needs — API Reference & Integration Guide

The single source of truth for frontend and mobile integration with the Jolly Home Needs REST API.

---

## 1. Global Specifications

- **Base URL**: `http://localhost:5000/api` (default development port)
- **Headers**:
  - Content-Type: `application/json`
  - Authorization: `Bearer <JWT_TOKEN>` (required on all protected endpoints)

---

## 2. Health Check

### `GET /health`
Verifies API server status.

- **Auth**: None
- **Response Shape (200 OK)**:
```json
{
  "status": "OK",
  "message": "Jolly Home Needs API is running",
  "timestamp": "2026-09-06T10:55:00.000Z"
}
```

---

## 3. Users & Authentication (`/users`)

### `POST /users/login`
Authenticates a user and generates a JWT.

- **Auth**: None
- **Request Body**:
```json
{
  "email": "admin@jollyhomeneeds.com",
  "password": "SecurePassword123"
}
```
- **Response Shape (200 OK)**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "userName": "Admin User",
    "email": "admin@jollyhomeneeds.com",
    "roleReference": {
      "_id": "64f1a2b3c4d5e6f7a8b9c001",
      "roleName": "admin"
    },
    "activeStatusReference": {
      "_id": "64f1a2b3c4d5e6f7a8b9c002",
      "activeStatusName": "active"
    },
    "createdAt": "2026-09-06T10:00:00.000Z",
    "updatedAt": "2026-09-06T10:00:00.000Z"
  }
}
```

### `POST /users`
Registers or creates a user account.

- **Auth**: None (or Admin)
- **Request Body**:
```json
{
  "userName": "Telecaller One",
  "email": "telecaller1@jollyhomeneeds.com",
  "password": "Password123",
  "roleReference": "64f1a2b3c4d5e6f7a8b9c001",
  "activeStatusReference": "64f1a2b3c4d5e6f7a8b9c002"
}
```
- **Response Shape (201 Created)**:
```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
  "userName": "Telecaller One",
  "email": "telecaller1@jollyhomeneeds.com",
  "roleReference": "64f1a2b3c4d5e6f7a8b9c001",
  "activeStatusReference": "64f1a2b3c4d5e6f7a8b9c002",
  "createdBy": null,
  "createdAt": "2026-09-06T10:05:00.000Z",
  "updatedAt": "2026-09-06T10:05:00.000Z"
}
```

### `GET /users`
List all users with roles and permissions populated.

- **Auth**: Bearer Token
- **Response Shape (200 OK)**:
```json
[
  {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "userName": "Telecaller One",
    "email": "telecaller1@jollyhomeneeds.com",
    "roleReference": {
      "_id": "64f1a2b3c4d5e6f7a8b9c001",
      "roleName": "user",
      "permissionReferences": [
        {
          "_id": "64f1a2b3c4d5e6f7a8b9c003",
          "permissionName": "write"
        }
      ]
    },
    "activeStatusReference": {
      "_id": "64f1a2b3c4d5e6f7a8b9c002",
      "activeStatusName": "active"
    },
    "createdAt": "2026-09-06T10:05:00.000Z",
    "updatedAt": "2026-09-06T10:05:00.000Z"
  }
]
```

### `GET /users/:id`
Fetch single user.

- **Auth**: Bearer Token
- **Response Shape (200 OK)**: Single user object without password hash.

### `PUT /users/:id`
Update user information, status, or password.

- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "userName": "Telecaller One Updated",
  "activeStatusReference": "64f1a2b3c4d5e6f7a8b9c002"
}
```
- **Response Shape (200 OK)**: Updated user object.

### `DELETE /users/:id`
Delete user.

- **Auth**: Bearer Token
- **Response Shape (200 OK)**:
```json
{ "message": "User deleted successfully" }
```

---

## 4. Roles (`/roles`)

### `GET /roles`
- **Auth**: None / Optional
- **Response Shape (200 OK)**: Array of roles with populated `permissionReferences` and `activeStatusReference`.

### `GET /roles/:id`
- **Auth**: None / Optional
- **Response Shape (200 OK)**: Single role object.

### `POST /roles`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "roleName": "superadmin",
  "permissionReferences": ["64f1a2b3c4d5e6f7a8b9c003"],
  "activeStatusReference": "64f1a2b3c4d5e6f7a8b9c002"
}
```
- **Response Shape (201 Created)**: Saved role object.

### `PUT /roles/:id`
- **Auth**: Bearer Token
- **Request Body**: Same fields as `POST`.
- **Response Shape (200 OK)**: Updated role object.

### `DELETE /roles/:id`
- **Auth**: Bearer Token
- **Response Shape (200 OK)**: `{ "message": "Role deleted successfully" }`

---

## 5. Permissions (`/permissions`)

### `GET /permissions`
- **Response Shape (200 OK)**: `[{ "_id": "...", "permissionName": "all" }]`

### `POST /permissions`
- **Auth**: Bearer Token
- **Request Body**:
```json
{ "permissionName": "write" }
```
- **Response Shape (201 Created)**: Created permission object.

### `PUT /permissions/:id` & `DELETE /permissions/:id`
- Update and delete permission by ID.

---

## 6. Active Statuses (`/active-statuses`)
Shared lookup used by `users`, `roles`, and `customers`.

### `GET /active-statuses`
- **Response Shape (200 OK)**: `[{ "_id": "...", "activeStatusName": "active" }]`

### `POST /active-statuses`
- **Auth**: Bearer Token
- **Request Body**:
```json
{ "activeStatusName": "active" }
```
- **Response Shape (201 Created)**: Created status record.

### `PUT /active-statuses/:id` & `DELETE /active-statuses/:id`
- Standard update and delete endpoints.

---

## 7. Customers (`/customers`)

### `GET /customers`
Supports search query across `name`, `phoneNumber`, or `apartmentName`: `/customers?search=9876543210`

- **Auth**: Bearer Token
- **Response Shape (200 OK)**:
```json
[
  {
    "_id": "64f1a2b3c4d5e6f7a8b9c100",
    "name": "Ravi Kumar",
    "phoneNumber": "9876543210",
    "address": "Flat 402, Lotus Towers, 5th Cross",
    "doorNo": "402",
    "block": "B Block",
    "apartmentName": "Lotus Towers",
    "landmark": "Near Metro Station",
    "city": "Chennai",
    "pincode": "600001",
    "activeStatusReference": {
      "_id": "64f1a2b3c4d5e6f7a8b9c002",
      "activeStatusName": "active"
    },
    "createdAt": "2026-09-06T10:10:00.000Z",
    "updatedAt": "2026-09-06T10:10:00.000Z"
  }
]
```

### `GET /customers/:id`
- **Auth**: Bearer Token
- **Response Shape (200 OK)**: Single customer details.

### `POST /customers`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "name": "Ravi Kumar",
  "phoneNumber": "9876543210",
  "address": "Flat 402, Lotus Towers, 5th Cross",
  "doorNo": "402",
  "block": "B Block",
  "apartmentName": "Lotus Towers",
  "landmark": "Near Metro Station",
  "city": "Chennai",
  "pincode": "600001",
  "activeStatusReference": "64f1a2b3c4d5e6f7a8b9c002"
}
```
- **Response Shape (201 Created)**: Created customer object.

### `PUT /customers/:id` & `DELETE /customers/:id`
- Standard update and delete endpoints.

---

## 8. Bookings (`/bookings`)
Entered as a single, already-confirmed record by the telecaller. Automatically generates the sequential invoice at the exact moment of creation!

### `POST /bookings`
Creates booking + generates atomic sequential invoice (`JHN<YYYYMMDD>-0001`).

- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "customerReference": "64f1a2b3c4d5e6f7a8b9c100",
  "bathroomCountReference": "64f1a2b3c4d5e6f7a8b9c200",
  "pricingReference": "64f1a2b3c4d5e6f7a8b9c300",
  "serviceDurationReference": "64f1a2b3c4d5e6f7a8b9c400",
  "serviceFrequencyReference": "64f1a2b3c4d5e6f7a8b9c500",
  "subscriptionTypeReference": "64f1a2b3c4d5e6f7a8b9c600",
  "timeSlotReference": "64f1a2b3c4d5e6f7a8b9c701",
  "startDateTime": "2026-09-10T09:00:00.000Z",
  "endDateTime": "2026-09-10T11:00:00.000Z",
  "paymentMethodReference": "64f1a2b3c4d5e6f7a8b9c700",
  "accountReference": "64f1a2b3c4d5e6f7a8b9c800",
  "transactionId": "UPI9823749823",
  "amount": 2500,
  "workStatusReference": "64f1a2b3c4d5e6f7a8b9c900"
}
```
- **Response Shape (201 Created)**:
```json
{
  "message": "Booking created and invoice generated successfully",
  "booking": {
    "_id": "64f1a2b3c4d5e6f7a8b9c950",
    "customerReference": "64f1a2b3c4d5e6f7a8b9c100",
    "bathroomCountReference": "64f1a2b3c4d5e6f7a8b9c200",
    "pricingReference": "64f1a2b3c4d5e6f7a8b9c300",
    "serviceDurationReference": "64f1a2b3c4d5e6f7a8b9c400",
    "serviceFrequencyReference": "64f1a2b3c4d5e6f7a8b9c500",
    "subscriptionTypeReference": "64f1a2b3c4d5e6f7a8b9c600",
    "timeSlotReference": "64f1a2b3c4d5e6f7a8b9c701",
    "startDateTime": "2026-09-10T09:00:00.000Z",
    "endDateTime": "2026-09-10T11:00:00.000Z",
    "paymentMethodReference": "64f1a2b3c4d5e6f7a8b9c700",
    "accountReference": "64f1a2b3c4d5e6f7a8b9c800",
    "transactionId": "UPI9823749823",
    "amount": 2500,
    "workStatusReference": "64f1a2b3c4d5e6f7a8b9c900",
    "createdBy": "64f1a2b3c4d5e6f7a8b9c0d1",
    "createdAt": "2026-09-06T10:20:00.000Z",
    "updatedAt": "2026-09-06T10:20:00.000Z"
  },
  "invoice": {
    "_id": "64f1a2b3c4d5e6f7a8b9c960",
    "invoiceNumber": "JHN20260906-0001",
    "customerReference": "64f1a2b3c4d5e6f7a8b9c100",
    "bookingReference": "64f1a2b3c4d5e6f7a8b9c950",
    "amount": 2500,
    "createdBy": "64f1a2b3c4d5e6f7a8b9c0d1",
    "createdAt": "2026-09-06T10:20:00.000Z",
    "updatedAt": "2026-09-06T10:20:00.000Z"
  }
}
```

### `GET /bookings`
Query parameters:
- `customerId`: Filter by customer ID
- `workStatusId`: Filter by work status
- `startDate`: Filter `startDateTime >= startDate`
- `endDate`: Filter `startDateTime <= endDate`

- **Auth**: Bearer Token
- **Response Shape (200 OK)**: Array of bookings with all reference lookups populated.

### `GET /bookings/:id`
- **Auth**: Bearer Token
- **Response Shape (200 OK)**: Single booking with populated references AND the associated generated invoice:
```json
{
  "booking": { /* booking document */ },
  "invoice": { /* invoice document */ }
}
```

### `PUT /bookings/:id`
Update booking details (rescheduling `startDateTime`, updating `workStatusReference`, etc.).

- **Auth**: Bearer Token
- **Request Body**: Any editable booking fields.
- **Response Shape (200 OK)**: Updated booking object.

### `DELETE /bookings/:id`
Deletes booking and its associated invoice.

- **Auth**: Bearer Token
- **Response Shape (200 OK)**:
```json
{ "message": "Booking and associated invoice deleted successfully" }
```

---

## 9. Invoices (`/invoices`)

### `GET /invoices`
Supports optional filters: `/invoices?customerId=...&bookingId=...`

- **Auth**: Bearer Token
- **Response Shape (200 OK)**: Array of invoice objects with populated `customerReference` and `bookingReference`.

### `GET /invoices/:id`
- **Auth**: Bearer Token
- **Response Shape (200 OK)**: Single invoice object.

### `GET /invoices/booking/:bookingId`
Fetches the invoice corresponding to a specific booking ID.

- **Auth**: Bearer Token
- **Response Shape (200 OK)**: Invoice document.

### `POST /invoices`
Manual invoice generation (if needed outside standard booking workflow).

- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "invoiceNumber": "JHN20260906-0002",
  "customerReference": "64f1a2b3c4d5e6f7a8b9c100",
  "bookingReference": "64f1a2b3c4d5e6f7a8b9c950",
  "amount": 2500
}
```

---

## 10. Service Durations (`/service-durations`)

### `GET /service-durations`
- **Response Shape (200 OK)**:
```json
[
  { "_id": "64f1a2b3c4d5e6f7a8b9c400", "durationMinutes": 60 }
]
```

### `POST /service-durations`
- **Auth**: Bearer Token
- **Request Body**:
```json
{ "durationMinutes": 120 }
```

---

## 11. Service Frequencies (`/service-frequencies`)

### `GET /service-frequencies`
- **Response Shape (200 OK)**:
```json
[
  { "_id": "64f1a2b3c4d5e6f7a8b9c500", "frequencyName": "once a month" }
]
```

### `POST /service-frequencies`
- **Auth**: Bearer Token
- **Request Body**:
```json
{ "frequencyName": "twice a week" }
```

---

## 12. Subscription Types (`/subscription-types`)

### `GET /subscription-types`
- **Response Shape (200 OK)**:
```json
[
  { "_id": "64f1a2b3c4d5e6f7a8b9c600", "subscriptionName": "3 month" }
]
```

### `POST /subscription-types`
- **Auth**: Bearer Token
- **Request Body**:
```json
{ "subscriptionName": "6 month" }
```

---

## 13. Time Slots (`/time-slots`)
Reference lookup for standard operating slots.

### `GET /time-slots`
- **Response Shape (200 OK)**:
```json
[
  {
    "_id": "64f1a2b3c4d5e6f7a8b9c701",
    "startTime": "09:00 AM",
    "endTime": "11:00 AM",
    "bufferTime": 30,
    "activeStatusReference": "64f1a2b3c4d5e6f7a8b9c002"
  }
]
```

### `POST /time-slots`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "startTime": "02:00 PM",
  "endTime": "04:00 PM",
  "bufferTime": 30,
  "activeStatusReference": "64f1a2b3c4d5e6f7a8b9c002"
}
```

---

## 14. Payment Methods (`/payment-methods`)

### `GET /payment-methods`
- **Response Shape (200 OK)**:
```json
[
  { "_id": "64f1a2b3c4d5e6f7a8b9c700", "paymentMethodName": "upi" }
]
```

### `POST /payment-methods`
- **Auth**: Bearer Token
- **Request Body**:
```json
{ "paymentMethodName": "cash" }
```

---

## 15. Payment Accounts (`/payment-accounts`)

### `GET /payment-accounts`
- **Response Shape (200 OK)**:
```json
[
  { "_id": "64f1a2b3c4d5e6f7a8b9c800", "accountName": "hdfc" }
]
```

### `POST /payment-accounts`
- **Auth**: Bearer Token
- **Request Body**:
```json
{ "accountName": "sbi" }
```

---

## 16. Bathroom Counts (`/bathroom-counts`)

### `GET /bathroom-counts`
- **Response Shape (200 OK)**:
```json
[
  { "_id": "64f1a2b3c4d5e6f7a8b9c200", "bathroomCount": 2 }
]
```

### `POST /bathroom-counts`
- **Auth**: Bearer Token
- **Request Body**:
```json
{ "bathroomCount": 3 }
```

---

## 17. Work Statuses (`/work-statuses`)
Tracks the job itself (`scheduled`, `in-progress`, `completed`, `cancelled`, `rescheduled`).

### `GET /work-statuses`
- **Response Shape (200 OK)**:
```json
[
  { "_id": "64f1a2b3c4d5e6f7a8b9c900", "statusName": "scheduled" }
]
```

### `POST /work-statuses`
- **Auth**: Bearer Token
- **Request Body**:
```json
{ "statusName": "in-progress" }
```

---

## 18. Pricing Reference List (`/pricing`)

### `GET /pricing`
Supports `/pricing?isActive=true` to only fetch currently active price rows.

- **Auth**: Bearer Token
- **Response Shape (200 OK)**:
```json
[
  {
    "_id": "64f1a2b3c4d5e6f7a8b9c300",
    "serviceDurationReference": {
      "_id": "64f1a2b3c4d5e6f7a8b9c400",
      "durationMinutes": 60
    },
    "bathroomCountReference": {
      "_id": "64f1a2b3c4d5e6f7a8b9c200",
      "bathroomCount": 2
    },
    "price": 1499,
    "isActive": true,
    "effectiveFrom": "2026-09-01T00:00:00.000Z"
  }
]
```

### `POST /pricing`
Adds a new pricing row. Pass `"deactivatePrevious": true` to automatically deactivate prior active pricing for the same duration and bathroom count combination.

- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "serviceDurationReference": "64f1a2b3c4d5e6f7a8b9c400",
  "bathroomCountReference": "64f1a2b3c4d5e6f7a8b9c200",
  "price": 1699,
  "deactivatePrevious": true,
  "effectiveFrom": "2026-09-06T00:00:00.000Z"
}
```
- **Response Shape (201 Created)**: Created pricing row.
