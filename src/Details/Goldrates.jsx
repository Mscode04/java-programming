import React, { useEffect, useState } from "react";
import { db } from "../Firebase/config";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "react-modal";
import "./Goldrates.css";
import { useNavigate } from "react-router-dom";

function Goldrates() {
  const [goldPrices, setGoldPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGoldPrice, setNewGoldPrice] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0], // Automatically set to today's date
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGoldPrices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "goldPrices"));
        const goldPricesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGoldPrices(goldPricesList);
      } catch (error) {
        console.error("Error fetching gold prices:", error);
        toast.error("Failed to load gold prices.");
      } finally {
        setLoading(false);
      }
    };
    fetchGoldPrices();
  }, []);

  const handleAddGoldPrice = async () => {
    if (!newGoldPrice.amount) {
      toast.error("Please fill the amount field.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "goldPrices"), {
        amount: newGoldPrice.amount,
        date: newGoldPrice.date,
      });

      setGoldPrices([...goldPrices, { id: docRef.id, ...newGoldPrice }]);
      toast.success("Gold price added successfully.");
      closeAddModal();
    } catch (error) {
      console.error("Error adding gold price:", error);
      toast.error("Failed to add gold price.");
    }
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewGoldPrice({ amount: "", date: new Date().toISOString().split("T")[0] });
  };

  return (
    <div className="admin-details-container">
      <ToastContainer position="top-center" autoClose={3000} />
      <button onClick={() => navigate(-1)} className="admin-details-back-button">
        <i className="bi bi-arrow-left"></i>
      </button>
      <h1 className="admin-details-title">Today's Gold Price</h1>
      <div className="admin-details-header">
        <button className="admin-details-add-button" onClick={openAddModal}>
          Add Gold Price
        </button>
      </div>
      {loading ? (
        <div className="admin-details-loading">
          <p>Loading....</p>
        </div>
      ) : (
        <table className="admin-details-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {goldPrices.length > 0 ? (
              goldPrices.map((goldPrice) => (
                <tr key={goldPrice.id}>
                  <td>{goldPrice.date}</td>
                  <td>{goldPrice.amount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="admin-details-no-data">
                  No gold prices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={closeAddModal}
        contentLabel="Add Gold Price Modal"
        className="admin-details-modal"
        overlayClassName="admin-details-modal-overlay"
      >
        <h2>Add Today's Gold Price</h2>
        <div className="admin-details-modal-form">
          <input
            type="number"
            placeholder="Amount"
            value={newGoldPrice.amount}
            onChange={(e) => setNewGoldPrice({ ...newGoldPrice, amount: e.target.value })}
          />
          <input type="date" value={newGoldPrice.date} disabled />
          <div className="admin-details-modal-buttons">
            <button onClick={handleAddGoldPrice}>Add</button>
            <button onClick={closeAddModal}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Goldrates;
