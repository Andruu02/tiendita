// Define la URL base de la API
const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  cargarCategorias();
  cargarProductos();
});

// 1. Cargar filtros de categorías (Sin cambios)
async function cargarCategorias() {
  const filtroContainer = document.getElementById('filtros-categorias');
  try {
    const response = await fetch(`${API_URL}/categorias`);
    const categorias = await response.json();

    categorias.forEach(cat => {
      const button = document.createElement('button');
      button.className = 'nav-link';
      button.textContent = cat.nombre;
      button.dataset.id = cat.id;
      button.addEventListener('click', () => {
        filtroContainer.querySelector('.active').classList.remove('active');
        button.classList.add('active');
        cargarProductos(cat.id);
      });
      filtroContainer.appendChild(button);
    });
    
    filtroContainer.querySelector('[data-id="all"]').addEventListener('click', (e) => {
       filtroContainer.querySelector('.active').classList.remove('active');
       e.target.classList.add('active');
       cargarProductos();
    });
    
  } catch (error) {
    console.error('Error al cargar categorías:', error);
  }
}

// 2. Cargar productos (¡ACTUALIZADO CON IMÁGENES!)
async function cargarProductos(categoriaId = null) {
  const catalogoContainer = document.getElementById('catalogo-productos');
  catalogoContainer.innerHTML = '<p>Cargando productos...</p>';
  
  let url = `${API_URL}/productos`;
  if (categoriaId) {
    url += `?categoria_id=${categoriaId}`;
  }

  try {
    const response = await fetch(url);
    const productos = await response.json();

    catalogoContainer.innerHTML = ''; 
    
    if (productos.length === 0) {
        catalogoContainer.innerHTML = '<p class="text-muted">No se encontraron productos para esta categoría.</p>';
        return;
    }

    productos.forEach(prod => {
      // --- LÓGICA DE IMAGEN ---
      // Si el producto tiene imágenes, usa la primera.
      // Si no, usa un placeholder.
      const imageUrl = (prod.imagenes && prod.imagenes.length > 0)
        ? prod.imagenes[0] 
        : 'https://via.placeholder.com/300x200.png?text=Sin+Imagen';
      // ------------------------

      const card = `
        <div class="col-md-4">
          <div class="card bg-dark-subtle border-secondary h-100">
            <img src="${imageUrl}" class="card-img-top" alt="${prod.nombre}">
            
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${prod.nombre}</h5>
              <h6 class="card-subtitle mb-2 text-primary">$${prod.precio}</h6>
              <p class="card-text text-muted small flex-grow-1">${prod.descripcion || ''}</p>
              <span class="badge bg-secondary align-self-start">${prod.categoria_nombre}</span>
            </div>
          </div>
        </div>
      `;
      catalogoContainer.innerHTML += card;
    });
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }
}