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
  const response = await apiRequest(url, {
    method: 'PUT',
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

