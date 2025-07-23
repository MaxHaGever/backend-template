import { User } from '../models/User';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { generateToken } from '../utils/generateToken';
import { AuthenticateRequest } from '../middleware/authMiddleware'; 

const JWT_SECRET = process.env.JWT_SECRET as string;

export const register = async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body;
    
    try {
        const existingUser = await User.findOne( {email});
        if (existingUser) {
            res.status(400).json({ message: 'Email already exists' });
            return;
        }   
        const newUser = await User.create({ username, email, password });
        const token = generateToken(newUser._id.toString());
        res.status(201).json({ token, user: { id: newUser._id, username: newUser.username, email: newUser.email } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }
        const token = generateToken(user._id.toString());
        res.status(200).json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updatePassword = async (req:AuthenticateRequest, res: Response): Promise<void> => {
    const {oldPassword, newPassword} = req.body;
    const userId = req.userId;

    try {
        const user = await User.findById(userId);
        if(!user){
            res.status(404).json({message: 'User not found'})
            return;
        }
        const isMatch = await user?.comparePassword(oldPassword);
        if(!isMatch){
            res.status(400).json({message: 'Invalid old password'});
            return;
        }
        user.password = newPassword;
        user.markModified('password');
        await user?.save();

        res.status(200).json({message: 'Password updated'})
    } catch (error) {
        res.status(500).json({message: 'Server error during password update'})
    }
} 




