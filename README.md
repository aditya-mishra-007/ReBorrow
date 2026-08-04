# 🚀 ReBorrow - Community Asset Sharing Platform

A peer-to-peer asset sharing and rental platform where users can list items they own for others to borrow, and request to borrow items listed by others.

Built with the **MERN Stack (MongoDB, Express, React, Node.js)** using **TypeScript** throughout, on both the frontend and backend.

---

## 🌐 Live Demo

🔗 **Live Application:** https://reborrow.vercel.app/

🔗 **Backend API Health Check:** https://reborrow.onrender.com/api/health

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcrypt

...

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form
- Axios

---

## 📂 Project Structure

```text
reborrow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── assetController.ts
│   │   │   └── borrowRequestController.ts
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Asset.ts
│   │   │   └── BorrowRequest.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── assetRoutes.ts
│   │   │   └── borrowRequestRoutes.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── authApi.ts
    │   │   ├── assetApi.ts
    │   │   └── borrowRequestApi.ts
    │   ├── components/
    │   │   ├── Layout.tsx
    │   │   ├── Navbar.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── lib/
    │   │   └── api.ts
    │   ├── pages/
    │   │   ├── HomePage.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── AssetDetailPage.tsx
    │   │   ├── CreateAssetPage.tsx
    │   │   ├── MyAssetsPage.tsx
    │   │   ├── MyRequestsPage.tsx
    │   │   ├── IncomingRequestsPage.tsx
    │   │   └── NotFoundPage.tsx
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── index.html
    ├── .env.example
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── tsconfig.node.json
```

---

## ⚠️ Critical Setup Requirement: MongoDB Replica Set

This application uses **MongoDB multi-document transactions** for the borrow-request workflow (`createBorrowRequest`, `approveBorrowRequest`, and `rejectBorrowRequest`) to ensure that both the **Asset** and **BorrowRequest** documents remain synchronized.

### Transactions require MongoDB to run as a Replica Set.

A standalone `mongod` instance will connect successfully but will throw runtime errors when transactions are executed.

### Option A — MongoDB Atlas (Recommended)

MongoDB Atlas clusters (including the free M0 tier) are replica sets by default.

Simply use the Atlas connection string as your `MONGO_URI`.

### Option B — Local MongoDB Replica Set

Start MongoDB:

```bash
mongod --replSet rs0 --dbpath /path/to/your/data
```

Open another terminal:

```bash
mongosh
```

Initialize the replica set:

```javascript
rs.initiate()
```

Your local connection string can now be:

```text
mongodb://localhost:27017/reborrow
```

---

## 📋 Prerequisites

- Node.js (v18 or later)
- npm
- MongoDB Replica Set (Local or Atlas)

---

## ⚙️ Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Copy the environment template:

```bash
cp .env.example .env
```

Update `.env` with your values:

| Variable | Description |
|----------|-------------|
| PORT | Backend port (Default: 5000) |
| NODE_ENV | development / production |
| MONGO_URI | MongoDB Replica Set connection string |
| JWT_SECRET | Random secret key |
| JWT_EXPIRES_IN | Example: 30d |
| CLIENT_URL | Frontend URL (e.g. http://localhost:5173) |

Run the backend:

```bash
npm run dev
```

Build production files:

```bash
npm run build
```

Run production build:

```bash
npm start
```

Backend runs at:

```text
http://localhost:5000
```

Health Check:

```text
GET /api/health
```

---

## 💻 Frontend Setup

Navigate to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Copy environment variables:

```bash
cp .env.example .env
```

For local development you can leave `VITE_API_URL` empty because Vite automatically proxies API requests.

Run the frontend:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Frontend runs at:

```text
http://localhost:5173
```

---

## 🚀 Running the Full Application

You'll need three services running simultaneously:

1. MongoDB Replica Set
2. Backend

```bash
cd backend
npm run dev
```

3. Frontend

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 🔄 Core Workflow & Business Rules

- Users can register and log in using JWT authentication.
- JWT tokens are stored in **localStorage** and automatically attached to authenticated requests.
- Anyone can browse assets without logging in.
- Authentication is required to:
  - Create assets
  - Borrow assets
  - Manage listings
  - Manage requests
- Users **cannot request their own assets**.
- Creating a borrow request changes asset status:
  - `available → requested`
- Asset owners can:
  - **Approve** → `borrowed`
  - **Reject** → `available`
- MongoDB transactions ensure both Asset and BorrowRequest remain synchronized.
- Assets with active borrow requests cannot be deleted.

---

## 🔌 API Endpoint Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register a new account |
| POST | `/login` | Public | Login and receive JWT |
| GET | `/me` | Private | Get logged-in user |

---

### Assets (`/api/assets`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List/Search Assets |
| GET | `/:id` | Public | Asset Details |
| POST | `/` | Private | Create Asset |
| PUT | `/:id` | Owner | Update Asset |
| DELETE | `/:id` | Owner | Delete Asset |

---

### Borrow Requests (`/api/borrow-requests`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Create Borrow Request |
| GET | `/my-requests` | Private | My Borrow Requests |
| GET | `/incoming` | Private | Incoming Requests |
| PATCH | `/:id/approve` | Owner | Approve Request |
| PATCH | `/:id/reject` | Owner | Reject Request |

---

## 🔮 Future Enhancements

- Cancel pending borrow requests
- Image upload support
- Pagination
- Rate limiting
- Email verification
- Notifications
- Asset categories with icons
- Admin dashboard
