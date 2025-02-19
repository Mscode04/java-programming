import React from "react";
import { Link, Navigate } from "react-router-dom";
import "./Main.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route } from "react-router-dom";
import Home from "../Home/Home";
import Doctor from "../Forms/Doctor"; // Import other components as needed
import Staff from "../Forms/Area";

import Product from "../Forms/Product";
import Headquarters from "../Forms/Headquarters";
import Create from "../Details/Create";
import BreifReport from "../Details/BreifReport";
import StaffYearReportsBeif from "../Details/StaffYearReportsBeif";
import AnnualReport from "../Details/AnnualReport";
import DoctorList from "../Forms/DoctorList";
import UpdateDoctor from "../Forms/UpdateDoctor";
import ReportsList from "../Details/ReportsList";
import ReportView from "../Details/ReportView";
import UpdateReport from "../Details/UpdateReport";

import StaffYearReports from "../Details/StaffYearReports";
import StaffDetails from "../Details/StaffDetails";
import AdminDetails from "../Details/AdminDetails";
function Main({ isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mainhome_app">
      <div className="mainhome_page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/staff-details" element={<StaffDetails />} />
          
          <Route path="/admin-details" element={<AdminDetails />} />
          <Route path="/product" element={<Product />} />
          <Route path="/headquarters" element={<Headquarters />} />
          <Route path="/create" element={<Create />} />       
          <Route path="/annual-report" element={<AnnualReport />} />
          <Route path="/breif-report" element={<BreifReport />} />
          <Route path="/doctor-list" element={<DoctorList />} />
          <Route path="/update-doctor/:id" element={<UpdateDoctor />} />
          <Route path="/si-report/:id" element={<ReportView />} />
          <Route path="/sireport-list" element={<ReportsList />} />
          <Route path="/update-report/:id" element={<UpdateReport />} />
          <Route path="/annual-report/:staff/:year" element={<StaffYearReports />} />
          <Route path="/brief-report/:staff/:year" element={<StaffYearReportsBeif />} />
        </Routes>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="mainhome_bottom-nav">
        <Link to="/main" className="mainhome_nav-item">
          <i className="bi bi-house-fill"></i>
        </Link>
        <Link to="/main/create" className="mainhome_nav-item">
          <i className="bi bi-plus-circle"></i>
        </Link>
        <Link to="/main/sireport-list" className="mainhome_nav-item">
          <i className="bi bi-journal-bookmark-fill"></i>
        </Link>
        <Link to="/main/annual-report" className="mainhome_nav-item">
          <i className="bi bi-book-fill"></i>
        </Link>
      </nav>
    </div>
  );
}

export default Main;