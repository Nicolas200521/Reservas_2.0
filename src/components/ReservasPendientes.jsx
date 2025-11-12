import { useState, useEffect } from 'react';
import { PiSoccerBallFill } from "react-icons/pi";
import { FaCheck, FaTimes, FaUser, FaCalendarAlt, FaClock, FaTimesCircle } from "react-icons/fa";
import { obtenerReservas, actualizarEstadoReserva } from '../services/reservasService';
import { formatearFecha, formatearHora, calcularDuracion, obtenerNombreCancha, obtenerNombreUsuario, obtenerEstadoReserva } from '../utils/reservaHelpers';
import { useNotification } from '../hooks/useNotification';
import Notification from './Notification';
import './ReservasPendientes.css';

function ReservasPendientes({ onReservaActualizada }) {
  const [reservasPendientes, setReservasPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [reservaARechazar, setReservaARechazar] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    fetchReservasPendientes();
  }, []);

  const fetchReservasPendientes = async () => {
    setLoading(true);
    try {
      const data = await obtenerReservas();
      const reservas = Array.isArray(data) ? data : [];
      // Filtrar solo las reservas pendientes usando la función helper para ser consistente
      const pendientes = reservas.filter(r => {
        const estado = obtenerEstadoReserva(r);
        return estado && estado === 'pendiente';
      });
      setReservasPendientes(pendientes);
    } catch (error) {
      console.error('Error al cargar reservas pendientes:', error);
      setReservasPendientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAceptar = async (reservaId) => {
    if (!reservaId) {
      showNotification('Error: ID de reserva no válido', 'error');
      return;
    }

    setProcessingId(reservaId);
    try {
      // Validar que el ID sea un número
      const id = typeof reservaId === 'number' ? reservaId : parseInt(reservaId);
      if (isNaN(id)) {
        throw new Error('ID de reserva inválido');
      }

      // Actualizar el estado de la reserva a "confirmada" (id_estado_reserva: 1)
      // ID 1 = confirmada, ID 2 = pendiente, ID 3 = cancelada, ID 4 = rechazada
      console.log('Aceptando reserva:', { reservaId: id, nuevoEstado: 1 });
      
      await actualizarEstadoReserva(id, 1);
      
      // Remover la reserva del estado local inmediatamente para que desaparezca de la UI
      setReservasPendientes(prev => prev.filter(r => r.id_reserva !== id));
      
      // Mostrar notificación de éxito
      showNotification('Reserva aceptada exitosamente. El estado ha cambiado a "confirmada".', 'success');
      
      // Notificar al componente padre para actualizar estadísticas
      if (onReservaActualizada) {
        onReservaActualizada();
      }
      
      // Recargar la lista de reservas pendientes para asegurar sincronización con el backend
      // Usar un pequeño delay para asegurar que el backend haya procesado el cambio
      setTimeout(() => {
        fetchReservasPendientes();
      }, 500);
    } catch (error) {
      console.error('Error al aceptar reserva:', error);
      const mensajeError = error.message || 'Error al aceptar la reserva. Intenta nuevamente.';
      showNotification(mensajeError, 'error');
      // Si hay error, recargar la lista para asegurar que el estado esté sincronizado
      fetchReservasPendientes();
    } finally {
      setProcessingId(null);
    }
  };

  const handleRechazarClick = (reserva) => {
    setReservaARechazar(reserva);
    setMotivoRechazo('');
    setShowRechazarModal(true);
  };

  const handleConfirmarRechazo = async () => {
    if (!reservaARechazar) return;
    
    const reservaId = reservaARechazar.id_reserva;
    setProcessingId(reservaId);
    setShowRechazarModal(false);
    
    try {
      // Actualizar el estado de la reserva a "rechazada" (id_estado_reserva: 4)
      // Si no se proporciona motivo, se envía un valor por defecto
      const motivo = motivoRechazo.trim() || 'Reserva rechazada por el administrador';
      await actualizarEstadoReserva(reservaId, 4, motivo);
      
      // Remover la reserva del estado local inmediatamente para que desaparezca de la UI
      setReservasPendientes(prev => prev.filter(r => r.id_reserva !== reservaId));
      
      // Mostrar notificación de éxito
      showNotification('Reserva rechazada exitosamente.', 'success');
      
      // Notificar al componente padre para actualizar estadísticas
      if (onReservaActualizada) {
        onReservaActualizada();
      }
      
      // Recargar la lista de reservas pendientes para asegurar sincronización con el backend
      // Usar un pequeño delay para asegurar que el backend haya procesado el cambio
      setTimeout(() => {
        fetchReservasPendientes();
      }, 500);
    } catch (error) {
      console.error('Error al rechazar reserva:', error);
      showNotification(error.message || 'Error al rechazar la reserva. Intenta nuevamente.', 'error');
      // Si hay error, recargar la lista para asegurar que el estado esté sincronizado
      fetchReservasPendientes();
    } finally {
      setProcessingId(null);
      setReservaARechazar(null);
      setMotivoRechazo('');
    }
  };

  const handleCancelarRechazo = () => {
    setShowRechazarModal(false);
    setReservaARechazar(null);
    setMotivoRechazo('');
  };

  if (loading) {
    return <div className="loading">Cargando reservas pendientes...</div>;
  }

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={hideNotification}
        />
      )}
      <section className="reservas-pendientes-section">
      <div className="section-header">
        <h2>Reservas Pendientes</h2>
        <span className="badge-count">{reservasPendientes.length}</span>
      </div>

      {reservasPendientes.length === 0 ? (
        <div className="empty-state">
          <PiSoccerBallFill className="empty-icon" />
          <p>No hay reservas pendientes</p>
          <p className="empty-note">Todas las reservas han sido procesadas</p>
        </div>
      ) : (
        <div className="reservas-pendientes-grid">
          {reservasPendientes.map((reserva) => {
            const fecha = formatearFecha(reserva.fecha);
            const horaInicio = formatearHora(reserva.hora_inicio);
            const horaFin = formatearHora(reserva.hora_fin);
            const canchaNombre = obtenerNombreCancha(reserva);
            const usuarioNombre = obtenerNombreUsuario(reserva);
            const duracion = calcularDuracion(reserva.hora_inicio, reserva.hora_fin);
            
            return (
              <div key={reserva.id_reserva} className="reserva-pendiente-card">
                <div className="reserva-pendiente-header">
                  <div className="cancha-info-header">
                    <PiSoccerBallFill className="cancha-icon-small" />
                    <h3>{canchaNombre}</h3>
                  </div>
                  <span className="estado-badge pendiente">Pendiente</span>
                </div>

                <div className="reserva-pendiente-details">
                  <div className="detail-row">
                    <FaUser className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Solicitado por:</span>
                      <span className="detail-value">{usuarioNombre}</span>
                    </div>
                  </div>

                  <div className="detail-row">
                    <FaCalendarAlt className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Fecha:</span>
                      <span className="detail-value">{fecha}</span>
                    </div>
                  </div>

                  <div className="detail-row">
                    <FaClock className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Hora:</span>
                      <span className="detail-value">{horaInicio} - {horaFin}</span>
                    </div>
                  </div>

                  {duracion > 0 && (
                    <div className="detail-row">
                      <PiSoccerBallFill className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Duración:</span>
                        <span className="detail-value">{duracion} minutos</span>
                      </div>
                    </div>
                  )}

                  {reserva.codigo_acceso && (
                    <div className="detail-row">
                      <div className="detail-content">
                        <span className="detail-label">Código de acceso:</span>
                        <span className="detail-value">{reserva.codigo_acceso}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="reserva-pendiente-actions">
                  <button
                    className="action-button aceptar"
                    onClick={() => handleAceptar(reserva.id_reserva)}
                    disabled={processingId === reserva.id_reserva}
                  >
                    <FaCheck />
                    <span>{processingId === reserva.id_reserva ? 'Procesando...' : 'Aceptar'}</span>
                  </button>
                  <button
                    className="action-button rechazar"
                    onClick={() => handleRechazarClick(reserva)}
                    disabled={processingId === reserva.id_reserva}
                  >
                    <FaTimes />
                    <span>{processingId === reserva.id_reserva ? 'Procesando...' : 'Rechazar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmación de Rechazo */}
      {showRechazarModal && reservaARechazar && (
        <div className="modal-overlay" onClick={handleCancelarRechazo}>
          <div className="modal-content-rechazar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-rechazar">
              <h2>Confirmar Rechazo de Reserva</h2>
              <button className="modal-close" onClick={handleCancelarRechazo}>×</button>
            </div>

            <div className="modal-body-rechazar">
              <div className="reserva-detail-card">
                <div className="reserva-detail-header">
                  <PiSoccerBallFill className="detail-icon-large" />
                  <h3>{obtenerNombreCancha(reservaARechazar)}</h3>
                  <span className="estado-badge pendiente">Pendiente</span>
                </div>

                <div className="reserva-detail-info">
                  <div className="detail-item-full">
                    <FaUser className="detail-icon" />
                    <div className="detail-content-full">
                      <span className="detail-label">Solicitado por:</span>
                      <span className="detail-value">{obtenerNombreUsuario(reservaARechazar)}</span>
                    </div>
                  </div>

                  <div className="detail-item-full">
                    <FaCalendarAlt className="detail-icon" />
                    <div className="detail-content-full">
                      <span className="detail-label">Fecha:</span>
                      <span className="detail-value">{formatearFecha(reservaARechazar.fecha)}</span>
                    </div>
                  </div>

                  <div className="detail-item-full">
                    <FaClock className="detail-icon" />
                    <div className="detail-content-full">
                      <span className="detail-label">Hora:</span>
                      <span className="detail-value">
                        {formatearHora(reservaARechazar.hora_inicio)} - {formatearHora(reservaARechazar.hora_fin)}
                      </span>
                    </div>
                  </div>

                  {calcularDuracion(reservaARechazar.hora_inicio, reservaARechazar.hora_fin) > 0 && (
                    <div className="detail-item-full">
                      <PiSoccerBallFill className="detail-icon" />
                      <div className="detail-content-full">
                        <span className="detail-label">Duración:</span>
                        <span className="detail-value">
                          {calcularDuracion(reservaARechazar.hora_inicio, reservaARechazar.hora_fin)} minutos
                        </span>
                      </div>
                    </div>
                  )}

                  {reservaARechazar.codigo_acceso && (
                    <div className="detail-item-full">
                      <div className="detail-content-full">
                        <span className="detail-label">Código de acceso:</span>
                        <span className="detail-value">{reservaARechazar.codigo_acceso}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-warning">
                  <FaTimesCircle className="warning-icon" />
                  <p>¿Estás seguro de que deseas rechazar esta reserva? Esta acción cambiará el estado a "rechazada".</p>
                </div>

                <div className="rechazo-field-container">
                  <label htmlFor="motivo-rechazo" className="rechazo-label">
                    Motivo de rechazo (opcional)
                  </label>
                  <textarea
                    id="motivo-rechazo"
                    className="rechazo-textarea"
                    placeholder="Ingresa el motivo por el cual rechazas esta reserva (opcional)..."
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    rows={4}
                    disabled={processingId === reservaARechazar.id_reserva}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions-rechazar">
              <button
                className="modal-button cancel"
                onClick={handleCancelarRechazo}
                disabled={processingId === reservaARechazar.id_reserva}
              >
                Cancelar
              </button>
              <button
                className="modal-button confirm-rechazar"
                onClick={handleConfirmarRechazo}
                disabled={processingId === reservaARechazar.id_reserva}
              >
                {processingId === reservaARechazar.id_reserva ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
    </>
  );
}

export default ReservasPendientes;

