import React, { useState, useEffect } from 'react';
import { db } from "../Firebase/config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import './Doctor.css';
import { Link ,useNavigate} from 'react-router-dom';

function Doctor() {
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
  const navigate=useNavigate()

  useEffect(() => {
    fetchAreas();
    fetchHeadquarters();
  }, []);

  const fetchAreas = async () => {
    const querySnapshot = await getDocs(collection(db, "Areas"));
    const areas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAreasList(areas.map(area => ({ value: area.id, label: area.name })));
  };

  const fetchHeadquarters = async () => {
    const querySnapshot = await getDocs(collection(db, "Headquarters"));
    const headquarters = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setHeadquartersList(headquarters.map(hq => ({ value: hq.id, label: hq.place, staff: hq.staff })));
  };

  const handleHeadquartersChange = (selectedOption) => {
    setHeadquarters(selectedOption);
    if (selectedOption && selectedOption.staff) {
      const staffOptions = selectedOption.staff.map(staffMember => ({
        value: staffMember.name,
        label: staffMember.name,
      }));
      setStaffList(staffOptions);
    } else {
      setStaffList([]);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "Doctors"), {
        name,
        address,
        phoneNumber,
        email,
        designation,
        area: area ? area.label : '',
        headquarters: headquarters ? headquarters.label : '',
        staff: staff ? staff.label : '',
      });
      toast.success('Doctor added successfully!');
      setName('');
      setAddress('');
      setPhoneNumber('');
      setEmail('');
      setDesignation('');
      setArea(null);
      setHeadquarters(null);
      setStaff(null);
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error('Error adding doctor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="docter-main">
      <button onClick={() => navigate(-1)} className="back-button" style={{color:"#d6e8ee"}}><i className="bi bi-arrow-left"></i></button>

    <div className="doctor-container">
      {/* <Link to="/main/doctor-list" className='btn btn-warning mb-2'>See All Docters</Link> */}
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

      <h1 className="doctor-title">Add New Doctor</h1>
      <form className="doctor-form" onSubmit={handleAddDoctor}>
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
            className="doctor-input"
          />
        </div>

        <div className="doctor-form-group">
          <label htmlFor="area">Area:</label>
          <Select
            id="area"
            value={area}
            required
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
            required
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
            required
          />
        </div>

        <button type="submit" className="doctor-submit-button" disabled={loading}>
          {loading ? 'Adding...' : 'Add Doctor'}
        </button>
      </form>
    </div>
    </div>
  );
}

export default Doctor;