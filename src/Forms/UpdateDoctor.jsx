import React, { useState, useEffect } from 'react';
import { db } from '../Firebase/config';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'; // Add missing imports
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import './UpdateDoctor.css'; // Add your custom styles

function UpdateDoctor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [area, setArea] = useState(null);
  const [headquarters, setHeadquarters] = useState(null);
  const [staff, setStaff] = useState(null);
  const [areasList, setAreasList] = useState([]);
  const [headquartersList, setHeadquartersList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctor();
    fetchAreas();
    fetchHeadquarters();
  }, []);

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'Doctors', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const doctorData = docSnap.data();
        setName(doctorData.name);
        setAddress(doctorData.address);
        setPhoneNumber(doctorData.phoneNumber);
        setEmail(doctorData.email);
        setDesignation(doctorData.designation);
        setArea({ value: doctorData.area, label: doctorData.area });
        setHeadquarters({ value: doctorData.headquarters, label: doctorData.headquarters });
        setStaff({ value: doctorData.staff, label: doctorData.staff });
      } else {
        toast.error('Doctor not found!');
        navigate('/doc-list');
      }
    } catch (error) {
      console.error('Error fetching doctor: ', error);
      toast.error('Error fetching doctor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    const querySnapshot = await getDocs(collection(db, 'Areas')); // Use imported functions
    const areas = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setAreasList(areas.map((area) => ({ value: area.id, label: area.name })));
  };

  const fetchHeadquarters = async () => {
    const querySnapshot = await getDocs(collection(db, 'Headquarters')); // Use imported functions
    const headquarters = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setHeadquartersList(headquarters.map((hq) => ({ value: hq.id, label: hq.place })));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docRef = doc(db, 'Doctors', id);
      await updateDoc(docRef, {
        name,
        address,
        phoneNumber,
        email,
        designation,
        area: area ? area.label : '',
        headquarters: headquarters ? headquarters.label : '',
        staff: staff ? staff.label : '',
      });
      toast.success('Doctor updated successfully!');
      navigate('/main/doctor-list');
    } catch (error) {
      console.error('Error updating doctor: ', error);
      toast.error('Error updating doctor. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleHeadquartersChange = (selectedOption) => {
    setHeadquarters(selectedOption);
    const selectedHeadquarter = headquartersList.find(hq => hq.value === selectedOption.value);
    if (selectedHeadquarter && selectedHeadquarter.staff) {
      setStaffList(selectedHeadquarter.staff.map(staff => ({ value: staff.name, label: staff.name })));
    } else {
      setStaffList([]);
    }
  };
  return (
    <div className="docter-main">
            <button onClick={() => navigate(-1)} className="back-button" style={{color:"#d6e8ee"}}><i className="bi bi-arrow-left"></i></button>

    <div className="update-doctor-container">
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

      <h1 className="update-doctor-title">Update Doctor</h1>
      <form className="update-doctor-form" onSubmit={handleUpdate}>
      <div className="doctor-form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="doctor-input"
          />
        </div>

        <div className="doctor-form-group">
          <label htmlFor="address">Address:</label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="doctor-input"
          />
        </div>

        <div className="doctor-form-group">
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="doctor-input"
          />
        </div>

        <div className="doctor-form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="doctor-input"
          />
        </div>

        <div className="doctor-form-group">
          <label htmlFor="designation">Designation:</label>
          <input
            type="text"
            id="designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            required
            className="doctor-input"
          />
        </div>

        <div className="doctor-form-group">
          <label htmlFor="area">Area:</label>
          <Select
            id="area"
            value={area}
            onChange={(selectedOption) => setArea(selectedOption)}
            options={areasList}
            placeholder="Select Area"
            isSearchable
          />
        </div>

        <div className="doctor-form-group">
          <label htmlFor="headquarters">Headquarters:</label>
          <Select
            id="headquarters"
            value={headquarters}
            onChange={handleHeadquartersChange}
            options={headquartersList}
            placeholder="Select Headquarters"
            isSearchable
          />
        </div>

        <div className="doctor-form-group">
          <label htmlFor="staff">Staff:</label>
          <Select
            id="staff"
            value={staff}
            onChange={(selectedOption) => setStaff(selectedOption)}
            options={staffList}
            placeholder="Select Staff"
            isSearchable
          />
        </div>
        <button type="submit" className="update-doctor-button" disabled={loading}>
          {loading ? 'Updating...' : 'Update Doctor'}
        </button>
      </form>
    </div>
    </div>
  );
}

export default UpdateDoctor;