import React, { useEffect, useState } from "react";
import { db } from "../Firebase/config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Button, Input, Select, Modal } from "antd";
import './Quotations.css';

const Quotations = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBills();
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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      await deleteDoc(doc(db, "Quotations", id));
      fetchBills();
    }
  };

  const filteredBills = bills.filter((bill) =>
    ((bill.products?.some((product) => product.productId.includes(filter))) || filter === "") &&
    (bill.customerName?.toLowerCase().includes(search.toLowerCase()) || search === "")
  );

  return (
    <div className="quotations-container">
      <h1 className="quotations-title">Quotations</h1>
      <div className="quotations-controls">
        <Input
          placeholder="Search by Customer Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="quotations-search"
        />
        <Select
          placeholder="Filter by Product"
          onChange={(value) => setFilter(value)}
          allowClear
          className="quotations-filter"
        >
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
          {filteredBills.map((bill) => (
            <tr key={bill.id} className="quotations-row">
              <td>{bill.date ? new Date(bill.date).toLocaleDateString() : "N/A"}</td>
              <td>{bill.goldRate || "N/A"}</td>
              <td>{bill.netPrice || "N/A"}</td>
              <td>{bill.customerName || "Unknown"}</td>
              <td>
                {bill.products?.map((product) => (
                  <p key={product.productId}>
                    {product.productName} (Qty: {product.quantity})
                  </p>
                )) || "No Products"}
              </td>
              <td>
                <Button onClick={() => setModalData(bill)} className="quotations-view-button">View</Button>
                <Button onClick={() => handleDelete(bill.id)} danger className="quotations-delete-button">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
        title="Quotation Details"
        visible={!!modalData}
        onCancel={() => setModalData(null)}
        footer={[<Button key="print" onClick={() => window.print()} className="quotations-print-button">Print</Button>]}
      >
        {modalData && (
          <div className="quotations-modal-content">
            <p><strong>Date:</strong> {modalData.date ? new Date(modalData.date).toLocaleDateString() : "N/A"}</p>
            <p><strong>Gold Rate:</strong> {modalData.goldRate || "N/A"}</p>
            <p><strong>Net Price:</strong> {modalData.netPrice || "N/A"}</p>
            <p><strong>Customer Name:</strong> {modalData.customerName || "Unknown"}</p>
            <p><strong>Products:</strong></p>
            {modalData.products?.map((product) => (
              <div key={product.productId} className="quotations-product">
                <p><strong>Product Name:</strong> {product.productName}</p>
                <p><strong>Product ID:</strong> {product.productId}</p>
                <p><strong>Quantity:</strong> {product.quantity}</p>
                <p><strong>Gram Weight:</strong> {product.gramWeight}</p>
                <p><strong>Stone Weight:</strong> {product.stoneWeight}</p>
                <p><strong>Net Weight:</strong> {product.netWeight}</p>
                <p><strong>Discount Amount:</strong> {product.discountAmount}</p>
              </div>
            )) || <p>No Products</p>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Quotations;
