import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        const storedPermissions = localStorage.getItem('permissions');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setPermissions(storedPermissions ? JSON.parse(storedPermissions) : []);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username, password, rememberMe = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setPermissions(data.permissions || []);
        setIsAuthenticated(true);

        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('permissions', JSON.stringify(data.permissions || []));

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Không thể kết nối đến server' };
    }
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('permissions');
    localStorage.removeItem('rememberMe');
  };

  const hasPermission = (resourceKey, action) => {
    const permKey = `${resourceKey}:${action}`;
    return permissions.includes(permKey);
  };

  const hasAnyPermission = (resourceKey, actions = ['view', 'add', 'edit', 'delete']) => {
    return actions.some(action => hasPermission(resourceKey, action));
  };

  const canView = (resourceKey) => hasPermission(resourceKey, 'view');
  const canAdd = (resourceKey) => hasPermission(resourceKey, 'add');
  const canEdit = (resourceKey) => hasPermission(resourceKey, 'edit');
  const canDelete = (resourceKey) => hasPermission(resourceKey, 'delete');
  const canPrint = (resourceKey) => hasPermission(resourceKey, 'print');
  const canImport = (resourceKey) => hasPermission(resourceKey, 'import');
  const canExport = (resourceKey) => hasPermission(resourceKey, 'export');

  const updatePermissions = (newPermissions) => {
    setPermissions(newPermissions);
    localStorage.setItem('permissions', JSON.stringify(newPermissions));
  };

  const refreshPermissions = async () => {
    if (!user?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/permissions/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const perms = await response.json();
        updatePermissions(perms);
      }
    } catch (error) {
      console.error('Error refreshing permissions:', error);
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Không thể kết nối đến server' };
    }
  };

  const value = {
    user,
    permissions,
    loading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    canView,
    canAdd,
    canEdit,
    canDelete,
    canPrint,
    canImport,
    canExport,
    updatePermissions,
    refreshPermissions,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
