import React, { useState, useEffect } from 'react';
import { db } from "../Firebase/config";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Headquarters.css'; // Import separate CSS file
import { useNavigate } from 'react-router-dom';

function Headquarters() {
  const [place, setPlace] = useState('');
  const [location, setLocation] = useState('');
  const [staff, setStaff] = useState([{ name: '', address: '', phoneNumber: '', email: '' }]);
  const [headquarters, setHeadquarters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate=useNavigate()
  const [searchTerm, setSearchTerm] = useState('');
  const [editingHeadquarter, setEditingHeadquarter] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [headquarterToDelete, setHeadquarterToDelete] = useState(null); // Track which headquarter is being deleted
  const headquartersPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchHeadquarters();
  }, []);

  const fetchHeadquarters = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "Headquarters"));
    const headquartersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setHeadquarters(headquartersList);
    setLoading(false);
  };

  const handleAddHeadquarter = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "Headquarters"), {
        place,
        location,
        staff,
      });
      toast.success('Headquarter added successfully!');
      setPlace('');
      setLocation('');
      setStaff([{ name: '', address: '', phoneNumber: '', email: '' }]);
      setShowAddForm(false);
      fetchHeadquarters();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error('Error adding headquarter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHeadquarter = async (headquarter) => {
    try {
      await updateDoc(doc(db, "Headquarters", headquarter.id), {
        place: headquarter.place,
        location: headquarter.location,
        staff: headquarter.staff,
      });
      toast.success('Headquarter updated successfully!');
      setEditingHeadquarter(null); // Stop editing
      fetchHeadquarters(); // Refresh the headquarters list
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error('Error updating headquarter. Please try again.');
    }
  };

  const handleDeleteHeadquarter = async (id) => {
    if (deletePin === '2024') {
      try {
        await deleteDoc(doc(db, "Headquarters", id));
        toast.success('Headquarter deleted successfully!');
        fetchHeadquarters();
      } catch (error) {
        console.error("Error deleting document: ", error);
        toast.error('Error deleting headquarter. Please try again.');
      } finally {
        setShowDeleteConfirmation(false);
        setDeletePin('');
        setHeadquarterToDelete(null);
      }
    } else {
      toast.error('Incorrect PIN. Please try again.');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleAddStaff = () => {
    setStaff([...staff, { name: '', address: '', phoneNumber: '', email: '' }]);
  };

  const handleStaffChange = (index, field, value) => {
    const updatedStaff = [...staff];
    updatedStaff[index][field] = value;
    setStaff(updatedStaff);
  };

  const handleEditStaff = (headquarter, index, field, value) => {
    const updatedHeadquarter = { ...headquarter };
    updatedHeadquarter.staff[index][field] = value;
    setEditingHeadquarter(updatedHeadquarter);
  };

  const handleAddStaffInEdit = (headquarter) => {
    const updatedHeadquarter = { ...headquarter };
    updatedHeadquarter.staff.push({ name: '', address: '', phoneNumber: '', email: '' });
    setEditingHeadquarter(updatedHeadquarter);
  };

  // Normalize search term for case-insensitive comparison
  const normalizedSearchTerm = searchTerm.toLowerCase();

  const filteredHeadquarters = headquarters.filter(headquarter =>
    headquarter.place.toLowerCase().includes(normalizedSearchTerm) ||
    headquarter.location.toLowerCase().includes(normalizedSearchTerm)
  );

  const indexOfLastHeadquarter = currentPage * headquartersPerPage;
  const indexOfFirstHeadquarter = indexOfLastHeadquarter - headquartersPerPage;
  const currentHeadquarters = filteredHeadquarters.slice(indexOfFirstHeadquarter, indexOfLastHeadquarter);

  const paginate = (direction) => {
    if (direction === 'next' && currentPage < Math.ceil(filteredHeadquarters.length / headquartersPerPage)) {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="headquarters-container">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="delete-confirmation-modal">
          <div className="delete-confirmation-content">
            <h3>Confirm Deletion</h3>
            <p>Enter the PIN "2024" to confirm deletion:</p>
            <input
              type="text"
              value={deletePin}
              onChange={(e) => setDeletePin(e.target.value)}
              placeholder="Enter PIN"
              className="delete-pin-input"
            />
            <div className="delete-confirmation-buttons">
              <button
                className="delete-confirm-button"
                onClick={() => handleDeleteHeadquarter(headquarterToDelete)}
              >
                Confirm
              </button>
              <button
                className="delete-cancel-button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeletePin('');
                  setHeadquarterToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
        <button onClick={() => navigate(-1)} className="back-button" style={{color:"#d6e8ee"}}><i className="bi bi-arrow-left"></i></button>

      <div className="headquarters-header">
        <h1 className="headquarters-title">Headquarters</h1>
        <button className="headquarters-add-button" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Hide Form' : 'Add New Headquarters'}
        </button>
      </div>

      {showAddForm && (
        <form className="headquarters-form" onSubmit={handleAddHeadquarter}>
          <div className="headquarters-form-group">
            <label htmlFor="place">Place:</label>
            <input
              type="text"
              id="place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              required
              className="headquarters-input"
            />
          </div>
          <div className="headquarters-form-group">
            <label htmlFor="location">Location:</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="headquarters-input"
            />
          </div>
          <div className="headquarters-form-group">
            <label>Staff:</label>
            {staff.map((staffMember, index) => (
              <div key={index} className="staff-form-group">
                <input
                  type="text"
                  placeholder="Name"
                  value={staffMember.name}
                  onChange={(e) => handleStaffChange(index, 'name', e.target.value)}
                  className="staff-input"
                />
                <div className="div-hide-date">
                <input
                  type="text"
                  placeholder="Address"
                  value={staffMember.address}
                  onChange={(e) => handleStaffChange(index, 'address', e.target.value)}
                  className="staff-input"
                />
                </div>
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={staffMember.phoneNumber}
                  onChange={(e) => handleStaffChange(index, 'phoneNumber', e.target.value)}
                  className="staff-input"
                />
                <div className="div-hide-date">
                <input
                  type="email"
                  placeholder="Email"
                  
                  value={staffMember.email}
                  onChange={(e) => handleStaffChange(index, 'email', e.target.value)}
                  className="staff-input"
                />
                </div>
              </div>
            ))}
            <button type="button" className="add-staff-button" onClick={handleAddStaff}>
              Add More Staff
            </button>
          </div>
          <button type="submit" className="headquarters-submit-button" disabled={loading}>
            {loading ? 'Adding...' : 'Save'}
          </button>
        </form>
      )}

      <div className="headquarters-search">
        <input
          type="text"
          placeholder="Search HQ..."
          value={searchTerm}
          onChange={handleSearch}
          className="headquarters-search-input form-control"
        />
      </div>

      <div className="table-wrapper">
  <table className="headquarters-table">
    <thead>
      <tr>
        <th>Place</th>
        <th>Location</th>
        <th>Staff</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {currentHeadquarters.map(headquarter => (
        <tr key={headquarter.id}>
          <td>
            {editingHeadquarter?.id === headquarter.id ? (
              <input
                type="text"
                value={editingHeadquarter.place}
                onChange={(e) =>
                  setEditingHeadquarter({ ...editingHeadquarter, place: e.target.value })
                }
              />
            ) : (
              headquarter.place
            )}
          </td>
          <td>
            {editingHeadquarter?.id === headquarter.id ? (
              <input
                type="text"
                value={editingHeadquarter.location}
                onChange={(e) =>
                  setEditingHeadquarter({ ...editingHeadquarter, location: e.target.value })
                }
              />
            ) : (
              headquarter.location
            )}
          </td>
          <td>
            {editingHeadquarter?.id === headquarter.id ? (
              <>
                {editingHeadquarter.staff.map((staffMember, index) => (
                  <div key={index} className="staff-form-group">
                    <input
                      type="text"
                      placeholder="Name"
                      value={staffMember.name}
                      onChange={(e) => handleEditStaff(editingHeadquarter, index, 'name', e.target.value)}
                      className="staff-input"
                    />
                    <div className="div-hide-date">
                    <input
                      type="text"
                      placeholder="Address"
                      value={staffMember.address}
                      onChange={(e) => handleEditStaff(editingHeadquarter, index, 'address', e.target.value)}
                      className="staff-input"
                    />
                    </div>
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={staffMember.phoneNumber}
                      onChange={(e) => handleEditStaff(editingHeadquarter, index, 'phoneNumber', e.target.value)}
                      className="staff-input"
                    />
                    <div className="div-hide-date">
                    <input
                      type="email"
                      placeholder="Email"
                      value={staffMember.email}
                      onChange={(e) => handleEditStaff(editingHeadquarter, index, 'email', e.target.value)}
                      className="staff-input"
                    />
                    </div>
                  </div>
                ))}
                <button type="button" className="add-staff-button" onClick={() => handleAddStaffInEdit(editingHeadquarter)}>
                  Add More Staff
                </button>
              </>
            ) : (
              <ul>
                {(headquarter.staff || []).map((staffMember, index) => (
                  <li key={index}>
                    <strong>{staffMember.name}</strong>, {staffMember.phoneNumber}
                  </li>
                ))}
              </ul>
            )}
          </td>
          <td>
            {editingHeadquarter?.id === headquarter.id ? (
              <>
                <button className="headquarters-save-button btn btn-success" onClick={() => handleUpdateHeadquarter(editingHeadquarter)}>
                  Save
                </button>
                <button className="headquarters-cancel-button btn btn-danger" onClick={() => setEditingHeadquarter(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="headquarters-update-button btn btn-success" onClick={() => setEditingHeadquarter(headquarter)}>
                  Update
                </button>
                <button
                  className="headquarters-delete-button btn btn-danger"
                  onClick={() => {
                    setHeadquarterToDelete(headquarter.id);
                    setShowDeleteConfirmation(true);
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      <div className="headquarters-pagination">
        <button
          className="headquarters-pagination-button"
          onClick={() => paginate('prev')}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <button
          className="headquarters-pagination-button"
          onClick={() => paginate('next')}
          disabled={currentPage === Math.ceil(filteredHeadquarters.length / headquartersPerPage)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Headquarters;