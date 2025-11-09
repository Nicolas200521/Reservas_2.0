import { useState, useEffect } from 'react';
import { PiSoccerBallFill } from "react-icons/pi";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { API_ENDPOINTS } from '../config/api';
import { apiGet, apiPost } from '../utils/apiClient';
import './CanchasDisponibles.css';

function CanchasDisponibles({ user, onReservaCreada }) {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    duracion: 90
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCanchas();
  }, []);

  const fetchCanchas = async () => {
    try {
      // En producción, esto vendría de un endpoint /api/canchas
      // Por ahora, usamos datos mock
      const canchasMock = [
        { id: 1, nombre: 'Cancha 1', tipo: 'Fútbol 11', precio: 50000, disponible: true },
        { id: 2, nombre: 'Cancha 2', tipo: 'Fútbol 7', precio: 40000, disponible: true },
        { id: 3, nombre: 'Cancha 3', tipo: 'Fútbol 5', precio: 30000, disponible: true },
        { id: 4, nombre: 'Cancha 4', tipo: 'Fútbol 11', precio: 50000, disponible: false },
      ];
      setCanchas(canchasMock);
    } catch (error) {
      console.error('Error al cargar canchas:', error);
      setCanchas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReservar = (cancha) => {
    setCanchaSeleccionada(cancha);
    setShowModal(true);
    setError('');
    // Establecer fecha mínima como hoy
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      fecha: today,
      hora: '',
      duracion: 90
    });
  };

  const handleSubmitReserva = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!formData.fecha || !formData.hora) {
      setError('Por favor completa todos los campos');
      setSubmitting(false);
      return;
    }

    try {
      const response = await apiPost(API_ENDPOINTS.RESERVAS.BASE, {
        cancha: canchaSeleccionada.nombre,
        fecha: formData.fecha,
        hora: formData.hora,
        duracion: formData.duracion,
        usuarioId: user?.id,
        estado: 'pendiente' // Todas las reservas se crean con estado pendiente
      });

      setShowModal(false);
      setCanchaSeleccionada(null);
      
      // Mostrar mensaje de éxito
      alert('¡Reserva creada exitosamente! Tu reserva está pendiente de aprobación por el administrador.');
      
      // Notificar al componente padre
      if (onReservaCreada) {
        onReservaCreada(response.reserva || response);
      }
    } catch (err) {
      setError(err.message || 'Error al crear la reserva. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const horasDisponibles = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00'
  ];

  if (loading) {
    return <div className="loading">Cargando canchas disponibles...</div>;
  }

  return (
    <>
      <section className="canchas-section">
        <div className="section-header">
          <h2>Canchas Disponibles</h2>
          <p className="section-subtitle">Selecciona una cancha para reservar</p>
        </div>

        <div className="canchas-grid">
          {canchas.map((cancha) => (
            <div key={cancha.id} className={`cancha-card ${!cancha.disponible ? 'no-disponible' : ''}`}>
              <div className="cancha-header">
                <PiSoccerBallFill className="cancha-icon" />
                <h3>{cancha.nombre}</h3>
              </div>
              
              <div className="cancha-info">
                <div className="cancha-detail">
                  <FaMapMarkerAlt className="detail-icon" />
                  <span>{cancha.tipo}</span>
                </div>
                <div className="cancha-detail">
                  <span className="precio">${cancha.precio?.toLocaleString('es-CO') || 'N/A'}</span>
                  <span className="precio-label">por hora</span>
                </div>
              </div>

              <div className="cancha-status">
                {cancha.disponible ? (
                  <span className="status-badge disponible">Disponible</span>
                ) : (
                  <span className="status-badge no-disponible">No Disponible</span>
                )}
              </div>

              <button
                className="reservar-button"
                onClick={() => handleReservar(cancha)}
                disabled={!cancha.disponible}
              >
                {cancha.disponible ? 'Reservar Ahora' : 'No Disponible'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modal de Reserva */}
      {showModal && canchaSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reservar {canchaSeleccionada.nombre}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmitReserva} className="reserva-form">
              {error && (
                <div className="error-message">{error}</div>
              )}

              <div className="form-group">
                <label>
                  <FaCalendarAlt className="label-icon" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <FaClock className="label-icon" />
                  Hora
                </label>
                <select
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  required
                >
                  <option value="">Selecciona una hora</option>
                  {horasDisponibles.map((hora) => (
                    <option key={hora} value={hora}>{hora}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <PiSoccerBallFill className="label-icon" />
                  Duración (minutos)
                </label>
                <select
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
                  required
                >
                  <option value={60}>60 minutos</option>
                  <option value={90}>90 minutos</option>
                  <option value={120}>120 minutos</option>
                </select>
              </div>

              <div className="reserva-summary">
                <div className="summary-item">
                  <span>Cancha:</span>
                  <strong>{canchaSeleccionada.nombre}</strong>
                </div>
                <div className="summary-item">
                  <span>Precio estimado:</span>
                  <strong>
                    ${((canchaSeleccionada.precio || 0) * (formData.duracion / 60)).toLocaleString('es-CO')}
                  </strong>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="confirm-button"
                  disabled={submitting}
                >
                  {submitting ? 'Reservando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CanchasDisponibles;

