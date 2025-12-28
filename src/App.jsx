import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import AdminPage from './components/Admin/AdminPage';
import QuotationTable from './components/business/QuotationTable';
import ImportGoods from './components/business/ImportGoods';
import ResizableTable from './components/business/ResizableTable';
import WarehouseTransfer from './components/business/WarehouseTransfer';
import ExportGoods from './components/business/ExportGoods';
import CreateOrder from './components/business/sales/CreateOrder';
import OrderManagement from './components/business/sales/OrderManagement';
import PrintOrder from './components/business/sales/PrintOrder';
import PrintOrderByVehicle from './components/business/sales/PrintOrderByVehicle';
import ReceiptVoucher from './components/business/accounting/ReceiptVoucher';
import ExpenseVoucher from './components/business/accounting/ExpenseVoucher';
import CostCalculation from './components/business/CostCalculation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/setup/company-info" element={<CompanyInfo />} />
            <Route path="/setup/accounts-funds" element={<AccountsFunds />} />
            <Route path="/setup/customer-groups" element={<CustomerGroups />} />
            <Route path="/setup/customers" element={<Customers />} />
            <Route path="/setup/suppliers" element={<Suppliers />} />
            <Route path="/setup/product-categories" element={<ProductCategories />} />
            <Route path="/setup/products" element={<Products />} />
            <Route path="/setup/units" element={<Units />} />
            <Route path="/setup/transaction-contents" element={<TransactionContents />} />
            <Route path="/setup/warehouses" element={<Warehouses />} />
            <Route path="/setup/vehicles" element={<Vehicles />} />
            <Route path="/permissions/users" element={<Users />} />
            <Route path="/business/quotation-table" element={<QuotationTable />} />
            <Route path="/business/import-goods" element={<ImportGoods />} />
            <Route path="/business/warehouse-transfer" element={<WarehouseTransfer />} />
            <Route path="/business/export-goods" element={<ExportGoods />} />
            <Route path="/business/exports" element={<ExportGoods />} />
            <Route path="/business/sales/create-order" element={<CreateOrder />} />
            <Route path="/business/sales/order-management" element={<OrderManagement />} />
            <Route path="/business/sales/print-order" element={<PrintOrder />} />
            <Route path="/business/sales/print-order-by-vehicle" element={<PrintOrderByVehicle />} />
            <Route path="/business/accounting/receipt-voucher" element={<ReceiptVoucher />} />
            <Route path="/business/accounting/expense-voucher" element={<ExpenseVoucher />} />
            <Route path="/business/cost-calculation" element={<CostCalculation />} />
            <Route path="/admin/manage-data" element={<AdminPage />} />
            <Route path="/test/resizable-table" element={<ResizableTable />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
