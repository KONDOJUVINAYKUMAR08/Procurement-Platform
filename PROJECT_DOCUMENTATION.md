# ProcureFlow – Complete Project Documentation & Technical Specification

Welcome to the comprehensive technical documentation for **ProcureFlow**, a production-ready monolithic Procurement & Vendor Management Platform. This document is designed for developers and AI agents to understand the entire architecture, database schema, api endpoints, state management, security configurations, and deployment strategies of this application.

---

## 1. Project Overview & Architecture

ProcureFlow is built as a monolithic monorepo structured with a clear separation between the frontend client and the backend server. The design system is inspired by the clean, minimalist Nothing OS aesthetics (vibrant dark mode, monochrome theme, smooth transitions, and border-heavy grid layouts).

```
+-------------------------------------------------------------+
|                        Browser Client                       |
|           (React 18, TypeScript, Tailwind, Recharts)        |
+-------------------------------------------------------------+
                              |
                     HTTPS (Axios + JSON)
                              |
                              v
+-------------------------------------------------------------+
|                         Web Proxy                           |
|                       (Nginx Port 80)                       |
+-------------------------------------------------------------+
                              |
                        Reverse Proxy
                              |
                              v
+-------------------------------------------------------------+
|                    Express Backend Server                   |
|           (Node.js, Express, TypeScript, PM2, Port 5000)    |
+-------------------------------------------------------------+
          |                   |                     |
     Mongoose Driver       AWS SDK v2            SMTP client
          |                   |                     |
          v                   v                     v
+-------------------+ +---------------+ +---------------------+
|      MongoDB      | | AWS Services  | |   Ethereal/SMTP     |
|   (Port 27017)    | | (S3, KMS, SM) | |    (Mail Server)    |
+-------------------+ +---------------+ +---------------------+
```

### High-Level Tech Stack
*   **Frontend**: React 18, TypeScript, React Router v6, Tailwind CSS, TanStack React Query v4, Axios (with automatic refresh token handling), Recharts, Framer Motion, and Lucide React.
*   **Backend**: Node.js v20, Express, TypeScript, Mongoose/MongoDB, Joi input validation, Winston (logger), Helmet/CORS/express-rate-limit, and JSON Web Tokens (JWT) for authentication.
*   **Storage & Encryption**: AWS SDK v2 integration (S3 for secure file uploads, KMS for database field-level encryption, and Secrets Manager for secrets rotation).
*   **Deployment**: Runs on a single Ubuntu EC2 instance configured with a local MongoDB instance, PM2 process management, Nginx reverse proxy, and UFW firewall.

---

## 2. Monorepo Directory Layout

```
procurement-platform/
├── client/                     # React Frontend
│   ├── build/                  # Static production build files (after npm run build)
│   ├── public/                 # Static public assets (HTML template, favicon)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Buttons, Inputs, Skeletons, Modals, Badges
│   │   │   ├── dashboard/      # Custom analytics graphs and stat cards
│   │   │   └── layout/         # Layout wrapper, Header, Sidebar, Notifications panel
│   │   ├── context/            # React state context (AuthContext.tsx)
│   │   ├── lib/                # Client-side utility functions
│   │   ├── pages/              # Primary route views (Dashboard, Vendors, PRs, POs, etc.)
│   │   ├── services/           # Network communications API layers (api.ts, endpoints.ts)
│   │   ├── types/              # TypeScript definitions mapping backend schemas
│   │   ├── App.tsx             # Route definitions and client bootstrap
│   │   ├── index.css           # Global typography, Tailwind imports, Nothing OS theme base
│   │   └── index.tsx           # React DOM renderer entrypoint
│   ├── package.json            # React project dependencies
│   └── tailwind.config.js      # Custom Tailwind styling definitions (colors, fonts)
│
├── server/                     # Node.js + Express Backend
│   ├── dist/                   # Transpiled JavaScript files (after npm run build)
│   ├── src/
│   │   ├── config/             # Connection pooling and secret integrations
│   │   │   ├── aws.ts          # S3 configurations & KMS cryptography (encrypt/decrypt)
│   │   │   ├── logger.ts       # Winston file and console logger configs
│   │   │   └── secrets.ts      # Envs parsing, app configuration, and Mongoose connection
│   │   ├── controllers/        # Business logic routes controllers mapping API endpoints
│   │   ├── middleware/         # Express filters:
│   │   │   ├── audit.ts        # Database audit log tracker
│   │   │   ├── auth.ts         # User auth middleware & JWT signatures
│   │   │   └── validation.ts   # Joi payload request schema validators
│   │   ├── models/             # Mongoose schemas definitions
│   │   ├── routes/             # REST route bindings (auth, vendors, invoices, contracts, etc.)
│   │   ├── seed/               # Initial seeder script for local database testing
│   │   ├── services/           # Reusable service classes
│   │   ├── types/              # TS interface definitions mapping JWT payloads & requests
│   │   ├── utils/              # Generic backend utility methods
│   │   ├── validators/         # Joi schema objects
│   │   └── index.ts            # Entrypoint file starting the Express application
│   ├── package.json            # Backend dependencies and run scripts
│   └── tsconfig.json           # Compiler rules for TypeScript
│
├── scripts/                    # Platform scripts
│   ├── check-local.sh          # Local environment verification checklist script
│   └── deploy-ec2.sh           # Shell script for manual, zero-docker production EC2 deployment
│
├── docker-compose.yml          # Container configuration for Docker local run (optional)
├── Dockerfile                  # Base container definition (optional)
└── package.json                # Monorepo root configuration file using concurrently
```

---

## 3. Database Schema Specification (MongoDB / Mongoose)

ProcureFlow uses MongoDB via Mongoose. The database consists of 9 key collections:

### 3.1 User (`User` Model)
Represents a user account in the system with Role-Based Access Control (RBAC).
*   **email** (String, Required, Unique, Lowercase, Trimmed): Login credential.
*   **password** (String, Required): Hashed password.
*   **firstName** (String, Required, Trimmed).
*   **lastName** (String, Required, Trimmed).
*   **role** (String, Enum, Default: `'procurement_manager'`): One of `'admin'`, `'procurement_manager'`, or `'finance'`.
*   **department** (String, Default: `'General'`).
*   **isActive** (Boolean, Default: `true`): Deactivation prevents logins.
*   **lastLogin** (Date, Optional).
*   **resetPasswordToken** (String, Optional).
*   **resetPasswordExpires** (Date, Optional).
*   **Virtual Field**: `fullName` (`firstName + ' ' + lastName`).
*   **Config**: Timestamps enabled. Password and reset tokens are excluded during JSON serialization.

### 3.2 Vendor (`Vendor` Model)
Stores partner profiles, banking details, rating metrics, and activity audit trails.
*   **vendorName** (String, Required, Trimmed).
*   **vendorCode** (String, Required, Unique, Trimmed): Code tracking (e.g. `VND-001`).
*   **contactPerson** (String, Required, Trimmed).
*   **email** (String, Required, Trimmed, Lowercase).
*   **phone** (String, Required, Trimmed).
*   **address** (Nested Object):
    *   `street` (String, Default: `""`)
    *   `city` (String, Default: `""`)
    *   `state` (String, Default: `""`)
    *   `country` (String, Default: `""`)
    *   `zipCode` (String, Default: `""`)
*   **taxId** (String, Required): Encrypted via KMS.
*   **bankAccount** (String, Required): Encrypted via KMS.
*   **status** (String, Enum, Default: `'pending'`): One of `'active'`, `'inactive'`, `'pending'`, or `'blacklisted'`.
*   **rating** (Number, Default: `0`, Range: `0-5`).
*   **notes** (String, Default: `""`).
*   **activities** (Array of Objects): Tracking actions performed on vendors:
    *   `action` (String, Required)
    *   `description` (String, Required)
    *   `performedBy` (ObjectId, Ref: `'User'`, Required)
    *   `timestamp` (Date, Default: `Date.now`)
*   **createdBy** (ObjectId, Ref: `'User'`, Required).
*   **Indexes**: Text index on `{ vendorName: "text", vendorCode: "text", email: "text" }`.
*   **Config**: Timestamps enabled.

### 3.3 PurchaseRequest (`PurchaseRequest` Model)
Requested items requiring budget approval prior to generating binding POs.
*   **title** (String, Required, Trimmed).
*   **department** (String, Required).
*   **priority** (String, Enum, Default: `'medium'`): One of `'low'`, `'medium'`, `'high'`, or `'urgent'`.
*   **description** (String, Required).
*   **estimatedCost** (Number, Required).
*   **vendor** (ObjectId, Ref: `'Vendor'`, Optional).
*   **status** (String, Enum, Default: `'draft'`): One of `'draft'`, `'pending'`, `'approved'`, or `'rejected'`.
*   **requestedBy** (ObjectId, Ref: `'User'`, Required).
*   **approvedBy** (ObjectId, Ref: `'User'`, Optional).
*   **rejectionReason** (String, Optional).
*   **items** (Array of Objects):
    *   `name` (String, Required)
    *   `description` (String, Default: `""`)
    *   `quantity` (Number, Required)
    *   `unitPrice` (Number, Required)
*   **Indexes**: Text index on `{ title: "text", department: "text" }`.
*   **Config**: Timestamps enabled.

### 3.4 PurchaseOrder (`PurchaseOrder` Model)
Binding POs generated from approved Purchase Requests or issued directly.
*   **poNumber** (String, Required, Unique).
*   **vendor** (ObjectId, Ref: `'Vendor'`, Required).
*   **purchaseRequest** (ObjectId, Ref: `'PurchaseRequest'`, Optional).
*   **items** (Array of Objects):
    *   `name` (String, Required)
    *   `description` (String, Default: `""`)
    *   `quantity` (Number, Required)
    *   `unitPrice` (Number, Required)
    *   `totalPrice` (Number, Required)
*   **subtotal** (Number, Required).
*   **tax** (Number, Default: `0`).
*   **totalAmount** (Number, Required).
*   **status** (String, Enum, Default: `'draft'`): One of `'draft'`, `'issued'`, `'acknowledged'`, `'shipped'`, `'completed'`, or `'cancelled'`.
*   **orderDate** (Date, Default: `Date.now`).
*   **expectedDeliveryDate** (Date, Optional).
*   **notes** (String, Default: `""`).
*   **createdBy** (ObjectId, Ref: `'User'`, Required).
*   **Config**: Timestamps enabled.

### 3.5 Contract (`Contract` Model)
Documents representing legal agreements signed with vendors.
*   **contractName** (String, Required, Trimmed).
*   **vendor** (ObjectId, Ref: `'Vendor'`, Required).
*   **contractNumber** (String, Required, Unique).
*   **effectiveDate** (Date, Required).
*   **expiryDate** (Date, Required).
*   **contractValue** (Number, Required).
*   **status** (String, Enum, Default: `'active'`): One of `'active'`, `'expired'`, `'terminated'`, or `'pending_renewal'`.
*   **description** (String, Default: `""`).
*   **documentUrl** (String, Optional): Link to S3 storage bucket.
*   **versions** (Array of Objects): Version tracking for contract updates:
    *   `version` (Number, Required)
    *   `documentUrl` (String, Required)
    *   `uploadedAt` (Date, Default: `Date.now`)
    *   `uploadedBy` (ObjectId, Ref: `'User'`, Required)
*   **createdBy** (ObjectId, Ref: `'User'`, Required).
*   **Indexes**: Text index on `{ contractName: "text", contractNumber: "text" }`.
*   **Config**: Timestamps enabled.

### 3.6 Invoice (`Invoice` Model)
Requests for payment matching issued POs or under active contracts.
*   **invoiceNumber** (String, Required, Unique).
*   **vendor** (ObjectId, Ref: `'Vendor'`, Required).
*   **purchaseOrder** (ObjectId, Ref: `'PurchaseOrder'`, Optional).
*   **contract** (ObjectId, Ref: `'Contract'`, Optional).
*   **amount** (Number, Required).
*   **tax** (Number, Default: `0`).
*   **totalAmount** (Number, Required).
*   **dueDate** (Date, Required).
*   **status** (String, Enum, Default: `'pending'`): One of `'pending'`, `'approved'`, `'paid'`, `'overdue'`, or `'disputed'`.
*   **description** (String, Default: `""`).
*   **documentUrl** (String, Optional): Link to S3.
*   **paymentDate** (Date, Optional).
*   **paymentMethod** (String, Optional).
*   **approvedBy** (ObjectId, Ref: `'User'`, Optional).
*   **createdBy** (ObjectId, Ref: `'User'`, Required).
*   **Config**: Timestamps enabled.

### 3.7 Document (`Document` Model)
Stores metadata for uploads routed to AWS S3.
*   **fileName** (String, Required): UUID/randomized S3 storage filename.
*   **originalName** (String, Required): Original filename from user client.
*   **mimeType** (String, Required).
*   **size** (Number, Required): File size in bytes.
*   **s3Key** (String, Required).
*   **s3Bucket** (String, Required).
*   **category** (String, Enum, Required): One of `'contract'`, `'invoice'`, `'purchase_order'`, or `'vendor_certificate'`.
*   **relatedId** (String, Optional): Foreign reference ID mapping the record category.
*   **uploadedBy** (ObjectId, Ref: `'User'`, Required).
*   **Config**: Timestamps enabled.

### 3.8 Notification (`Notification` Model)
Alert messages pushed to internal users for critical event loops.
*   **title** (String, Required).
*   **message** (String, Required).
*   **type** (String, Enum, Required): One of `'contract_expiry'`, `'invoice_due'`, `'vendor_approval'`, `'purchase_approval'`, or `'system'`.
*   **userId** (ObjectId, Ref: `'User'`, Optional): Specific target user, or null/undefined if global alert.
*   **isRead** (Boolean, Default: `false`).
*   **relatedId** (String, Optional): Target entity identifier.
*   **relatedModel** (String, Optional): Target entity class name.
*   **Config**: Timestamps enabled.

### 3.9 AuditLog (`AuditLog` Model)
Secure activity logging system for administrators.
*   **userId** (ObjectId, Ref: `'User'`, Required).
*   **action** (String, Required): Trigger action (e.g. `'create'`, `'update'`, `'approve'`).
*   **entity** (String, Required): Context collection name.
*   **entityId** (String, Optional).
*   **details** (Mixed/Record, Default: `{}`): Query payloads, routes and response status codes.
*   **ipAddress** (String, Default: `""`).
*   **userAgent** (String, Default: `""`).
*   **Indexes**: Compound index on `{ action: 1, entity: 1, createdAt: -1 }`.
*   **Config**: Timestamps enabled.

---

## 4. API Specification & RBAC Permissions

All API routes start with the prefix `/api`. Request bodies must be JSON, and payloads are validated with Joi.

### 4.1 Route Declarations & RBAC Matrix

| Endpoint | Method | Middleware Stack | Allowed Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Profile** | | | | |
| `/api/auth/register` | POST | Joi: `registerSchema` | `admin` | Register a new user |
| `/api/auth/login` | POST | Joi: `loginSchema` | Public | Authenticate user & return JWT + Refresh Token |
| `/api/auth/refresh-token` | POST | - | Public | Rotate expired access token using refresh token |
| `/api/auth/logout` | POST | - | Public | Perform token cleanup |
| `/api/auth/forgot-password` | POST | Joi: `forgotPasswordSchema` | Public | Generate reset password token & email it |
| `/api/auth/reset-password` | POST | Joi: `resetPasswordSchema` | Public | Reset password using reset token |
| `/api/auth/profile` | GET | `authenticate` | All Roles | Retrieve logged-in profile data |
| `/api/auth/profile` | PUT | `authenticate`, Joi: `userUpdateSchema` | All Roles | Update user profile fields |
| **Vendor Management** | | | | |
| `/api/vendors` | GET | `authenticate` | All Roles | List/Search vendors (supports text search & pagination) |
| `/api/vendors/stats` | GET | `authenticate` | All Roles | Retrieve total counts and rating groupings |
| `/api/vendors/:id` | GET | `authenticate` | All Roles | Retrieve individual vendor detail |
| `/api/vendors` | POST | `authenticate`, `authorize('admin', 'procurement_manager')`, Joi: `vendorSchema`, `auditLog('create', 'vendor')` | `admin`, `procurement_manager` | Register a new vendor profile |
| `/api/vendors/:id` | PUT | `authenticate`, `authorize('admin', 'procurement_manager')`, Joi: `vendorSchema`, `auditLog('update', 'vendor')` | `admin`, `procurement_manager` | Update vendor parameters |
| `/api/vendors/:id` | DELETE | `authenticate`, `authorize('admin')`, `auditLog('delete', 'vendor')` | `admin` | Deletes/unregisters a vendor |
| **Purchase Requests** | | | | |
| `/api/purchase-requests` | GET | `authenticate` | All Roles | List/Filter purchase requests |
| `/api/purchase-requests/:id`| GET | `authenticate` | All Roles | Retrieve purchase request details |
| `/api/purchase-requests` | POST | `authenticate`, Joi: `purchaseRequestSchema`, `auditLog('create', 'purchase_request')` | All Roles | Create a new purchase request in `draft` status |
| `/api/purchase-requests/:id`| PUT | `authenticate`, Joi: `purchaseRequestSchema`, `auditLog('update', 'purchase_request')` | Request Owner, `admin` | Update a purchase request in `draft` or `rejected` status |
| `/api/purchase-requests/:id/submit`| POST | `authenticate`, `auditLog('submit', 'purchase_request')` | Request Owner, `admin` | Transition status from `draft` to `pending` |
| `/api/purchase-requests/:id/approve`| POST | `authenticate`, `authorize('admin', 'procurement_manager')`, `auditLog('approve', 'purchase_request')` | `admin`, `procurement_manager` | Approve a pending PR (allows generating a PO) |
| `/api/purchase-requests/:id/reject` | POST | `authenticate`, `authorize('admin', 'procurement_manager')`, `auditLog('reject', 'purchase_request')` | `admin`, `procurement_manager` | Reject a pending PR with a required explanation |
| **Purchase Orders** | | | | |
| `/api/purchase-orders` | GET | `authenticate` | All Roles | List all PO records |
| `/api/purchase-orders/:id` | GET | `authenticate` | All Roles | Fetch single PO |
| `/api/purchase-orders` | POST | `authenticate`, `authorize('admin', 'procurement_manager')`, Joi: `purchaseOrderSchema`, `auditLog('create', 'purchase_order')` | `admin`, `procurement_manager` | Create a new PO (auto-generates `poNumber`) |
| `/api/purchase-orders/:id` | PUT | `authenticate`, `authorize('admin', 'procurement_manager')`, `auditLog('update', 'purchase_order')` | `admin`, `procurement_manager` | Update PO items/status |
| **Contracts** | | | | |
| `/api/contracts` | GET | `authenticate` | All Roles | List all contracts |
| `/api/contracts/expiring` | GET | `authenticate` | All Roles | Retrieve contracts expiring within 30 days |
| `/api/contracts/:id` | GET | `authenticate` | All Roles | Get individual contract detail |
| `/api/contracts` | POST | `authenticate`, `authorize('admin', 'procurement_manager')`, Joi: `contractSchema`, `auditLog('create', 'contract')` | `admin`, `procurement_manager` | Create a new contract |
| `/api/contracts/:id` | PUT | `authenticate`, `authorize('admin', 'procurement_manager')`, `auditLog('update', 'contract')` | `admin`, `procurement_manager` | Update contract metadata/renew version |
| **Invoices** | | | | |
| `/api/invoices` | GET | `authenticate` | All Roles | List all invoices |
| `/api/invoices/:id` | GET | `authenticate` | All Roles | Get individual invoice details |
| `/api/invoices` | POST | `authenticate`, `authorize('admin', 'finance', 'procurement_manager')`, Joi: `invoiceSchema`, `auditLog('create', 'invoice')` | `admin`, `finance`, `procurement_manager` | Submit a new invoice |
| `/api/invoices/:id/approve` | POST | `authenticate`, `authorize('admin', 'finance')`, `auditLog('approve', 'invoice')` | `admin`, `finance` | Transition status from `pending` to `approved` |
| `/api/invoices/:id/pay` | POST | `authenticate`, `authorize('admin', 'finance')`, `auditLog('pay', 'invoice')` | `admin`, `finance` | Mark invoice as `paid` with payment method |
| **Audit Logs** | | | | |
| `/api/audit-logs` | GET | `authenticate`, `authorize('admin')` | `admin` | Query full audit history log |
| **User Administration** | | | | |
| `/api/users` | GET | `authenticate`, `authorize('admin')` | `admin` | List all users |
| `/api/users/:id` | GET | `authenticate`, `authorize('admin')` | `admin` | Fetch user info |
| `/api/users/:id` | PUT | `authenticate`, `authorize('admin')`, Joi: `userUpdateSchema` | `admin` | Update user roles or toggle `isActive` status |
| `/api/users/:id` | DELETE | `authenticate`, `authorize('admin')` | `admin` | Delete user from system |
| **Document Management** | | | | |
| `/api/documents/upload` | POST | `authenticate`, Multer upload | All Roles | Upload attachment to S3; returns details |
| `/api/documents` | GET | `authenticate` | All Roles | List documents filtered by categories |
| `/api/documents/:id/download` | GET | `authenticate` | All Roles | Returns a presigned AWS S3 download link |
| `/api/documents/:id` | DELETE | `authenticate`, `auditLog('delete', 'document')` | All Roles (must own or be admin) | Deletes file from local db and AWS S3 bucket |
| **System Dashboard** | | | | |
| `/api/dashboard` | GET | `authenticate` | All Roles | Fetch dashboard analytics metrics |
| **Notifications** | | | | |
| `/api/notifications` | GET | `authenticate` | All Roles | Fetch notifications for logged-in user |
| `/api/notifications/unread-count` | GET | `authenticate` | All Roles | Unread notifications count |
| `/api/notifications/:id/read` | PUT | `authenticate` | All Roles | Mark single notification as read |
| `/api/notifications/read-all` | PUT | `authenticate` | All Roles | Mark all notifications as read |
| **Report Export** | | | | |
| `/api/reports/vendors` | GET | `authenticate` | All Roles | Export CSV list of vendors |
| `/api/reports/procurement` | GET | `authenticate` | All Roles | Export CSV list of purchase orders/requests |
| `/api/reports/invoices` | GET | `authenticate` | All Roles | Export CSV list of invoices |
| `/api/reports/contracts` | GET | `authenticate` | All Roles | Export CSV list of contracts |

---

## 5. Security & Authentication Model

ProcureFlow implements stateless authentication with stateful token expiration management.

```
       [Client Login Request] ---> (Validate Request via Joi)
                                          |
                                    (Check Credentials)
                                          |
                                          v
                              [Generate Tokens Payload]
                                          |
            +-----------------------------+-----------------------------+
            |                                                           |
            v                                                           v
  [Generate Access Token]                                     [Generate Refresh Token]
  - Expiry: 15 minutes                                         - Expiry: 7 days
  - JWT Sign (jwtSecret)                                      - JWT Sign (jwtRefreshSecret)
            |                                                           |
            v                                                           v
   Returned in JSON Response                                    Saved in LocalStorage
   (Stored in Auth Context)                                    (Or optional HTTP-only cookie)
```

### 5.1 Authentication Flow Details
1.  **Access Token**: Expressed as a JSON Web Token signed with `JWT_SECRET`. Contains payload `{ userId: string, email: string, role: string }`. Typically valid for 15 minutes (`JWT_EXPIRY`).
2.  **Refresh Token**: Long-lived token signed with `JWT_REFRESH_SECRET`. Valid for 7 days (`JWT_REFRESH_EXPIRY`). Stored on the client in `localStorage` and sent via POST request to `/api/auth/refresh-token` to retrieve a new Access Token.
3.  **Transport Layer Security**: In production, the Nginx layer sits in front of port 5000 to terminate SSL/TLS.
4.  **Cookie Integration (Optional)**: Backend routes support extracting authentication tokens from HTTP-only secure cookies (`req.cookies.token`) as a fallback if authorization headers (`Authorization: Bearer <token>`) are not present.

### 5.2 Input Validation Layer
All inbound endpoints that create or modify resources run Joi-based verification filters. If request validation fails, the `validate` middleware halts processing and returns a `400 Bad Request` containing an array of error messages mapped to specific fields:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "vendor.phone",
      "message": "\"phone\" is required"
    }
  ]
}
```

### 5.3 Audit Logger Middleware
Sensitive mutations (create, update, delete, approve) are intercept-logged in the background. The `auditLog(action, entity)` middleware wraps Express's `res.end()` function:
- If the route responds with a success status code (`< 400`), it registers an `AuditLog` entry detailing:
  - Performing `userId`
  - Action name (e.g. `'approve'`) and Entity (e.g. `'invoice'`)
  - Target `entityId` extracted from query params
  - Request data (body, queries, params) and metadata (IP address, user-agent)
- The audit tracker processes asynchronously without blocking the client's HTTP response.

---

## 6. Frontend Architecture & API Client

The frontend client is bootstrapped with Create React App (TypeScript template).

### 6.1 State & Query Management
*   **TanStack React Query**: Used for server state cache synchronization, querying, and mutations (e.g., vendor lists, invoice stats, alerts count).
*   **AuthContext**: Manages user authentication state globally. Exposes parameters:
    *   `user` profile info
    *   `token` access string
    *   `isLoading` state while validating profile during mount
    *   `login()` / `logout()` methods
    *   `updateUser()` updater
*   **Axios Client Instance**: All API requests flow through a configured instance in `client/src/services/api.ts`.

### 6.2 Frontend Routing Map

*   `/login`: Sign in screen (Unauthenticated only).
*   `/forgot-password`: Password reset request screen (Unauthenticated only).
*   `/reset-password`: Resets user credentials using token verification (Unauthenticated only).
*   `/`: Core authenticated layout. Displays analytics dashboards and transaction graphs.
*   `/vendors`: Directory list of vendors. Contains creation and filters panel.
*   `/vendors/:id`: Profile card of vendor showing bank details, active contracts, and activities logs.
*   `/purchase-requests`: Procurement request submission dashboard and approval log.
*   `/purchase-orders`: Purchase order tracking page.
*   `/contracts`: Legal contract management board, tracking expiry deadlines and files.
*   `/invoices`: Accounting console, showing billing status and payment processing hooks.
*   `/documents`: Central asset manager for contract agreements, invoices, and certificates.
*   `/notifications`: System alerts and action requests directory.
*   `/reports`: Exporters for downloading platform data tables as CSV files.
*   `/users` (Admin only): Controls system logins, roles, and account activation.
*   `/settings`: Manage personal profiles.

---

## 7. Cloud Integrations (AWS S3 & KMS)

ProcureFlow integrates with AWS to store files and encrypt sensitive fields.

```
       [Secure Document File Upload]
                     |
            (Multer Temp Buffer)
                     |
      (Upload S3 via Server-Side KMS)
        - Key: contracts/ctr-123.pdf
        - Encryption: aws:kms
                     |
                     v
             [AWS S3 Bucket]
```

### 7.1 AWS S3 Document Storage
*   File attachments (PDFs, images, spreadsheets) uploaded for contracts, invoices, or vendor onboarding are sent to an S3 bucket configured via `AWS_S3_BUCKET`.
*   Files are uploaded under category subfolders: `contracts/`, `invoices/`, `purchase_orders/`, or `vendor_certificates/`.
*   All file requests are secured. The client requests a presigned S3 URL from `/api/documents/:id/download` which generates a time-limited download URL valid for 3600 seconds.

### 7.2 AWS KMS Envelope Encryption
*   Highly sensitive database fields, specifically bank account numbers (`bankAccount`) and tax IDs (`taxId`) in the `Vendor` schema, are processed using AWS Key Management Service (KMS).
*   Prior to saving a vendor record to MongoDB, the fields are encrypted via KMS's `kms.encrypt()`. The resulting binary is stored in base64 format.
*   When fetched by an authorized user, the server calls `kms.decrypt()` to return the clear text.
*   *Fallback Strategy*: If no KMS Key ID (`AWS_KMS_KEY_ID`) is provided in the configuration, the system automatically falls back to base64 encoding/decoding.

---

## 8. Seeding, Local Development, & Verification

### 8.1 Local Setup
To verify and run the application locally on a development machine:
1.  **Clone the workspace** and navigate to the project directory.
2.  **Install dependencies**:
    ```bash
    npm install                         # Installs root helper utilities
    cd server && npm install            # Installs Express dependencies
    cd ../client && npm install --legacy-peer-deps  # Installs React frontend
    ```
3.  **Set up environment**: Copy the template environment file:
    ```bash
    cp server/.env.example server/.env
    ```
4.  **Database Seeding**: Populate the local database with demo data:
    ```bash
    cd server && npm run seed
    ```
5.  **Start Development Servers**:
    ```bash
    # From project root directory
    npm run dev
    ```
    This starts the backend server on `http://localhost:5000` and the React frontend on `http://localhost:3000`.

### 8.2 Seeding Accounts (Default)
The database seeder (`server/src/seed/index.ts`) creates the following test accounts:
*   **Administrator**: `admin@procurement.com` / password `admin123`
*   **Procurement Manager**: `manager@procurement.com` / password `manager123`
*   **Finance Officer**: `finance@procurement.com` / password `finance123`

---

## 9. Single-Instance Production EC2 Deployment (No Docker)

ProcureFlow is designed to deploy on a single Ubuntu EC2 instance without using Docker. This manual deployment setup installs the entire stack (Express server, React frontend, MongoDB database, PM2, Nginx, and UFW firewall) directly onto the host operating system.

### 9.1 Infrastructure Design (Single-Instance EC2)

```
                              Public Internet (HTTPS Port 443 / HTTP Port 80)
                                                    |
                                                    v
+-----------------------------------------------------------------------------------+
|  Ubuntu EC2 Instance Host VM                                                      |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |  Firewall (UFW) - Block all outside requests EXCEPT SSH (22) & HTTP (80)  |   |
|   +---------------------------------------------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   |  Nginx Web Proxy (Port 80)                                                |   |
|   |  - Static files fallback for SPA React client (client/build)              |   |
|   |  - Reverse proxy API requests to local backend (proxy_pass http://5000)   |   |
|   +---------------------------------------------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   |  PM2 Process Runner (Port 5000)                                           |   |
|   |  - Hosts backend Express instance (`server/dist/index.js`)                |   |
|   |  - Spawns background process monitoring with auto-restarts                |   |
|   +---------------------------------------------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   |  MongoDB Community Service (Localhost Port 27017)                         |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

### 9.2 Automated Verification & Deployment Scripts
Two scripts are provided in the `/scripts` directory to ensure smooth operations:

1.  **Verification Script (`scripts/check-local.sh`)**:
    *   Verifies that Node.js (v18+) and npm are installed.
    *   Creates a `.env` configuration file from the example template if missing.
    *   Installs dependencies across all three directories (root, client, server).
    *   Validates database connectivity by running Mongoose checks.
    *   Seeds mock accounts into MongoDB.
    *   Validates compilation by building both the TypeScript server and React frontend.
2.  **Deployment Script (`scripts/deploy-ec2.sh`)**:
    *   Updates host system libraries (`apt-get update & upgrade`).
    *   Installs MongoDB 7.0 Community Edition, configures it to start on system boot.
    *   Installs Node.js v20 LTS and global PM2.
    *   Installs Nginx and configures a server block to reverse-proxy `/api` to port 5000, while serving static frontend assets directly.
    *   Configures UFW Firewall rules to restrict access, permitting only SSH (22) and Nginx (80).
    *   Generates cryptographically random secure JWT and Refresh secrets.
    *   Builds the Express server and compiles the React production bundle.
    *   Seeds database schemas.
    *   Launches backend process instances using PM2 under the system's non-root user.

---

## 10. Core Reference Implementations

Below are the complete, unmodified key configuration and implementation source files for reference.

### 10.1 Backend Entrypoint (`server/src/index.ts`)
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import * as path from 'path';
import config from './config/secrets';
import { connectDatabase } from './config/secrets';
import routes from './routes';
import logger from './config/logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Serve static files in production
if (config.nodeEnv === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/build');
  app.use(express.static(clientBuildPath));
  app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

// 404 handler
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
const start = async () => {
  try {
    await connectDatabase();
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export default app;
```

### 10.2 Config & Secrets Resolver (`server/src/config/secrets.ts`)
```typescript
import mongoose from 'mongoose';

interface AppConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiry: string;
  jwtRefreshExpiry: string;
  corsOrigin: string;
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
    kmsKeyId: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-change-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || 'procurement-docs',
    kmsKeyId: process.env.AWS_KMS_KEY_ID || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@procurement-platform.com',
  },
};

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default config;
```

### 10.3 Authentication Middleware (`server/src/middleware/auth.ts`)
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/secrets';
import { IAuthenticatedRequest, IAuthPayload } from '../types';
import { User } from '../models/User';
import logger from '../config/logger';

export const authenticate = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as IAuthPayload;
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or deactivated.',
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this resource.',
      });
    }

    next();
  };
};

export const generateToken = (payload: IAuthPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiry } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: IAuthPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiry } as jwt.SignOptions);
};
```

### 10.4 Express Joi Validators (`server/src/validators/index.ts`)
```typescript
import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('admin', 'procurement_manager', 'finance').default('procurement_manager'),
  department: Joi.string().min(1).max(100).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

export const vendorSchema = Joi.object({
  vendorName: Joi.string().min(1).max(200).required(),
  contactPerson: Joi.string().min(1).max(200).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(1).max(20).required(),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    country: Joi.string().allow(''),
    zipCode: Joi.string().allow(''),
  }).default({}),
  taxId: Joi.string().required(),
  bankAccount: Joi.string().required(),
  status: Joi.string().valid('active', 'inactive', 'pending', 'blacklisted'),
  rating: Joi.number().min(0).max(5),
  notes: Joi.string().allow(''),
});

export const purchaseRequestSchema = Joi.object({
  title: Joi.string().min(1).max(300).required(),
  department: Joi.string().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  description: Joi.string().required(),
  estimatedCost: Joi.number().min(0).required(),
  vendor: Joi.string(),
  items: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow(''),
      quantity: Joi.number().min(1).required(),
      unitPrice: Joi.number().min(0).required(),
    })
  ).default([]),
});

export const purchaseOrderSchema = Joi.object({
  vendor: Joi.string().required(),
  purchaseRequest: Joi.string(),
  items: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow(''),
      quantity: Joi.number().min(1).required(),
      unitPrice: Joi.number().min(0).required(),
    })
  ).min(1).required(),
  tax: Joi.number().min(0).default(0),
  expectedDeliveryDate: Joi.date(),
  notes: Joi.string().allow(''),
});

export const contractSchema = Joi.object({
  contractName: Joi.string().required(),
  vendor: Joi.string().required(),
  effectiveDate: Joi.date().required(),
  expiryDate: Joi.date().greater(Joi.ref('effectiveDate')).required(),
  contractValue: Joi.number().min(0).required(),
  description: Joi.string().allow(''),
  documentUrl: Joi.string().allow(''),
});

export const invoiceSchema = Joi.object({
  vendor: Joi.string().required(),
  purchaseOrder: Joi.string(),
  contract: Joi.string(),
  amount: Joi.number().min(0).required(),
  tax: Joi.number().min(0).default(0),
  dueDate: Joi.date().required(),
  description: Joi.string().allow(''),
  documentUrl: Joi.string().allow(''),
});

export const userUpdateSchema = Joi.object({
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  role: Joi.string().valid('admin', 'procurement_manager', 'finance'),
  department: Joi.string(),
  isActive: Joi.boolean(),
});

export const validatePagination = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().allow(''),
});
```

### 10.5 Frontend Network Interceptor (`client/src/services/api.ts`)
```typescript
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });
          const { token, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 11. Deployment Script Reference

### 11.1 EC2 Setup Script (`scripts/deploy-ec2.sh`)
```bash
#!/usr/bin/env bash
# Deployment script for ProcureFlow Procurement Platform on a single Ubuntu EC2 instance.
# Run this script as root or with sudo: sudo ./scripts/deploy-ec2.sh

# Exit on error
set -e

# Setup colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}   ProcureFlow – Manual EC2 Deployment Script       ${NC}"
echo -e "${BLUE}===================================================${NC}"
echo ""

# Ensure script is run with sudo/root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run this script with sudo or as root:${NC}"
  echo "sudo ./scripts/deploy-ec2.sh"
  exit 1
fi

# Detect application root path (assuming script is run from project root/scripts folder)
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo -e "${BLUE}📍 Application directory identified as: $APP_DIR${NC}"
cd "$APP_DIR"

# 1. System Update
echo -e "${BLUE}[1/8] Updating system packages...${NC}"
apt-get update -y
apt-get upgrade -y
apt-get install -y curl gnupg git build-essential ufw
echo -e "${GREEN}✅ System packages updated.${NC}"
echo ""

# 2. Install MongoDB 7.0 Community Edition
echo -e "${BLUE}[2/8] Installing MongoDB 7.0 Community Edition...${NC}"
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
       gpg --o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
    
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    apt-get update -y
    apt-get install -y mongodb-org
    
    # Start and enable MongoDB daemon
    systemctl start mongod
    systemctl enable mongod
    echo -e "${GREEN}✅ MongoDB 7.0 installed, started, and enabled on boot.${NC}"
else
    echo -e "${GREEN}✅ MongoDB is already installed.${NC}"
    systemctl start mongod || true
fi
echo ""

# 3. Install Node.js v20.x LTS
echo -e "${BLUE}[3/8] Installing Node.js v20 LTS...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js $(node -v) and npm $(npm -v) installed.${NC}"
else
    echo -e "${GREEN}✅ Node.js $(node -v) is already installed.${NC}"
fi
echo ""

# 4. Install PM2 (Process Manager)
echo -e "${BLUE}[4/8] Installing PM2 process manager...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed globally.${NC}"
else
    echo -e "${GREEN}✅ PM2 is already installed.${NC}"
fi
echo ""

# 5. Configure Nginx Reverse Proxy
echo -e "${BLUE}[5/8] Installing and configuring Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
fi

# Create Nginx site config
cat > /etc/nginx/sites-available/procurement << 'EOF'
server {
    listen 80;
    server_name _; # Responds to any IP or domain mapped to this instance

    # Adjust client body size limit for document uploads
    client_max_body_size 15M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site and disable default Nginx site if it exists
ln -sf /etc/nginx/sites-available/procurement /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Restart Nginx to apply changes
systemctl restart nginx
systemctl enable nginx
echo -e "${GREEN}✅ Nginx reverse proxy configured and started on port 80.${NC}"
echo ""

# 6. Configure Firewall (UFW)
echo -e "${BLUE}[6/8] Configuring Firewall (UFW)...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
# Expose port 5000 just in case, though port 80 is the main entrypoint
ufw allow 5000/tcp
echo "y" | ufw enable
echo -e "${GREEN}✅ UFW Firewall enabled with SSH and Nginx allowed.${NC}"
echo ""

# 7. Setup Application Environment and Files
echo -e "${BLUE}[7/8] Setting up Application Dependencies and Building...${NC}"

# Configure environment if not present
if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    # Generate random JWT secrets automatically
    JWT_SECRET_RAND=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    JWT_REFRESH_RAND=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET_RAND/" server/.env
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_RAND/" server/.env
    sed -i "s/NODE_ENV=development/NODE_ENV=production/" server/.env
    
    echo -e "${GREEN}✅ Created server/.env with production defaults and secure JWT keys.${NC}"
else
    # Ensure NODE_ENV is set to production
    sed -i "s/NODE_ENV=development/NODE_ENV=production/" server/.env
    echo -e "${GREEN}✅ server/.env already exists (ensured NODE_ENV=production).${NC}"
fi

# Install dependencies and build
echo "Installing dependencies..."
npm install --no-audit --no-fund
cd server && npm install --no-audit --no-fund && cd ..
cd client && npm install --no-audit --no-fund --legacy-peer-deps && cd ..

# Build
echo "Building applications..."
cd server && npm run build && cd ..
cd client && REACT_APP_API_URL=/api npm run build && cd ..
echo -e "${GREEN}✅ Applications built successfully.${NC}"
echo ""

# 8. Seed and Run via PM2
echo -e "${BLUE}[8/8] Seeding database and starting PM2 processes...${NC}"

# Get the non-root user who invoked sudo (fallback to root if run directly)
REAL_USER=${SUDO_USER:-$USER}
REAL_HOMEDIR=$(eval echo ~$REAL_USER)

# Create logs directory and assign permissions to real user
mkdir -p logs
chown -R $REAL_USER:$REAL_USER logs

# Seed Database
echo "Running database seeder..."
cd server && npm run seed && cd ..

# Start backend using PM2 as the real user
echo "Configuring PM2 for user '$REAL_USER'..."
sudo -u $REAL_USER pm2 delete procurement-app || true

# Start Node App in production mode as the real user
sudo -u $REAL_USER pm2 start server/dist/index.js --name "procurement-app" --update-env

# Save PM2 state and configure startup service for the real user
sudo -u $REAL_USER pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u $REAL_USER --hp $REAL_HOMEDIR || true

echo ""
echo -e "${GREEN}===================================================${NC}"
echo -e "${GREEN}   🎉 DEPLOYMENT SETUP COMPLETED SUCCESSFULLY!      ${NC}"
echo -e "${GREEN}                                                   ${NC}"
echo -e "${GREEN}   Your procurement platform is now running!       ${NC}"
echo -e "${GREEN}   Access it here: http://<your-ec2-public-ip>     ${NC}"
echo -e "${GREEN}                                                   ${NC}"
echo -e "${GREEN}   Demo Accounts:                                  ${NC}"
echo -e "${GREEN}     - Admin: admin@procurement.com / admin123     ${NC}"
echo -e "${GREEN}     - Manager: manager@procurement.com / manager123 ${NC}"
echo -e "${GREEN}     - Finance: finance@procurement.com / finance123 ${NC}"
echo -e "${GREEN}                                                   ${NC}"
echo -e "${GREEN}   To check application status: pm2 status          ${NC}"
echo -e "${GREEN}   To view logs: pm2 logs procurement-app          ${NC}"
echo -e "${GREEN}===================================================${NC}"
```
