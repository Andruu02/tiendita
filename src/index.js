import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import 'dotenv/config'; // Carga .env

import apiRoutes from './routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuración de Confianza de Proxy ---
// ¡IMPORTANTE! Esto le dice a Express que confíe en los encabezados
// (como 'x-forwarded-for') que Render le enviará.
// Sin esto, req.ip podría darte la IP de Render, no la del usuario.
app.set('trust proxy', true); // <-- AÑADE ESTO

// --- ¡NUEVO! Middleware de Filtro de IP ---
// Este es tu código. Se ejecutará en CADA petición.
app.use((req, res, next) => {
  // Obtenemos la IP del cliente. 'req.ip' es más fiable con 'trust proxy'
  let clientIP = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Si hay múltiples IPs (tras proxies), toma la primera
  if (clientIP && clientIP.includes(',')) {
    clientIP = clientIP.split(',')[0].trim();
  }
  
  // Limpieza de prefijo '::ffff:' (para IPs IPv4 sobre IPv6)
  if (clientIP && clientIP.startsWith('::ffff:')) {
    clientIP = clientIP.substring(7);
  }

  const allowedIPs = [
    '45.232.149.130',
    '45.232.149.146',
    '45.232.149.145',
    '168.194.102.162',
    '38.250.153.46',
    '::1',       // localhost (IPv6)
    '127.0.0.1', // localhost (IPv4)
  ];

  if (allowedIPs.includes(clientIP)) {
    // Si la IP está en la lista, permite continuar
    next();
  } else {
    // Si la IP no está, la bloquea
    console.warn(`🚫 IP no autorizada: ${clientIP}`);
    res.status(403).json({ message: 'Acceso denegado: IP no permitida' });
  }
});
// --- FIN del Middleware de IP ---


// --- Middlewares (Existentes) ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Servir archivos estáticos ---
app.use(express.static('public'));

// --- Rutas de la API ---
// El middleware de IP se ejecutó ANTES de llegar aquí
app.use('/api', apiRoutes);

// --- Iniciar el servidor ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});