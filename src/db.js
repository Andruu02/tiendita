import pg from 'pg';
import 'dotenv/config'; // Carga las variables de .env

// Configuración de la conexión
const config = {
  connectionString: process.env.DATABASE_URL
};

// Para producción (Render), necesitarás SSL, pero para local no.
// Lo dejaremos simple por ahora, listo para local.
// if (process.env.NODE_ENV === 'production') {
//   config.ssl = { rejectUnauthorized: false };
// }

const pool = new pg.Pool(config);

// Exportamos una función 'query' para usarla en las rutas
export const query = (text, params) => pool.query(text, params);

export default pool;