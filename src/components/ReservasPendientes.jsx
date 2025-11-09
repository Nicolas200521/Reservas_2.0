import { useState, useEffect } from 'react';
import { PiSoccerBallFill } from "react-icons/pi";
import { FaCheck, FaTimes, FaUser, FaCalendarAlt, FaClock } from "react-icons/fa";
import { API_ENDPOINTS } from '../config/api';
import { apiGet, apiPut } from '../utils/apiClient';
import './ReservasPendientes.css';

function ReservasPendientes({ onReservaActualizada }) {
  const [reservasPendientes, setReservasPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchReservasPendientes();
  }, []);

  const fetchReservasPendientes = async () => {
    try {
      const data = await apiGet(API_ENDPOINTS.RESERVAS.BASE);
      const reservas = Array.isArray(data) ? data : data.reservas || [];
      // Filtrar solo las reservas pendientes
      const pendientes = reservas.filter(r => r.estado === 'pendiente');
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
      await apiPut(API_ENDPOINTS.RESERVAS.BY_ID(reservaId), {
        estado: 'confirmada'
      });
      
      // Actualizar la lista
      setReservasPendientes(prev => 
        prev.filter(r => r.id !== reservaId)
      );
      
      // Mostrar mensaje de éxito
      alert('Reserva aceptada exitosamente. El estado ha cambiado a "confirmada".');
      
      // Notificar al componente padre para actualizar estadísticas
      if (onReservaActualizada) {
        onReservaActualizada();
      }
    } catch (error) {
      console.error('Error al aceptar reserva:', error);
      alert('Error al aceptar la reserva. Intenta nuevamente.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRechazar = async (reservaId) => {
    setProcessingId(reservaId);
    try {
      await apiPut(API_ENDPOINTS.RESERVAS.BY_ID(reservaId), {
        estado: 'rechazada'
      });
      
      // Actualizar la lista
      setReservasPendientes(prev => 
        prev.filter(r => r.id !== reservaId)
      );
      
      // Mostrar mensaje de éxito
      alert('Reserva rechazada exitosamente.');
      
      // Notificar al componente padre para actualizar estadísticas
      if (onReservaActualizada) {
        onReservaActualizada();
      }
    } catch (error) {
      console.error('Error al rechazar reserva:', error);
      alert('Error al rechazar la reserva. Intenta nuevamente.');
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
          {reservasPendientes.map((reserva) => (
            <div key={reserva.id} className="reserva-pendiente-card">
              <div className="reserva-pendiente-header">
                <div className="cancha-info-header">
                  <PiSoccerBallFill className="cancha-icon-small" />
                  <h3>{reserva.cancha}</h3>
                </div>
                <span className="estado-badge pendiente">Pendiente</span>
              </div>

              <div className="reserva-pendiente-details">
                <div className="detail-row">
                  <FaUser className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Solicitado por:</span>
                    <span className="detail-value">{reserva.usuarioNombre || `Usuario ID: ${reserva.usuarioId}`}</span>
                  </div>
                </div>

                <div className="detail-row">
                  <FaCalendarAlt className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Fecha:</span>
                    <span className="detail-value">{reserva.fecha}</span>
                  </div>
                </div>

                <div className="detail-row">
                  <FaClock className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Hora:</span>
                    <span className="detail-value">{reserva.hora}</span>
                  </div>
                </div>

                <div className="detail-row">
                  <PiSoccerBallFill className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Duración:</span>
                    <span className="detail-value">{reserva.duracion} minutos</span>
                  </div>
                </div>

                {reserva.createdAt && (
                  <div className="detail-row">
                    <span className="detail-label">Solicitado el:</span>
                    <span className="detail-value">
                      {new Date(reserva.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="reserva-pendiente-actions">
                <button
                  className="action-button aceptar"
                  onClick={() => handleAceptar(reserva.id)}
                  disabled={processingId === reserva.id}
                >
                  <FaCheck />
                  <span>{processingId === reserva.id ? 'Procesando...' : 'Aceptar'}</span>
                </button>
                <button
                  className="action-button rechazar"
                  onClick={() => handleRechazar(reserva.id)}
                  disabled={processingId === reserva.id}
                >
                  <FaTimes />
                  <span>{processingId === reserva.id ? 'Procesando...' : 'Rechazar'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ReservasPendientes;

