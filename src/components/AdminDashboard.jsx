import { useState, useEffect } from 'react';
import { PiSoccerBallFill } from "react-icons/pi";
import { FaSignOutAlt, FaCalendarAlt, FaUsers, FaShieldAlt } from "react-icons/fa";
import './Dashboard.css';
import { API_ENDPOINTS } from '../config/api';
import { apiGet } from '../utils/apiClient';
import ReservasPendientes from './ReservasPendientes';

function AdminDashboard({ user, onLogout }) {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pendientes'); // 'pendientes', 'reservas', 'usuarios'

  useEffect(() => {
    if (activeTab === 'reservas') {
      fetchReservas();
    }
  }, [activeTab]);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const data = await apiGet(API_ENDPOINTS.RESERVAS.BASE);
      setReservas(Array.isArray(data) ? data : data.reservas || []);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      setReservas([]);
    } finally {
      setLoading(false);
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
              <FaShieldAlt className="user-icon admin-icon" title="Administrador" />
              <div className="user-details">
                <span className="user-name">
                  {user?.name || 'Administrador'}
                  <span className="role-badge admin">Admin</span>
                </span>
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
            <h2>¡Bienvenido,{user?.name}!</h2>
            <p>Gestiona todas las reservas</p>
          </section>

          {/* Tabs de navegación para Admin */}
          <div className="admin-tabs">
            <button 
              className={`tab-button ${activeTab === 'pendientes' ? 'active' : ''}`}
              onClick={() => setActiveTab('pendientes')}
            >
              <FaCalendarAlt />
              <span>Reservas Pendientes</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'reservas' ? 'active' : ''}`}
              onClick={() => setActiveTab('reservas')}
            >
              <FaCalendarAlt />
              <span>Todas las Reservas</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'usuarios' ? 'active' : ''}`}
              onClick={() => setActiveTab('usuarios')}
            >
              <FaUsers />
              <span>Usuarios</span>
            </button>
          </div>

          <section className="stats-section">
            <div className="stat-card">
              <FaCalendarAlt className="stat-icon" />
              <div className="stat-info">
                <h3>{reservas.filter(r => r.estado === 'pendiente').length}</h3>
                <p>Reservas Pendientes</p>
              </div>
            </div>
            <div className="stat-card">
              <PiSoccerBallFill className="stat-icon" />
              <div className="stat-info">
                <h3>{reservas.filter(r => r.estado === 'confirmada').length}</h3>
                <p>Reservas Confirmadas</p>
              </div>
            </div>
            <div className="stat-card">
              <FaUsers className="stat-icon" />
              <div className="stat-info">
                <h3>{reservas.length}</h3>
                <p>Total Reservas</p>
              </div>
            </div>
          </section>

          {/* Sección de Reservas Pendientes */}
          {activeTab === 'pendientes' && (
            <ReservasPendientes 
              onReservaActualizada={() => {
                // Recargar todas las reservas para actualizar estadísticas
                fetchReservas();
              }}
            />
          )}

          {/* Sección de Todas las Reservas */}
          {activeTab === 'reservas' && (
            <section className="reservas-section">
              <div className="section-header">
                <h2>Todas las Reservas</h2>
              </div>

              {loading ? (
                <div className="loading">Cargando reservas...</div>
              ) : reservas.length === 0 ? (
                <div className="empty-state">
                  <PiSoccerBallFill className="empty-icon" />
                  <p>No hay reservas registradas</p>
                </div>
              ) : (
                <div className="reservas-grid">
                  {reservas.map((reserva) => (
                    <div key={reserva.id} className="reserva-card">
                      <div className="reserva-header">
                        <h3>{reserva.cancha}</h3>
                        <span className={`estado-badge ${reserva.estado}`}>
                          {reserva.estado}
                        </span>
                      </div>
                      <div className="reserva-details">
                        <div className="detail-item">
                          <span className="detail-label">Usuario:</span>
                          <span className="detail-value">{reserva.usuarioNombre || `ID: ${reserva.usuarioId}`}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Fecha:</span>
                          <span className="detail-value">{reserva.fecha}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Hora:</span>
                          <span className="detail-value">{reserva.hora}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Duración:</span>
                          <span className="detail-value">{reserva.duracion} min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Sección de Usuarios */}
          {activeTab === 'usuarios' && (
            <section className="usuarios-section">
              <div className="section-header">
                <h2>Gestión de Usuarios</h2>
                <button className="new-reserva-button">
                  + Nuevo Usuario
                </button>
              </div>
              <div className="admin-placeholder">
                <FaUsers className="placeholder-icon" />
                <p>Panel de gestión de usuarios</p>
                <p className="placeholder-note">
                  Aquí podrás ver, crear, editar y eliminar usuarios del sistema
                </p>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;

