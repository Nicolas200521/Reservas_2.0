import { useState } from 'react';
import { PiSoccerBallFill } from "react-icons/pi";
import { FaEnvelope, FaLock, FaUser, FaArrowLeft, FaPhone } from "react-icons/fa";
import './Auth.css';
import { API_ENDPOINTS } from '../config/api';
import { saveToken, saveUser, getToken } from '../services/authService';

// Función auxiliar para leer cookies
const getCookieValue = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

function Register({ onBackToLogin, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.name || !formData.email || !formData.telefono || !formData.password || !formData.confirmPassword) {
      setError('Todos los campos son requeridos');
      setLoading(false);
      return;
    }

    // Validar formato de teléfono (solo números, mínimo 7 dígitos)
    const telefonoRegex = /^[0-9]{7,15}$/;
    const telefonoLimpio = formData.telefono.replace(/\s|-/g, '');
    if (!telefonoRegex.test(telefonoLimpio)) {
      setError('El teléfono debe contener entre 7 y 15 dígitos');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // No usar credentials: 'include' si el backend usa CORS con wildcard (*)
        mode: 'cors',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          telefono: formData.telefono.replace(/\s|-/g, ''),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      setSuccess('¡Registro exitoso! Redirigiendo...');
      
      // Guardar token y usuario si vienen en la respuesta
      // El token puede venir en el JSON o en una cookie
      let token = data.token || data.accessToken || data.access_token || data.jwt;
      
      // Si no viene en el JSON, intentar leerlo de las cookies
      if (!token) {
        const cookieToken = getCookieValue('token') || 
                           getCookieValue('auth_token') || 
                           getCookieValue('jwt') || 
                           getCookieValue('access_token');
        if (cookieToken) {
          token = cookieToken;
        }
      }
      
      // Intentar guardar el token en localStorage (si viene en JSON)
      if (token && (data.token || data.accessToken || data.access_token || data.jwt)) {
        saveToken(token);
      }
      
      // Verificar que el token está disponible
      if (token) {
        const savedToken = getToken();
        if (!savedToken) {
          // Si no se pudo obtener el token, puede ser que venga en cookie HTTP-only
          // En ese caso, el backend lo manejará automáticamente
        }
      }

      // El usuario puede venir como: user, usuario, data
      const userData = data.user || data.usuario || data.data;
      
      if (userData) {
        saveUser(userData);
      }
      
      setTimeout(() => {
        if (onRegisterSuccess && userData) {
          onRegisterSuccess(userData);
        } else {
          onBackToLogin();
        }
      }, 2000);

    } catch (err) {
      setError(err.message || 'Error al registrar. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button onClick={onBackToLogin} className="back-button">
          <FaArrowLeft />
          <span>Volver al Login</span>
        </button>

        <div className="auth-header">
          <div className="ball-icon">
            <PiSoccerBallFill />
          </div>
          <h1>Crear Cuenta</h1>
          <p>Regístrate para reservar canchas</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">
              <span className="icon"><FaUser /></span>
              Nombre Completo
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Tu nombre completo"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <span className="icon"><FaEnvelope /></span>
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@correo.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">
              <span className="icon"><FaPhone /></span>
              Teléfono
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="1234567890"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <span className="icon"><FaLock /></span>
              Contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <span className="icon"><FaLock /></span>
              Confirmar Contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
            {!loading && <span className="button-icon">→</span>}
          </button>

          <div className="auth-footer">
            <p>
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={onBackToLogin} className="link-button">
                Inicia sesión
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;

