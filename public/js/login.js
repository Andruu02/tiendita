const API_URL = 'http://localhost:3000/api';

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault(); // Evitar que el formulario se envíe

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');

  errorMessage.classList.add('d-none'); // Ocultar error previo

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    // Si el login es exitoso
    console.log('Login exitoso:', data);

    // Guardamos los datos del usuario (en un futuro, un Token)
    // Usamos localStorage para "recordar" que el admin está logueado
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirigir al panel de admin
    window.location.href = 'admin.html'; 

  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.classList.remove('d-none');
  }
});