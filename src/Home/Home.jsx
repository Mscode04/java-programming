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
        <h2 className="HomeTitle">Dashboard</h2>

        <div className="HomeSection">
          <h3 className="SectionTitle">Reports</h3>
          <div className="IconGrid">
            <Link to="/main/sireport-list" className="IconItem">
              <i className="bi bi-file-earmark-text-fill"></i>
              <span>Single Report</span>
            </Link>
            <Link to="/main/annual-report" className="IconItem">
              <i className="bi bi-calendar-check-fill"></i>
              <span>Annual Report</span>
            </Link>
            <Link to="/main/breif-report" className="IconItem">
              <i className="bi bi-calendar-check-fill"></i>
              <span>Breif Report</span>
            </Link>
            <Link to="/main/doctor-list" className="IconItem">
              <i className="bi bi-file-medical-fill"></i>
              <span>Doctor</span>
            </Link>
            <Link to="/main/admin-details" className="IconItem">
              <i className="bi bi-person-badge-fill"></i>
              <span>Admins</span>
            </Link>
            <Link to="/main/staff-details" className="IconItem">
              <i className="bi bi-people-fill"></i>
              <span>Staffs</span>
            </Link>
            <Link to="/main/headquarters" className="IconItem">
              <i className="bi bi-building"></i>
              <span>HQ</span>
            </Link>
          </div>
        </div>

        <div className="HomeSection">
          <h3 className="SectionTitle">New Registrations</h3>
          <div className="IconGrid">
            <Link to="/main/create" className="IconItem">
              <i className="bi bi-file-earmark-plus-fill"></i>
              <span>Create New Report</span>
            </Link>
            <Link to="/main/doctor" className="IconItem">
              <i className="bi bi-person-plus-fill"></i>
              <span>Doctor</span>
            </Link>
            <Link to="/main/staff" className="IconItem">
              <i className="bi bi-geo-alt-fill"></i>
              <span>Area</span>
            </Link>
            <Link to="/main/admin-details" className="IconItem">
              <i className="bi bi-person-gear"></i>
              <span>Admin</span>
            </Link>
            <Link to="/main/product" className="IconItem">
              <i className="bi bi-box-seam"></i>
              <span>Product</span>
            </Link>
            <Link to="/main/headquarters" className="IconItem">
              <i className="bi bi-buildings"></i>
              <span>HQ</span>
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
