import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import assetRoutes from './routes/assetRoutes';

// Load environment variables
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// --- SECURITY MIDDLEWARES ---
app.use(helmet()); 
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// --- CUSTOM NoSQL INJECTION SANITIZER ---
const sanitizeNoSQL = (req: Request, res: Response, next: NextFunction): void => {
  const sanitizeValue = (obj: any): any => {
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else {
          sanitizeValue(obj[key]);
        }
      }
    }
    return obj;
  };

  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete req.query[key];
      }
    }
  }
  next();
};

app.use(sanitizeNoSQL);

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to ReBorrow API - Asset Sharing Platform 🚀' });
});

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});