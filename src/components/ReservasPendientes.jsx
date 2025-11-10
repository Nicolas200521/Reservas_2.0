import { useState, useEffect } from 'react';
import { PiSoccerBallFill } from "react-icons/pi";
import { FaCheck, FaTimes, FaUser, FaCalendarAlt, FaClock } from "react-icons/fa";
import { obtenerReservas, actualizarReserva } from '../services/reservasService';
import { formatearFecha, formatearHora, calcularDuracion, obtenerNombreCancha, obtenerNombreUsuario } from '../utils/reservaHelpers';
import './ReservasPendientes.css';

function ReservasPendientes({ onReservaActualizada }) {
  const [reservasPendientes, setReservasPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchReservasPendientes();
  }, []);

  const fetchReservasPendientes = async () => {
    setLoading(true);
    try {
      const data = await obtenerReservas();
      const reservas = Array.isArray(data) ? data : [];
      // Filtrar solo las reservas pendientes usando estado_reserva_rel
      const pendientes = reservas.filter(r => 
        r.estado_reserva_rel?.estado_reserva === 'pendiente'
      );
      setReservasPendientes(pendientes);
    } catch (error) {
      console.error('Error al cargar reservas pendientes:', error);
      setReservasPendientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAceptar = async (reservaId) => {
    setProcessingId(reservaId);
    try {
      // El backend espera que actualicemos el id_estado_reserva a 2 (confirmada)
      // Pero según la documentación, solo podemos actualizar fecha, hora_inicio y hora_fin
      // Necesitamos verificar si el backend acepta actualizar el estado directamente
      // Por ahora, intentamos actualizar con id_estado_reserva
      await actualizarReserva(reservaId, {
        id_estado_reserva: 2
      });
      
      // Actualizar la lista
      setReservasPendientes(prev => 
        prev.filter(r => r.id_reserva !== reservaId)
      );
      
      // Mostrar mensaje de éxito
      alert('Reserva aceptada exitosamente. El estado ha cambiado a "confirmada".');
      
      // Notificar al componente padre para actualizar estadísticas
      if (onReservaActualizada) {
        onReservaActualizada();
      }
      
      // Recargar la lista
      fetchReservasPendientes();
    } catch (error) {
      console.error('Error al aceptar reserva:', error);
      alert(error.message || 'Error al aceptar la reserva. Intenta nuevamente.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRechazar = async (reservaId) => {
    if (!window.confirm('¿Estás seguro de que deseas rechazar esta reserva?')) {
      return;
    }
    
    setProcessingId(reservaId);
    try {
      // El backend espera que actualicemos el id_estado_reserva a 3 (cancelada/rechazada)
      await actualizarReserva(reservaId, {
        id_estado_reserva: 3
      });
      
      // Actualizar la lista
      setReservasPendientes(prev => 
        prev.filter(r => r.id_reserva !== reservaId)
      );
      
      // Mostrar mensaje de éxito
      alert('Reserva rechazada exitosamente.');
      
      // Notificar al componente padre para actualizar estadísticas
      if (onReservaActualizada) {
        onReservaActualizada();
      }
      
      // Recargar la lista
      fetchReservasPendientes();
    } catch (error) {
      console.error('Error al rechazar reserva:', error);
      alert(error.message || 'Error al rechazar la reserva. Intenta nuevamente.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="loading">Cargando reservas pendientes...</div>;
  }

  return (
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
                    onClick={() => handleRechazar(reserva.id_reserva)}
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
    </section>
  );
}

export default ReservasPendientes;

