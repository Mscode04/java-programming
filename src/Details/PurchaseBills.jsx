import React, { useEffect, useState } from "react";
import { db } from "../Firebase/config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Button, Input, Select, Modal, Spin } from "antd";
import "./PurchaseBills.css";

const PurchaseBills = () => {
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

  const filteredBills = bills.filter(
    (bill) =>
      (filter === "" || (bill.products && bill.products.some((p) => p.productId === filter))) &&
      (search === "" || bill.sellerId?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="purchase-bills-container">
      <h1 className="purchase-bills-title">Purchase Bills</h1>

      <div className="purchase-bills-filters">
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
        footer={[<Button key="print" onClick={() => window.print()}>Print</Button>]}
      >
        {modalData && (
          <div className="purchase-bills-modal">
            <p><strong>Date:</strong> {modalData.date ? new Date(modalData.date).toLocaleDateString() : "N/A"}</p>
            <p><strong>Gold Rate:</strong> {modalData.goldRate || "N/A"}</p>
            <p><strong>Net Price:</strong> {modalData.netPrice || "N/A"}</p>
            <p><strong>Seller ID:</strong> {modalData.sellerId || "N/A"}</p>

            <h3>Products:</h3>
            {Array.isArray(modalData.products) && modalData.products.length > 0 ? (
              modalData.products.map((product, index) => (
                <div key={index} className="purchase-bills-product">
                  <p><strong>Product Name:</strong> {product.productName || "N/A"}</p>
                  <p><strong>Product ID:</strong> {product.productId || "N/A"}</p>
                  <p><strong>Quantity:</strong> {product.quantity || 0}</p>
                  <p><strong>Gram Weight:</strong> {product.gramWeight || 0}</p>
                  <p><strong>Net Weight:</strong> {product.netWeight || 0}</p>
                  <p><strong>Stone Weight:</strong> {product.stoneWeight || 0}</p>
                  <p><strong>Discount Amount:</strong> {product.discountAmount || 0}</p>
                  <p><strong>Net Price:</strong> {product.netPrice || 0}</p>
                </div>
              ))
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
