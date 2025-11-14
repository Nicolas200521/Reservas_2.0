import { useState, useEffect } from 'react';
import { PiSoccerBallFill } from "react-icons/pi";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaCreditCard, FaLock, FaShieldAlt, FaUser, FaMoneyBillWave, FaWallet, FaUniversity } from "react-icons/fa";
import { obtenerCanchas } from '../services/canchasService';
import { crearReserva, calcularHoraFin } from '../services/reservasService';
import { crearPago } from '../services/pagosService';
import { useNotification } from '../hooks/useNotification';
import Notification from './Notification';
import './CanchasDisponibles.css';

// Métodos de pago disponibles
const METODOS_PAGO = [
  { id_metodo_pago: 1, metodo_pago: 'Efectivo' },
  { id_metodo_pago: 2, metodo_pago: 'Tarjeta de Crédito' },
  { id_metodo_pago: 3, metodo_pago: 'Tarjeta de Débito' },
  { id_metodo_pago: 4, metodo_pago: 'Transferencia Bancaria' },
  { id_metodo_pago: 5, metodo_pago: 'Nequi' },
  { id_metodo_pago: 6, metodo_pago: 'Daviplata' }
];

function CanchasDisponibles({ user, onReservaCreada }) {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    duracion: 90,
    metodoPago: null // Método de pago seleccionado en el formulario de reserva
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [reservaCreada, setReservaCreada] = useState(null);
  const [montoPago, setMontoPago] = useState(0);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]?.id_metodo_pago || null); // ID del método de pago seleccionado
  const metodosPago = METODOS_PAGO; // Lista de métodos de pago
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: '',
    expiracion: '',
    cvv: '',
    titular: ''
  });
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    fetchCanchas();
  }, []);

  // Debug: verificar estado del modal de pago
  useEffect(() => {
    if (showPagoModal) {
      console.log('🔍 Estado del modal de pago:', {
        showPagoModal,
        reservaCreada,
        id_reserva: reservaCreada?.id_reserva,
        montoPago
      });
    }
  }, [showPagoModal, reservaCreada, montoPago]);

  const fetchCanchas = async () => {
    setLoading(true);
    try {
      const canchasData = await obtenerCanchas();
      // Mapear los datos del backend al formato esperado por el componente
      const canchasFormateadas = canchasData.map(cancha => ({
        id: cancha.id_cancha,
        nombre: cancha.nombre,
        tipo: cancha.tipo_cesped || 'Sintético',
        precio: cancha.precio_hora || 0,
        disponible: cancha.estado === 'activa'
      }));
      setCanchas(canchasFormateadas);
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
      duracion: 90,
      metodoPago: METODOS_PAGO[0]?.id_metodo_pago || null
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
      // Calcular hora de fin basada en la duración
      const horaFin = calcularHoraFin(formData.hora, formData.duracion);
      
      // Calcular monto del pago
      const monto = (canchaSeleccionada.precio || 0) * (formData.duracion / 60);
      
      // Crear la reserva usando el servicio
      const response = await crearReserva({
        id_cancha: canchaSeleccionada.id,
        fecha: formData.fecha,
        hora_inicio: formData.hora,
        hora_fin: horaFin
      });

      // Obtener el ID de la reserva creada
      const reservaData = response.reserva || response;
      const idReserva = reservaData.id_reserva || reservaData.id || reservaData.id_reserva;


      // Validar que tenemos el ID de la reserva antes de continuar
      if (!idReserva) {
        console.error('❌ Error: No se pudo obtener el ID de la reserva');
        throw new Error('No se pudo obtener el ID de la reserva creada');
      }

      // Guardar información de la reserva y monto para el pago
      const reservaInfo = {
        id_reserva: idReserva,
        ...reservaData
      };
      setReservaCreada(reservaInfo);
      setMontoPago(monto);
      
      // Usar el método de pago seleccionado en el formulario
      const metodoPagoSeleccionado = formData.metodoPago || METODOS_PAGO[0]?.id_metodo_pago;
      if (metodoPagoSeleccionado) {
        setMetodoPago(metodoPagoSeleccionado);
      }

      // Crear el pago automáticamente después de crear la reserva
      try {
        await crearPago({
          id_reserva: idReserva,
          monto: monto,
          id_metodo_pago: metodoPagoSeleccionado,
          id_estado_pago: 1  // Estado pendiente
        });
        
      } catch (errorPago) {
        console.error('⚠️ Error al crear el pago automáticamente:', errorPago);
        // No bloqueamos el flujo si falla la creación del pago
        // El usuario podrá crear el pago manualmente después
        showNotification('Reserva creada, pero hubo un problema al crear el pago. Podrás completarlo después.', 'warning');
      }

      // Cerrar modal de reserva primero
      setShowModal(false);
      setCanchaSeleccionada(null);
      
      // Usar setTimeout para asegurar que el estado se actualice antes de abrir el modal de pago
      setTimeout(() => {
        setShowPagoModal(true);
      }, 150);
      
      // Mostrar notificación de éxito
      showNotification('¡Reserva y pago creados exitosamente! Revisa los detalles del pago.', 'success');
      
      // Notificar al componente padre
      if (onReservaCreada) {
        onReservaCreada(reservaData);
      }
    } catch (err) {
      const errorMessage = err.message || 'Error al crear la reserva. Intenta nuevamente.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcesarPago = async () => {
    if (!reservaCreada || !reservaCreada.id_reserva) {
      showNotification('Error: No se encontró la información de la reserva', 'error');
      return;
    }

    // Validar datos de tarjeta si el método requiere tarjeta
    const metodoSeleccionado = metodosPago.find(m => 
      (m.id_metodo_pago || m.id) === metodoPago
    );
    
    if (metodoSeleccionado) {
      const nombreMetodo = (metodoSeleccionado.metodo_pago || metodoSeleccionado.nombre_metodo || '').toLowerCase();
      const requiereTarjeta = nombreMetodo.includes('tarjeta') || nombreMetodo.includes('crédito') || nombreMetodo.includes('credito') || nombreMetodo.includes('débito') || nombreMetodo.includes('debito');
      
      if (requiereTarjeta) {
        if (!datosTarjeta.numero || !datosTarjeta.expiracion || !datosTarjeta.cvv || !datosTarjeta.titular) {
          showNotification('Por favor completa todos los datos de la tarjeta', 'error');
          return;
        }
      }
    }

    setProcesandoPago(true);
    try {
      // El pago ya fue creado automáticamente al crear la reserva
      // Aquí solo confirmamos que el proceso se completó
      // El modal de pago se muestra para que el usuario vea los detalles
      
      // Cerrar modal de pago
      setShowPagoModal(false);
      setReservaCreada(null);
      setMontoPago(0);
      setDatosTarjeta({ numero: '', expiracion: '', cvv: '', titular: '' });
      // Restablecer al primer método de pago disponible
      setMetodoPago(METODOS_PAGO[0]?.id_metodo_pago || null);
      
      // Mostrar notificación de éxito
      showNotification('¡Pago confirmado exitosamente! Tu pago está pendiente de confirmación.', 'success');
    } catch (err) {
      const errorMessage = err.message || 'Error al procesar el pago. Intenta nuevamente.';
      showNotification(errorMessage, 'error');
    } finally {
      setProcesandoPago(false);
    }
  };

  const formatearNumeroTarjeta = (valor) => {
    // Eliminar espacios y caracteres no numéricos
    const numero = valor.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Agregar espacios cada 4 dígitos
    const grupos = numero.match(/.{1,4}/g);
    return grupos ? grupos.join(' ') : numero;
  };

  const formatearExpiracion = (valor) => {
    const numero = valor.replace(/\D/g, '');
    if (numero.length >= 2) {
      return numero.slice(0, 2) + '/' + numero.slice(2, 4);
    }
    return numero;
  };

  const handleCerrarPagoModal = () => {
    setShowPagoModal(false);
    setReservaCreada(null);
    setMontoPago(0);
    setDatosTarjeta({ numero: '', expiracion: '', cvv: '', titular: '' });
    // Restablecer al primer método de pago disponible
    setMetodoPago(METODOS_PAGO[0]?.id_metodo_pago || null);
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
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={hideNotification}
        />
      )}
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
      {showModal && canchaSeleccionada && !showPagoModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 1000 }}>
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

              {/* Selección de método de pago */}
              <div className="metodo-pago-reserva">
                <label className="selector-label">
                  <FaCreditCard className="label-icon" />
                  Método de Pago
                </label>
                {metodosPago.length > 0 ? (
                  <>
                    <div className="metodos-pago-reserva">
                      {metodosPago.map((metodo) => {
                        const metodoId = metodo.id_metodo_pago || metodo.id;
                        return (
                          <button
                            key={metodoId}
                            type="button"
                            className={`metodo-pago-btn-reserva ${formData.metodoPago === metodoId ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, metodoPago: metodoId })}
                            disabled={submitting}
                          >
                            <FaCreditCard />
                            <span>{metodo.nombre_metodo || metodo.metodo_pago || 'Método de Pago'}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="metodo-pago-note">
                      Podrás completar los datos de pago después de confirmar la reserva
                    </p>
                  </>
                ) : (
                  <p className="error-message">No hay métodos de pago disponibles</p>
                )}
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

      {/* Modal de Pasarela de Pago Simulada */}
      {showPagoModal && reservaCreada && reservaCreada.id_reserva && (
        <div className="modal-overlay" onClick={handleCerrarPagoModal} style={{ zIndex: 2000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Procesar Pago</h2>
              <button className="modal-close" onClick={handleCerrarPagoModal}>×</button>
            </div>

            <div className="pago-content">
              {/* Resumen de la reserva */}
              <div className="pago-resumen">
                <h3 className="resumen-title">Resumen de tu Reserva</h3>
                <div className="pago-info">
                  <div className="info-item">
                    <span className="info-label">Reserva ID:</span>
                    <span className="info-value">#{reservaCreada.id_reserva}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Monto a pagar:</span>
                    <span className="info-value monto">
                      ${montoPago.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pasarela de pago */}
              <div className="pago-simulado">
                <div className="pago-header">
                  <div className="pago-logo">
                    <FaCreditCard className="pago-icon" />
                    <div>
                      <h3>Pasarela de Pago Segura</h3>
                      <p className="pago-subtitle">
                        <FaLock className="lock-icon" />
                        Transacción segura y encriptada
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selección de método de pago */}
                <div className="metodo-pago-selector">
                  <label className="selector-label">Método de Pago</label>
                  {metodosPago.length > 0 ? (
                    <div className="metodos-pago">
                      {metodosPago.map((metodo) => {
                        const metodoId = metodo.id_metodo_pago || metodo.id;
                        return (
                          <button
                            key={metodoId}
                            type="button"
                            className={`metodo-pago-btn ${metodoPago === metodoId ? 'active' : ''}`}
                            onClick={() => setMetodoPago(metodoId)}
                            disabled={procesandoPago}
                          >
                            <FaCreditCard />
                            <span>{metodo.nombre_metodo || metodo.metodo_pago || 'Método de Pago'}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="error-message">No hay métodos de pago disponibles</p>
                  )}
                </div>

                {/* Formulario de tarjeta */}
                {metodoPago && (() => {
                  const metodoSeleccionado = metodosPago.find(m => 
                    (m.id_metodo_pago || m.id) === metodoPago
                  );
                  // Mostrar formulario de tarjeta si el método requiere tarjeta (por defecto true)
                  return metodoSeleccionado && metodoSeleccionado.requiere_tarjeta !== false;
                })() && (
                  <div className="pago-form">
                    <div className="form-group">
                      <label htmlFor="numero-tarjeta">
                        <FaCreditCard className="label-icon-small" />
                        Número de Tarjeta
                      </label>
                      <input
                        id="numero-tarjeta"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        value={datosTarjeta.numero}
                        onChange={(e) => setDatosTarjeta({ ...datosTarjeta, numero: formatearNumeroTarjeta(e.target.value) })}
                        disabled={procesandoPago}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="expiracion">
                          <FaCalendarAlt className="label-icon-small" />
                          Fecha de Expiración
                        </label>
                        <input
                          id="expiracion"
                          type="text"
                          placeholder="MM/AA"
                          maxLength="5"
                          value={datosTarjeta.expiracion}
                          onChange={(e) => setDatosTarjeta({ ...datosTarjeta, expiracion: formatearExpiracion(e.target.value) })}
                          disabled={procesandoPago}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="cvv">
                          <FaShieldAlt className="label-icon-small" />
                          CVV
                        </label>
                        <input
                          id="cvv"
                          type="text"
                          placeholder="123"
                          maxLength="3"
                          value={datosTarjeta.cvv}
                          onChange={(e) => setDatosTarjeta({ ...datosTarjeta, cvv: e.target.value.replace(/\D/g, '') })}
                          disabled={procesandoPago}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="titular">
                        <FaUser className="label-icon-small" />
                        Nombre del Titular
                      </label>
                      <input
                        id="titular"
                        type="text"
                        placeholder="Nombre completo como aparece en la tarjeta"
                        value={datosTarjeta.titular}
                        onChange={(e) => setDatosTarjeta({ ...datosTarjeta, titular: e.target.value })}
                        disabled={procesandoPago}
                      />
                    </div>
                  </div>
                )}

                {/* Información de seguridad */}
                <div className="pago-seguridad">
                  <FaShieldAlt className="seguridad-icon" />
                  <span>Tu información está protegida con encriptación SSL</span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCerrarPagoModal}
                  disabled={procesandoPago}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="confirm-button"
                  onClick={handleProcesarPago}
                  disabled={procesandoPago}
                >
                  {procesandoPago ? 'Procesando...' : 'Pagar Ahora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CanchasDisponibles;

