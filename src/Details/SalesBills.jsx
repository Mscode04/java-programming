import React, { useState, useEffect } from 'react';
import { db } from "../Firebase/config";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Sellers.css'; // Import separate CSS file
import { useNavigate } from 'react-router-dom';

function Sellers() {
  const [dealerName, setDealerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSeller, setEditingSeller] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [sellerToDelete, setSellerToDelete] = useState(null); // Track which seller is being deleted
  const sellersPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "Sellers"));
    const sellersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSellers(sellersList);
    setLoading(false);
  };

  const handleAddSeller = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "Sellers"), {
        dealerName,
        phone,
        email,
      });
      toast.success('Seller added successfully!');
      setDealerName('');
      setPhone('');
      setEmail('');
      setShowAddForm(false);
      fetchSellers();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error('Error adding seller. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSeller = async (seller) => {
    try {
      await updateDoc(doc(db, "Sellers", seller.id), {
        dealerName: seller.dealerName,
        phone: seller.phone,
        email: seller.email,
      });
      toast.success('Seller updated successfully!');
      setEditingSeller(null); // Stop editing
      fetchSellers(); // Refresh the sellers list
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error('Error updating seller. Please try again.');
    }
  };

  const handleDeleteSeller = async (id) => {
    if (deletePin === '2024') {
      try {
        await deleteDoc(doc(db, "Sellers", id));
        toast.success('Seller deleted successfully!');
        fetchSellers();
      } catch (error) {
        console.error("Error deleting document: ", error);
        toast.error('Error deleting seller. Please try again.');
      } finally {
        setShowDeleteConfirmation(false);
        setDeletePin('');
        setSellerToDelete(null);
      }
    } else {
      toast.error('Incorrect PIN. Please try again.');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Normalize search term for case-insensitive comparison
  const normalizedSearchTerm = searchTerm.toLowerCase();

  const filteredSellers = sellers.filter(seller => {
    console.log('Seller:', seller);
    console.log('Dealer Name:', seller.dealerName);
    console.log('Phone:', seller.phone);
    console.log('Email:', seller.email);
  
    return (
      (seller.dealerName?.toLowerCase() || '').includes(normalizedSearchTerm) ||
      (seller.phone?.toLowerCase() || '').includes(normalizedSearchTerm) ||
      (seller.email?.toLowerCase() || '').includes(normalizedSearchTerm)
    );
  });

  const indexOfLastSeller = currentPage * sellersPerPage;
  const indexOfFirstSeller = indexOfLastSeller - sellersPerPage;
  const currentSellers = filteredSellers.slice(indexOfFirstSeller, indexOfLastSeller);

  const paginate = (direction) => {
    if (direction === 'next' && currentPage < Math.ceil(filteredSellers.length / sellersPerPage)) {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="sellers-container">
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
        <div className="sellers-delete-confirmation-modal">
          <div className="sellers-delete-confirmation-content">
            <h3>Confirm Deletion</h3>
            <p>Enter the PIN "2024" to confirm deletion:</p>
            <input
              type="text"
              value={deletePin}
              onChange={(e) => setDeletePin(e.target.value)}
              placeholder="Enter PIN"
              className="sellers-delete-pin-input"
            />
            <div className="sellers-delete-confirmation-buttons">
              <button
                className="sellers-delete-confirm-button"
                onClick={() => handleDeleteSeller(sellerToDelete)}
              >
                Confirm
              </button>
              <button
                className="sellers-delete-cancel-button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeletePin('');
                  setSellerToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => navigate(-1)} className="sellers-back-button" style={{ color: "#d6e8ee" }}><i className="bi bi-arrow-left"></i></button>

      <div className="sellers-header">
        <h1 className="sellers-title">Sellers</h1>
        <button className="sellers-add-button" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Hide Form' : 'Add New Seller'}
        </button>
      </div>

      {showAddForm && (
        <form className="sellers-form" onSubmit={handleAddSeller}>
          <div className="sellers-form-group">
            <label htmlFor="dealerName">Dealer Name:</label>
            <input
              type="text"
              id="dealerName"
              value={dealerName}
              onChange={(e) => setDealerName(e.target.value)}
              required
              className="sellers-input"
            />
          </div>
          <div className="sellers-form-group">
            <label htmlFor="phone">Phone:</label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="sellers-input"
            />
          </div>
          <div className="sellers-form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sellers-input"
            />
          </div>
          <button type="submit" className="sellers-submit-button" disabled={loading}>
            {loading ? 'Adding...' : 'Save'}
          </button>
        </form>
      )}

      <div className="sellers-search">
        <input
          type="text"
          placeholder="Search Seller..."
          value={searchTerm}
          onChange={handleSearch}
          className="sellers-search-input form-control"
        />
      </div>

      <div className="sellers-table-wrapper">
        <table className="sellers-table">
          <thead>
            <tr>
              <th>Dealer Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSellers.map(seller => (
              <tr key={seller.id}>
                <td>
                  {editingSeller?.id === seller.id ? (
                    <input
                      type="text"
                      value={editingSeller.dealerName}
                      onChange={(e) =>
                        setEditingSeller({ ...editingSeller, dealerName: e.target.value })
                      }
                    />
                  ) : (
                    seller.dealerName
                  )}
                </td>
                <td>
                  {editingSeller?.id === seller.id ? (
                    <input
                      type="text"
                      value={editingSeller.phone}
                      onChange={(e) =>
                        setEditingSeller({ ...editingSeller, phone: e.target.value })
                      }
                    />
                  ) : (
                    seller.phone
                  )}
                </td>
                <td>
                  {editingSeller?.id === seller.id ? (
                    <input
                      type="email"
                      value={editingSeller.email}
                      onChange={(e) =>
                        setEditingSeller({ ...editingSeller, email: e.target.value })
                      }
                    />
                  ) : (
                    seller.email
                  )}
                </td>
                <td>
                  {editingSeller?.id === seller.id ? (
                    <>
                      <button className="sellers-save-button btn btn-success" onClick={() => handleUpdateSeller(editingSeller)}>
                        Save
                      </button>
                      <button className="sellers-cancel-button btn btn-danger" onClick={() => setEditingSeller(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="sellers-update-button btn btn-success" onClick={() => setEditingSeller(seller)}>
                        Update
                      </button>
                      <button
                        className="sellers-delete-button btn btn-danger"
                        onClick={() => {
                          setSellerToDelete(seller.id);
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

      <div className="sellers-pagination">
        <button
          className="sellers-pagination-button"
          onClick={() => paginate('prev')}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <button
          className="sellers-pagination-button"
          onClick={() => paginate('next')}
          disabled={currentPage === Math.ceil(filteredSellers.length / sellersPerPage)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Sellers;