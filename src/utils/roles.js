// Utilidades para manejo de roles y permisos

/**
 * Roles disponibles en el sistema
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

/**
 * Verifica si el usuario es administrador
 * @param {object} user - Objeto usuario
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user?.role === ROLES.ADMIN;
};

/**
 * Verifica si el usuario es un usuario 
 * @param {object} user 
 * @returns {boolean}
 */
export const isUser = (user) => {
  return user?.role === ROLES.USER;
};

/**
 * Verifica si el usuario tiene un rol específico
 * @param {object} user - Objeto usuario
 * @param {string} role - Rol a verificar
 * @returns {boolean}
 */
export const hasRole = (user, role) => {
  return user?.role === role;
};

/**
 * Obtiene el rol del usuario
 * @param {object} user - Objeto usuario
 * @returns {string} - Rol del usuario o 'user' por defecto
 */
export const getUserRole = (user) => {
  return user?.role || ROLES.USER;
};

/**
 * Verifica si el usuario tiene permisos de administrador
 * @param {object} user - Objeto usuario
 * @returns {boolean}
 */
export const canManageUsers = (user) => {
  return isAdmin(user);
};

/**
 * Verifica si el usuario puede ver todas las reservas
 * @param {object} user - Objeto usuario
 * @returns {boolean}
 */
export const canViewAllReservas = (user) => {
  return isAdmin(user);
};

/**
 * @param {object} user 
 * @returns {boolean}
 */
export const canEditAnyReserva = (user) => {
  return isAdmin(user);
};

