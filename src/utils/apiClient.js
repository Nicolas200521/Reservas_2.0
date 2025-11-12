// Cliente API para hacer peticiones autenticadas con JWT
import { getAuthHeaders, getToken, removeToken, isTokenExpired } from '../services/authService';

/**
 * Realiza una petición HTTP autenticada
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de fetch (method, body, etc.)
 * @returns {Promise<Response>}
 */
export const apiRequest = async (url, options = {}) => {
  const token = getToken();
  
  // Verificar si el token está expirado
  if (token && isTokenExpired(token)) {
    removeToken();
    throw new Error('Token expirado. Por favor, inicia sesión nuevamente.');
  }

  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const headers = getAuthHeaders();
  
  // Merge con headers personalizados si existen
  const finalHeaders = {
    ...headers,
    ...(options.headers || {}),
  };

  // Log para debugging (solo en desarrollo)
  if (import.meta.env.DEV) {
    console.log('🔐 Petición autenticada:', {
      url,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      headers: {
        'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'none',
        'Content-Type': 'application/json'
      }
    });
  }

  const config = {
    ...options,
    headers: finalHeaders,
    // Solo usar credentials: 'include' si el backend está configurado con CORS específico
    // Si el backend usa wildcard (*), no usar credentials para evitar errores de CORS
    // credentials: 'include', // Descomentar solo si el backend tiene CORS con origen específico
  };

  try {
    const response = await fetch(url, config);
    
    // Si el token es inválido, limpiar y lanzar error
    if (response.status === 401) {
      removeToken();
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    
    // Si no tiene permisos (403), lanzar error con mensaje más descriptivo
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'No tienes permisos para realizar esta acción';
      throw new Error(errorMessage);
    }
    
    return response;
  } catch (error) {
    // Si ya es un Error con mensaje, relanzarlo
    if (error instanceof Error && error.message) {
      throw error;
    }
    console.error('Error en petición API:', error);
    throw error;
  }
};

/**
 * Maneja la respuesta y extrae el JSON o lanza un error
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  let data;
  if (isJson) {
    data = await response.json();
  } else {
    // Si no es JSON, intentar leer como texto
    const text = await response.text();
    data = text ? { message: text } : {};
  }
  
  // Si la respuesta no es exitosa, lanzar error con el mensaje del servidor
  if (!response.ok) {
    const errorMessage = data.error || data.message || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  return data;
};

/**
 * GET request autenticado
 */
export const apiGet = async (url) => {
  const response = await apiRequest(url, { method: 'GET' });
  return handleResponse(response);
};

/**
 * POST request autenticado
 */
export const apiPost = async (url, data) => {
  const response = await apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

/**
 * PUT request autenticado
 */
export const apiPut = async (url, data) => {
  // Validar que los datos sean un objeto válido
  if (!data || typeof data !== 'object') {
    throw new Error('Los datos a actualizar deben ser un objeto válido');
  }
  
  // Log para debugging (solo en desarrollo)
  if (import.meta.env.DEV) {
    console.log('📝 Actualizando reserva:', {
      url,
      datos: data
    });
  }
  
  const response = await apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

/**
 * PATCH request autenticado
 */
export const apiPatch = async (url, data) => {
  // Validar que los datos sean un objeto válido
  if (!data || typeof data !== 'object') {
    throw new Error('Los datos a actualizar deben ser un objeto válido');
  }
  
  // Log para debugging (solo en desarrollo)
  if (import.meta.env.DEV) {
    console.log('🔧 PATCH request:', {
      url,
      datos: data
    });
  }
  
  const response = await apiRequest(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

/**
 * DELETE request autenticado
 */
export const apiDelete = async (url) => {
  const response = await apiRequest(url, { method: 'DELETE' });
  return handleResponse(response);
};

