// Configuración de la API
// Siempre usa la URL de Railway desde la variable de entorno VITE_API_URL
// La URL se configura en el archivo .env o en las variables de entorno del hosting
// IMPORTANTE: VITE_API_URL es requerida y debe estar configurada

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  const errorMsg = 'VITE_API_URL no está configurada. Crea un archivo .env en la raíz del proyecto con:\nVITE_API_URL=http://localhost:3000';
  console.error('❌ ERROR:', errorMsg);
  // No lanzar error inmediatamente, permitir que la app cargue para mostrar el error en la UI
}

const WS_URL = import.meta.env.VITE_WS_URL;

// Log para verificar la URL configurada
if (import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true') {
  console.log('🔌 API URL configurada:', API_URL);
  if (WS_URL) {
    console.log('🔌 WebSocket URL configurada:', WS_URL);
  }
}
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10);

export const API_BASE_URL = API_URL || 'http://localhost:3000'; // Fallback para desarrollo
export const API_TIMEOUT_MS = API_TIMEOUT;
export const WS_BASE_URL = WS_URL; // URL del servidor WebSocket (opcional)

// Función para verificar si la URL está configurada
export const isApiUrlConfigured = () => {
  return !!API_URL && !API_URL.includes('undefined');
};

// Configuración de la aplicación
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Reservas de Canchas',
  version: import.meta.env.VITE_APP_VERSION || '2.0.0',
  env: import.meta.env.VITE_APP_ENV || 'production', // Siempre producción por defecto
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  debugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
};

// Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
  },
  USUARIOS: {
    BASE: `${API_BASE_URL}/api/usuarios`,
    BY_ID: (id) => `${API_BASE_URL}/api/usuarios/${id}`,
  },
  RESERVAS: {
    BASE: `${API_BASE_URL}/api/reservas`,
    MIS_RESERVAS: `${API_BASE_URL}/api/reservas/mis-reservas`,
    BY_ID: (id) => `${API_BASE_URL}/api/reservas/${id}`,
    ESTADO: (id) => `${API_BASE_URL}/api/reservas/${id}/estado`,
    CANCELAR: (id) => `${API_BASE_URL}/api/reservas/${id}/cancelar`,
  },
  CANCHAS: {
    BASE: `${API_BASE_URL}/api/canchas`,
    BY_ID: (id) => `${API_BASE_URL}/api/canchas/${id}`,
  },
  HEALTH: `${API_BASE_URL}/api/health`,
};

export default API_BASE_URL;

