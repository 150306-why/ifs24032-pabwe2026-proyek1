const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { env } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');
const portsRoutes = require('./modules/ports/ports.routes');
const boatsRoutes = require('./modules/boats/boats.routes');
const routesRoutes = require('./modules/routes/routes.routes');
const schedulesRoutes = require('./modules/schedules/schedules.routes');
const bookingsRoutes = require('./modules/bookings/bookings.routes');
const ticketsRoutes = require('./modules/tickets/tickets.routes');

/**
 * Membuat instance Express. Dependensi (db) disuntikkan agar mudah diuji.
 * @param {{ db: import('better-sqlite3').Database }} deps
 */
function createApp({ db }) {
  const app = express();
  app.locals.db = db;

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '10kb' }));

  const api = express.Router();
  api.get('/health', (req, res) => res.json({ data: { status: 'ok' }, message: 'OK' }));
  api.use('/auth', authRoutes);
  api.use('/ports', portsRoutes);
  api.use('/boats', boatsRoutes);
  api.use('/routes', routesRoutes);
  api.use('/schedules', schedulesRoutes);
  api.use('/bookings', bookingsRoutes);
  api.use('/tickets', ticketsRoutes);
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
