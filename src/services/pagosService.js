// Servicio para gestión de pagos
import { API_ENDPOINTS } from '../config/api';
import { apiGet, apiPost, apiPut, apiPatch } from '../utils/apiClient';

/**
 * Crea un nuevo pago
 * @param {Object} datos - Datos del pago
 *   - id_reserva: ID de la reserva
 *   - monto: Monto del pago
 *   - id_metodo_pago: ID del método de pago (1 por defecto)
 *   - id_estado_pago: ID del estado del pago (1: pendiente por defecto)
 * @returns {Promise<Object>} Pago creado
 */
export const crearPago = async (datos) => {
  try {
    // Validar datos requeridos
    if (!datos.id_reserva || !datos.monto) {
      throw new Error('id_reserva y monto son requeridos');
    }

    // Formatear datos del pago
    const datosFormateados = {
      id_reserva: datos.id_reserva,
      monto: parseFloat(datos.monto),
      id_metodo_pago: datos.id_metodo_pago || 1, // Por defecto método de pago 1
      id_estado_pago: datos.id_estado_pago || 1, // Por defecto estado pendiente
    };

    const pago = await apiPost(API_ENDPOINTS.PAGOS.BASE, datosFormateados);
    return pago;
  } catch (error) {
    console.error('Error al crear pago:', error);
    throw error;
  }
};

/**
 * Obtiene todos los pagos
 * @returns {Promise<Array>} Lista de pagos
 */
export const obtenerPagos = async () => {
  try {
    const pagos = await apiGet(API_ENDPOINTS.PAGOS.BASE);
    return Array.isArray(pagos) ? pagos : [];
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    throw error;
  }
};

/**
 * Obtiene un pago por ID
 * @param {number} id - ID del pago
 * @returns {Promise<Object>} Datos del pago
 */
export const obtenerPagoPorId = async (id) => {
  try {
    const pago = await apiGet(API_ENDPOINTS.PAGOS.BY_ID(id));
    return pago;
  } catch (error) {
    console.error(`Error al obtener pago ${id}:`, error);
    throw error;
  }
};

/**
 * Actualiza un pago
 * @param {number} id - ID del pago a actualizar
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} Pago actualizado
 */
export const actualizarPago = async (id, datos) => {
  try {
    const pago = await apiPatch(API_ENDPOINTS.PAGOS.BY_ID(id), datos);
    return pago;
  } catch (error) {
    console.error(`Error al actualizar pago ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene todos los métodos de pago disponibles
 * @returns {Promise<Array>} Lista de métodos de pago
 */
export const obtenerMetodosPago = async () => {
  try {
    const metodos = await apiGet(API_ENDPOINTS.PAGOS.METODOS);
    return Array.isArray(metodos) ? metodos : [];
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    throw error;
  }
};

