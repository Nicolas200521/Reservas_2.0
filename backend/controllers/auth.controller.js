/**
 * Controlador de autenticación
 * Este es un ejemplo educativo - en producción usar JWT, bcrypt, etc.
 */

// Simulación de base de datos (en producción usar una BD real)
let users = [
  {
    id: 1,
    email: 'admin@reservas.com',
    password: 'admin123', // En producción: hash con bcrypt
    name: 'Administrador',
    role: 'admin'
  },
  {
    id: 2,
    email: 'usuario@reservas.com',
    password: 'usuario123',
    name: 'Usuario de Prueba',
    role: 'user'
  },
  {
    id: 3,
    email: 'juan@reservas.com',
    password: 'juan123',
    name: 'Juan Pérez',
    role: 'user'
  },
  {
    id: 4,
    email: 'maria@reservas.com',
    password: 'maria123',
    name: 'María García',
    role: 'user'
  }
];

/**
 * @desc    Iniciar sesión
 * @route   POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      });
    }

    // Buscar usuario
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // En producción: generar JWT token
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login exitoso',
      user: userWithoutPassword,
      token: 'token_simulado_para_educacion' // En producción: JWT real
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Registrar nuevo usuario
 * @route   POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validación
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, contraseña y nombre son requeridos' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ 
        error: 'El email ya está registrado' 
      });
    }

    // Crear nuevo usuario
    const newUser = {
      id: users.length + 1,
      email,
      password, // En producción: hash con bcrypt
      name,
      role: 'user'
    };

    users.push(newUser);

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Obtener perfil del usuario
 * @route   GET /api/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    // En producción: obtener del token JWT
    const userId = req.headers['user-id'] || 1;
    const user = users.find(u => u.id === parseInt(userId));

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc    Solicitar recuperación de contraseña
 * @route   POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validación
    if (!email) {
      return res.status(400).json({ 
        error: 'El email es requerido' 
      });
    }

    // Verificar si el usuario existe
    const user = users.find(u => u.email === email);

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({
        message: 'Si el email existe, se enviará un enlace de recuperación'
      });
    }

    // En producción: enviar email con token de recuperación
    // Por ahora, solo retornamos un mensaje educativo
    res.json({
      message: 'Si el email existe, se enviará un enlace de recuperación',
      // En producción: generar token y enviar email
      // token: generateResetToken(),
      note: 'Este es un ejemplo educativo. En producción se enviaría un email.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

