import React, { useState } from "react";
import "./Home.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useNavigate } from "react-router-dom";

function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    navigate("/logout");
  };

  return (
    <div className="HomeApp">
      <header className="HomeTopbar">
        <button className="btn btn-transparent" onClick={toggleDrawer}>
          <i className="bi bi-list"></i>
        </button>
      </header>
      <div className="HomeContent">
        <h2 className="HomeTitle">Hezza Gold</h2>

        <div className="HomeSection">
          <h3 className="SectionTitle">Reports</h3>
          <div className="IconGrid">
            <Link to="/main/Stock" className="IconItem">
              <i className="bi bi-box"></i>
              <span>Stock</span>
            </Link>
            <Link to="/main/Quotations" className="IconItem">
              <i className="bi bi-receipt"></i>
              <span>Quotations</span>
            </Link>
            <Link to="/main/SalesBills" className="IconItem">
              <i className="bi bi-receipt-cutoff"></i>
              <span>Sales Bills</span>
            </Link>
            <Link to="/main/PurchaseBills" className="IconItem">
              <i className="bi bi-cart-check"></i>
              <span>Purchase Bills</span>
            </Link>
            <Link to="/main/Sellers" className="IconItem">
              <i className="bi bi-people"></i>
              <span>Sellers</span>
            </Link>
          </div>
        </div>

        <div className="HomeSection">
          <h3 className="SectionTitle">New Forms</h3>
          <div className="IconGrid">
            <Link to="/main/Quotationsbill" className="IconItem">
              <i className="bi bi-file-earmark-text"></i>
              <span>Quotation bill</span>
            </Link>
            <Link to="/main/SalesBill" className="IconItem">
              <i className="bi bi-cash"></i>
              <span>Sales Bill</span>
            </Link>
            <Link to="/main/PurchaseBill" className="IconItem">
              <i className="bi bi-bag-check"></i>
              <span>Purchase bill</span>
            </Link>
            <Link to="/main/Goldrates" className="IconItem">
              <i className="bi bi-currency-exchange"></i>
              <span>Gold Rate</span>
            </Link>
            <Link to="/main/product" className="IconItem">
              <i className="bi bi-box-seam"></i>
              <span>Product</span>
            </Link>
          </div>
        </div>
      </div>

      <div className={`HomeDrawer ${drawerOpen ? "open" : ""}`}>
        <button className="HomeDrawerCloseButton" onClick={toggleDrawer}>
          <i className="bi bi-arrow-left"></i>
        </button>
        
        <div className="drawer-footer">
          <button className="btn btn-danger mb-5" onClick={handleLogout}>
            Logout
          </button>
          <div className="powered-by" style={{color:"#024579"}}>Powered by <a href="https://neuraq.in/" className="text-decoration-none" style={{color:"#43dd11"}}>Neuraq Technologies</a></div>
        </div>
      </div>
    </div>
  );
}

export default Home;
