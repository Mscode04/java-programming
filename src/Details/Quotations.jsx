import React, { useEffect, useState } from "react";
import { db } from "../Firebase/config";
import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { Button, Input, Select, Modal } from "antd";
import './Quotations.css';
import { useNavigate } from 'react-router-dom';
const Quotations = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const navigate = useNavigate();
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [goldRate, setGoldRate] = useState(0);

  useEffect(() => {
    fetchBills();
    fetchGoldRate();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "Quotations"));
    const billsData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setBills(billsData);
    setLoading(false);
  };

  const fetchGoldRate = async () => {
    const today = new Date().toISOString().split('T')[0];
    const goldRateQuery = collection(db, "goldPrices");
    const querySnapshot = await getDocs(goldRateQuery);
    let rate = 0;
    querySnapshot.forEach((doc) => {
      if (doc.data().date === today) {
        rate = doc.data().amount;
      }
    });
    if (rate > 0) setGoldRate(rate);
    else console.log("No gold rate found for today!");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      await deleteDoc(doc(db, "Quotations", id));
      fetchBills();
    }
  };

  const handlePrint = async (quotationId) => {
    const quotationRef = doc(db, "Quotations", quotationId);
    const quotationSnap = await getDoc(quotationRef);
    const quotationData = quotationSnap.data();

    const printableContent = `
      <h2>Quotation</h2>
      <p><strong>Customer:</strong> ${quotationData.customerName}</p>
      <p><strong>Date:</strong> ${new Date(quotationData.date).toLocaleString()}</p>
      <p><strong>Gold Rate:</strong> ${quotationData.goldRate}</p>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>Product</th>
            <th>Gram Weight</th>
            <th>Stone Weight</th>
            <th>Quantity</th>
            <th>Discount Amount</th>
            <th>Net Weight</th>
            <th>Maker Charge}</th>
            <th>Net Price</th>
          </tr>
        </thead>
        <tbody>
          ${quotationData.products.map(product => `
            <tr>
              <td>${product.productName}</td>
              <td>${product.gramWeight}</td>
              <td>${product.stoneWeight}</td>
              <td>${product.quantity}</td>
              <td>${product.discountAmount}</td>
              <td>${product.netWeight}</td>
              <td>${product.makerCharge}</td>
              <td>$${product.netPrice}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p><strong>Total Net Price:</strong> $${quotationData.totalNetPrice}</p>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Quotation</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          ${printableContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="quotations-container">
       <button onClick={() => navigate(-1)} className="back-button" style={{ color: "#d6e8ee" }}><i className="bi bi-arrow-left"></i></button>

      <h1 className="quotations-title">Quotations</h1>
      <div className="quotations-controls">
        <Input placeholder="Search by Customer Name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select placeholder="Filter by Product" onChange={(value) => setFilter(value)} allowClear>
          {[...new Set(bills.flatMap((bill) => bill.products?.map((p) => p.productId) || []))].map((productId) => (
            <Select.Option key={productId} value={productId}>{productId}</Select.Option>
          ))}
        </Select>
      </div>
      <table className="quotations-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Gold Rate</th>
            <th>Net Price</th>
            <th>Customer</th>
            <th>Products</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => (
            <tr key={bill.id}>
              <td>{bill.date ? new Date(bill.date).toLocaleDateString() : "N/A"}</td>
              <td>{bill.goldRate || goldRate || "N/A"}</td>
              <td>{bill.totalNetPrice || "N/A"}</td>
              <td>{bill.customerName || "Unknown"}</td>
              <td>
                {bill.products?.map((product) => (
                  <p key={product.productId}>{product.productName} (Qty: {product.quantity})</p>
                )) || "No Products"}
              </td>
              <td>
                <Button onClick={() => setModalData(bill)}>View</Button>
                <Button onClick={() => handleDelete(bill.id)} danger>Delete</Button>
                <Button onClick={() => handlePrint(bill.id)}>Print</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
  title="Quotation Details"
  visible={!!modalData}
  onCancel={() => setModalData(null)}
  footer={[
    <Button key="print" type="primary" onClick={() => handlePrint(modalData.id)}>
      Print
    </Button>,
    <Button key="close" onClick={() => setModalData(null)}>
      Close
    </Button>,
  ]}
  width={800} // Set the width of the modal
  className="quotations-modal" // Add this line
>
  {modalData && (
    <div>
      <p><strong>Customer:</strong> {modalData.customerName}</p>
      <p><strong>Date:</strong> {new Date(modalData.date).toLocaleString()}</p>
      <p><strong>Gold Rate:</strong> {modalData.goldRate}</p>
      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>Product</th>
            <th>Gram Weight</th>
            <th>Stone Weight</th>
            <th>Quantity</th>
            <th>Discount Amount</th>
            <th>Net Weight</th>
            <th>Maker Charge</th>
            <th>Net Price</th>
          </tr>
        </thead>
        <tbody>
          {modalData.products?.map((product, index) => (
            <tr key={index}>
              <td>{product.productName}</td>
              <td>{product.gramWeight}</td>
              <td>{product.stoneWeight}</td>
              <td>{product.quantity}</td>
              <td>{product.discountAmount}</td>
              <td>{product.netWeight}</td>
              <td>{product.makerCharge}</td>
              <td>${product.netPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><strong>Total Net Price:</strong> ${modalData.totalNetPrice}</p>
    </div>
  )}
</Modal>
    </div>
  );
};

export default Quotations;