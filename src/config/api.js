// Configuración de la API
// Siempre usa la URL de Railway desde la variable de entorno VITE_API_URL
// La URL se configura en el archivo .env o en las variables de entorno del hosting
// IMPORTANTE: VITE_API_URL es requerida y debe estar configurada

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('❌ ERROR: VITE_API_URL');
  throw new Error('VITE_API_URL es requerida.');
}

// Log para verificar la URL configurada
if (import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true') {
  console.log('🔌 API URL configurada:', API_URL);
}
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10);

export const API_BASE_URL = API_URL;
export const API_TIMEOUT_MS = API_TIMEOUT;

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
  RESERVAS: {
    BASE: `${API_BASE_URL}/api/reservas`,
    BY_ID: (id) => `${API_BASE_URL}/api/reservas/${id}`,
  },
  CANCHAS: {
    BASE: `${API_BASE_URL}/api/canchas`,
    BY_ID: (id) => `${API_BASE_URL}/api/canchas/${id}`,
  },
  HEALTH: `${API_BASE_URL}/api/health`,
};

export default API_BASE_URL;

