import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import ChangePassword from './components/auth/ChangePassword';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import CompanyInfo from './components/setup/CompanyInfo';
import AccountsFunds from './components/setup/AccountsFunds';
import CustomerGroups from './components/setup/CustomerGroups';
import Customers from './components/setup/Customers';
import Suppliers from './components/setup/Suppliers';
import ProductCategories from './components/setup/ProductCategories';
import Products from './components/setup/Products';
import Units from './components/setup/Units';
import TransactionContents from './components/setup/TransactionContents';
import Warehouses from './components/setup/Warehouses';
import Vehicles from './components/setup/Vehicles';
import Users from './components/permissions/Users';
import PermissionGroupsPage from './components/permissions/PermissionGroupsPage';
import UserPermissionsPage from './components/permissions/UserPermissionsPage';
import AdminPage from './components/Admin/AdminPage';
import QuotationTable from './components/business/QuotationTable';
import ImportGoods from './components/business/ImportGoods';
import ResizableTable from './components/business/ResizableTable';
import WarehouseTransfer from './components/business/WarehouseTransfer';
import ExportGoods from './components/business/ExportGoods';
import SaleManagementByCurrentUser from './components/business/sales/SaleManagementByCurrentUser';
import SaleManagement from './components/business/sales/SaleManagement';
import CreateOrderForm from './components/business/sales/CreateOrderForm';
import PrintOrder from './components/business/sales/PrintOrder';
import PrintOrderByVehicle from './components/business/sales/PrintOrderByVehicle';
import ReceiptVoucher from './components/business/accounting/ReceiptVoucher';
import ExpenseVoucher from './components/business/accounting/ExpenseVoucher';
import CostCalculation from './components/business/CostCalculation';
import './App.css';

// Layout component with Header
function AppLayout({ children }) {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Change password route */}
          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Setup routes */}
          <Route path="/setup/company-info" element={
            <ProtectedRoute requiredPermission="company_info">
              <AppLayout><CompanyInfo /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/setup/accounts-funds" element={
            <ProtectedRoute requiredPermission="accounts_funds">
              <AppLayout><AccountsFunds /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/setup/customer-groups" element={
            <ProtectedRoute requiredPermission="customer_groups">
              <AppLayout><CustomerGroups /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/setup/customers" element={
            <ProtectedRoute requiredPermission="customers">
              <AppLayout><Customers /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/setup/suppliers" element={
            <ProtectedRoute requiredPermission="suppliers">
              <AppLayout><Suppliers /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/setup/product-categories" element={
            <ProtectedRoute requiredPermission="product_categories">
              <AppLayout><ProductCategories /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/setup/products" element={
            <ProtectedRoute requiredPermission="products">
              <AppLayout><Products /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/setup/units" element={
            <ProtectedRoute requiredPermission="units">
              <AppLayout><Units /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/setup/transaction-contents" element={
            <ProtectedRoute requiredPermission="transaction_contents">
              <AppLayout><TransactionContents /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/setup/warehouses" element={
            <ProtectedRoute requiredPermission="warehouses">
              <AppLayout><Warehouses /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/setup/vehicles" element={
            <ProtectedRoute requiredPermission="vehicles">
              <AppLayout><Vehicles /></AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Permissions routes */}
          <Route path="/permissions/users" element={
            <ProtectedRoute requiredPermission="users">
              <AppLayout><Users /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/permissions/groups" element={
            <ProtectedRoute requiredPermission="permission_groups">
              <AppLayout><PermissionGroupsPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/permissions/user-permissions/:userId" element={
            <ProtectedRoute requiredPermission="user_permissions">
              <AppLayout><UserPermissionsPage /></AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Business routes */}
          <Route path="/business/quotation-table" element={
            <ProtectedRoute requiredPermission="quotations">
              <AppLayout><QuotationTable /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/import-goods" element={
            <ProtectedRoute requiredPermission="imports">
              <AppLayout><ImportGoods /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/warehouse-transfer" element={
            <ProtectedRoute requiredPermission="warehouse_transfers">
              <AppLayout><WarehouseTransfer /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/export-goods" element={
            <ProtectedRoute requiredPermission="exports">
              <AppLayout><ExportGoods /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/exports" element={
            <ProtectedRoute requiredPermission="exports">
              <AppLayout><ExportGoods /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/sales/sale-management-by-current-user" element={
            <ProtectedRoute requiredPermission="orders">
              <AppLayout><SaleManagementByCurrentUser /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/sales/sale-management" element={
            <ProtectedRoute requiredPermission="orders">
              <AppLayout><SaleManagement /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/sales/create-order-form" element={
            <ProtectedRoute requiredPermission="orders" requiredAction="add">
              <AppLayout><CreateOrderForm /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/sales/print-order" element={
            <ProtectedRoute requiredPermission="orders" requiredAction="print">
              <AppLayout><PrintOrder /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/sales/print-order-by-vehicle" element={
            <ProtectedRoute requiredPermission="orders" requiredAction="print">
              <AppLayout><PrintOrderByVehicle /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/accounting/receipt-voucher" element={
            <ProtectedRoute requiredPermission="receipts">
              <AppLayout><ReceiptVoucher /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/accounting/expense-voucher" element={
            <ProtectedRoute requiredPermission="expenses">
              <AppLayout><ExpenseVoucher /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/business/cost-calculation" element={
            <ProtectedRoute requiredPermission="cost_calculation">
              <AppLayout><CostCalculation /></AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/manage-data" element={
            <ProtectedRoute requiredPermission="admin">
              <AppLayout><AdminPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/test/resizable-table" element={
            <ProtectedRoute>
              <AppLayout><ResizableTable /></AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
