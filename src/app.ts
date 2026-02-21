import express from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import Analyticsrouter from './routes/analytics.route';

dotenv.config()

const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Dreamdevs Challenge API is healthy' })
})

// Routes
app.use('/analytics', Analyticsrouter)

// 404 — For handling routes that are not defined or do not exist
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` })
})

// Global error handler for handling errors
app.use(errorHandler)

export default app;