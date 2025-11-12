import { useState, useEffect, useMemo } from 'react';
import { PiSoccerBallFill } from "react-icons/pi";
import { FaSignOutAlt, FaCalendarAlt, FaUser, FaFutbol } from "react-icons/fa";
import './Dashboard.css';
import { obtenerReservas, cancelarReserva } from '../services/reservasService';
import { getUser } from '../services/authService';
import { obtenerEstadoReserva, formatearFecha, formatearHora, obtenerNombreCancha } from '../utils/reservaHelpers';
import { useNotification } from '../hooks/useNotification';
import { useWebSocket } from '../hooks/useWebSocket';
import Notification from './Notification';
import ConfirmModal from './ConfirmModal';
import CanchasDisponibles from './CanchasDisponibles';

function UserDashboard({ user, onLogout }) {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('canchas');
  const [filtroEstado, setFiltroEstado] = useState('todas'); // 'todas', 'activas', 'canceladas'
  const [showConfirmCancelar, setShowConfirmCancelar] = useState(false);
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const { notification, showNotification, hideNotification } = useNotification();

  // Función para actualizar una reserva en la lista
  const actualizarReservaEnLista = (reservaActualizada) => {
    setReservas(prevReservas => {
      const currentUser = getUser();
      const userId = currentUser?.id || currentUser?.id_usuario;
      const reservaUserId = reservaActualizada.id_usuario || reservaActualizada.usuario?.id_usuario;
      
      // Solo actualizar si la reserva pertenece al usuario actual
      if (userId && reservaUserId !== userId) {
        return prevReservas;
      }

      // Buscar si la reserva ya existe en la lista
      const existe = prevReservas.some(r => r.id_reserva === reservaActualizada.id_reserva);
      
      if (existe) {
        // Actualizar reserva existente
        return prevReservas.map(r => 
          r.id_reserva === reservaActualizada.id_reserva ? reservaActualizada : r
        );
      } else {
        // Agregar nueva reserva (si pertenece al usuario)
        return [...prevReservas, reservaActualizada];
      }
    });
  };

  // Función para eliminar una reserva de la lista
  const eliminarReservaDeLista = (idReserva) => {
    setReservas(prevReservas => 
      prevReservas.filter(r => r.id_reserva !== idReserva)
    );
  };

  // Configurar WebSocket para actualizaciones en tiempo real
  const { obtenerMisReservas: obtenerMisReservasWS } = useWebSocket({
    enabled: true,
    obtenerMisReservas: true, // Obtener solo las reservas del usuario
    autoObtenerReservas: activeTab === 'mis-reservas', // Solo obtener si está en la pestaña de reservas
    onListaReservas: (listaReservas) => {
      // Cuando se recibe la lista inicial de reservas desde WebSocket
      const todasReservas = Array.isArray(listaReservas) ? listaReservas : [];
      
      // Filtrar solo las reservas del usuario actual (por si acaso)
      const currentUser = getUser();
      const reservasUsuario = currentUser?.id || currentUser?.id_usuario
        ? todasReservas.filter(r => {
            const reservaUserId = r.id_usuario || r.usuario?.id_usuario;
            const userId = currentUser.id || currentUser.id_usuario;
            return reservaUserId === userId;
          })
        : todasReservas;
      
      setReservas(reservasUsuario);
      setLoading(false);
    },
    onNuevaReserva: (nuevaReserva) => {
      // Nueva reserva recibida automáticamente cuando alguien crea una
      // Verificar que sea del usuario actual antes de agregarla
      const currentUser = getUser();
      const reservaUserId = nuevaReserva.id_usuario || nuevaReserva.usuario?.id_usuario;
      const userId = currentUser?.id || currentUser?.id_usuario;
      
      if (reservaUserId === userId) {
        setReservas(prev => [nuevaReserva, ...prev]);
        showNotification('Nueva reserva creada', 'success');
      }
    },
    onActualizacion: (reservaActualizada) => {
      // Actualización de reserva existente (recibe la reserva actualizada directamente)
      actualizarReservaEnLista(reservaActualizada);
      showNotification('Reserva actualizada', 'info');
    },
  }); 

  useEffect(() => {
    if (activeTab === 'mis-reservas') {
      fetchReservas();
    }
  }, [activeTab]);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      // Usar obtenerReservas() que devuelve todas las reservas del usuario (incluyendo canceladas)
      // El backend filtra automáticamente por usuario, pero no por estado
      const data = await obtenerReservas();
      const todasReservas = Array.isArray(data) ? data : [];
      
      // Filtrar solo las reservas del usuario actual (por si acaso)
      const currentUser = getUser();
      const reservasUsuario = currentUser?.id || currentUser?.id_usuario
        ? todasReservas.filter(r => {
            const reservaUserId = r.id_usuario || r.usuario?.id_usuario;
            const userId = currentUser.id || currentUser.id_usuario;
            return reservaUserId === userId;
          })
        : todasReservas;
      
      // Log para debug: verificar qué reservas estamos recibiendo
      if (import.meta.env.DEV) {
        console.log('📋 Reservas recibidas:', reservasUsuario.length);
        console.log('📋 Estados de reservas:', reservasUsuario.map(r => ({
          id: r.id_reserva,
          estado: obtenerEstadoReserva(r)
        })));
      }
      setReservas(reservasUsuario);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarReservaClick = (id) => {
    setReservaACancelar(id);
    setShowConfirmCancelar(true);
  };

  const handleConfirmarCancelar = async () => {
    if (!reservaACancelar ) return;
    try {
      await cancelarReserva(reservaACancelar);
      showNotification('Reserva cancelada exitosamente', 'success');
      setShowConfirmCancelar(false);
      setReservaACancelar(null);
      fetchReservas(); // Recargar la lista
    } catch (error) {
      let errorMessage = error.message || 'Error al cancelar la reserva';
      if (errorMessage.includes('permisos') || errorMessage.includes('acceso denegado') || errorMessage.includes('Forbidden')) {
        errorMessage = 'No tienes permisos para cancelar esta reserva. Solo puedes cancelar tus propias reservas.';
      }
      showNotification(errorMessage, 'error');
      setShowConfirmCancelar(false);
      setReservaACancelar(null);
    }
  };

  const handleCancelarCancelar = () => {
    setShowConfirmCancelar(false);
    setReservaACancelar(null);
  };

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
      
      <ConfirmModal
        isOpen={showConfirmCancelar}
        onClose={handleCancelarCancelar}
        onConfirm={handleConfirmarCancelar}
        title="Confirmar cancelación"
        message="Recuerda que al cancelar la reserva el 90% de la cuota no sera reembolsada. ¿Estás seguro de que deseas cancelar esta reserva?"
        confirmText="Cancelar reserva"
        cancelText="No cancelar"
        type="warning"
      />
      
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
            {(() => {
              // Calcular estadísticas usando useMemo para optimizar
              const totalReservas = reservas.length;
              const confirmadas = reservas.filter(r => {
                const estado = obtenerEstadoReserva(r);
                return estado && estado === 'confirmada';
              }).length;
              const pendientes = reservas.filter(r => {
                const estado = obtenerEstadoReserva(r);
                return estado && estado === 'pendiente';
              }).length;
              const canceladasRechazadas = reservas.filter(r => {
                const estado = obtenerEstadoReserva(r);
                return estado && (estado === 'cancelada' || estado === 'rechazada');
              }).length;

              return (
                <>
                  <div className="stat-card">
                    <FaCalendarAlt className="stat-icon" />
                    <div className="stat-info">
                      <h3>{totalReservas}</h3>
                      <p>Mis Reservas</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <PiSoccerBallFill className="stat-icon" />
                    <div className="stat-info">
                      <h3>{confirmadas}</h3>
                      <p>Reservas Confirmadas</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <FaCalendarAlt className="stat-icon" />
                    <div className="stat-info">
                      <h3>{pendientes}</h3>
                      <p>Pendientes</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <FaSignOutAlt className="stat-icon" />
                    <div className="stat-info">
                      <h3>{canceladasRechazadas}</h3>
                      <p>Canceladas/Rechazadas</p>
                    </div>
                  </div>
                </>
              );
            })()}
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

              {/* Filtros de estado */}
              <div className="filtros-reservas" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className={`filtro-button ${filtroEstado === 'todas' ? 'active' : ''}`}
                  onClick={() => setFiltroEstado('todas')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: filtroEstado === 'todas' ? '#007bff' : '#fff',
                    color: filtroEstado === 'todas' ? '#fff' : '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Todas
                </button>
                <button
                  className={`filtro-button ${filtroEstado === 'activas' ? 'active' : ''}`}
                  onClick={() => setFiltroEstado('activas')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: filtroEstado === 'activas' ? '#28a745' : '#fff',
                    color: filtroEstado === 'activas' ? '#fff' : '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Activas
                </button>
                <button
                  className={`filtro-button ${filtroEstado === 'canceladas' ? 'active' : ''}`}
                  onClick={() => setFiltroEstado('canceladas')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: filtroEstado === 'canceladas' ? '#dc3545' : '#fff',
                    color: filtroEstado === 'canceladas' ? '#fff' : '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Canceladas/Rechazadas
                </button>
              </div>

              {loading ? (
                <div className="loading">Cargando reservas...</div>
              ) : (() => {
                // Filtrar reservas según el filtro seleccionado
                const reservasFiltradas = reservas.filter(reserva => {
                  const estado = obtenerEstadoReserva(reserva);
                  if (!estado) return false; // Excluir reservas sin estado
                  if (filtroEstado === 'todas') return true;
                  if (filtroEstado === 'activas') {
                    return estado === 'pendiente' || estado === 'confirmada';
                  }
                  if (filtroEstado === 'canceladas') {
                    return estado === 'cancelada' || estado === 'rechazada';
                  }
                  return true;
                });

                if (reservasFiltradas.length === 0) {
                  return (
                    <div className="empty-state">
                      <PiSoccerBallFill className="empty-icon" />
                      <p>
                        {filtroEstado === 'canceladas' 
                          ? 'No tienes reservas canceladas o rechazadas' 
                          : filtroEstado === 'activas'
                          ? 'No tienes reservas activas'
                          : 'No tienes reservas aún'}
                      </p>
                      {filtroEstado === 'todas' && (
                        <button 
                          className="new-reserva-button"
                          onClick={() => setActiveTab('canchas')}
                        >
                          Crear Primera Reserva
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="reservas-grid">
                    {reservasFiltradas.map((reserva) => {
                    const fecha = formatearFecha(reserva.fecha);
                    const horaInicio = formatearHora(reserva.hora_inicio);
                    const horaFin = formatearHora(reserva.hora_fin);
                    const canchaNombre = obtenerNombreCancha(reserva);
                    const estado = obtenerEstadoReserva(reserva);
                    
                    // Si no hay estado, no mostrar la reserva
                    if (!estado) return null;
                    
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
                        {(estado !== 'rechazada' && estado !== 'cancelada') && (
                          <div className="reserva-actions">
                            <button 
                              className="action-button delete" 
                              onClick={() => handleCancelarReservaClick(reserva.id_reserva)}
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                );
              })()}
            </section>
          )}
        </div>
      </main>
    </div>
    </>
  );
}

export default UserDashboard;

