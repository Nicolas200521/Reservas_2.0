import { useState, useEffect } from 'react'
import './App.css'
import { PiSoccerBallFill } from "react-icons/pi";
import { FaEnvelope, FaLock } from "react-icons/fa";
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import { API_ENDPOINTS } from './config/api';
import { saveToken, saveUser, getToken, getUser, removeToken, isTokenExpired } from './services/authService';

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentView, setCurrentView] = useState('login') // 'login', 'register', 'forgot-password'

  // Verificar si hay un token guardado al cargar la app
  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    
    if (token && savedUser) {
      // Verificar si el token está expirado
      if (isTokenExpired(token)) {
        removeToken();
      } else {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión')
      }

      // Login exitoso - Guardar token y usuario
      if (data.token) {
        saveToken(data.token);
      }
      if (data.user) {
        saveUser(data.user);
        setUser(data.user);
      }
      setIsAuthenticated(true)
      // Limpiar formulario
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false)
    setUser(null)
    setError('')
  }

  // Si está autenticado, mostrar el Dashboard
  if (isAuthenticated && user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  // Mostrar pantalla de registro
  if (currentView === 'register') {
    return (
      <Register 
        onBackToLogin={() => setCurrentView('login')}
        onRegisterSuccess={(userData) => {
          setUser(userData);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // Mostrar pantalla de recuperación de contraseña
  if (currentView === 'forgot-password') {
    return (
      <ForgotPassword 
        onBackToLogin={() => setCurrentView('login')}
      />
    );
  }

  // Mostrar pantalla de login (por defecto)
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="ball-icon">
            <PiSoccerBallFill />
          </div>
          <h1>Reservas de Canchas</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
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
              placeholder="Correo Electrónico"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
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

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Recordarme</span>
            </label>
            <button 
              type="button"
              onClick={() => setCurrentView('forgot-password')}
              className="forgot-password-link"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            {!loading && <span className="button-icon">→</span>}
          </button>

          <div className="divider">
            <span>o</span>
          </div>

          <button 
            type="button" 
            className="register-button"
            onClick={() => setCurrentView('register')}
          >
            ¿No tienes cuenta? <strong>Regístrate</strong>
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
