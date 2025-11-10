// Utilidades para trabajar con reservas
/**
 * Obtiene el estado de una reserva como string
 * @param {Object} reserva - Objeto de reserva del backend
 * @returns {string} Estado de la reserva ('pendiente', 'confirmada', 'cancelada')
 */
export const obtenerEstadoReserva = (reserva) => {
  return reserva.estado_reserva_rel?.estado_reserva || 'pendiente';
};

/**
 * Formatea una fecha del backend a formato legible
 * @param {string} fechaISO - Fecha en formato ISO del backend
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (fechaISO) => {
  if (!fechaISO) return 'N/A';
  try {
    return new Date(fechaISO).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Formatea una hora del backend a formato legible
 * @param {string} horaISO - Hora en formato ISO del backend
 * @returns {string} Hora formateada (HH:MM)
 */
export const formatearHora = (horaISO) => {
  if (!horaISO) return 'N/A';
  try {
    return new Date(horaISO).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Calcula la duración en minutos entre dos horas
 * @param {string} horaInicioISO - Hora de inicio en formato ISO
 * @param {string} horaFinISO - Hora de fin en formato ISO
 * @returns {number} Duración en minutos
 */
export const calcularDuracion = (horaInicioISO, horaFinISO) => {
  if (!horaInicioISO || !horaFinISO) return 0;
  try {
    const inicio = new Date(horaInicioISO);
    const fin = new Date(horaFinISO);
    return Math.round((fin - inicio) / (1000 * 60));
  } catch (error) {
    return 0;
  }
};

/**
 * Obtiene el nombre de la cancha de una reserva
 * @param {Object} reserva - Objeto de reserva del backend
 * @returns {string} Nombre de la cancha
 */
export const obtenerNombreCancha = (reserva) => {
  return reserva.cancha?.nombre || `Cancha ${reserva.id_cancha}`;
};

/**
 * Obtiene el nombre del usuario de una reserva
 * @param {Object} reserva - Objeto de reserva del backend
 * @returns {string} Nombre del usuario
 */
export const obtenerNombreUsuario = (reserva) => {
  return reserva.usuario?.nombre || reserva.usuario?.correo || `ID: ${reserva.id_usuario}`;
};

