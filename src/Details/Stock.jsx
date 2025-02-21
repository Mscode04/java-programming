import React, { useEffect, useState } from "react";
import { db } from "../Firebase/config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Button, Input, Select, Modal } from "antd";
import './Stock.css'

const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "Stock"));
    const stockData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setStocks(stockData);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this stock entry?")) {
      await deleteDoc(doc(db, "Stock", id));
      fetchStocks();
    }
  };

  const filteredStocks = stocks.filter((stock) =>
    (stock.productId.includes(filter) || filter === "") &&
    (stock.productName.toLowerCase().includes(search.toLowerCase()) || search === "")
  );

  return (
    <div className="stock-container">
      <h1 className="stock-title">Stock</h1>
      <div className="stock-controls">
        <Input
          placeholder="Search by Product Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="stock-search"
        />
        <Select
          placeholder="Filter by Product ID"
          onChange={(value) => setFilter(value)}
          allowClear
          className="stock-filter"
        >
          {[...new Set(stocks.map((stock) => stock.productId))].map((product) => (
            <Select.Option key={product} value={product}>{product}</Select.Option>
          ))}
        </Select>
      </div>
      <table className="stock-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Gold Rate</th>
            <th>Net Weight</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStocks.map((stock) => (
            <tr key={stock.id} className="stock-row">
              <td>{stock.productName}</td>
              <td>{stock.goldRate}</td>
              <td>{stock.netWeight}</td>
              <td>{stock.quantity}</td>
              <td>
                <Button onClick={() => setModalData(stock)} className="stock-view-button">View</Button>
                <Button onClick={() => handleDelete(stock.id)} danger className="stock-delete-button">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
        title="Stock Details"
        visible={!!modalData}
        onCancel={() => setModalData(null)}
        footer={[<Button key="print" onClick={() => window.print()} className="stock-print-button">Print</Button>]}
      >
        {modalData && (
          <div className="stock-modal-content">
            <p><strong>Added On:</strong> {new Date(modalData.addedOn).toLocaleDateString()}</p>
            <p><strong>Last Updated:</strong> {new Date(modalData.lastUpdated).toLocaleDateString()}</p>
            <p><strong>Gold Rate:</strong> {modalData.goldRate}</p>
            <p><strong>Gram Weight:</strong> {modalData.gramWeight}</p>
            <p><strong>Net Weight:</strong> {modalData.netWeight}</p>
            <p><strong>Product ID:</strong> {modalData.productId}</p>
            <p><strong>Product Name:</strong> {modalData.productName}</p>
            <p><strong>Quantity:</strong> {modalData.quantity}</p>
            <p><strong>Stone Weight:</strong> {modalData.stoneWeight}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Stock;
