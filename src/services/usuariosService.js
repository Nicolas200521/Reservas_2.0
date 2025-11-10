// Servicio para gestión de usuarios
import { API_ENDPOINTS } from '../config/api';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiClient';
import { getUser } from './authService';

/**
 * Obtiene todos los usuarios (solo admin)
 * @returns {Promise<Array>} Lista de usuarios
 */
export const obtenerUsuarios = async () => {
  try {
    const usuarios = await apiGet(API_ENDPOINTS.USUARIOS.BASE);
    return Array.isArray(usuarios) ? usuarios : [];
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

/**
 * Obtiene un usuario por ID
 * @param {number} id - ID del usuario
 * @returns {Promise<Object>} Datos del usuario
 */
export const obtenerUsuarioPorId = async (id) => {
  try {
    const usuario = await apiGet(API_ENDPOINTS.USUARIOS.BY_ID(id));
    return usuario;
  } catch (error) {
    console.error(`Error al obtener usuario ${id}:`, error);
    throw error;
  }
};

/**
 * Actualiza un usuario
 * @param {number} id - ID del usuario a actualizar
 * @param {Object} datos - Datos a actualizar (name, email, telefono, password)
 * @returns {Promise<Object>} Usuario actualizado
 */
export const actualizarUsuario = async (id, datos) => {
  try {
    const usuarioActualizado = await apiPut(API_ENDPOINTS.USUARIOS.BY_ID(id), datos);
    return usuarioActualizado;
  } catch (error) {
    console.error(`Error al actualizar usuario ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina un usuario (solo admin)
 * @param {number} id - ID del usuario a eliminar
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const eliminarUsuario = async (id) => {
  try {
    const respuesta = await apiDelete(API_ENDPOINTS.USUARIOS.BY_ID(id));
    return respuesta;
  } catch (error) {
    console.error(`Error al eliminar usuario ${id}:`, error);
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
 * Verifica si el usuario actual puede gestionar usuarios
 * @returns {boolean} true si puede gestionar, false en caso contrario
 */
export const puedeGestionarUsuarios = () => {
  return esAdmin();
};

