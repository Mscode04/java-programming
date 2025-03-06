import React, { useEffect, useState } from "react";
import { db } from "../Firebase/config";
import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { Button, Input, Select, Modal, Spin } from "antd";
import "./PurchaseBills.css";
import { useNavigate } from 'react-router-dom';
const PurchaseBills = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "PurchaseBills"));
      const billsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBills(billsData);
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bill?")) {
      try {
        await deleteDoc(doc(db, "PurchaseBills", id));
        fetchBills(); // Refresh the list after deletion
      } catch (error) {
        console.error("Error deleting bill:", error);
      }
    }
  };

  const handlePrint = async (billId) => {
    const billRef = doc(db, "PurchaseBills", billId);
    const billSnap = await getDoc(billRef);
    const billData = billSnap.data();

    const printableContent = `
      <h2>Purchase Bill</h2>
      <p><strong>Date:</strong> ${billData.date ? new Date(billData.date).toLocaleDateString() : "N/A"}</p>
      <p><strong>Gold Rate:</strong> ${billData.goldRate || "N/A"}</p>
      <p><strong>Net Price:</strong> ${billData.netPrice || "N/A"}</p>
      <p><strong>Seller ID:</strong> ${billData.sellerId || "N/A"}</p>
      <h3>Products</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Product ID</th>
            <th>Quantity</th>
            <th>Gram Weight</th>
            <th>Net Weight</th>
            <th>Stone Weight</th>
            <th>Discount Amount</th>
            <th>Net Price</th>
          </tr>
        </thead>
        <tbody>
          ${billData.products?.map((product) => `
            <tr>
              <td>${product.productName || "N/A"}</td>
              <td>${product.productId || "N/A"}</td>
              <td>${product.quantity || 0}</td>
              <td>${product.gramWeight || 0}</td>
              <td>${product.netWeight || 0}</td>
              <td>${product.stoneWeight || 0}</td>
              <td>${product.discountAmount || 0}</td>
              <td>${product.netPrice || 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Bill</title>
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

  const filteredBills = bills.filter(
    (bill) =>
      (filter === "" || (bill.products && bill.products.some((p) => p.productId === filter))) &&
      (search === "" || bill.sellerId?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="purchase-bills-container">
            <button onClick={() => navigate(-1)} className="back-button" style={{ color: "#d6e8ee" }}><i className="bi bi-arrow-left"></i></button>

      <h1 className="purchase-bills-title">Purchase Bills</h1>

      <div className="purchase-bills-controls">
        <Input
          placeholder="Search by Seller Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="purchase-bills-search"
        />

        <Select
          placeholder="Filter by Product"
          onChange={(value) => setFilter(value)}
          allowClear
          className="purchase-bills-select"
        >
          {[...new Set(bills.flatMap((bill) => (bill.products || []).map((p) => p.productId)))].map(
            (product) => (
              <Select.Option key={product} value={product}>
                {product}
              </Select.Option>
            )
          )}
        </Select>
      </div>

      {loading ? (
        <div className="purchase-bills-loading">
          <Spin size="large" />
        </div>
      ) : (
        <table className="purchase-bills-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Gold Rate</th>
              <th>Net Price</th>
              <th>Seller</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((bill) => (
              <tr key={bill.id}>
                <td>{bill.date ? new Date(bill.date).toLocaleDateString() : "N/A"}</td>
                <td>{bill.goldRate || "N/A"}</td>
                <td>{bill.netPrice || "N/A"}</td>
                <td>{bill.sellerId || "N/A"}</td>
                <td>
                  <Button onClick={() => setModalData(bill)}>View</Button>
                  <Button onClick={() => handleDelete(bill.id)} danger>
                    Delete
                  </Button>
                  <Button onClick={() => handlePrint(bill.id)}>Print</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal for Bill Details */}
      <Modal
        title="Purchase Bill Details"
        open={!!modalData}
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
        className="purchase-bills-modal"
      >
        {modalData && (
          <div>
            <p><strong>Date:</strong> {modalData.date ? new Date(modalData.date).toLocaleDateString() : "N/A"}</p>
            <p><strong>Gold Rate:</strong> {modalData.goldRate || "N/A"}</p>
            <p><strong>Net Price:</strong> {modalData.netPrice || "N/A"}</p>
            <p><strong>Seller ID:</strong> {modalData.sellerId || "N/A"}</p>

            <h3>Products:</h3>
            {Array.isArray(modalData.products) && modalData.products.length > 0 ? (
              <table border="1" cellPadding="5" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Product ID</th>
                    <th>Quantity</th>
                    <th>Gram Weight</th>
                    <th>Net Weight</th>
                    <th>Stone Weight</th>
                    <th>Discount Amount</th>
                    <th>Net Price</th>
                  </tr>
                </thead>
                <tbody>
                  {modalData.products.map((product, index) => (
                    <tr key={index}>
                      <td>{product.productName || "N/A"}</td>
                      <td>{product.productId || "N/A"}</td>
                      <td>{product.quantity || 0}</td>
                      <td>{product.gramWeight || 0}</td>
                      <td>{product.netWeight || 0}</td>
                      <td>{product.stoneWeight || 0}</td>
                      <td>{product.discountAmount || 0}</td>
                      <td>{product.netPrice || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No products available.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseBills;