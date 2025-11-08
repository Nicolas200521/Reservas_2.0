# Reservas 2.0 - Proyecto Educativo Full-Stack

Proyecto educativo completo de sistema de reservas de canchas de fútbol con **Frontend (React)** y **Backend (Node.js/Express)**.

## 📚 Propósito Educativo

Este proyecto está diseñado para fines educativos y demuestra:
- Desarrollo Full-Stack (Frontend + Backend)
- Arquitectura REST API
- Separación de responsabilidades (rutas, controladores)
- Manejo de peticiones HTTP
- Estructura de proyecto escalable

## 🚀 Inicio Rápido

### Instalación

```bash
# Instalar todas las dependencias (frontend + backend)
npm install
```

### Ejecutar el Proyecto

#### Opción 1: Ejecutar Frontend y Backend por separado

```bash
# Terminal 1 - Frontend (React)
npm run dev
# Se abrirá en http://localhost:5173

# Terminal 2 - Backend (Express)
npm run dev:backend
# API disponible en http://localhost:3000
```

#### Opción 2: Ejecutar ambos simultáneamente

```bash
npm run dev:all
```

Esto iniciará:
- Frontend en `http://localhost:5173`
- Backend en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
Reservas_2.0/
├── backend/                    # Backend (Node.js/Express)
│   ├── controllers/            # Lógica de negocio
│   │   ├── auth.controller.js  # Controlador de autenticación
│   │   └── reservas.controller.js # Controlador de reservas
│   ├── routes/                 # Definición de rutas
│   │   ├── auth.routes.js      # Rutas de autenticación
│   │   └── reservas.routes.js  # Rutas de reservas
│   ├── server.js               # Servidor principal
│   ├── .env.example            # Ejemplo de variables de entorno
│   └── package.json            # Dependencias del backend
│
├── src/                        # Frontend (React)
│   ├── App.jsx                 # Componente principal
│   ├── App.css                 # Estilos del componente App
│   ├── main.jsx                # Punto de entrada
│   └── index.css               # Estilos globales
│
├── public/                     # Archivos estáticos
│   └── images/                 # Imágenes del proyecto
│
├── index.html                  # HTML principal
├── vite.config.js              # Configuración de Vite
└── package.json                # Dependencias del proyecto
```

## 🔌 API Endpoints

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar nuevo usuario
- `GET /api/auth/profile` - Obtener perfil del usuario

### Reservas

- `GET /api/reservas` - Obtener todas las reservas
- `GET /api/reservas/:id` - Obtener una reserva por ID
- `POST /api/reservas` - Crear una nueva reserva
- `PUT /api/reservas/:id` - Actualizar una reserva
- `DELETE /api/reservas/:id` - Eliminar una reserva

### Health Check

- `GET /api/health` - Verificar estado del servidor

## 🛠️ Tecnologías

### Frontend
- **React 18** - Biblioteca de UI
- **Vite 5** - Build tool y dev server
- **React Icons** - Iconos
- **JavaScript (ES6+)** - Lenguaje

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **CORS** - Manejo de CORS
- **dotenv** - Variables de entorno

## 📝 Notas Educativas

### ⚠️ Importante para Producción

Este proyecto es **netamente educativo**. Para un entorno de producción necesitarías:

1. **Autenticación Real**
   - Implementar JWT (JSON Web Tokens)
   - Hash de contraseñas con bcrypt
   - Middleware de autenticación

2. **Base de Datos**
   - Reemplazar arrays en memoria por base de datos real
   - MongoDB, PostgreSQL, MySQL, etc.
   - ORM/ODM (Mongoose, Sequelize, Prisma)

3. **Validación**
   - Validación de datos con Joi, Yup o express-validator
   - Sanitización de inputs

4. **Seguridad**
   - Rate limiting
   - Helmet.js para headers de seguridad
   - Validación de CORS más estricta

5. **Testing**
   - Tests unitarios (Jest, Mocha)
   - Tests de integración
   - Tests E2E

## 🧪 Probar la API

### Con cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@reservas.com","password":"admin123"}'

# Obtener reservas
curl http://localhost:3000/api/reservas
```

### Con Postman/Thunder Client

Importa las rutas y prueba los endpoints directamente desde tu cliente HTTP favorito.

## 📦 Scripts Disponibles

- `npm run dev` - Inicia solo el frontend
- `npm run dev:backend` - Inicia solo el backend
- `npm run dev:all` - Inicia frontend y backend simultáneamente
- `npm run build` - Compila el frontend para producción
- `npm run preview` - Previsualiza el build de producción

## 🎓 Conceptos Aprendidos

- Arquitectura MVC (Model-View-Controller)
- RESTful API design
- Separación Frontend/Backend
- Manejo de rutas y controladores
- Middleware en Express
- CORS y seguridad básica
- Estructura de proyecto escalable

## 📄 Licencia
