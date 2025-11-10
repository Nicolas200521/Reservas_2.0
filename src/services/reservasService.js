// Servicio para gestión de reservas
import { API_ENDPOINTS } from '../config/api';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiClient';
import { getUser } from './authService';

/**
 * Obtiene todas las reservas
 * - Admin: ve todas las reservas
 * - Usuario: solo ve sus propias reservas
 * @returns {Promise<Array>} Lista de reservas
 */
export const obtenerReservas = async () => {
  try {
    const reservas = await apiGet(API_ENDPOINTS.RESERVAS.BASE);
    return Array.isArray(reservas) ? reservas : [];
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    throw error;
  }
};

/**
 * Obtiene las reservas del usuario autenticado
 * @returns {Promise<Array>} Lista de reservas del usuario
 */
export const obtenerMisReservas = async () => {
  try {
    const reservas = await apiGet(API_ENDPOINTS.RESERVAS.MIS_RESERVAS);
    return Array.isArray(reservas) ? reservas : [];
  } catch (error) {
    console.error('Error al obtener mis reservas:', error);
    throw error;
  }
};

/**
 * Obtiene una reserva por ID
 * @param {number} id - ID de la reserva
 * @returns {Promise<Object>} Datos de la reserva
 */
export const obtenerReservaPorId = async (id) => {
  try {
    const reserva = await apiGet(API_ENDPOINTS.RESERVAS.BY_ID(id));
    return reserva;
  } catch (error) {
    console.error(`Error al obtener reserva ${id}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva reserva
 * @param {Object} datos - Datos de la reserva (id_cancha, fecha, hora_inicio, hora_fin)
 * @returns {Promise<Object>} Reserva creada
 */
export const crearReserva = async (datos) => {
  try {
    // Asegurar que los datos estén en el formato correcto
    const datosFormateados = {
      id_cancha: datos.id_cancha,
      fecha: datos.fecha, // Formato: YYYY-MM-DD
      hora_inicio: datos.hora_inicio, // Formato: HH:MM
      hora_fin: datos.hora_fin, // Formato: HH:MM
    };

    const reserva = await apiPost(API_ENDPOINTS.RESERVAS.BASE, datosFormateados);
    return reserva;
  } catch (error) {
    console.error('Error al crear reserva:', error);
    throw error;
  }
};

/**
 * Actualiza una reserva
 * Solo el dueño o admin puede actualizar
 * @param {number} id - ID de la reserva a actualizar
 * @param {Object} datos - Datos a actualizar (fecha, hora_inicio, hora_fin)
 * @returns {Promise<Object>} Reserva actualizada
 */
export const actualizarReserva = async (id, datos) => {
  try {
    const reserva = await apiPut(API_ENDPOINTS.RESERVAS.BY_ID(id), datos);
    return reserva;
  } catch (error) {
    console.error(`Error al actualizar reserva ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina una reserva
 * Solo el dueño o admin puede eliminar
 * @param {number} id - ID de la reserva a eliminar
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const eliminarReserva = async (id) => {
  try {
    const respuesta = await apiDelete(API_ENDPOINTS.RESERVAS.BY_ID(id));
    return respuesta;
  } catch (error) {
    console.error(`Error al eliminar reserva ${id}:`, error);
    throw error;
  }
};

/**
 * Calcula la hora de fin basada en la hora de inicio y duración
 * @param {string} horaInicio - Hora de inicio en formato HH:MM
 * @param {number} duracionMinutos - Duración en minutos
 * @returns {string} Hora de fin en formato HH:MM
 */
export const calcularHoraFin = (horaInicio, duracionMinutos) => {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const fechaInicio = new Date();
  fechaInicio.setHours(horas, minutos, 0, 0);
  
  const fechaFin = new Date(fechaInicio.getTime() + duracionMinutos * 60000);
  
  const horasFin = fechaFin.getHours().toString().padStart(2, '0');
  const minutosFin = fechaFin.getMinutes().toString().padStart(2, '0');
  
  return `${horasFin}:${minutosFin}`;
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
 * Verifica si el usuario puede gestionar una reserva específica
 * @param {Object} reserva} - Objeto de reserva con id_usuario
 * @returns {boolean} true si puede gestionar, false en caso contrario
 */
export const puedeGestionarReserva = (reserva) => {
  const user = getUser();
  if (esAdmin()) return true;
  if (!user || !reserva) return false;
  
  // Comparar IDs (pueden venir como id_usuario o usuario.id_usuario)
  const reservaUserId = reserva.id_usuario || reserva.usuario?.id_usuario;
  const currentUserId = user.id || user.id_usuario;
  
  return reservaUserId === currentUserId;
};

