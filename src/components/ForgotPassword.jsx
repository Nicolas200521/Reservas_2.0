import { useState } from 'react';
import { PiSoccerBallFill } from "react-icons/pi";
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import './Auth.css';

function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!email) {
      setError('El correo electrónico es requerido');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-container">
            <FaCheckCircle className="success-icon" />
            <h1>¡Solicitud Enviada!</h1>
            <p>
              Si el correo <strong>{email}</strong> está registrado, 
              recibirás un enlace para restablecer tu contraseña.
            </p>
            <p className="note">
              <small>
                Nota: Este es un ejemplo educativo. En producción se enviaría un email real.
              </small>
            </p>
            <button onClick={onBackToLogin} className="auth-button">
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1>Recuperar Contraseña</h1>
          <p>Ingresa tu correo para recuperar tu contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <span className="icon"><FaEnvelope /></span>
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            {!loading && <span className="button-icon">→</span>}
          </button>

          <div className="auth-footer">
            <p>
              ¿Recordaste tu contraseña?{' '}
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

export default ForgotPassword;

