# Backend - Reservas 2.0

Backend educativo desarrollado con Node.js y Express para el sistema de reservas de canchas.

## 🏗️ Arquitectura

```
backend/
├── controllers/     # Lógica de negocio y manejo de requests
├── routes/          # Definición de endpoints y rutas
└── server.js        # Configuración del servidor Express
```

## 🚀 Inicio Rápido

```bash
# Desde la raíz del proyecto
npm run dev:backend

# O desde la carpeta backend
cd backend
node server.js
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Estructura Educativa

### Controllers (Controladores)
Los controladores contienen la lógica de negocio:
- `auth.controller.js` - Maneja autenticación (login, register)
- `reservas.controller.js` - Maneja CRUD de reservas

### Routes (Rutas)
Las rutas definen los endpoints de la API:
- `auth.routes.js` - `/api/auth/*`
- `reservas.routes.js` - `/api/reservas/*`

### Server.js
Configuración principal del servidor Express:
- Middlewares (CORS, JSON parser)
- Registro de rutas
- Manejo de errores
- Inicio del servidor

## 📝 Notas

Este backend es educativo y usa arrays en memoria. En producción:
- Usar base de datos real
- Implementar autenticación JWT
- Agregar validación de datos
- Implementar seguridad avanzada

