import React from "react";
import { Link, Navigate } from "react-router-dom";
import "./Main.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route } from "react-router-dom";
import Home from "../Home/Home";
import SalesBill from "../Details/SalesBill"; // Import other components as needed
import PurchaseBill from "../Details/PurchaseBill";

import Product from "../Details/Product";
import Sellers  from "../Details/Sellers";
import Quotationsbill from "../Details/Quotationsbill";
import Quotations from "../Details/Quotations";

import Stock from "../Details/Stock";
import SalesBills from "../Details/SalesBills";


import PurchaseBills from "../Details/PurchaseBills";
import Goldrates from "../Details/Goldrates";
function Main({ isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mainhome_app">
      <div className="mainhome_page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/SalesBill" element={<SalesBill />} />
          <Route path="/PurchaseBill" element={<PurchaseBill />} />
          <Route path="/PurchaseBills" element={<PurchaseBills />} />
          
          <Route path="/Goldrates" element={<Goldrates />} />
          <Route path="/product" element={<Product />} />
          <Route path="/Sellers" element={<Sellers />} />
          <Route path="/Quotationsbill" element={<Quotationsbill />} />       
          <Route path="/Stock" element={<Stock />} />
          <Route path="/Quotations" element={<Quotations />} />
          <Route path="/SalesBills" element={<SalesBills />} />
         
          
          
        
        </Routes>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="mainhome_bottom-nav">
        <Link to="/main" className="mainhome_nav-item">
          <i className="bi bi-house-fill"></i>
        </Link>
        <Link to="/main/Goldrates" className="mainhome_nav-item">
          <i className="bi bi-plus-circle"></i>
        </Link>
        
        <Link to="/main/Stock" className="mainhome_nav-item">
          <i className="bi bi-book-fill"></i>
        </Link>
      </nav>
    </div>
  );
}

export default Main;