import React, { useState, useEffect } from 'react';
import { db } from "../Firebase/config";
import { collection, getDocs ,addDoc} from "firebase/firestore";
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Create.css'; // Import CSS for styling
import { useNavigate } from 'react-router-dom';

function Create() {
  // Section 0: General Details
  const [reportOfYear, setReportOfYear] = useState('');
  const navigate=useNavigate()
  // Section 1: Doctor Details
  const [doctorName, setDoctorName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [area, setArea] = useState(null);
  const [headquarters, setHeadquarters] = useState(null);
  const [staff, setStaff] = useState(null);
  const [doctorsList, setDoctorsList] = useState([]);
  const [areasList, setAreasList] = useState([]);
  const [headquartersList, setHeadquartersList] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Section 2: Activity Details
  const [activityMonth, setActivityMonth] = useState('');
  const [activityDay, setActivityDay] = useState('');
  const [activityAmount, setActivityAmount] = useState('');
  const [mr, setMr] = useState('');
  const [abm, setAbm] = useState('');
  const [rsm, setRsm] = useState('');
  const [targetedTimes, setTargetedTimes] = useState(3.5);

  // Section 3: Prescribed Products
  const [prescribedProducts, setPrescribedProducts] = useState([{ productName: '' }]);

  // Section 4: Targeted Products
  const [targetedProducts, setTargetedProducts] = useState([{ productName: ''}]);

  // Section 5: Last Year Amount
  const [lastYearAmount, setLastYearAmount] = useState('');

  // Section 6: Dynamic Date and Amount
  const [dynamicFields, setDynamicFields] = useState([{ date: '', amount: '' }]);

  const [productsList, setProductsList] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "Products"));
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(products);
    
    setProductsList(products.map(product => ({ value: product.id, label: product.productName, ...product })));
  };

  // Fetch data from Firebase
  useEffect(() => {
    fetchDoctors();
    fetchAreas();
    fetchHeadquarters();
    fetchProducts()
  }, []);

  const fetchDoctors = async () => {
    const querySnapshot = await getDocs(collection(db, "Doctors"));
    const doctors = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDoctorsList(doctors.map(doctor => ({ value: doctor.id, label: doctor.name, ...doctor })));
  };

  const fetchAreas = async () => {
    const querySnapshot = await getDocs(collection(db, "Areas"));
    const areas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAreasList(areas.map(area => ({ value: area.id, label: area.name })));
  };

  const fetchHeadquarters = async () => {
    const querySnapshot = await getDocs(collection(db, "Headquarters"));
    const headquarters = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setHeadquartersList(headquarters.map(hq => ({ value: hq.id, label: hq.place, ...hq })));
  };

  const handleDoctorChange = (selectedOption) => {
    setDoctorName(selectedOption);
    const selectedDoctor = doctorsList.find(doctor => doctor.value === selectedOption.value);
    if (selectedDoctor) {
      setAddress(selectedDoctor.address || '');
      setPhone(selectedDoctor.phoneNumber || '');
      setDesignation(selectedDoctor.designation || '');
      setArea(selectedDoctor.area ? { value: selectedDoctor.area, label: selectedDoctor.area } : null);
      setHeadquarters(selectedDoctor.headquarters ? { value: selectedDoctor.headquarters, label: selectedDoctor.headquarters } : null);
      setStaff(selectedDoctor.staff ? { value: selectedDoctor.staff, label: selectedDoctor.staff } : null);
    }
  };
  const handlePrescribedProductChange = (selectedOption, index) => {
    const newProducts = [...prescribedProducts];
    newProducts[index].productName = selectedOption ? selectedOption.label : '';
    setPrescribedProducts(newProducts);
  };
  
  const handleTargetedProductChange = (selectedOption, index) => {
    const newProducts = [...targetedProducts];
    newProducts[index].productName = selectedOption ? selectedOption.label : '';
    setTargetedProducts(newProducts);
  };
  const handleHeadquartersChange = (selectedOption) => {
    setHeadquarters(selectedOption);
    const selectedHeadquarter = headquartersList.find(hq => hq.value === selectedOption.value);
    if (selectedHeadquarter && selectedHeadquarter.staff) {
      setStaffList(selectedHeadquarter.staff.map(staff => ({ value: staff.name, label: staff.name, ...staff })));
    } else {
      setStaffList([]);
    }
  };

  const handleAddPrescribedProduct = () => {
    setPrescribedProducts([...prescribedProducts, { productName: '' }]);
  };

  const handleAddTargetedProduct = () => {
    setTargetedProducts([...targetedProducts, { productName: '' }]);
  };

  const handleAddDynamicField = () => {
    setDynamicFields([...dynamicFields, { date: '', amount: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Prepare the data to be saved
      const reportData = {
        // Section 0: General Details
        reportOfYear,
  
        // Section 1: Doctor Details
        doctorName: doctorName.label,
        address,
        phone,
        designation,
        area: area ? area.label : null,
        headquarters: headquarters ? headquarters.label : null,
        staff: staff ? staff.label : null,
  
        // Section 2: Activity Details
        activityMonth,
        activityDay,
        activityAmount,
        mr,
        abm,
        rsm,
        targetedTimes,
  
        // Section 3: Prescribed Products
        prescribedProducts: prescribedProducts.map(product => product.productName),
  
        // Section 4: Targeted Products
        targetedProducts: targetedProducts.map(product => product.productName),
  
        // Section 5: Last Year Amount
        lastYearAmount,
  
        // Section 6: Dynamic Date and Amount
        dynamicFields,
  
        // Section 7: Calculated Fields
        totalBusiness,
        percentage,
        expectedAmount,
        status: statusColor === 'very-bad' ? 'Very Bad' :
        statusColor === 'bad' ? 'Bad' :
        statusColor === 'good' ? 'Good' :
        statusColor === 'very-good' ? 'Very Good' :
        'Reload'
      };
  
      // Add the report data to the "Reports" collection in Firestore
      const docRef = await addDoc(collection(db, "Reports"), reportData);
  
      // Notify the user that the report was created successfully
      toast.success(`Report created successfully with ID: ${docRef.id}`);
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error("Failed to create report. Please try again.");
    }
  };

// Calculate Total Business
const totalBusiness = parseFloat(lastYearAmount || 0) + dynamicFields.reduce((sum, field) => sum + parseFloat(field.amount || 0), 0);
// Calculate Expected Amount
const expectedAmount = parseFloat(activityAmount || 0) * parseFloat(targetedTimes || 0);
// Calculate Percentage
const percentage = totalBusiness === 0 ? 0 : ((parseFloat( totalBusiness|| 0) /expectedAmount ) * 100).toFixed(2);

// Determine Status
const getStatusColor = () => {
  if (percentage > 100) return 'reload'; // Above 100%
  if (percentage >= 75) return 'very-good'; // 75-100%
  if (percentage >= 50) return 'good'; // 50-75%
  if (percentage >= 25) return 'bad'; // 25-50%
  return 'very-bad'; // Below 25%
};

const statusColor = getStatusColor();

  return (
    <div className="cretemain">
       <button className="adminreg-back-button" style={{ color: "#d6e8ee", backgroundColor: "transparent", border: "none" }} onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i>
        </button>
    <div className="create-report-container">
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

      <h1 className="create-report-title">New Report</h1>

      <form onSubmit={handleSubmit}>
        {/* Section 0: General Details */}
        <div className="section">
          <h2>General Details</h2>
          <div className="form-group">
            <label>Report of Year:</label>
            <input
              type="text"
              value={reportOfYear}
              onChange={(e) => setReportOfYear(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Section 1: Doctor Details */}
        <div className="section">
          <h2>Doctor Details</h2>
          <div className="form-group">
            <label>Doctor Name:</label>
            <Select
              value={doctorName}
              onChange={handleDoctorChange}
              options={doctorsList}
              placeholder="Select Doctor"
              isSearchable
              required
            />
          </div>
          <div className="form-group">
            <label>Address:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              
            />
          </div>
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              
            />
          </div>
          <div className="form-group">
            <label>Designation:</label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              
            />
          </div>
          <div className="form-group">
            <label>Area:</label>
            <Select
              value={area}
              onChange={(selectedOption) => setArea(selectedOption)}
              options={areasList}
              placeholder="Select Area"
              isSearchable
            />
          </div>
          <div className="form-group">
            <label>Headquarters:</label>
            <Select
              value={headquarters}
              onChange={handleHeadquartersChange}
              options={headquartersList}
              placeholder="Select Headquarters"
              isSearchable
            />
          </div>
          <div className="form-group">
            <label>Staff:</label>
            <Select
              value={staff}
              onChange={(selectedOption) => setStaff(selectedOption)}
              options={staffList}
              placeholder="Select Staff"
              isSearchable
              required
            />
          </div>
        </div>

        {/* Section 2: Activity Details */}
        <div className="section">
          <h2>Activity Details</h2>
          <div className="form-group">
          <label>Month:</label>
<input
  type="month"
  value={activityMonth}
  onChange={(e) => setActivityMonth(e.target.value)}
  required
/>

          </div>
          <div className="div-hide-date">
          <div className="form-group">
            <label>Day:</label>
            <input
              type="text"
              value={activityDay}
              onChange={(e) => setActivityDay(e.target.value)}
              
            />
          </div>
          </div>
          <div className="form-group">
            <label>Amount:</label>
            <input
              type="number"
              value={activityAmount}
              onChange={(e) => setActivityAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>MR:</label>
            <input
              type="text"
              value={mr}
              onChange={(e) => setMr(e.target.value)}
              
            />
          </div>
          <div className="form-group">
            <label>ABM:</label>
            <input
              type="text"
              value={abm}
              onChange={(e) => setAbm(e.target.value)}
              
            />
          </div>
          <div className="form-group">
            <label>RSM:</label>
            <input
              type="text"
              value={rsm}
              onChange={(e) => setRsm(e.target.value)}
              
            />
          </div>
          <div className="form-group">
            <label>Targeted Times:</label>
            <input
              type="number"
              value={targetedTimes}
              onChange={(e) => setTargetedTimes(e.target.value)}
              required
            />
          </div>
        </div>

       {/* Section 3: Prescribed Products */}
<div className="section">
  <h2>Prescribed Products</h2>
  {prescribedProducts.map((product, index) => (
    <div key={index} className="form-group products-names">
      <label>Product Name:</label>
      <Select
        value={productsList.find(option => option.label === product.productName)}
        onChange={(selectedOption) => handlePrescribedProductChange(selectedOption, index)}
        options={productsList}
        placeholder="Select Product"
        
        isSearchable
      />
    </div>
  ))}
  <button type="button" onClick={handleAddPrescribedProduct}>Add More</button>
</div>

{/* Section 4: Targeted Products */}
<div className="section">
  <h2>Targeted Products</h2>
  {targetedProducts.map((product, index) => (
    <div key={index} className="form-group">
      <label>Product Name:</label>
      <Select
        value={productsList.find(option => option.label === product.productName)}
        onChange={(selectedOption) => handleTargetedProductChange(selectedOption, index)}
        options={productsList}
        placeholder="Select Product"
        
        isSearchable
      />
    </div>
  ))}
  <button type="button" onClick={handleAddTargetedProduct}>Add More</button>
</div>

        {/* Section 5: Last Year Amount */}
        <div className="section">
          <h2>Last Year Amount</h2>
          <div className="form-group">
            <label>Amount:</label>
            <input
              type="number"
              value={lastYearAmount}
              onChange={(e) => setLastYearAmount(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Section 6: Dynamic Date and Amount */}
        <div className="section">
          <h2>Dynamic Date and Amount</h2>
          {dynamicFields.map((field, index) => (
            <div key={index} className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={field.date}
                onChange={(e) => {
                  const newFields = [...dynamicFields];
                  newFields[index].date = e.target.value;
                  setDynamicFields(newFields);
                }}
                required
              />
              <label>Amount:</label>
              <input
                type="number"
                value={field.amount}
                onChange={(e) => {
                  const newFields = [...dynamicFields];
                  newFields[index].amount = e.target.value;
                  setDynamicFields(newFields);
                }}
                required
              />
            </div>
          ))}
          <button type="button" onClick={handleAddDynamicField}>Add More</button>
        </div>

        {/* Section 7: Total Business */}
        <div className="section">
        <h2>Total Business</h2>
        <div className="form-group">
          <label>Total Business:</label>
          <input
            type="text"
            value={totalBusiness}
            readOnly
          />
        </div>
        <div className="form-group">
          <label>Percentage:</label>
          <input
            type="text"
            value={`${percentage}%`}
            readOnly
          />
        </div>
        <div className="form-group">
          <label>Expected Amount:</label>
          <input
            type="text"
            value={expectedAmount}
            readOnly
          />
        </div>
        <div className="form-group">
  <label>Status:</label>
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <div style={{
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: 
        statusColor === 'very-bad' ? 'red' :
        statusColor === 'bad' ? 'orange' :
        statusColor === 'good' ? 'yellow' :
        statusColor === 'very-good' ? 'green' :
        'blue', // For reload
      marginRight: '8px'
    }} />
    <span>
      {statusColor === 'very-bad' ? 'Very Bad' : 
       statusColor === 'bad' ? 'Bad' : 
       statusColor === 'good' ? 'Good' : 
       statusColor === 'very-good' ? 'Very Good' : 
       'Reload'}
    </span>
  </div>
</div>
        </div>

        <button type="submit" className="submit-button">Submit Report</button>
      </form>
    </div>
    </div>
  );
}

export default Create;