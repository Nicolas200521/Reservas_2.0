// Servicio de autenticación con JWT
// Maneja el almacenamiento y envío de tokens

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const TOKEN_COOKIE_NAME = 'token'; // Nombre de la cookie donde viene el token

/**
 * Obtiene el valor de una cookie por su nombre
 */
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

/**
 * Guarda el token JWT en localStorage
 */
export const saveToken = (token) => {
  if (!token) {
    return false;
  }
  
  // Validar que el token sea un string
  if (typeof token !== 'string') {
    return false;
  }
  
  // Validar formato básico de JWT (debe tener al menos un punto)
  if (!token.includes('.')) {
    return false;
  }
  
  try {
    localStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene el token JWT
 * Primero intenta obtenerlo del localStorage, luego de las cookies
 */
export const getToken = () => {
  // Primero intentar obtener del localStorage
  const localToken = localStorage.getItem(TOKEN_KEY);
  if (localToken) {
    return localToken;
  }
  
  // Si no está en localStorage, intentar obtener de las cookies
  // Puede venir como: token, auth_token, jwt, access_token
  const cookieToken = getCookie('token') || 
                      getCookie('auth_token') || 
                      getCookie('jwt') || 
                      getCookie('access_token');
  
  if (cookieToken) {
    // Guardar en localStorage para futuras consultas
    try {
      localStorage.setItem(TOKEN_KEY, cookieToken);
    } catch (error) {
      // Si no se puede guardar en localStorage, solo retornar la cookie
    }
    return cookieToken;
  }
  
  return null;
};

/**
 * Elimina el token del localStorage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Guarda los datos del usuario en localStorage
 */
export const saveUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Obtiene los datos del usuario del localStorage
 */
export const getUser = () => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Verifica si hay un token guardado (usuario autenticado)
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Obtiene los headers con el token para las peticiones autenticadas
 * Si el token viene en una cookie HTTP-only, no se puede leer aquí,
 * pero el navegador lo enviará automáticamente con credentials: 'include'
 */
export const getAuthHeaders = () => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Si tenemos el token disponible (de localStorage o cookie no HTTP-only),
  // enviarlo en el header Authorization
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Si no hay token pero el backend usa cookies HTTP-only,
  // el token se enviará automáticamente con credentials: 'include'
  
  return headers;
};

/**
 * Decodifica el token JWT (sin verificar, solo para obtener datos)
 * Nota: En producción, el backend debe verificar el token
 */
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
};

/**
 * Verifica si el token está expirado
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

