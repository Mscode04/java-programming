import React, { useState, useEffect } from "react";
import { db } from "../Firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useParams, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "react-toastify/dist/ReactToastify.css";
import "./ReportView.css";
import { useNavigate } from 'react-router-dom';
function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    const docRef = doc(db, "Reports", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setReport({ id: docSnap.id, ...docSnap.data() });
    } else {
      toast.error("Report not found");
    }
  };

  // Utility function to format YYYY-MM to MMM-YYYY
  const formatDate = (dateString) => {
    const [year, month] = dateString.split("-");
    const date = new Date(year, month - 1); // Month is 0-indexed in JavaScript Date
    return date.toLocaleString("default", { month: "short", year: "numeric" });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(40, 53, 147);
    doc.text(`${report.staff} - Dr.${report.doctorName}`, 20, 20);
  
    // Add status circle
    const statusColor = getStatusColor(report.status);
    doc.setFillColor(statusColor);
    doc.circle(190, 15, 2, "F");
  
    let startY = 25;
    const tableWidth = 170; // Total width based on 210mm page with 20mm margins
  
    const addSectionHeader = (text) => {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(211, 211, 211);
  
      // Draw background rectangle spanning the full table width
      doc.rect(20, startY, tableWidth, 10, "F");
      doc.text(text, 25, startY + 7);
  
      startY += 10;
    };
  
    const addTable = (data) => {
      doc.autoTable({
        startY: startY,
        body: data,
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { cellPadding: 2, fontSize: 10, valign: "middle" },
        columnStyles: {
          0: { cellWidth: 60, fillColor: [240, 240, 240], textColor: [0, 0, 0] },
          1: { cellWidth: "auto", fillColor: [255, 255, 255], textColor: [0, 0, 0] },
        },
        margin: { left: 20, right: 20 }, // Ensure table uses full width
      });
      startY = doc.autoTable.previous.finalY +0;
    };
  
    // General Information Section
    addSectionHeader("General Information");
    addTable([
      ["Report Year", report.reportOfYear],
      ["Staff", report.staff],
      ["Status", report.status],
      ["Doctor Name", report.doctorName],
      ["Address", report.address],
      ["Phone", report.phone],
      ["Designation", report.designation],
      ["Area", report.area],
      ["Headquarters", report.headquarters],
    ]);
  
    // Activity Details Section
    addSectionHeader("Activity Details");
    addTable([
      ["Activity Month", report.activityMonth],
      ["Activity Amount", report.activityAmount],
      ["Target Times", report.targetedTimes],
      ["MR", report.mr],
      ["ABM", report.abm],
      ["RSM", report.rsm],
    ]);
  
    // Monthly Sales Section
    if (report.dynamicFields) {
      addSectionHeader("Monthly Sales");
      const monthlySalesData = report.dynamicFields.map((field) => [
        formatDate(field.date),
        field.amount,
      ]);
      addTable(monthlySalesData);
    }
  
    // Product Items Section
    addSectionHeader("Product Items");
    const productItemsData = [];
    if (report.targetedProducts) {
      productItemsData.push(["Targeted Products", report.targetedProducts.join(", ")]);
    }
    if (report.prescribedProducts) {
      productItemsData.push(["Prescribed Products", report.prescribedProducts.join(", ")]);
    }
    if (productItemsData.length > 0) {
      addTable(productItemsData);
    }
  
    // Total Business Section
    addSectionHeader("Total Business");
    addTable([
      ["Total Business", report.totalBusiness],
      ["Expected Amount", report.expectedAmount],
      ["Percentage", `${report.percentage}%`],
    ]);
  
    doc.save(`Report_${report.staff}.pdf`);
  };
  const exportToExcel = () => {
    const worksheetData = {
      "Report Year": report.reportOfYear,
      "Staff": report.staff,
      "HQ": report.headquarters,
      "Doctor Name": report.doctorName,
      "Address": report.address,
      "Phone": report.phone,
      "Designation": report.designation,
      "Area": report.area,
      "Month": report.activityMonth,
      "Day": report.activityDay,
      "Amount": report.activityAmount,
      "MR": report.mr,
      "ABM": report.abm,
      "RSM": report.rsm,
      ...(report.targetedProducts && { "Targeted Products": report.targetedProducts.join(", ") }),
      ...(report.prescribedProducts && { "Prescribed Products": report.prescribedProducts.join(", ") }),
      "Targeted Times": report.targetedTimes,
      "Last Year Amount": report.lastYearAmount,
      ...(report.dynamicFields && report.dynamicFields.reduce((acc, field, index) => {
        acc[`Month ${index + 1} `] = formatDate(field.date);
        acc[`Amount ${index + 1}`] = field.amount;
        return acc;
      }, {})),
      "Total Business": report.totalBusiness,
      "Percentage": `${report.percentage}%`,
      "Expected Amount": report.expectedAmount,
      "Status": report.status,
    };

    const worksheet = XLSX.utils.json_to_sheet([worksheetData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    // Add some basic styling to the Excel sheet
    const headerRange = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: "283593" } }, // Dark blue background
        font: { color: { rgb: "FFFFFF" }, bold: true }, // White text, bold
      };
    }

    XLSX.writeFile(workbook, `Report_${report.staff}.xlsx`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Very Good":
        return "green"; // Light green
      case "Good":
        return "yellow"; // Green
      case "Bad":
        return "orenge"; // Orange
      case "Very Bad":
        return "red"; // Red
      default:
        return "blue"; // Gray (for 'Reload' or unknown status)
    }
  };

  if (!report) return <div><div className='loading-container'>
  <img src="https://i.pinimg.com/originals/65/ba/48/65ba488626025cff82f091336fbf94bb.gif" alt="" />
</div></div>;

  return (
    <div className="view-report-container">
      <ToastContainer />
      <button onClick={() => navigate(-1)} className="back-button"><i className="bi bi-arrow-left"  style={{color:"#d6e8ee"}}></i></button>
      <h1>Report Dr.{report.doctorName}</h1>
      <table className="report-table">
        <thead>
          <tr>
            <th className="bg-info first">Field</th>
            <th className="bg-info first2">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Report Year</td><td>{report.reportOfYear}</td></tr>
          <tr><td>Staff</td><td>{report.staff}</td></tr>
          <tr>
            <td>Status</td>
            <td className="Staus-btn">
              <button className="disable"
                style={{ 
                  backgroundColor: getStatusColor(report.status)}} 
                title={report.status}
              ></button>
            </td>
          </tr>
          <tr><td>Doctor Name</td><td>{report.doctorName}</td></tr>
          <tr><td>Address</td><td>{report.address}</td></tr>
          <tr><td>Phone</td><td>{report.phone}</td></tr>
          <tr><td>Designation</td><td>{report.designation}</td></tr>
          <tr><td>Area</td><td>{report.area}</td></tr>
          <tr><td>Headquarters</td><td>{report.headquarters}</td></tr>
          
          <tr><td colSpan="2" className="bg-info"><strong>Activity Details</strong></td></tr>
          <tr><td>Activity Month</td><td>{report.activityMonth}</td></tr>
          <tr><td>Activity Amount</td><td>{report.activityAmount}</td></tr>
          <tr><td>Target Times</td><td>{report.targetedTimes}</td></tr>
          <tr><td>MR</td><td>{report.mr}</td></tr>
          <tr><td>ABM</td><td>{report.abm}</td></tr>
          <tr><td>RSM</td><td>{report.rsm}</td></tr>
          {report.dynamicFields && (
            <>
              <tr><td colSpan="2" className="bg-info"><strong>Monthly Sales</strong></td></tr>
              {report.dynamicFields.map((field, index) => (
                <tr key={index}>
                  <td>{formatDate(field.date)}</td>
                  <td>{field.amount}</td>
                </tr>
              ))}
            </>
          )}
          <tr><td colSpan="2" className="bg-info"><strong>Product Items</strong></td></tr>
          {report.targetedProducts && (
            <tr><td>Targeted Products</td><td>{report.targetedProducts.join(", ")}</td></tr>
          )}
          {report.prescribedProducts && (
            <tr><td>Prescribed Products</td><td>{report.prescribedProducts.join(", ")}</td></tr>
          )}
          <tr><td colSpan="2" className="bg-info"><strong>Total Business</strong></td></tr>
          <tr><td>Total Business</td><td>{report.totalBusiness}</td></tr>
          <tr><td>Expected Amount</td><td>{report.expectedAmount}</td></tr>
          <tr><td >Percentage</td><td>{report.percentage} %</td></tr>
          <tr><td >Activity Status</td><td>{report.status}</td></tr>
          <tr>
            <td className="last">Status</td>
            <td className="last2 Staus-btn">
              <button 
                style={{ 
                  backgroundColor: getStatusColor(report.status)}} 
                title={report.status}
                
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="actions">
        <button onClick={exportToPDF} className="export-btn">Download PDF</button>
        <button onClick={exportToExcel} className="export-btn">Download Excel</button>
        <button className="export-btn">  <Link to={`/main/update-report/${report.id}`} className="export-btn">Update</Link></button>
      
      </div>
    </div>
  );
}

export default ReportView;