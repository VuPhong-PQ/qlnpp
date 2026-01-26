import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredPermission, requiredAction = 'view' }) {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading while checking auth status
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e1e5eb',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>
          {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
        <p style={{ color: '#6c757d' }}>Đang tải...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission, requiredAction)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 60px)',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: '#fff5f5',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px'
        }}>
          🚫
        </div>
        <h2 style={{ margin: 0, color: '#c53030' }}>Không có quyền truy cập</h2>
        <p style={{ color: '#6c757d', textAlign: 'center', maxWidth: '400px' }}>
          Bạn không có quyền truy cập chức năng này. 
          Vui lòng liên hệ quản trị viên để được cấp quyền.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '12px 24px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Quay lại
        </button>
      </div>
    );
  }

  return children;
}
