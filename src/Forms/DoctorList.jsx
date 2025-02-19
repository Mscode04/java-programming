import React, { useState, useEffect } from 'react';
import { db } from '../Firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import './DoctorList.css'; // Add your custom styles for the table and modal

Modal.setAppElement('#root'); // Required for accessibility

function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [confirmationPin, setConfirmationPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate=useNavigate()

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'Doctors'));
      const doctorsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching doctors: ', error);
      toast.error('Error fetching doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirmationPin === '2024') {
      try {
        await deleteDoc(doc(db, 'Doctors', selectedDoctorId));
        toast.success('Doctor deleted successfully!');
        fetchDoctors(); // Refresh the list after deletion
        closeDeleteModal();
      } catch (error) {
        console.error('Error deleting doctor: ', error);
        toast.error('Error deleting doctor. Please try again.');
      }
    } else {
      toast.error('Incorrect PIN. Please try again.');
    }
  };

  const openDeleteModal = (doctorId) => {
    setSelectedDoctorId(doctorId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setConfirmationPin('');
    setSelectedDoctorId(null);
  };

  return (
    <div className="doctor-list-container">
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

<button onClick={() => navigate(-1)} className="back-button" style={{color:"#d6e8ee"}}><i className="bi bi-arrow-left"></i></button><h1 className="doctor-list-title">Doctor List</h1>
      <Link to="/main/doctor" className="add-doctor-link">
        Add New Doctor
      </Link>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="doctor-table">
          <thead>
            <tr  className='first-main'>
              <th className='first-hd'>Name</th>
              <th>Staff</th>
              <th>Area</th>
              <th>Headquarters</th>
              <th className='first-hd-2'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id} className='docter-list-last'>
                <td className='name-last-docter'>{doctor.name}</td>
                <td>{doctor.staff}</td>
                <td>{doctor.area}</td>
                <td>{doctor.headquarters}</td>
                <td className='action-last'>
                  <Link to={`/main/update-doctor/${doctor.id}`} className="update-button">
                    Update
                  </Link>
                  <button
                    className="delete-button"
                    onClick={() => openDeleteModal(doctor.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Delete Confirmation Modal"
        className="delete-modal"
        overlayClassName="delete-modal-overlay"
      >
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this doctor? Enter the confirmation PIN to proceed.</p>
        <input
          type="password"
          placeholder="Enter PIN"
          value={confirmationPin}
          onChange={(e) => setConfirmationPin(e.target.value)}
          className="pin-input"
        />
        <div className="modal-buttons">
          <button onClick={handleDelete} className="confirm-delete-button">
            Confirm Delete
          </button>
          <button onClick={closeDeleteModal} className="cancel-delete-button">
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default DoctorList;