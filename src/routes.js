import { Router } from 'express';
import { query } from './db.js';

const router = Router();

// --- RUTAS PÚBLICAS ---

// 1. Obtener categorías (Sin cambios)
router.get('/categorias', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categorias ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Obtener productos (¡ACTUALIZADO CON IMÁGENES!)
router.get('/productos', async (req, res) => {
  const { categoria_id } = req.query;

  // ¡SQL ACTUALIZADO!
  // Usamos un subquery con JSON_AGG para agrupar todas las imágenes
  // de un producto en un solo campo llamado 'imagenes'.
  let sqlQuery = `
    SELECT 
      p.*, 
      c.nombre AS categoria_nombre,
      (
        SELECT json_agg(img.url) 
        FROM imagenes_productos img 
        WHERE img.producto_id = p.id
      ) AS imagenes
    FROM productos p
    JOIN categorias c ON p.categoria_id = c.id
  `;
  const params = [];

  if (categoria_id) {
    sqlQuery += ' WHERE p.categoria_id = $1';
    params.push(categoria_id);
  }
  
  sqlQuery += ' ORDER BY p.nombre ASC';

  try {
    const result = await query(sqlQuery, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ¡NUEVA RUTA! Obtener un solo producto (para el formulario de editar)
router.get('/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Obtenemos solo los datos del producto, no necesitamos imágenes aquí
    const result = await query('SELECT * FROM productos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- RUTA DE AUTENTICACIÓN ---

// 4. Login (Sin cambios)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email no encontrado' });
    }
    const user = result.rows[0];
    if (password !== user.password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    res.json({
      message: 'Login exitoso',
      user: { id: user.id, email: user.email, rol: user.rol }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- RUTAS PROTEGIDAS (CRUD) ---

// 5. Crear Producto (Sin cambios)
router.post('/productos', async (req, res) => {
  const { nombre, descripcion, precio, categoria_id } = req.body;
  try {
    const result = await query(
      'INSERT INTO productos (nombre, descripcion, precio, categoria_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, descripcion, precio, categoria_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Actualizar (Editar) Producto (Sin cambios, ya estaba bien)
router.put('/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, categoria_id } = req.body;
  try {
    const result = await query(
      'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, categoria_id = $4 WHERE id = $5 RETURNING *',
      [nombre, descripcion, precio, categoria_id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Borrar Producto (Sin cambios, ya estaba bien)
router.delete('/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Borramos primero las imágenes asociadas (si las hubiera)
    await query('DELETE FROM imagenes_productos WHERE producto_id = $1', [id]);
    // Luego borramos el producto
    await query('DELETE FROM productos WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Obtener todas las imágenes de UN producto
router.get('/productos/:id/imagenes', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      'SELECT * FROM imagenes_productos WHERE producto_id = $1 ORDER BY id ASC', 
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Añadir una nueva imagen (URL) a un producto
router.post('/imagenes', async (req, res) => {
  const { url, producto_id } = req.body;
  if (!url || !producto_id) {
    return res.status(400).json({ error: 'Faltan url o producto_id' });
  }
  try {
    const result = await query(
      'INSERT INTO imagenes_productos (url, producto_id) VALUES ($1, $2) RETURNING *',
      [url, producto_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Borrar una imagen específica por su ID
router.delete('/imagenes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM imagenes_productos WHERE id = $1', [id]);
    res.status(204).send(); // Éxito, sin contenido
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;