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

  const headers = getAuthHeaders();
  
  // Merge con headers personalizados si existen
  const finalHeaders = {
    ...headers,
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers: finalHeaders,
  };

  try {
    const response = await fetch(url, config);
    
    // Si el token es inválido, limpiar y lanzar error
    if (response.status === 401) {
      removeToken();
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    
    return response;
  } catch (error) {
    console.error('Error en petición API:', error);
    throw error;
  }
};

/**
 * GET request autenticado
 */
export const apiGet = async (url) => {
  const response = await apiRequest(url, { method: 'GET' });
  return response.json();
};

/**
 * POST request autenticado
 */
export const apiPost = async (url, data) => {
  const response = await apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

/**
 * PUT request autenticado
 */
export const apiPut = async (url, data) => {
  const response = await apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
};

/**
 * DELETE request autenticado
 */
export const apiDelete = async (url) => {
  const response = await apiRequest(url, { method: 'DELETE' });
  return response.json();
};

