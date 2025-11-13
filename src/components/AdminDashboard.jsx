import { useState, useEffect } from 'react';
import { PiSoccerBallFill } from "react-icons/pi";
import { FaSignOutAlt, FaCalendarAlt, FaUsers, FaShieldAlt, FaTimes, FaTrash, FaCheckCircle } from "react-icons/fa";
import './Dashboard.css';
import { obtenerReservas } from '../services/reservasService';
import { obtenerUsuarios, eliminarUsuario } from '../services/usuariosService';
import { obtenerEstadoReserva, formatearFecha, formatearHora, obtenerNombreCancha, obtenerNombreUsuario } from '../utils/reservaHelpers';
import { useNotification } from '../hooks/useNotification';
import { useWebSocket } from '../hooks/useWebSocket';
import Notification from './Notification';
import ConfirmModal from './ConfirmModal';
import ReservasPendientes from './ReservasPendientes';

function AdminDashboard({ user, onLogout }) {
  const [reservas, setReservas] = useState([]);
  const [reservasConfirmadas, setReservasConfirmadas] = useState([]);
  const [reservasCanceladas, setReservasCanceladas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [loadingCanceladas, setLoadingCanceladas] = useState(false);
  const [loadingConfirmadas, setLoadingConfirmadas] = useState(false);
  const [activeTab, setActiveTab] = useState('pendientes'); // 'pendientes', 'confirmadas', 'reservas', 'canceladas', 'usuarios'
  const [eliminandoUsuarioId, setEliminandoUsuarioId] = useState(null);
  const [showConfirmEliminar, setShowConfirmEliminar] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const { notification, showNotification, hideNotification } = useNotification();

  // Función para actualizar una reserva en la lista
  const actualizarReservaEnLista = (reservaActualizada) => {
    // Actualizar lista principal
    setReservas(prevReservas => {
      const existe = prevReservas.some(r => r.id_reserva === reservaActualizada.id_reserva);
      if (existe) {
        return prevReservas.map(r => 
          r.id_reserva === reservaActualizada.id_reserva ? reservaActualizada : r
        );
      } else {
        return [...prevReservas, reservaActualizada];
      }
    });
    
    // Actualizar listas filtradas según el estado
    const estado = obtenerEstadoReserva(reservaActualizada);
    actualizarReservaConfirmada(reservaActualizada);
    actualizarReservaCancelada(reservaActualizada);
  };

  // Función para actualizar reservas confirmadas
  const actualizarReservaConfirmada = (reservaActualizada) => {
    const estado = obtenerEstadoReserva(reservaActualizada);
    if (estado === 'confirmada') {
      setReservasConfirmadas(prev => {
        const existe = prev.some(r => r.id_reserva === reservaActualizada.id_reserva);
        if (existe) {
          return prev.map(r => 
            r.id_reserva === reservaActualizada.id_reserva ? reservaActualizada : r
          );
        } else {
          return [...prev, reservaActualizada];
        }
      });
    } else {
      // Si ya no está confirmada, removerla de la lista
      setReservasConfirmadas(prev => 
        prev.filter(r => r.id_reserva !== reservaActualizada.id_reserva)
      );
    }
  };

  // Función para actualizar reservas canceladas
  const actualizarReservaCancelada = (reservaActualizada) => {
    const estado = obtenerEstadoReserva(reservaActualizada);
    if (estado === 'cancelada' || estado === 'rechazada') {
      setReservasCanceladas(prev => {
        const existe = prev.some(r => r.id_reserva === reservaActualizada.id_reserva);
        if (existe) {
          return prev.map(r => 
            r.id_reserva === reservaActualizada.id_reserva ? reservaActualizada : r
          );
        } else {
          return [...prev, reservaActualizada];
        }
      });
    } else {
      // Si ya no está cancelada, removerla de la lista
      setReservasCanceladas(prev => 
        prev.filter(r => r.id_reserva !== reservaActualizada.id_reserva)
      );
    }
  };

  // Función para eliminar una reserva de todas las listas
  const eliminarReservaDeListas = (idReserva) => {
    setReservas(prev => prev.filter(r => r.id_reserva !== idReserva));
    setReservasConfirmadas(prev => prev.filter(r => r.id_reserva !== idReserva));
    setReservasCanceladas(prev => prev.filter(r => r.id_reserva !== idReserva));
  };

  // Configurar WebSocket para actualizaciones en tiempo real
  const { obtenerReservas: obtenerReservasWS } = useWebSocket({
    enabled: true,
    obtenerMisReservas: false, // Admin obtiene todas las reservas
    autoObtenerReservas: true,
    onListaReservas: (listaReservas) => {
      // Cuando se recibe la lista inicial de reservas desde WebSocket
      const todasReservas = Array.isArray(listaReservas) ? listaReservas : [];
      
      // Actualizar todas las listas según el estado
      setReservas(todasReservas);
      
      const confirmadas = todasReservas.filter(r => {
        const estado = obtenerEstadoReserva(r);
        return estado && estado === 'confirmada';
      });
      setReservasConfirmadas(confirmadas);
      
      const canceladas = todasReservas.filter(r => {
        const estado = obtenerEstadoReserva(r);
        return estado && (estado === 'cancelada' || estado === 'rechazada');
      });
      setReservasCanceladas(canceladas);
      
      setLoading(false);
      setLoadingConfirmadas(false);
      setLoadingCanceladas(false);
    },
    onNuevaReserva: (nuevaReserva) => {
      // Nueva reserva recibida automáticamente cuando alguien crea una
      setReservas(prev => [nuevaReserva, ...prev]);
      
      // Actualizar listas filtradas según el estado
      const estado = obtenerEstadoReserva(nuevaReserva);
      if (estado === 'confirmada') {
        setReservasConfirmadas(prev => [nuevaReserva, ...prev]);
      } else if (estado === 'cancelada' || estado === 'rechazada') {
        setReservasCanceladas(prev => [nuevaReserva, ...prev]);
      }
      
      showNotification('Nueva reserva recibida', 'info');
    },
    onActualizacion: (reservaActualizada) => {
      // Actualización de reserva existente (recibe la reserva actualizada directamente)
      actualizarReservaEnLista(reservaActualizada);
      showNotification('Reserva actualizada', 'info');
    },
  });

  useEffect(() => {
    // Cargar todas las reservas al inicio para actualizar las estadísticas
    // Esto asegura que los contadores se actualicen correctamente
    fetchReservas();
    fetchReservasConfirmadas();
    fetchReservasCanceladas();
    
    if (activeTab === 'usuarios') {
      fetchUsuarios();
    }
  }, [activeTab]);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const data = await obtenerReservas();
      const todasReservas = Array.isArray(data) ? data : [];
      setReservas(todasReservas);
      
      // También actualizar las listas filtradas para mantener sincronización
      const confirmadas = todasReservas.filter(r => {
        const estado = obtenerEstadoReserva(r);
        return estado && estado === 'confirmada';
      });
      setReservasConfirmadas(confirmadas);
      
      const canceladas = todasReservas.filter(r => {
        const estado = obtenerEstadoReserva(r);
        return estado && (estado === 'cancelada' || estado === 'rechazada');
      });
      setReservasCanceladas(canceladas);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservasConfirmadas = async () => {
    setLoadingConfirmadas(true);
    try {
      const data = await obtenerReservas();
      const todasReservas = Array.isArray(data) ? data : [];
      // Filtrar solo las reservas confirmadas
      const confirmadas = todasReservas.filter(r => {
        const estado = obtenerEstadoReserva(r);
        return estado && estado === 'confirmada';
      });
      setReservasConfirmadas(confirmadas);
    } catch (error) {
      console.error('Error al cargar reservas confirmadas:', error);
      setReservasConfirmadas([]);
    } finally {
      setLoadingConfirmadas(false);
    }
  };

  const fetchReservasCanceladas = async () => {
    setLoadingCanceladas(true);
    try {
      const data = await obtenerReservas();
      const todasReservas = Array.isArray(data) ? data : [];
      // Filtrar reservas canceladas y rechazadas
      const canceladas = todasReservas.filter(r => {
        const estado = obtenerEstadoReserva(r);
        return estado && (estado === 'cancelada' || estado === 'rechazada');
      });
      setReservasCanceladas(canceladas);
    } catch (error) {
      console.error('Error al cargar reservas canceladas:', error);
      setReservasCanceladas([]);
    } finally {
      setLoadingCanceladas(false);
    }
  };

  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      // Verificar que el usuario sea admin antes de hacer la petición
      const currentUser = user;
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.rol !== 'admin')) {
        throw new Error('Solo los administradores pueden ver la lista de usuarios');
      }

      const data = await obtenerUsuarios();
      console.log('Usuarios recibidos:', data);
      
      // Asegurar que sea un array
      if (Array.isArray(data)) {
        setUsuarios(data);
        console.log(`Se cargaron ${data.length} usuarios`);
      } else if (data && typeof data === 'object') {
        // Si viene como objeto con una propiedad que contiene el array
        const usuariosArray = data.usuarios || data.data || Object.values(data).find(Array.isArray) || [];
        setUsuarios(Array.isArray(usuariosArray) ? usuariosArray : []);
        console.log(`Se cargaron ${usuariosArray.length} usuarios (desde objeto)`);
      } else {
        console.warn('Formato de respuesta inesperado:', data);
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      // Mostrar mensaje de error más amigable
      const errorMessage = error.message || 'Error desconocido al cargar usuarios';
      showNotification(`Error al cargar usuarios: ${errorMessage}. Si eres administrador, verifica que tu sesión esté activa.`, 'error');
      setUsuarios([]);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleEliminarUsuarioClick = (usuarioId, usuarioNombre) => {
    setUsuarioAEliminar({ id: usuarioId, nombre: usuarioNombre });
    setShowConfirmEliminar(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!usuarioAEliminar) return;

    const { id, nombre } = usuarioAEliminar;
    setEliminandoUsuarioId(id);
    setShowConfirmEliminar(false);
    
    try {
      await eliminarUsuario(id);
      showNotification(`Usuario "${nombre || 'eliminado'}" eliminado exitosamente.`, 'success');
      
      // Recargar la lista de usuarios
      fetchUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      showNotification(error.message || 'Error al eliminar el usuario. Intenta nuevamente.', 'error');
    } finally {
      setEliminandoUsuarioId(null);
      setUsuarioAEliminar(null);
    }
  };

  const handleCancelarEliminar = () => {
    setShowConfirmEliminar(false);
    setUsuarioAEliminar(null);
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
        isOpen={showConfirmEliminar}
        onClose={handleCancelarEliminar}
        onConfirm={handleConfirmarEliminar}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar al usuario "${usuarioAEliminar?.nombre || 'este usuario'}"?\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        isLoading={eliminandoUsuarioId !== null}
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
              className={`tab-button ${activeTab === 'confirmadas' ? 'active' : ''}`}
              onClick={() => setActiveTab('confirmadas')}
            >
              <FaCheckCircle />
              <span>Reservas Confirmadas</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'reservas' ? 'active' : ''}`}
              onClick={() => setActiveTab('reservas')}
            >
              <FaCalendarAlt />
              <span>Todas las Reservas</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'canceladas' ? 'active' : ''}`}
              onClick={() => setActiveTab('canceladas')}
            >
              <FaTimes />
              <span>Canceladas/Rechazadas</span>
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
            {(() => {
              // Calcular estadísticas usando los estados actualizados
              // Usar reservasConfirmadas y reservasCanceladas que se mantienen actualizados
              const pendientes = reservas.filter(r => {
                const estado = obtenerEstadoReserva(r);
                return estado && estado === 'pendiente';
              }).length;
              const confirmadas = reservasConfirmadas.length; // Usar el estado que se mantiene actualizado
              const canceladasRechazadas = reservasCanceladas.length; // Usar el estado que se mantiene actualizado
              const totalReservas = reservas.length;

              return (
                <>
                  <div className="stat-card">
                    <FaCalendarAlt className="stat-icon" />
                    <div className="stat-info">
                      <h3>{pendientes}</h3>
                      <p>Reservas Pendientes</p>
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
                    <FaTimes className="stat-icon" />
                    <div className="stat-info">
                      <h3>{canceladasRechazadas}</h3>
                      <p>Canceladas/Rechazadas</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <FaUsers className="stat-icon" />
                    <div className="stat-info">
                      <h3>{totalReservas}</h3>
                      <p>Total Reservas</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </section>

          {/* Sección de Reservas Pendientes */}
          {activeTab === 'pendientes' && (
            <ReservasPendientes 
              onReservaActualizada={() => {
                // Recargar todas las reservas para actualizar estadísticas
                fetchReservas();
                // Recargar reservas confirmadas cuando se acepta una reserva
                fetchReservasConfirmadas();
                // Si estamos viendo canceladas, recargarlas también
                if (activeTab === 'canceladas') {
                  fetchReservasCanceladas();
                }
              }}
            />
          )}

          {/* Sección de Reservas Confirmadas */}
          {activeTab === 'confirmadas' && (
            <section className="reservas-section">
              <div className="section-header">
                <h2>Reservas Confirmadas</h2>
                <span className="badge-count">{reservasConfirmadas.length}</span>
              </div>

              {loadingConfirmadas ? (
                <div className="loading">Cargando reservas confirmadas...</div>
              ) : reservasConfirmadas.length === 0 ? (
                <div className="empty-state">
                  <FaCheckCircle className="empty-icon" />
                  <p>No hay reservas confirmadas</p>
                  <p className="empty-note">Las reservas aceptadas aparecerán aquí</p>
                </div>
              ) : (
                <div className="reservas-grid">
                  {reservasConfirmadas.map((reserva) => {
                    const fecha = formatearFecha(reserva.fecha);
                    const horaInicio = formatearHora(reserva.hora_inicio);
                    const horaFin = formatearHora(reserva.hora_fin);
                    const canchaNombre = obtenerNombreCancha(reserva);
                    const usuarioNombre = obtenerNombreUsuario(reserva);
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
                            <span className="detail-label">Usuario:</span>
                            <span className="detail-value">{usuarioNombre}</span>
                          </div>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
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
                  {reservas.map((reserva) => {
                    const fecha = formatearFecha(reserva.fecha);
                    const horaInicio = formatearHora(reserva.hora_inicio);
                    const horaFin = formatearHora(reserva.hora_fin);
                    const canchaNombre = obtenerNombreCancha(reserva);
                    const usuarioNombre = obtenerNombreUsuario(reserva);
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
                            <span className="detail-label">Usuario:</span>
                            <span className="detail-value">{usuarioNombre}</span>
                          </div>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Sección de Reservas Canceladas/Rechazadas */}
          {activeTab === 'canceladas' && (
            <section className="reservas-section">
              <div className="section-header">
                <h2>Reservas Canceladas/Rechazadas</h2>
                <span className="badge-count">{reservasCanceladas.length}</span>
              </div>

              {loadingCanceladas ? (
                <div className="loading">Cargando reservas canceladas y rechazadas...</div>
              ) : reservasCanceladas.length === 0 ? (
                <div className="empty-state">
                  <FaTimes className="empty-icon" />
                  <p>No hay reservas canceladas o rechazadas</p>
                  <p className="empty-note">Las reservas canceladas y rechazadas aparecerán aquí</p>
                </div>
              ) : (
                <div className="reservas-grid">
                  {reservasCanceladas.map((reserva) => {
                    const fecha = formatearFecha(reserva.fecha);
                    const horaInicio = formatearHora(reserva.hora_inicio);
                    const horaFin = formatearHora(reserva.hora_fin);
                    const canchaNombre = obtenerNombreCancha(reserva);
                    const usuarioNombre = obtenerNombreUsuario(reserva);
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
                            <span className="detail-label">Usuario:</span>
                            <span className="detail-value">{usuarioNombre}</span>
                          </div>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Sección de Usuarios */}
          {activeTab === 'usuarios' && (
            <section className="usuarios-section">
              <div className="section-header">
                <h2>Gestión de Usuarios</h2>
                <span className="badge-count">{usuarios.length}</span>
              </div>

              {loadingUsuarios ? (
                <div className="loading">Cargando usuarios...</div>
              ) : usuarios.length === 0 ? (
                <div className="empty-state">
                  <FaUsers className="empty-icon" />
                  <p>No hay usuarios registrados</p>
                  <p className="empty-note">Los usuarios registrados aparecerán aquí</p>
                </div>
              ) : (
                <div className="reservas-grid">
                  {usuarios.map((usuario) => (
                    <div key={usuario.id_usuario || usuario.id} className="reserva-card">
                      <div className="reserva-header">
                        <h3>{usuario.nombre || usuario.name || 'Sin nombre'}</h3>
                        <span className={`estado-badge ${usuario.rol === 'admin' || usuario.role === 'admin' ? 'admin' : 'user'}`}>
                          {usuario.rol === 'admin' || usuario.role === 'admin' ? 'Admin' : 'Usuario'}
                        </span>
                      </div>
                      <div className="reserva-details">
                        <div className="detail-item">
                          <span className="detail-label">Correo:</span>
                          <span className="detail-value">{usuario.correo || usuario.email || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Teléfono:</span>
                          <span className="detail-value">{usuario.telefono || usuario.phone || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">ID:</span>
                          <span className="detail-value">{usuario.id_usuario || usuario.id || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="reserva-actions">
                        <button
                          className="action-button delete"
                          onClick={() => handleEliminarUsuarioClick(
                            usuario.id_usuario || usuario.id,
                            usuario.nombre || usuario.name
                          )}
                          disabled={eliminandoUsuarioId === (usuario.id_usuario || usuario.id)}
                          title="Eliminar usuario"
                        >
                          <FaTrash />
                          <span>
                            {eliminandoUsuarioId === (usuario.id_usuario || usuario.id) 
                              ? 'Eliminando...' 
                              : 'Eliminar'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
    </>
  );
}

export default AdminDashboard;

