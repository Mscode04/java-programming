import React, { useEffect, useState } from "react";
import { db } from "../Firebase/config";
import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { Button, Input, Select, Modal } from "antd";
import { useNavigate } from 'react-router-dom';
import './SalesBills.css';

const SalesBills = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "SalesBills"));
    const billsData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setBills(billsData);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this sales bill?")) {
      await deleteDoc(doc(db, "SalesBills", id));
      fetchBills();
    }
  };

  const handlePrint = async (billId) => {
    const billRef = doc(db, "SalesBills", billId);
    const billSnap = await getDoc(billRef);
    const billData = billSnap.data();

    const printableContent = `
      <h2>Sales Bill</h2>
      <p><strong>Customer:</strong> ${billData.customerName}</p>
      <p><strong>Date:</strong> ${new Date(billData.date).toLocaleString()}</p>
      <p><strong>Gold Rate:</strong> ${billData.goldRate}</p>
      <h3>Products</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>Product</th>
            <th>Gram Weight</th>
            <th>Stone Weight</th>
            <th>Quantity</th>
            <th>Discount Amount</th>
            <th>Maker Charge</th>
            <th>Net Weight</th>
            <th>Net Price</th>
          </tr>
        </thead>
        <tbody>
          ${billData.products.map(product => `
            <tr>
              <td>${product.productName}</td>
              <td>${product.gramWeight}g</td>
              <td>${product.stoneWeight}g</td>
              <td>${product.quantity}</td>
              <td>$${product.discountAmount}</td>
              <td>$${product.makerCharge}</td>
              <td>${product.netWeight}g</td>
              <td>$${product.netPrice}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <h3>Exchange Products</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>Product</th>
            <th>Gram Weight</th>
            <th>Stone Weight</th>
            <th>Quantity</th>
            <th>Discount Amount</th>
            <th>Net Weight</th>
            <th>Net Price</th>
          </tr>
        </thead>
        <tbody>
          ${billData.exchangeProducts.map(product => `
            <tr>
              <td>${product.productName}</td>
              <td>${product.gramWeight}g</td>
              <td>${product.stoneWeight}g</td>
              <td>${product.quantity}</td>
              <td>$${product.discountAmount}</td>
              <td>${product.netWeight}g</td>
              <td>$${product.netPrice}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p><strong>Total Net Price:</strong> $${billData.totalNetPrice}</p>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Bill</title>
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
    <div className="salesBills-container">
       <button onClick={() => navigate(-1)} className="back-button" style={{ color: "#d6e8ee" }}><i className="bi bi-arrow-left"></i></button>

      <h1 className="salesBills-title">Sales Bills</h1>

      <div className="salesBills-controls">
        <Input placeholder="Search by Customer Name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select placeholder="Filter by Product" onChange={(value) => setFilter(value)} allowClear>
          {[...new Set(bills.flatMap((bill) => bill.products?.map((p) => p.productId) || []))].map((productId) => (
            <Select.Option key={productId} value={productId}>{productId}</Select.Option>
          ))}
        </Select>
      </div>
      <table className="salesBills-table">
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
              <td>{bill.goldRate || "N/A"}</td>
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
        title="Sales Bill Details"
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
        width={800}
        className="salesBills-modal"
      >
        {modalData && (
          <div>
            <p><strong>Customer:</strong> {modalData.customerName}</p>
            <p><strong>Date:</strong> {new Date(modalData.date).toLocaleString()}</p>
            <p><strong>Gold Rate:</strong> {modalData.goldRate}</p>
            <h3>Products</h3>
            <table border="1" cellPadding="5" cellSpacing="0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Gram Weight</th>
                  <th>Stone Weight</th>
                  <th>Quantity</th>
                  <th>Discount Amount</th>
                  <th>Maker Charge</th>
                  <th>Net Weight</th>
                  <th>Net Price</th>
                </tr>
              </thead>
              <tbody>
                {modalData.products?.map((product, index) => (
                  <tr key={index}>
                    <td>{product.productName}</td>
                    <td>{product.gramWeight}g</td>
                    <td>{product.stoneWeight}g</td>
                    <td>{product.quantity}</td>
                    <td>${product.discountAmount}</td>
                    <td>${product.makerCharge}</td>
                    <td>{product.netWeight}g</td>
                    <td>${product.netPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3>Exchange Products</h3>
            <table border="1" cellPadding="5" cellSpacing="0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Gram Weight</th>
                  <th>Stone Weight</th>
                  <th>Quantity</th>
                  <th>Discount Amount</th>
                  <th>Net Weight</th>
                  <th>Net Price</th>
                </tr>
              </thead>
              <tbody>
                {modalData.exchangeProducts?.map((product, index) => (
                  <tr key={index}>
                    <td>{product.productName}</td>
                    <td>{product.gramWeight}g</td>
                    <td>{product.stoneWeight}g</td>
                    <td>{product.quantity}</td>
                    <td>${product.discountAmount}</td>
                    <td>{product.netWeight}g</td>
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

export default SalesBills;