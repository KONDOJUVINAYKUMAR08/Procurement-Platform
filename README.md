# ProcureFlow – Procurement & Vendor Management Platform

A production-ready monolithic Procurement & Vendor Management Platform with a premium Nothing OS-inspired UI.

## 🏗️ Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Tailwind CSS** + custom design system
- **TanStack React Query** for data fetching
- **React Router v6** for routing
- **Recharts** for analytics charts
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **MongoDB** + **Mongoose**
- **JWT Authentication** + RBAC
- **Joi Validation**
- **Multer** for file uploads
- **Winston** for logging

### AWS Integration
- **S3** – Document storage
- **KMS** – Data encryption
- **Secrets Manager** – Secret management

## 📁 Project Structure

```
procurement-platform/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # UI Components
│   │   ├── context/            # React Context (Auth)
│   │   ├── lib/                # Utilities
│   │   ├── pages/              # Page Components
│   │   ├── services/           # API Services
│   │   └── types/              # TypeScript Types
│   └── tailwind.config.js
├── server/                     # Express Backend
│   ├── src/
│   │   ├── config/             # Configuration
│   │   ├── controllers/        # Route Controllers
│   │   ├── middleware/         # Auth, Audit, Validation
│   │   ├── models/             # Mongoose Models
│   │   ├── routes/             # API Routes
│   │   ├── services/           # Business Logic
│   │   ├── validators/         # Joi Schemas
│   │   └── seed/               # Database Seed Data
│   └── tsconfig.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm**
- **MongoDB** (local or Atlas)
- (Optional) **AWS Account** for S3/KMS

### 1. Clone & Install

```bash
cd procurement-platform

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Install root dependencies
cd .. && npm install
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and other settings
```

### 3. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongo mongo:7

# Or use Docker Compose
docker-compose up -d mongo
```

### 4. Seed Database

```bash
cd server && npm run seed
```

### 5. Start Development Servers

```bash
# From project root - starts both frontend and backend
npm run dev

# Or separately:
# Terminal 1 - Backend (port 5000)
cd server && npm run dev

# Terminal 2 - Frontend (port 3000)
cd client && npm start
```

### 6. Open the Application

Navigate to **http://localhost:3000**

## 🔑 Demo Accounts

| Role               | Email                        | Password     |
|--------------------|------------------------------|--------------|
| Admin              | admin@procurement.com        | admin123     |
| Procurement Manager| manager@procurement.com      | manager123   |
| Finance            | finance@procurement.com      | finance123   |

## 📋 Features

### Core Modules
- ✅ **Dashboard** – Analytics with charts, metrics, recent activity
- ✅ **Vendor Management** – CRUD, search, filter, activity timeline
- ✅ **Purchase Requests** – Create, submit, approve/reject workflow
- ✅ **Purchase Orders** – Generate POs, track status, line items
- ✅ **Contract Management** – Expiry monitoring, version tracking
- ✅ **Invoice Management** – Approval workflow, payment tracking
- ✅ **Document Management** – Upload/download/preview with S3
- ✅ **Notifications** – Real-time notification center
- ✅ **Audit Logs** – Complete activity tracking
- ✅ **Reports** – Export CSV for vendors, procurement, invoices, contracts

### Authentication & Security
- ✅ JWT authentication with refresh tokens
- ✅ Role-Based Access Control (Admin, Procurement Manager, Finance)
- ✅ Helmet security headers
- ✅ Rate limiting
- ✅ Input validation (Joi)
- ✅ Secure cookies
- ✅ Password hashing (bcrypt)

### UI/UX
- ✅ Nothing OS-inspired black & white design
- ✅ Glass morphism effects
- ✅ Smooth animations & transitions
- ✅ Responsive design (mobile-friendly)
- ✅ Dark mode only (premium aesthetic)
- ✅ Loading skeletons
- ✅ Modern typography (Inter font)

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# The app will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Mongo Express: http://localhost:8081
```

## 🌐 API Endpoints

### Authentication
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| POST   | /api/auth/register        | Register user        |
| POST   | /api/auth/login           | Login                |
| POST   | /api/auth/refresh-token   | Refresh JWT          |
| POST   | /api/auth/forgot-password | Forgot password      |
| POST   | /api/auth/reset-password  | Reset password       |
| GET    | /api/auth/profile         | Get profile          |
| PUT    | /api/auth/profile         | Update profile       |

### Vendors
| Method | Endpoint              | Description      |
|--------|-----------------------|------------------|
| GET    | /api/vendors          | List vendors     |
| GET    | /api/vendors/stats    | Vendor stats     |
| GET    | /api/vendors/:id      | Get vendor       |
| POST   | /api/vendors          | Create vendor    |
| PUT    | /api/vendors/:id      | Update vendor    |
| DELETE | /api/vendors/:id      | Delete vendor    |

### Purchase Requests
| Method | Endpoint                            | Description        |
|--------|-------------------------------------|--------------------|
| GET    | /api/purchase-requests              | List requests      |
| POST   | /api/purchase-requests              | Create request     |
| POST   | /api/purchase-requests/:id/submit   | Submit request     |
| POST   | /api/purchase-requests/:id/approve  | Approve request    |
| POST   | /api/purchase-requests/:id/reject   | Reject request     |

### Purchase Orders
| Method | Endpoint                | Description       |
|--------|-------------------------|-------------------|
| GET    | /api/purchase-orders    | List POs          |
| POST   | /api/purchase-orders    | Create PO         |
| GET    | /api/purchase-orders/:id| Get PO            |

### Contracts
| Method | Endpoint                   | Description           |
|--------|----------------------------|-----------------------|
| GET    | /api/contracts             | List contracts        |
| GET    | /api/contracts/expiring    | Expiring contracts    |
| POST   | /api/contracts             | Create contract       |
| PUT    | /api/contracts/:id         | Update contract       |

### Invoices
| Method | Endpoint                     | Description         |
|--------|------------------------------|---------------------|
| GET    | /api/invoices                | List invoices       |
| POST   | /api/invoices                | Create invoice      |
| POST   | /api/invoices/:id/approve    | Approve invoice     |
| POST   | /api/invoices/:id/pay        | Mark as paid        |

### Other
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | /api/dashboard        | Dashboard stats     |
| GET    | /api/notifications    | Notifications       |
| GET    | /api/audit-logs       | Audit logs (admin)  |
| GET    | /api/reports/*        | Reports             |
| POST   | /api/documents/upload | Upload document     |

## ⚙️ Environment Variables

See `server/.env` for all configuration options:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/procurement
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=procurement-docs
```

## 📄 License

MIT License
