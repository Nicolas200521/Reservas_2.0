import { useState } from 'react'
import './App.css'
import { PiSoccerBallFill } from "react-icons/pi";
import { FaEnvelope, FaLock } from "react-icons/fa";

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login:', { email, password })
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="field-lines"></div>
        <div className="field-circle"></div>
        <div className="field-penalty-left"></div>
        <div className="field-penalty-right"></div>
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="ball-icon">
            <PiSoccerBallFill />
          </div>
          <h1>Reservas de Canchas</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
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
                placeholder="••••••••"
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
            <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" className="login-button">
            Iniciar Sesión
            <span className="button-icon">→</span>
          </button>

          <div className="divider">
            <span>o</span>
          </div>

          <button type="button" className="register-button">
            ¿No tienes cuenta? <strong>Regístrate</strong>
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
