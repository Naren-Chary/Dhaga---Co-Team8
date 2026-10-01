import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import ordersRouter from './routes/orders.js';
import riskRouter from './routes/risk.js';
import interventionsRouter from './routes/interventions.js';
import analyticsRouter from './routes/analytics.js';
import resilienceRouter from './routes/resilience.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Basic In-Memory Rate Limiting (Phase 11 Security)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 300; // Generous for local development & demo

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'localhost';
  const now = Date.now();
  const clientData = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    clientData.count++;
  }

  rateLimitMap.set(ip, clientData);

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS_PER_WINDOW - clientData.count));

  if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again in a few moments.',
      retryAfterSeconds: Math.ceil((clientData.resetTime - now) / 1000),
    });
  }

  next();
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', rateLimiter);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/risk', riskRouter);
app.use('/api/interventions', interventionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/resilience', resilienceRouter);

// Root fallback
app.get('/', (req, res) => {
  res.json({
    message: 'Dhaga & Co. COD Risk & Return Intelligence API is running.',
    healthEndpoint: '/api/health',
    ordersEndpoint: '/api/orders',
    riskEndpoint: '/api/risk',
    analyticsEndpoint: '/api/analytics',
    resilienceEndpoint: '/api/resilience/telemetry',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Dhaga & Co. Backend Server listening on port ${PORT}`);
  console.log(`🔗 Health:     http://localhost:${PORT}/api/health`);
  console.log(`📦 Orders:     http://localhost:${PORT}/api/orders`);
  console.log(`🧠 Risk API:   http://localhost:${PORT}/api/risk`);
  console.log(`📊 Analytics:  http://localhost:${PORT}/api/analytics`);
  console.log(`🛡️ Resilience: http://localhost:${PORT}/api/resilience/telemetry`);
  console.log(`====================================================`);
});

export default app;
