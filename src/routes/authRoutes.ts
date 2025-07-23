import express from 'express';
import { register, login, updatePassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.patch('/update-password', protect, updatePassword);

export default router;