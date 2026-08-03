# 🚀 ReBorrow - Community Asset Sharing Platform

ReBorrow is a full-stack, type-safe web application designed to facilitate peer-to-peer asset sharing and borrowing within communities. Built with modern web standards, it ensures secure authentication, robust NoSQL protection, and a scalable architecture.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript, Mongoose, JWT, TSX
- **Database:** MongoDB
- **Security:** Helmet, CORS, Cookie-Parser, Custom NoSQL Injection Sanitizer

---

## 📂 Project Structure

```text
ReBorrow/
├── backend/
│   ├── config/       # Database configuration (db.ts)
│   ├── controllers/  # Business logic (auth, assets)
│   ├── middleware/   # Authentication, security & RBAC middleware
│   ├── models/       # Mongoose schemas (User, Asset)
│   ├── routes/       # API endpoints
│   └── server.ts     # Express application entry point
├── tsconfig.json     # Global TypeScript configuration
└── README.md         # Project documentation
```

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/api/auth/register` | Register a new user |
| **POST** | `/api/auth/login` | Authenticate user and issue a secure JWT cookie |

### Assets (`/api/assets`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/api/assets` | Retrieve all available community assets |
| **POST** | `/api/assets` | Create a new asset listing *(Protected)* |

---

## ⚙️ Getting Started Locally

### 1. Clone the repository

```bash
git clone <your-repository-url>
```

### 2. Navigate to the backend folder

```bash
cd backend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create a `.env` file inside the `backend` directory

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 5. Run the development server

```bash
npm run dev
```

The backend server will start at:

```text
http://localhost:5000
```