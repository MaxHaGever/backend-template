import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';

app.use('/api', authRoutes);
app.use(errorHandler);

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGODB_URI)
  .then(() => {
  console.log('Connected to MongoDB');
  }).catch(err => {
  console.error('MongoDB connection error:', err);
  });
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

}

export default app;