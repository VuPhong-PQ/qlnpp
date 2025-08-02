import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import CompanyInfo from './components/setup/CompanyInfo'
import AccountsFunds from './components/setup/AccountsFunds'
import CustomerGroups from './components/setup/CustomerGroups'
import Customers from './components/setup/Customers'
import Suppliers from './components/setup/Suppliers'
import './App.css'

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
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
