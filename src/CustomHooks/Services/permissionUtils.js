// permissionUtils.js
import { useUserData } from '../../store/userDataStore';

const isDevelopmentMode = import.meta.env.VITE_APP_MODE === 'development';

/**
 * Checks if the user has a specific permission or if in development mode
 * Also checks parent/child permission relationships
 * 
 * @param {string} permission - The permission to check
 * @returns {boolean} - True if the user has the permission or in development mode, false otherwise
 */
export const hasPermission = (permission) => {
  if (!permission) {
    return true;
  }

  if (isDevelopmentMode) {
    return true;
  }

  const userData = useUserData();
  if (userData?.role?.roleId === 1) {
    return true;
  }

  const permissions = userData?.role?.permissions || [];
  
  // Check exact permission match
  if (permissions.includes(String(permission))) {
    return true;
  }

  // Check if any child permissions exist for the requested permission
  const permissionPrefix = permission + '.';
  const hasChildPermissions = permissions.some(p => p.startsWith(permissionPrefix));
  if (hasChildPermissions) {
    return true;
  }

  // Check if any parent permissions exist
  const permissionParts = permission.split('.');
  while (permissionParts.length > 1) {
    permissionParts.pop();
    const parentPermission = permissionParts.join('.');
    if (permissions.includes(parentPermission)) {
      return true;
    }
  }

  return false;
};
