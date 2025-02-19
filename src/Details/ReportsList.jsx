import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../Firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ReportList.css';

function ReportList() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    headquarters: '',
    area: '',
    staff: '',
    status: '',
    reportOfYear: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, filters, reports, sortConfig]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'Reports'));
      const reportsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(reportsList);
      setFilteredReports(reportsList);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const pin = prompt('Enter PIN to confirm deletion:');
    if (pin === '2024') {
      await deleteDoc(doc(db, 'Reports', id));
      toast.success('Report deleted successfully');
      fetchReports();
    } else {
      toast.error('Incorrect PIN. Deletion canceled.');
    }
  };

  const applyFilters = () => {
    let filtered = reports.filter((report) => 
      report.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      report.staff.toLowerCase().includes(search.toLowerCase()) ||
      report.headquarters.toLowerCase().includes(search.toLowerCase()) ||
      report.area.toLowerCase().includes(search.toLowerCase())
    );

    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        filtered = filtered.filter((report) => report[key] === filters[key]);
      }
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredReports(filtered);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="getyt">
      <div className="allreport-container">
        <button onClick={() => navigate(-1)} className="back-button"><i className="bi bi-arrow-left"></i></button>
        <ToastContainer position="top-center" autoClose={2000} />
        <h1>Single Reports</h1>
        

        {/* Search and Filters */}
        <div className="search-filter-container">
          <input 
            type="text" 
            placeholder="Search Doctor, Staff, HQ, Area..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="search-input"
          />

          <select onChange={(e) => setFilters({ ...filters, headquarters: e.target.value })}>
            <option value="">Filter by HQ</option>
            {[...new Set(reports.map(r => r.headquarters))].map(hq => (
              <option key={hq} value={hq}>{hq}</option>
            ))}
          </select>

          <select onChange={(e) => setFilters({ ...filters, area: e.target.value })}>
            <option value="">Filter by Area</option>
            {[...new Set(reports.map(r => r.area))].map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          <select onChange={(e) => setFilters({ ...filters, staff: e.target.value })}>
            <option value="">Filter by Staff</option>
            {[...new Set(reports.map(r => r.staff))].map(staff => (
              <option key={staff} value={staff}>{staff}</option>
            ))}
          </select>

          <select onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Filter by Status</option>
            {[...new Set(reports.map(r => r.status))].map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select onChange={(e) => setFilters({ ...filters, reportOfYear: e.target.value })}>
            <option value="">Filter by Year</option>
            {[...new Set(reports.map(r => r.reportOfYear))].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading-container">
            <img src="https://i.pinimg.com/originals/65/ba/48/65ba488626025cff82f091336fbf94bb.gif" alt="Loading..." />
          </div>
        ) : (
          <table className="allreport-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('doctorName')}>Doctor Name</th>
                <th onClick={() => handleSort('staff')}>Staff Name</th>
                <th onClick={() => handleSort('reportOfYear')}>Report Year</th>
                <th onClick={() => handleSort('totalBusiness')}>Total Business</th>
                <th onClick={() => handleSort('status')}>Status</th>
                <th onClick={() => handleSort('headquarters')}>HQ</th>
                <th onClick={() => handleSort('area')}>Area</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="allreport-row">
                  <td>{report.doctorName}</td>
                  <td>{report.staff}</td>
                  <td>{report.reportOfYear}</td>
                  <td>{report.totalBusiness}</td>
                  <td>{report.status}</td>
                  <td>{report.headquarters}</td>
                  <td>{report.area}</td>
                  <td>
                    <Link to={`/main/si-report/${report.id}`} className="allreport-view-button">View</Link>
                    <button onClick={() => handleDelete(report.id)} className="allreport-delete-button">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ReportList;
