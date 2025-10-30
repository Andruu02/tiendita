const API_URL = 'http://localhost:3000/api';

// Envolvemos TODO el script en este listener.
document.addEventListener('DOMContentLoaded', () => {
  
  // --- Selectores del DOM ---
  const form = document.getElementById('form-producto');
  const formTitulo = document.getElementById('form-titulo');
  const productoIdInput = document.getElementById('producto-id');
  const nombreInput = document.getElementById('nombre');
  const precioInput = document.getElementById('precio');
  const categoriaInput = document.getElementById('categoria_id');
  const descripcionInput = document.getElementById('descripcion');
  const btnGuardar = document.getElementById('btn-guardar');
  const btnCancelar = document.getElementById('btn-cancelar');
  const tbodyProductos = document.getElementById('lista-productos-admin'); // <--- ID del <tbody>
  
  const modalElement = document.getElementById('modal-imagenes');
  const modalTitulo = document.getElementById('modal-titulo'); // <--- ID del <span>
  const modalProductoIdInput = document.getElementById('modal-producto-id');
  const formAgregarImagen = document.getElementById('form-agregar-imagen');
  const inputImagenUrl = document.getElementById('modal-imagen-url');
  const listaImagenesContainer = document.getElementById('lista-imagenes-actuales');

  // La comprobación de errores. Uno de estos es 'null' en tu proyecto.
  if (!form || !modalElement || !formAgregarImagen || !categoriaInput || !tbodyProductos || !modalTitulo) {
      console.error("Error crítico: Faltan elementos del DOM. Revisa que los IDs en admin.html coincidan con admin.js.");
      console.log({
          form,
          modalElement,
          formAgregarImagen,
          categoriaInput,
          tbodyProductos,
          modalTitulo
      }); // Esto te dirá en la consola cuál falta
      return;
  }
  
  // --- Inicialización del Modal ---
  const modal = new bootstrap.Modal(modalElement);
  
  // --- Lógica Principal ---

  // 1. Proteger la página
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.rol !== 'admin') {
    alert('Acceso denegado. Debes ser administrador.');
    window.location.href = 'login.html';
    return;
  }

  // 2. Cargar datos iniciales
  cargarCategoriasAdmin();
  cargarProductosAdmin();

  // 3. Setup de listeners
  document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });

  form.addEventListener('submit', guardarProducto);
  btnCancelar.addEventListener('click', resetFormulario);
  formAgregarImagen.addEventListener('submit', agregarImagen);

  
  // --- Definición de Funciones ---

  async function cargarCategoriasAdmin() {
    try {
        const response = await fetch(`${API_URL}/categorias`);
        if (!response.ok) throw new Error('Error al cargar categorías');
        const categorias = await response.json();
        
        categoriaInput.innerHTML = '<option value="">Seleccione una categoría...</option>';
        categorias.forEach(cat => {
            categoriaInput.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
        });
    } catch (error) {
        console.error(error);
    }
  }

  async function cargarProductosAdmin() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        if (!response.ok) throw new Error('Error al cargar productos');
        const productos = await response.json();

        tbodyProductos.innerHTML = ''; // Limpiar la tabla
        productos.forEach(prod => {
        tbodyProductos.innerHTML += `
            <tr>
            <td>${prod.nombre}</td>
            <td>$${prod.precio}</td>
            <td>${prod.categoria_nombre}</td>
            <td>
                <button class="btn btn-sm btn-warning btn-editar" data-id="${prod.id}">Editar</button>
                <button class="btn btn-sm btn-info btn-imagenes" data-id="${prod.id}" data-nombre="${prod.nombre}">Imágenes</button>
                <button class="btn btn-sm btn-danger btn-borrar" data-id="${prod.id}">Borrar</button>
            </td>
            </tr>
        `;
        });
        
        // Asignamos los listeners a los botones recién creados
        asignarListenersBotones();
    } catch (error) {
        console.error(error);
    }
  }

  function asignarListenersBotones() {
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', () => prepararEdicion(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-imagenes').forEach(btn => {
      btn.addEventListener('click', () => gestionarImagenes(btn.dataset.id, btn.dataset.nombre));
    });
    
    document.querySelectorAll('.btn-borrar').forEach(btn => {
      btn.addEventListener('click', () => borrarProducto(btn.dataset.id));
    });
  }

  async function guardarProducto(e) {
    e.preventDefault();
    const id = productoIdInput.value;
    const esEdicion = !!id;
    const producto = {
      nombre: nombreInput.value,
      precio: precioInput.value,
      categoria_id: categoriaInput.value,
      descripcion: descripcionInput.value,
    };
    const url = esEdicion ? `${API_URL}/productos/${id}` : `${API_URL}/productos`;
    const metodo = esEdicion ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto)
      });
      if (!response.ok) throw new Error(esEdicion ? 'Error al actualizar' : 'Error al crear');
      resetFormulario();
      cargarProductosAdmin();
    } catch (error) {
      alert(error.message);
    }
  }

  async function prepararEdicion(id) {
    try {
      const response = await fetch(`${API_URL}/productos/${id}`);
      if (!response.ok) throw new Error('No se pudo cargar el producto');
      const prod = await response.json();
      formTitulo.textContent = 'Editar Producto';
      productoIdInput.value = prod.id;
      nombreInput.value = prod.nombre;
      precioInput.value = prod.precio;
      categoriaInput.value = prod.categoria_id;
      descripcionInput.value = prod.descripcion;
      btnGuardar.textContent = 'Actualizar Producto';
      btnCancelar.classList.remove('d-none');
      window.scrollTo(0, 0);
    } catch (error) {
      alert(error.message);
    }
  }

  async function borrarProducto(id) {
    if (!confirm('¿Estás seguro de que quieres borrar este producto? (Se borrarán también sus imágenes)')) return;
    try {
      const response = await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al borrar el producto');
      cargarProductosAdmin();
    } catch (error) {
      alert(error.message);
    }
  }

  function resetFormulario() {
    form.reset();
    formTitulo.textContent = 'Crear Nuevo Producto';
    productoIdInput.value = '';
    btnGuardar.textContent = 'Guardar Producto';
    btnCancelar.classList.add('d-none');
  }

  async function gestionarImagenes(id, nombre) {
    modalTitulo.textContent = nombre;
    modalProductoIdInput.value = id;
    await cargarImagenesModal(id);
    modal.show();
  }

  async function cargarImagenesModal(productoId) {
    listaImagenesContainer.innerHTML = '<p>Cargando imágenes...</p>';
    try {
      const response = await fetch(`${API_URL}/productos/${productoId}/imagenes`);
      if (!response.ok) throw new Error('No se pudieron cargar las imágenes');
      
      const imagenes = await response.json();
      
      listaImagenesContainer.innerHTML = '';
      if (imagenes.length === 0) {
        listaImagenesContainer.innerHTML = '<p class="text-muted">Este producto no tiene imágenes.</p>';
        return;
      }
      
      imagenes.forEach(img => {
        listaImagenesContainer.innerHTML += `
          <div class="col-md-4">
            <div class="card position-relative">
              <img src="${img.url}" class="img-fluid rounded" alt="Imagen producto" style="height: 150px; object-fit: cover;">
              <button 
                class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 btn-borrar-img" 
                data-imgid="${img.id}">
                &times;
              </button>
            </div>
          </div>
        `;
      });

      // Asignamos listeners a los botones de borrar imagen
      document.querySelectorAll('.btn-borrar-img').forEach(btn => {
        btn.addEventListener('click', () => borrarImagen(btn.dataset.imgid, productoId));
      });

    } catch (error) {
      listaImagenesContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
    }
  }

  async function agregarImagen(e) {
    e.preventDefault();
    
    const url = inputImagenUrl.value;
    const producto_id = modalProductoIdInput.value;

    try {
      const response = await fetch(`${API_URL}/imagenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, producto_id })
      });
      
      if (!response.ok) throw new Error('Error al añadir la URL');
      
      inputImagenUrl.value = '';
      await cargarImagenesModal(producto_id);

    } catch (error) {
      alert(error.message);
    }
  }

  async function borrarImagen(imagenId, productoId) {
    if (!confirm('¿Seguro que quieres borrar esta imagen?')) return;
    
    try {
      const response = await fetch(`${API_URL}/imagenes/${imagenId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al borrar la imagen');
      
      await cargarImagenesModal(productoId);

    } catch (error) {
      alert(error.message);
    }
  }

}); // --- FIN DE DOMContentLoaded ---