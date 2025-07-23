jest.setTimeout(60000);
import request from 'supertest';
import app from '../index';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  console.log('🧪 In-Memory Mongo URI:', mongoServer.getUri());
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Authentication API', () => {
    it('should register a new user', async () => {
        const response = await request(app)
            .post('/api/register')
            .send({
                username: 'testuser',
                email: 'test@email.com',
                password: 'testpassword'
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user.email', 'test@email.com');
        expect(response.body).toHaveProperty('token');
    });
    it('should login an existing user', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({
                email: 'test@email.com',
                password: 'testpassword'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user.email', 'test@email.com');
        expect(response.body).toHaveProperty('token');
        const decoded = jwt.verify(response.body.token, JWT_SECRET);
        expect(decoded).toHaveProperty('userId');
    });
    it('should not login with invalid credentials', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({
                email: 'invalid@email.com',
                password: 'wrongpassword'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });
    it('should not register with an existing email', async () => {
        const response = await request(app)
            .post('/api/register')
            .send({
                username: 'anotheruser',
                email: 'test@email.com',
                password: 'testpassword'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Email already exists');
    });
    it('should update password for authenticated user', async () => {
        const loginResponse = await request(app)
            .post('/api/login')
            .send({
                email: 'test@email.com',
                password: 'testpassword'
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('token');

        const token = loginResponse.body.token;

        const response = await request(app)
            .patch('/api/update-password')
            .set('Authorization', `Bearer ${token}`)
            .send({
                oldPassword: 'testpassword',
                newPassword: 'newpassword'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Password updated');
        const loginAgainResponse = await request(app)
            .post('/api/login')
            .send({
                email: 'test@email.com',
                password: 'newpassword'
            });

        expect(loginAgainResponse.status).toBe(200);
        expect(loginAgainResponse.body).toHaveProperty('token');
        expect(loginAgainResponse.body).toHaveProperty('user.email', 'test@email.com');
    });
  });