import { useState, useEffect } from 'react'
import './App.css'
import { PiSoccerBallFill } from "react-icons/pi";
import { FaEnvelope, FaLock } from "react-icons/fa";
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import { API_ENDPOINTS, isApiUrlConfigured } from './config/api';
import { saveToken, saveUser, getToken, getUser, removeToken, isTokenExpired } from './services/authService';

// Función auxiliar para leer cookies
const getCookieValue = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

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

    // Verificar que la URL de la API esté configurada
    if (!isApiUrlConfigured()) {
      setError('Error de configuración: VITE_API_URL no está configurada.\n\nCrea un archivo .env en la raíz del proyecto con:\n\nVITE_API_URL=http://localhost:3000\n\n(Reemplaza con la URL de tu servidor)');
      setLoading(false);
      return;
    }

    try {
      // Mostrar información de depuración
      const loginUrl = API_ENDPOINTS.AUTH.LOGIN;
      
      let response;
      try {
        response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          // No usar credentials: 'include' si el backend usa CORS con wildcard (*)
          // Solo usar si el backend está configurado con origen específico y credentials: true
          mode: 'cors',
          body: JSON.stringify({ email, password }),
        });
      } catch (fetchError) {
        // Capturar errores de red (Failed to fetch, CORS, etc.)
        let errorMessage = 'No se pudo conectar al servidor.\n\n';
        
        if (fetchError.message === 'Failed to fetch' || fetchError.name === 'TypeError') {
          errorMessage += 'Posibles causas:\n';
          errorMessage += '1. El servidor no está corriendo\n';
          errorMessage += '2. La URL está incorrecta\n';
          errorMessage += `   URL intentada: ${loginUrl}\n`;
          errorMessage += '3. CORS no está configurado en el backend\n';
          errorMessage += '4. Problema de red o firewall\n\n';
          errorMessage += 'Verifica en la consola del navegador (F12) para más detalles.';
        } else {
          errorMessage = fetchError.message || 'Error desconocido al conectar con el servidor';
        }
        
        throw new Error(errorMessage);
      }

      // Verificar si la respuesta es JSON válido
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'Error al iniciar sesión: respuesta inválida del servidor');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Error al iniciar sesión');
      }

      // Login exitoso - Guardar token y usuario
      // El token puede venir en el JSON o en una cookie
      let token = data.token || data.accessToken || data.access_token || data.jwt;
      
      // Si no viene en el JSON, intentar leerlo de las cookies
      if (!token) {
        // Intentar leer de cookies (puede venir como: token, auth_token, jwt, access_token)
        const cookieToken = getCookieValue('token') || 
                           getCookieValue('auth_token') || 
                           getCookieValue('jwt') || 
                           getCookieValue('access_token');
        if (cookieToken) {
          token = cookieToken;
        }
      }
      
      if (!token) {
        // Si no hay token, mostrar error con información de depuración
        throw new Error('No se recibió token de autenticación del servidor. Verifica la respuesta del backend.');
      }

      // Intentar guardar el token en localStorage (si viene en JSON)
      // Si viene en cookie HTTP-only, no se puede guardar pero getToken() lo leerá de la cookie
      if (data.token || data.accessToken || data.access_token || data.jwt) {
        const tokenSaved = saveToken(token);
        if (!tokenSaved) {
          throw new Error('Error al guardar el token de autenticación. Verifica el formato del token.');
        }
      }
      
      // Verificar que el token está disponible (de localStorage o cookie)
      const savedToken = getToken();
      if (!savedToken) {
        throw new Error('Error al verificar el token. Intenta nuevamente.');
      }

      // El usuario puede venir como: user, usuario, data, usuario_data
      const userData = data.user || data.usuario || data.data || data.usuario_data;
      
      if (userData) {
        saveUser(userData);
        setUser(userData);
      } else {
        // Si no hay datos de usuario, crear un objeto mínimo con el email
        const minimalUser = {
          email: email,
          name: email.split('@')[0],
        };
        saveUser(minimalUser);
        setUser(minimalUser);
      }

      setIsAuthenticated(true);
      // Limpiar formulario
      setEmail('');
      setPassword('');
    } catch (err) {
      // Mostrar mensaje de error más descriptivo
      let errorMessage = err.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      
      // Si es un error de red, mostrar información adicional
      if (err.message.includes('Failed to fetch') || err.message.includes('No se pudo conectar')) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
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
            <div className="error-message" style={{ whiteSpace: 'pre-line' }}>
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
