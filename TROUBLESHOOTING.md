# Solución de Problemas - Petición no llega al Backend

## ⚠️ Error de CORS con credentials: 'include'

Si ves este error:
```
Access-Control-Allow-Origin header must not be the wildcard '*' when the request's credentials mode is 'include'
```

**Problema**: El backend está usando `Access-Control-Allow-Origin: *` pero el frontend está usando `credentials: 'include'`, lo cual no es compatible.

**Solución**: El código ya está ajustado para NO usar `credentials: 'include'` en login/registro si el backend usa wildcard. Si necesitas usar cookies, el backend debe cambiar a un origen específico.

---

# Solución de Problemas - Petición no llega al Backend

## 🔍 Diagnóstico

Si la petición no llega al backend, sigue estos pasos:

### 1. Verificar la URL de la API

Abre la consola del navegador (F12) y verifica:
- La URL que se está intentando usar
- Si hay errores de CORS
- Si hay errores de red

### 2. Verificar que el servidor esté corriendo

```bash
# Verifica que el backend esté activo
curl http://localhost:3000/api/health
# O la URL que uses para tu servidor
```

### 3. Verificar CORS en el Backend

El backend **DEBE** tener CORS configurado para permitir:
- **Origin**: La URL de tu frontend (ej: `http://localhost:5173`)
- **Credentials**: `true` (para enviar cookies)
- **Methods**: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- **Headers**: `Content-Type, Authorization`

#### Ejemplo para Express/Node.js:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### 4. Verificar el archivo .env

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_API_URL=http://localhost:3000
```

**IMPORTANTE**: Después de crear o modificar el `.env`, **reinicia el servidor de desarrollo** de Vite:

```bash
# Detén el servidor (Ctrl+C) y vuelve a iniciarlo
npm run dev
```

### 5. Verificar en la consola del navegador

Abre las herramientas de desarrollador (F12) y ve a la pestaña **Network**:
1. Intenta hacer login
2. Busca la petición a `/api/auth/login`
3. Verifica:
   - **Status**: ¿Qué código de estado muestra?
   - **Request URL**: ¿Es la URL correcta?
   - **Request Headers**: ¿Se están enviando los headers correctos?
   - **Response**: ¿Hay algún mensaje de error?

### 6. Verificar errores de CORS

Si ves un error como:
```
Access to fetch at 'http://localhost:3000/api/auth/login' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solución**: Configura CORS en el backend para permitir tu origen.

### 7. Verificar que el endpoint existe

Asegúrate de que el backend tenga el endpoint:
- `POST /api/auth/login`

Y que acepte:
- Headers: `Content-Type: application/json`
- Body: `{ "email": "...", "password": "..." }`
- Cookies: Si usas cookies, debe aceptar `credentials: include`

## 🛠️ Soluciones Comunes

### Problema: "Failed to fetch"

**Causas posibles:**
1. El servidor no está corriendo
2. La URL está incorrecta
3. CORS no está configurado
4. Problema de red/firewall

**Solución:**
1. Verifica que el servidor esté corriendo
2. Verifica la URL en `.env`
3. Configura CORS en el backend
4. Verifica la consola del navegador para más detalles

### Problema: La petición se hace pero no llega al backend

**Causas posibles:**
1. CORS está bloqueando la petición
2. El endpoint no existe
3. El método HTTP es incorrecto

**Solución:**
1. Verifica la configuración de CORS
2. Verifica que el endpoint exista en el backend
3. Verifica que el método sea `POST` para login

## 📝 Checklist

- [ ] El servidor backend está corriendo
- [ ] El archivo `.env` existe y tiene `VITE_API_URL` configurada
- [ ] El servidor de desarrollo de Vite se reinició después de crear/modificar `.env`
- [ ] CORS está configurado en el backend
- [ ] El endpoint `/api/auth/login` existe en el backend
- [ ] La URL en `.env` coincide con la URL del servidor
- [ ] No hay errores en la consola del navegador
- [ ] La petición aparece en la pestaña Network del navegador

## 🔗 Recursos

- [Documentación de CORS](https://developer.mozilla.org/es/docs/Web/HTTP/CORS)
- [Fetch API con credentials](https://developer.mozilla.org/es/docs/Web/API/Fetch_API/Using_Fetch#sending_a_request_with_credentials_included)

