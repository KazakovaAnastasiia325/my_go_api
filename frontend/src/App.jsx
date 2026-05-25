import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import Customer from './pages/Сustomer';
import Catalog from './pages/Catalog';
import Seller from './pages/Seller';
import Reg from './pages/Reg';

// Временная заглушка, если страницы создания продавца еще нет физически
const CreateSellerStub = () => (
  <div className="p-10 text-center text-slate-400">Страница создания нового пользователя / продавца</div>
);

function App() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-200"> 
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/create-seller" element={<CreateSellerStub />} /> 
          <Route path="/customer-dashboard" element={<Customer />} />
          <Route path="/catalog-dashboard" element={<Catalog />} />
          <Route path="/reg" element={<Reg />} />
          <Route path="/seller-dashboard" element={<Seller />} />
          <Route path="/" element={<Navigate to="/auth" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;