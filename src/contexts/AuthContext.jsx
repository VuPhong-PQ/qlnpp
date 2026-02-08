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
  const [categoryPermissions, setCategoryPermissions] = useState([]); // Array of allowed category IDs
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        const storedPermissions = localStorage.getItem('permissions');
        const storedCategoryPermissions = localStorage.getItem('categoryPermissions');

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setPermissions(storedPermissions ? JSON.parse(storedPermissions) : []);
          setCategoryPermissions(storedCategoryPermissions ? JSON.parse(storedCategoryPermissions) : []);
          setIsAuthenticated(true);
          
          // Reload category permissions from server to ensure fresh data
          if (parsedUser?.id) {
            await loadCategoryPermissions(parsedUser.id);
          }
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

        // Load category permissions after successful login
        if (data.user?.id) {
          await loadCategoryPermissions(data.user.id);
        }

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
    setCategoryPermissions([]);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('categoryPermissions');
    localStorage.removeItem('permissions');
    localStorage.removeItem('rememberMe');
  };

  const hasPermission = (resourceKey, action) => {
    const isSuperAdmin = () => {
      const name = (user?.username || user?.name || user?.role || '').toString().toLowerCase();
      return name === 'superadmin' || user?.isSuperAdmin === true;
    };

    if (isSuperAdmin()) return true;

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

  // Load category permissions for a user
  const loadCategoryPermissions = async (userId) => {
    if (!userId) return;
    
    try {
      // Check if user is superadmin or admin - they have access to all categories
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const name = (parsedUser?.username || parsedUser?.name || '').toString().toLowerCase();
        if (name === 'superadmin' || name === 'admin') {
          // SuperAdmin/Admin has all category permissions - store empty array to indicate "all"
          setCategoryPermissions([]);
          localStorage.setItem('categoryPermissions', JSON.stringify([]));
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/productcategorypermissions/user/${userId}`);
      if (response.ok) {
        const perms = await response.json();
        // Extract allowed category IDs where canView is true
        const allowedIds = (perms || [])
          .filter(p => p.canView || p.CanView)
          .map(p => p.productCategoryId || p.ProductCategoryId || (p.productCategory && p.productCategory.id));
        
        setCategoryPermissions(allowedIds);
        localStorage.setItem('categoryPermissions', JSON.stringify(allowedIds));
      }
    } catch (error) {
      console.error('Error loading category permissions:', error);
    }
  };

  // Check if user can view a specific category
  // categoryId can be a number ID or a category code string
  const canViewCategory = (categoryId) => {
    // SuperAdmin/Admin can view all categories
    const name = (user?.username || user?.name || user?.role || '').toString().toLowerCase();
    if (name === 'superadmin' || name === 'admin' || user?.isSuperAdmin === true) {
      return true;
    }

    // If no category permissions are set (empty array from admin), allow all
    // If user has specific permissions, check against the list
    if (categoryPermissions.length === 0) {
      // Empty means either admin (all access) or no permissions set
      // Check if user is admin by looking at permissions array
      const hasAdminAccess = permissions.includes('admin:full-access') || 
                            permissions.some(p => p.startsWith('manage_data:'));
      return hasAdminAccess;
    }

    // Check if categoryId is in the allowed list
    // Handle both numeric IDs and string category codes
    const numericId = parseInt(categoryId);
    if (!isNaN(numericId)) {
      return categoryPermissions.includes(numericId);
    }
    
    // If categoryId is a string (category code), we need category data to resolve
    // For now, default to checking if string matches any allowed ID
    return categoryPermissions.some(id => String(id) === String(categoryId));
  };

  // Filter products by allowed categories
  const filterProductsByCategory = (products) => {
    // SuperAdmin/Admin can view all products
    const name = (user?.username || user?.name || user?.role || '').toString().toLowerCase();
    if (name === 'superadmin' || name === 'admin' || user?.isSuperAdmin === true) {
      return products;
    }

    // If no specific category permissions (admin access), return all
    if (categoryPermissions.length === 0) {
      const hasAdminAccess = permissions.includes('admin:full-access') || 
                            permissions.some(p => p.startsWith('manage_data:'));
      if (hasAdminAccess) return products;
      // No permissions at all - return empty
      return [];
    }

    // Filter products by allowed category IDs or codes
    return products.filter(product => {
      const productCategoryId = product.categoryId || product.productCategoryId || product.CategoryId;
      const productCategoryCode = product.category || product.Category || product.categoryCode;
      
      // Check numeric ID first
      if (productCategoryId && categoryPermissions.includes(parseInt(productCategoryId))) {
        return true;
      }
      
      // Check category code against allowed IDs - need to match somehow
      // This will require categories to be loaded for code-to-id mapping
      return categoryPermissions.some(id => String(id) === String(productCategoryCode));
    });
  };

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
    categoryPermissions,
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
    canViewCategory,
    filterProductsByCategory,
    loadCategoryPermissions,
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
