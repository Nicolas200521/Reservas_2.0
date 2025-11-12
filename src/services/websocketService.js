
import { io } from 'socket.io-client';
import { getToken } from './authService';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const getWebSocketURL = () => {
  const wsUrl = import.meta.env.VITE_WS_URL;
  if (wsUrl) {
    return wsUrl;
  }
  
  // Si no hay URL específica, derivar de la API URL
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Convertir http:// a ws:// y https:// a wss://
    return apiUrl.replace(/^http/, 'ws');
  }
  return 'ws://localhost:3000';
};

/**
 * Conecta al servidor WebSocket
 * @param {Object} options - Opciones de conexión
 * @param {Function} onConnect - Callback cuando se conecta
 * @param {Function} onDisconnect - Callback cuando se desconecta
 * @param {Function} onError - Callback cuando hay error
 * @returns {Object} Instancia del socket
 */
export const connectWebSocket = (options = {}) => {
  const {
    onConnect,
    onDisconnect,
    onError,
  } = options;

  // Si ya hay una conexión activa, reutilizarla
  if (socket && socket.connected) {
    return socket;
  }

  // Cerrar conexión anterior si existe
  if (socket) {
    socket.disconnect();
  }

  const wsUrl = getWebSocketURL();

  // Crear conexión con cookies (withCredentials: true)
  // El token viene en una cookie, no en auth
  socket = io(wsUrl, {
    withCredentials: true, // Necesario para enviar cookies
    transports: ['websocket', 'polling'], // Intentar WebSocket primero, luego polling
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  });

  // Evento: conexión exitosa
  socket.on('connect', () => {
    reconnectAttempts = 0;
    if (onConnect) onConnect();
  });

  // Evento: desconexión
  socket.on('disconnect', (reason) => {
    if (onDisconnect) onDisconnect(reason);
  });

  // Evento: error de conexión
  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      if (onError) onError(new Error('No se pudo conectar al servidor WebSocket'));
    } else {
      if (onError) onError(error);
    }
  });

  // Evento: reconexión exitosa
  socket.on('reconnect', () => {
    reconnectAttempts = 0;
  });

  return socket;
};

/**
 * Desconecta el WebSocket
 */
export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

/**
 * Obtiene la instancia actual del socket
 * @returns {Object|null} Instancia del socket o null
 */
export const getSocket = () => {
  return socket;
};

/**
 * Verifica si el socket está conectado
 * @returns {boolean}
 */
export const isSocketConnected = () => {
  return socket && socket.connected;
};

/**
 * Suscribe a eventos de reservas usando el patrón del backend
 * @param {Function} onListaReservas - Callback cuando se recibe la lista de reservas
 * @param {Function} onNuevaReserva - Callback cuando se recibe una nueva reserva
 * @param {Function} onActualizacion - Callback cuando hay una actualización de reserva existente
 */
export const subscribeToReservas = (callbacks = {}) => {
  if (!socket || !socket.connected) {
    return;
  }

  const {
    onListaReservas,
    onNuevaReserva,
    onActualizacion,
  } = callbacks;

  // Suscribirse al servidor para recibir actualizaciones
  socket.emit('reservas:suscribir');

  // Escuchar lista inicial de reservas
  if (onListaReservas) {
    socket.on('reservas:lista', (data) => {
      if (data.success) {
        onListaReservas(data.data);
      }
    });
  }

  // Escuchar nuevas reservas (se reciben automáticamente cuando alguien crea una)
  if (onNuevaReserva) {
    socket.on('reservas:nueva', (data) => {
      if (data.success) {
        onNuevaReserva(data.data);
      }
    });
  }

  // Escuchar actualizaciones de reservas existentes
  if (onActualizacion) {
    socket.on('reservas:actualizacion', (data) => {
      if (data.reserva) {
        onActualizacion(data.reserva);
      }
    });
  }
};

/**
 * Cancela la suscripción a eventos de reservas
 */
export const unsubscribeFromReservas = () => {
  if (!socket) return;

  socket.emit('reservas:desuscribir');
  socket.off('reservas:lista');
  socket.off('reservas:nueva');
  socket.off('reservas:actualizacion');
};

/**
 * Solicita todas las reservas
 */
export const obtenerReservas = () => {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('reservas:obtener');
};

/**
 * Solicita las reservas del usuario actual
 */
export const obtenerMisReservas = () => {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('reservas:mis-reservas');
};

/**
 * Emite un evento al servidor (si es necesario)
 * @param {string} event - Nombre del evento
 * @param {Object} data - Datos a enviar
 */
export const emitEvent = (event, data) => {
  if (!socket || !socket.connected) {
    return;
  }

  socket.emit(event, data);
};

