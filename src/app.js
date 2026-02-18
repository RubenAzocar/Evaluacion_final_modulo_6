const express = require('express');
const path = require('path');
const MascotasRoutes = require('./routes/mascotas.routes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Cabeceras de seguridad básicas
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:;");
  next();
});

// Rutas
app.use('/api/pets', MascotasRoutes);

// Manejador de errores
app.use((err, req, res, next) => {
  console.error('ERROR_NO_CONTROLADO:', err);
  res.status(500).json({ error: 'Error del sistema. Contacte al administrador.' });
});

module.exports = app;
