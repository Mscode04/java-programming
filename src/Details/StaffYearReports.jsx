import React, { useState, useEffect } from 'react';
import { db } from '../Firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useParams, Link ,useNavigate} from 'react-router-dom';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './StaffYearReports.css';

function StaffYearReports() {
  const { staff, year } = useParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [percentageFilter, setPercentageFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();
  useEffect(() => {
    const fetchReports = async () => {
      const q = query(
        collection(db, 'Reports'),
        where('staff', '==', decodeURIComponent(staff)),
        where('reportOfYear', '==', year)
      );

      const querySnapshot = await getDocs(q);
      const reportsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setReports(reportsData);
      setLoading(false);
    };

    fetchReports();
  }, [staff, year]);

  const formatDate = (dateString) => {
    const [year, month] = dateString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  const exportAllToExcel = () => {
    // Define the maximum number of dynamic fields (months) to ensure consistent columns
    const maxDynamicFields = Math.max(...reports.map(report => report.dynamicFields ? report.dynamicFields.length : 0));
  
    // Create the worksheet data with ordered dynamic fields
    const worksheetData = reports.map((report) => {
      const dynamicFieldsData = {};
      if (report.dynamicFields) {
        for (let i = 0; i < maxDynamicFields; i++) {
          const field = report.dynamicFields[i];
          dynamicFieldsData[`Month ${i + 1}`] = field ? `${formatDate(field.date)} : ${field.amount}` : '';
        }
      }
  
      return {
        'Report Year': report.reportOfYear,
        'Staff': report.staff,
        'HQ': report.headquarters,
        'Doctor Name': report.doctorName,
        'Address': report.address,
        'Phone': report.phone,
        'Designation': report.designation,
        'Area': report.area,
        'Month': report.activityMonth,
        'Day': report.activityDay,
        'Amount': report.activityAmount,
        'MR': report.mr,
        'ABM': report.abm,
        'RSM': report.rsm,
        ...(report.targetedProducts && { 'Targeted Products': report.targetedProducts.join(', ') }),
        ...(report.prescribedProducts && { 'Prescribed Products': report.prescribedProducts.join(', ') }),
        'Targeted Times': report.targetedTimes,
        'Last Year Amount': report.lastYearAmount,
        ...dynamicFieldsData, // Add dynamic fields in order
        'Total Business': report.totalBusiness,
        'Percentage': `${report.percentage}%`,
        'Expected Amount': report.expectedAmount,
        'Status': report.status,
      };
    });
  
    // Create the worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
    // Style the headers
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: '283593' } },
        font: { color: { rgb: 'FFFFFF' }, bold: true },
      };
    }
  
    // Create the workbook and export the file
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
    XLSX.writeFile(workbook, `All_Reports_${staff}_${year}.xlsx`);
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'Very Good':
        return '#90EE90';
      case 'Good':
        return '#32CD32';
      case 'Bad':
        return '#FFA500';
      case 'Very Bad':
        return '#FF0000';
      default:
        return '#808080';
    }
  };

  const filterReports = (reports) => {
    switch (percentageFilter) {
      case 'below25':
        return reports.filter(report => report.percentage < 25);
      case '25-50':
        return reports.filter(report => report.percentage >= 25 && report.percentage < 50);
      case '50-75':
        return reports.filter(report => report.percentage >= 50 && report.percentage < 75);
      case '75-100':
        return reports.filter(report => report.percentage >= 75 && report.percentage <= 100);
      case 'above100':
        return reports.filter(report => report.percentage > 100);
      default:
        return reports;
    }
  };

  const sortReports = (reports) => {
    return reports.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.percentage - b.percentage;
      } else {
        return b.percentage - a.percentage;
      }
    });
  };

  const filteredReports = filterReports(reports);
  const sortedReports = sortReports(filteredReports);

  if (loading) return <div className='loading-container'>
    <img src="https://i.pinimg.com/originals/65/ba/48/65ba488626025cff82f091336fbf94bb.gif" alt="" />
  </div>;

  return (
    <div className="reports-container">
      <button onClick={() => navigate(-1)} className="back-button" style={{color:"#d6e8ee"}}><i className="bi bi-arrow-left"></i></button>
      <h2>Reports for {decodeURIComponent(staff)} - {year}</h2>
      <div className="filters-container">
        <label>
          <select value={percentageFilter} onChange={(e) => setPercentageFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="below25">Below 25%</option>
            <option value="25-50">25% - 50%</option>
            <option value="50-75">50% - 75%</option>
            <option value="75-100">75% - 100%</option>
            <option value="above100">Above 100%</option>
          </select>
        </label>

        <label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
      </div>
    
      <table className="reports-table">
        <thead>
          <tr>
            <th>Doctor Name</th>
            <th>Designation</th>
            <th>Area</th>
            <th>Headquarters</th>
            <th>Activity Month</th>
            <th>Activity Amount</th>
            <th>Target Times</th>
            <th>Last Year Collection</th>
            <th >Monthly Collection</th>
            <th>Total Business</th>
            <th>Expected Amount</th>
            <th>Percentage</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
       
        </thead>
        <tbody>
  {sortedReports.map((report) => (
    <React.Fragment key={report.id}>
      {/* Main Report Row */}
      <tr>
        <td>{report.doctorName}</td>
        <td>{report.designation}</td>
        <td>{report.area}</td>
        <td>{report.headquarters}</td>
        <td>{report.activityMonth}</td>
        <td>{report.activityAmount}</td>
        <td>{report.targetedTimes}</td>
        <td>{report.lastYearAmount}</td>
        
          <td>  {report.dynamicFields && report.dynamicFields.map((field, index) => (
         
            <td colSpan="2">
              {formatDate(field.date)} <td>{field.amount}</td> 
            </td>
        ))}</td>
        <td>{report.totalBusiness}</td>
        <td>{report.expectedAmount}</td>
        <td>{report.percentage}%</td>
        <td>
          <button
            className="status-button"
            style={{ backgroundColor: getStatusColor(report.status) }}
            title={report.status}
          ></button>
        </td>
        <td>
          <Link to={`/main/update-report/${report.id}`} className="export-btn">Update</Link>
        </td>
      </tr>

     
   
    </React.Fragment>
  ))}
</tbody>
      </table>
      <div className="download-buttons">
        <button onClick={exportAllToExcel} className="export-btn">Download All as Excel</button>
      </div>
    </div>
  );
}

export default StaffYearReports;