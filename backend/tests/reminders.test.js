require('./setup');
const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const apiRoutes = require('../routes/api');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

let token;

beforeEach(async () => {
    const signup = await request(app).post('/api/auth/signup').send({
        username: 'reminderuser', email: 'reminder@test.com', password: 'password123'
    });
    token = signup.body.token;
});

describe('Reminder Routes', () => {
    const futureTime = new Date(Date.now() + 3600000).toISOString();

    test('POST /api/reminders — creates a reminder', async () => {
        const res = await request(app)
            .post('/api/reminders')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Study React', message: 'Time to study!', reminderTime: futureTime });
        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Study React');
        expect(res.body.isTriggered).toBe(false);
    });

    test('GET /api/reminders — returns user reminders', async () => {
        await request(app).post('/api/reminders').set('Authorization', `Bearer ${token}`).send({ title: 'R1', reminderTime: futureTime });
        const res = await request(app).get('/api/reminders').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
    });

    test('PATCH /api/reminders/:id/trigger — marks as triggered', async () => {
        const create = await request(app).post('/api/reminders').set('Authorization', `Bearer ${token}`).send({ title: 'Trigger Me', reminderTime: futureTime });
        const id = create.body._id;

        const res = await request(app).patch(`/api/reminders/${id}/trigger`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.isTriggered).toBe(true);
    });

    test('DELETE /api/reminders/:id — removes reminder', async () => {
        const create = await request(app).post('/api/reminders').set('Authorization', `Bearer ${token}`).send({ title: 'Delete Me', reminderTime: futureTime });
        const id = create.body._id;

        await request(app).delete(`/api/reminders/${id}`).set('Authorization', `Bearer ${token}`);
        const list = await request(app).get('/api/reminders').set('Authorization', `Bearer ${token}`);
        expect(list.body.length).toBe(0);
    });

    test('Reminders are user-scoped — other users cannot see them', async () => {
        await request(app).post('/api/reminders').set('Authorization', `Bearer ${token}`).send({ title: 'Private', reminderTime: futureTime });

        const other = await request(app).post('/api/auth/signup').send({ username: 'other2', email: 'other2@test.com', password: 'password123' });
        const res = await request(app).get('/api/reminders').set('Authorization', `Bearer ${other.body.token}`);
        expect(res.body.length).toBe(0);
    });
});
