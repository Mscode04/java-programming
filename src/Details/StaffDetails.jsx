import React, { useEffect, useState } from "react";
import { db } from "../Firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./StaffDetails.css";
import { useNavigate } from "react-router-dom";

function StaffDetails() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHQ, setSelectedHQ] = useState("All");
  const [hqList, setHQList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Headquarters"));
        const staffList = [];
        const hqSet = new Set(); // To store unique HQ names
        querySnapshot.forEach((doc) => {
          const place = doc.data().place; // Get HQ name
          hqSet.add(place); // Add HQ name to the set
          if (doc.data().staff) {
            doc.data().staff.forEach((staff) => {
              staffList.push({ ...staff, place }); // Add HQ name to each staff
            });
          }
        });
        setStaffs(staffList);
        setHQList(["All", ...Array.from(hqSet)]); // Convert set to array and add "All" option
      } catch (error) {
        console.error("Error fetching staff details:", error);
        toast.error("Failed to load staff details.");
      } finally {
        setLoading(false);
      }
    };
    fetchStaffs();
  }, []);

  // Filter staff based on search query and selected HQ
  const filteredStaffs = staffs.filter((staff) => {
    const matchesName = staff.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHQ = selectedHQ === "All" || staff.place === selectedHQ;
    return matchesName && matchesHQ;
  });

  return (
    <div className="staffdetails-container">
      <ToastContainer position="top-center" autoClose={3000} />
      <button onClick={() => navigate(-1)} className="back-button">
      <i className="bi bi-arrow-left"  style={{color:"#d6e8ee"}}></i>
      </button>
      <h1 className="staffdetails-title">Staffs</h1>

      {/* Search and Filter Section */}
      <div className="staffdetails-filters">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="staffdetails-search"
        />
        <select
          value={selectedHQ}
          onChange={(e) => setSelectedHQ(e.target.value)}
          className="staffdetails-hq-filter"
        >
          {hqList.map((hq, index) => (
            <option key={index} value={hq}>
              {hq}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="staffdetails-loading">
          <img
            src="https://i.pinimg.com/originals/65/ba/48/65ba488626025cff82f091336fbf94bb.gif"
            alt="Loading..."
          />
        </div>
      ) : (
        <table className="staffdetails-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>HQ Name</th>
              
            
              
            </tr>
          </thead>
          <tbody>
            {filteredStaffs.length > 0 ? (
              filteredStaffs.map((staff, index) => (
                <tr key={index}>
                  <td>{staff.name}</td>
                  <td>{staff.place}</td>
                  
                 

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="staffdetails-no-data">
                  No staff found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StaffDetails;