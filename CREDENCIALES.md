# 🔐 Credenciales de Acceso - Reservas 2.0

Este documento contiene las credenciales de prueba disponibles mientras no se implementa la base de datos.

## 👤 Usuarios Disponibles

### Administrador
- **Email:** `admin@reservas.com`
- **Contraseña:** `admin123`
- **Rol:** Administrador
- **Nombre:** Administrador

### Usuario Regular
- **Email:** `usuario@reservas.com`
- **Contraseña:** `usuario123`
- **Rol:** Usuario
- **Nombre:** Usuario de Prueba

### Usuario Juan
- **Email:** `juan@reservas.com`
- **Contraseña:** `juan123`
- **Rol:** Usuario
- **Nombre:** Juan Pérez

### Usuario María
- **Email:** `maria@reservas.com`
- **Contraseña:** `maria123`
- **Rol:** Usuario
- **Nombre:** María García

## 📝 Notas

- Estas credenciales son solo para **fines educativos y de prueba**
- Los datos se almacenan en memoria (arrays), por lo que se perderán al reiniciar el servidor
- Puedes crear nuevos usuarios usando el endpoint de registro: `POST /api/auth/register`
- En producción, las contraseñas deben estar hasheadas con bcrypt

## 🧪 Probar Login

### Desde el Frontend
Usa cualquiera de las credenciales anteriores en el formulario de login.

### Desde cURL o Postman

```bash
# Login con admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@reservas.com","password":"admin123"}'

# Login con usuario regular
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@reservas.com","password":"usuario123"}'
```

## 🔄 Registrar Nuevo Usuario

También puedes registrar nuevos usuarios usando:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@reservas.com",
    "password": "nuevo123",
    "name": "Nuevo Usuario"
  }'
```

**Nota:** Los usuarios registrados se perderán al reiniciar el servidor hasta que se implemente una base de datos real.

