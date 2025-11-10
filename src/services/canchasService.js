// Servicio para gestión de canchas
import { API_ENDPOINTS } from '../config/api';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiClient';
import { getUser } from './authService';

/**
 * Realiza una petición pública (sin autenticación)
 */
const publicRequest = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.message || `Error ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error en petición pública:', error);
    throw error;
  }
};

/**
 * Obtiene todas las canchas activas (público)
 * @returns {Promise<Array>} Lista de canchas
 */
export const obtenerCanchas = async () => {
  try {
    const canchas = await publicRequest(API_ENDPOINTS.CANCHAS.BASE);
    return Array.isArray(canchas) ? canchas : [];
  } catch (error) {
    console.error('Error al obtener canchas:', error);
    throw error;
  }
};

/**
 * Obtiene una cancha por ID (público)
 * @param {number} id - ID de la cancha
 * @returns {Promise<Object>} Datos de la cancha
 */
export const obtenerCanchaPorId = async (id) => {
  try {
    const cancha = await publicRequest(API_ENDPOINTS.CANCHAS.BY_ID(id));
    return cancha;
  } catch (error) {
    console.error(`Error al obtener cancha ${id}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva cancha (solo admin)
 * @param {Object} datos - Datos de la cancha (nombre, tipo_cesped, precio_hora, estado)
 * @returns {Promise<Object>} Cancha creada
 */
export const crearCancha = async (datos) => {
  try {
    const cancha = await apiPost(API_ENDPOINTS.CANCHAS.BASE, datos);
    return cancha;
  } catch (error) {
    console.error('Error al crear cancha:', error);
    throw error;
  }
};

/**
 * Actualiza una cancha (solo admin)
 * @param {number} id - ID de la cancha a actualizar
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} Cancha actualizada
 */
export const actualizarCancha = async (id, datos) => {
  try {
    const cancha = await apiPut(API_ENDPOINTS.CANCHAS.BY_ID(id), datos);
    return cancha;
  } catch (error) {
    console.error(`Error al actualizar cancha ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina una cancha (solo admin)
 * @param {number} id - ID de la cancha a eliminar
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const eliminarCancha = async (id) => {
  try {
    const respuesta = await apiDelete(API_ENDPOINTS.CANCHAS.BY_ID(id));
    return respuesta;
  } catch (error) {
    console.error(`Error al eliminar cancha ${id}:`, error);
    throw error;
  }
};

/**
 * Verifica si el usuario actual es admin
 * @returns {boolean} true si es admin, false en caso contrario
 */
export const esAdmin = () => {
  const user = getUser();
  return user?.role === 'admin' || user?.rol === 'admin';
};

/**
 * Verifica si el usuario actual puede gestionar canchas
 * @returns {boolean} true si puede gestionar, false en caso contrario
 */
export const puedeGestionarCanchas = () => {
  return esAdmin();
};

