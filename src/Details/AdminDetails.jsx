import React, { useEffect, useState } from "react";
import { db } from "../Firebase/config";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "react-modal";
import "./AdminDetails.css";
import { useNavigate } from "react-router-dom";

function AdminDetails() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [confirmationPin, setConfirmationPin] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "admins"));
        const adminsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAdmins(adminsList);
      } catch (error) {
        console.error("Error fetching admins:", error);
        toast.error("Failed to load admin details.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "admins"), {
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password,
      });

      setAdmins([...admins, { id: docRef.id, ...newAdmin }]);
      toast.success("Admin added successfully.");
      closeAddModal();
    } catch (error) {
      console.error("Error adding admin:", error);
      toast.error("Failed to add admin.");
    }
  };

  const handleDeleteAdmin = async () => {
    if (confirmationPin !== "2024") {
      toast.error("Invalid confirmation pin.");
      return;
    }

    try {
      await deleteDoc(doc(db, "admins", adminToDelete.id));
      setAdmins(admins.filter((admin) => admin.id !== adminToDelete.id));
      toast.success("Admin deleted successfully.");
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Failed to delete admin.");
    }
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewAdmin({ name: "", email: "", password: "" });
  };

  const openDeleteModal = (admin) => {
    setAdminToDelete(admin);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAdminToDelete(null);
    setConfirmationPin("");
  };

  const filteredAdmins = admins.filter((admin) =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admindetails-container">
      <ToastContainer position="top-center" autoClose={3000} />
      <button onClick={() => navigate(-1)} className="back-button">
        <i className="bi bi-arrow-left"></i>
      </button>
      <h1 className="admindetails-title">Admin Details</h1>
      <div className="admindetails-header">
        <input
          type="text"
          placeholder="Search by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="admindetails-search"
        />
        <button className="admindetails-add-button" onClick={openAddModal}>
          Add Admin
        </button>
      </div>
      {loading ? (
        <div className="admindetails-loading">
          <img
            src="https://i.pinimg.com/originals/65/ba/48/65ba488626025cff82f091336fbf94bb.gif"
            alt="Loading..."
          />
        </div>
      ) : (
        <table className="admindetails-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>User Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.length > 0 ? (
              filteredAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>
                    <button
                      className="admindetails-delete-button"
                      onClick={() => openDeleteModal(admin)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="admindetails-no-data">
                  No admins found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={closeAddModal}
        contentLabel="Add Admin Modal"
        className="admindetails-modal"
        overlayClassName="admindetails-modal-overlay"
      >
        <h2>Add New Admin</h2>
        <div className="admindetails-modal-form">
          <input
            type="text"
            placeholder="Name"
            value={newAdmin.name}
            onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Email"
            value={newAdmin.email}
            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={newAdmin.password}
            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
          />
          <div className="admindetails-modal-buttons">
            <button onClick={handleAddAdmin}>Add</button>
            <button onClick={closeAddModal}>Cancel</button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Delete Admin Modal"
        className="admindetails-modal"
        overlayClassName="admindetails-modal-overlay"
      >
        <h2>Delete Admin</h2>
        <div className="admindetails-modal-form">
          <p>Are you sure you want to delete {adminToDelete?.name}?</p>
          <input
            type="password"
            placeholder="Enter confirmation pin"
            value={confirmationPin}
            onChange={(e) => setConfirmationPin(e.target.value)}
          />
          <div className="admindetails-modal-buttons">
            <button onClick={handleDeleteAdmin}>Delete</button>
            <button onClick={closeDeleteModal}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminDetails;