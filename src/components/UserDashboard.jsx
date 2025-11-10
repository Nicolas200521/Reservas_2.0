import { useState, useEffect } from 'react';
import { PiSoccerBallFill } from "react-icons/pi";
import { FaSignOutAlt, FaCalendarAlt, FaUser, FaFutbol } from "react-icons/fa";
import './Dashboard.css';
import { obtenerMisReservas, eliminarReserva } from '../services/reservasService';
import { obtenerEstadoReserva, formatearFecha, formatearHora, obtenerNombreCancha } from '../utils/reservaHelpers';
import CanchasDisponibles from './CanchasDisponibles';

function UserDashboard({ user, onLogout }) {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('canchas'); 

  useEffect(() => {
    if (activeTab === 'mis-reservas') {
      fetchReservas();
    }
  }, [activeTab]);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const data = await obtenerMisReservas();
      setReservas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarReserva = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      return;
    }

    try {
      await eliminarReserva(id);
      alert('Reserva cancelada exitosamente');
      fetchReservas(); // Recargar la lista
    } catch (error) {
      alert(error.message || 'Error al cancelar la reserva');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <PiSoccerBallFill className="logo-icon" />
            <h1>Reservas de Canchas</h1>
          </div>
          <div className="user-section">
            <div className="user-info">
              <FaUser className="user-icon" />
              <div className="user-details">
                <span className="user-name">{user?.name || 'Usuario'}</span>
                <span className="user-email">{user?.email}</span>
              </div>
            </div>
            <button onClick={onLogout} className="logout-button">
              <FaSignOutAlt />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <section className="welcome-section">
            <h2>¡Bienvenido, {user?.name}!</h2>
            <p>Gestiona tus reservas de canchas de fútbol</p>
          </section>

          {/* Tabs de navegación para Usuario */}
          <div className="user-tabs">
            <button 
              className={`tab-button ${activeTab === 'canchas' ? 'active' : ''}`}
              onClick={() => setActiveTab('canchas')}
            >
              <FaFutbol />
              <span>Canchas Disponibles</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'mis-reservas' ? 'active' : ''}`}
              onClick={() => setActiveTab('mis-reservas')}
            >
              <FaCalendarAlt />
              <span>Mis Reservas</span>
            </button>
          </div>

          <section className="stats-section">
            <div className="stat-card">
              <FaCalendarAlt className="stat-icon" />
              <div className="stat-info">
                <h3>{reservas.length}</h3>
                <p>Mis Reservas</p>
              </div>
            </div>
            <div className="stat-card">
              <PiSoccerBallFill className="stat-icon" />
              <div className="stat-info">
                <h3>{reservas.filter(r => obtenerEstadoReserva(r) === 'confirmada').length}</h3>
                <p>Reservas Confirmadas</p>
              </div>
            </div>
            <div className="stat-card">
              <FaCalendarAlt className="stat-icon" />
              <div className="stat-info">
                <h3>{reservas.filter(r => obtenerEstadoReserva(r) === 'pendiente').length}</h3>
                <p>Pendientes</p>
              </div>
            </div>
          </section>

          {/* Sección de Canchas Disponibles */}
          {activeTab === 'canchas' && (
            <CanchasDisponibles 
              user={user}
              onReservaCreada={() => {
                setActiveTab('mis-reservas');
                fetchReservas();
              }}
            />
          )}

          {/* Sección de Mis Reservas */}
          {activeTab === 'mis-reservas' && (
            <section className="reservas-section">
              <div className="section-header">
                <h2>Mis Reservas</h2>
                <button 
                  className="new-reserva-button"
                  onClick={() => setActiveTab('canchas')}
                >
                  + Nueva Reserva
                </button>
              </div>

              {loading ? (
                <div className="loading">Cargando reservas...</div>
              ) : reservas.length === 0 ? (
                <div className="empty-state">
                  <PiSoccerBallFill className="empty-icon" />
                  <p>No tienes reservas aún</p>
                  <button 
                    className="new-reserva-button"
                    onClick={() => setActiveTab('canchas')}
                  >
                    Crear Primera Reserva
                  </button>
                </div>
              ) : (
                <div className="reservas-grid">
                  {reservas.map((reserva) => {
                    const fecha = formatearFecha(reserva.fecha);
                    const horaInicio = formatearHora(reserva.hora_inicio);
                    const horaFin = formatearHora(reserva.hora_fin);
                    const canchaNombre = obtenerNombreCancha(reserva);
                    const estado = obtenerEstadoReserva(reserva);
                    
                    return (
                      <div key={reserva.id_reserva} className="reserva-card">
                        <div className="reserva-header">
                          <h3>{canchaNombre}</h3>
                          <span className={`estado-badge ${estado}`}>
                            {estado}
                          </span>
                        </div>
                        <div className="reserva-details">
                          <div className="detail-item">
                            <span className="detail-label">Fecha:</span>
                            <span className="detail-value">{fecha}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Hora:</span>
                            <span className="detail-value">{horaInicio} - {horaFin}</span>
                          </div>
                          {reserva.codigo_acceso && (
                            <div className="detail-item">
                              <span className="detail-label">Código:</span>
                              <span className="detail-value">{reserva.codigo_acceso}</span>
                            </div>
                          )}
                        </div>
                        <div className="reserva-actions">
                          <button 
                            className="action-button delete" 
                            onClick={() => handleEliminarReserva(reserva.id_reserva)}
                            disabled={estado === 'cancelada'}
                          >
                            {estado === 'cancelada' ? 'Cancelada' : 'Cancelar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;

