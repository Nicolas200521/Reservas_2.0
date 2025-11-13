// Hook personalizado para manejar WebSocket en componentes React
import { useEffect, useRef, useCallback } from 'react';
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribeToReservas,
  unsubscribeFromReservas,
  obtenerReservas,
  obtenerMisReservas,
  isSocketConnected,
} from '../services/websocketService';

/**
 * Hook para usar WebSocket en componentes
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.enabled - Si el WebSocket debe estar activo (default: true)
 * @param {Function} options.onListaReservas - Callback cuando se recibe la lista de reservas
 * @param {Function} options.onNuevaReserva - Callback cuando se recibe una nueva reserva
 * @param {Function} options.onActualizacion - Callback cuando hay una actualización de reserva existente
 * @param {Function} options.onConnect - Callback cuando se conecta
 * @param {Function} options.onDisconnect - Callback cuando se desconecta
 * @param {Function} options.onError - Callback cuando hay error
 * @param {boolean} options.autoObtenerReservas - Si debe obtener reservas automáticamente al conectar (default: true)
 * @param {boolean} options.obtenerMisReservas - Si debe obtener solo las reservas del usuario (default: false)
 * @returns {Object} Estado y funciones del WebSocket
 */
export const useWebSocket = (options = {}) => {
  const {
    enabled = true,
    onListaReservas,
    onNuevaReserva,
    onActualizacion,
    onConnect,
    onDisconnect,
    onError,
    autoObtenerReservas = true,
    obtenerMisReservas: obtenerMisReservasFlag = false,
  } = options;

  const callbacksRef = useRef({
    onListaReservas,
    onNuevaReserva,
    onActualizacion,
  });

  // Actualizar referencias de callbacks cuando cambian
  useEffect(() => {
    callbacksRef.current = {
      onListaReservas,
      onNuevaReserva,
      onActualizacion,
    };
  }, [onListaReservas, onNuevaReserva, onActualizacion]);

  // Conectar y suscribirse cuando el componente se monta
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Conectar al WebSocket (no necesita token porque viene en cookie)
    const socket = connectWebSocket({
      onConnect: () => {
        if (onConnect) onConnect();
      },
      onDisconnect: (reason) => {
        if (onDisconnect) onDisconnect(reason);
      },
      onError: (error) => {
        if (onError) onError(error);
      },
    });

    if (!socket) {
      return;
    }

    // Esperar a que se conecte antes de suscribirse
    const handleConnect = () => {
      // Suscribirse a eventos de reservas
      subscribeToReservas({
        onListaReservas: (data) => {
          if (callbacksRef.current.onListaReservas) {
            callbacksRef.current.onListaReservas(data);
          }
        },
        onNuevaReserva: (nuevaReserva) => {
          // Nueva reserva recibida automáticamente
          if (callbacksRef.current.onNuevaReserva) {
            callbacksRef.current.onNuevaReserva(nuevaReserva);
          }
        },
        onActualizacion: (reservaActualizada) => {
          // Actualización de reserva existente
          if (callbacksRef.current.onActualizacion) {
            callbacksRef.current.onActualizacion(reservaActualizada);
          }
        },
      });

      // Obtener reservas iniciales si está habilitado
      if (autoObtenerReservas) {
        if (obtenerMisReservasFlag) {
          obtenerMisReservas();
        } else {
          obtenerReservas();
        }
      }
    };

    // Si ya está conectado, suscribirse inmediatamente
    if (socket.connected) {
      handleConnect();
    } else {
      // Si no, esperar al evento de conexión
      socket.once('connect', handleConnect);
    }

    // Cleanup: desconectar cuando el componente se desmonta
    return () => {
      unsubscribeFromReservas();
      disconnectWebSocket();
    };
  }, [enabled, onConnect, onDisconnect, onError, autoObtenerReservas, obtenerMisReservasFlag]);

  // Función para verificar si está conectado
  const isConnected = useCallback(() => {
    return isSocketConnected();
  }, []);

  // Funciones para obtener reservas manualmente
  const obtenerReservasManual = useCallback(() => {
    obtenerReservas();
  }, []);

  const obtenerMisReservasManual = useCallback(() => {
    obtenerMisReservas();
  }, []);

  return {
    isConnected,
    obtenerReservas: obtenerReservasManual,
    obtenerMisReservas: obtenerMisReservasManual,
  };
};

