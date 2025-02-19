import React, { useState, useEffect } from 'react';
import { db } from "../Firebase/config";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import './Area.css';

function Area() {
  const [name, setName] = useState('');
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingArea, setEditingArea] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "Areas"));
    const areasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAreas(areasList);
    setLoading(false);
  };

  const handleAddArea = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "Areas"), { name });
      toast.success('Area added successfully!');
      setName('');
      setShowAddModal(false);
      fetchAreas();
    } catch (error) {
      toast.error('Error adding area. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArea = async (id) => {
    try {
      await deleteDoc(doc(db, "Areas", id));
      toast.success('Area deleted successfully!');
      fetchAreas();
    } catch (error) {
      toast.error('Error deleting area. Please try again.');
    } finally {
      setShowDeleteConfirmation(false);
      setAreaToDelete(null);
    }
  };

  const handleUpdateArea = async () => {
    try {
      await updateDoc(doc(db, "Areas", editingArea.id), { name: editingArea.name });
      toast.success('Area updated successfully!');
      setEditingArea(null);
      fetchAreas();
    } catch (error) {
      toast.error('Error updating area. Please try again.');
    }
  };

  const filteredAreas = areas.filter(area => area.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="main-area">
      <button
        className="adminreg-back-button"
        onClick={() => navigate(-1)}
        style={{ color: "#97cadb", backgroundColor: "transparent", border: "none" }}
      >
        <i className="bi bi-arrow-left"></i>
      </button>
      <div className="area-container">
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar />

        <h1 style={{color:"#024579"}}>Areas</h1>

        <button className="add-area-button" onClick={() => setShowAddModal(true)}>
          Add New
        </button>

        <input
          type="text"
          placeholder="Search areas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <table className="area-table">
          <thead>
            <tr>
              <th>Area Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAreas.map(area => (
              <tr key={area.id}>
                <td>
                  {editingArea?.id === area.id ? (
                    <input
                      type="text"
                      value={editingArea.name}
                      onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                    />
                  ) : (
                    area.name
                  )}
                </td>
                <td>
                  {editingArea?.id === area.id ? (
                    <>
                      <button className='btn btn-success' onClick={handleUpdateArea}>Save</button>
                      <button className='btn btn-danger' onClick={() => setEditingArea(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditingArea(area)} className='btn btn-warning'>Update</button>
                      <button className='btn btn-danger' onClick={() => {
                        setAreaToDelete(area.id);
                        setShowDeleteConfirmation(true);
                      }}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Add New Area</h3>
              <form onSubmit={handleAddArea} className="area-form">
                <input
                  type="text"
                  placeholder="Enter Area Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <div className="modal-buttons">
                  <button type="submit" className='btn btn-success' disabled={loading}>{loading ? 'Adding...' : 'Save'}</button>
                  <button type="button" className='btn btn-danger' onClick={() => setShowAddModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteConfirmation && (
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-content">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this area?</p>
              <div className="delete-confirmation-buttons">
                <button
                  className="delete-confirm-button"
                  onClick={() => handleDeleteArea(areaToDelete)}
                >
                  Confirm
                </button>
                <button
                  className="delete-cancel-button"
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setAreaToDelete(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Area;