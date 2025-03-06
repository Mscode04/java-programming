import React, { useState, useEffect } from 'react';
import { db } from "../Firebase/config";
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import './PurchaseBill.css';
import { useNavigate } from 'react-router-dom';
function PurchaseBill() {
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const [goldRate, setGoldRate] = useState(0);
  const [selectedSeller, setSelectedSeller] = useState('');
  const [productEntries, setProductEntries] = useState([{ productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1 }]);

  // Fetch sellers, products, and gold rate on component mount
  useEffect(() => {
    fetchSellers();
    fetchProducts();
    fetchGoldRate();
  }, []);

  // Fetch sellers from Firestore
  const fetchSellers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Sellers"));
      setSellers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching sellers: ", error);
      alert("An error occurred while fetching sellers.");
    }
  };

  // Fetch products from Firestore
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Products"));
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching products: ", error);
      alert("An error occurred while fetching products.");
    }
  };

  // Fetch gold rate from Firestore
  const fetchGoldRate = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const querySnapshot = await getDocs(collection(db, "goldPrices"));
      const rate = querySnapshot.docs.find(doc => doc.data().date === today)?.data().amount || 0;
      setGoldRate(rate);
    } catch (error) {
      console.error("Error fetching gold rate: ", error);
      alert("An error occurred while fetching the gold rate.");
    }
  };

  // Handle changes in product entries
  const handleProductChange = (index, field, value) => {
    const updatedEntries = [...productEntries];
    updatedEntries[index][field] = value;
    setProductEntries(updatedEntries);
  };

  // Add a new product entry
  const addProductEntry = () => {
    setProductEntries([...productEntries, { productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1 }]);
  };

  // Remove a product entry
  const removeProductEntry = (index) => {
    if (productEntries.length > 1) {
      setProductEntries(productEntries.filter((_, i) => i !== index));
    }
  };

  // Calculate net weight for a product entry
  const calculateNetWeight = (entry) => entry.gramWeight - entry.stoneWeight;

  // Calculate net price for a product entry
  const calculateNetPrice = (entry) => calculateNetWeight(entry) * goldRate * entry.quantity;

  // Update stock in Firestore
  const updateStock = async (entry) => {
    if (!entry.productId) return;

    const stockRef = doc(db, "Stock", entry.productId);
    const stockSnap = await getDoc(stockRef);
    const product = products.find(p => p.id === entry.productId);
    if (!product) return;

    const netWeight = calculateNetWeight(entry);

    try {
      if (stockSnap.exists()) {
        const currentStock = stockSnap.data();
        await updateDoc(stockRef, {
          quantity: currentStock.quantity + entry.quantity,
          gramWeight: currentStock.gramWeight + entry.gramWeight,
          stoneWeight: currentStock.stoneWeight + entry.stoneWeight,
          netWeight: currentStock.netWeight + netWeight,
          lastUpdated: new Date().toISOString(),
          goldRate: goldRate,
          productName: product.productName
        });
      } else {
        await setDoc(stockRef, {
          productId: entry.productId,
          productName: product.productName,
          quantity: entry.quantity,
          gramWeight: entry.gramWeight,
          stoneWeight: entry.stoneWeight,
          netWeight: netWeight,
          goldRate: goldRate,
          addedOn: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error updating stock: ", error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate seller and product entries
    if (!selectedSeller || productEntries.some(entry => !entry.productId)) {
      alert("Please select a seller and products.");
      return null;
    }

    try {
      const seller = sellers.find(s => s.id === selectedSeller);
      if (!seller) {
        alert("Seller not found.");
        return null;
      }

      // Validate seller data
      if (!seller.dealerName || !seller.phone) {
        alert("Seller data is incomplete. Please ensure the seller has a name, contact number");
        return null;
      }

      // Prepare bill details
      const billDetails = {
        sellerId: selectedSeller,
        sellerName: seller.dealerName,
        sellerContact: seller.phone,
        products: productEntries.map(entry => {
          const product = products.find(p => p.id === entry.productId);
          return {
            productId: entry.productId,
            productName: product ? product.productName : 'Unknown Product',
            gramWeight: entry.gramWeight,
            stoneWeight: entry.stoneWeight,
            goldRate,
            quantity: entry.quantity,
            netWeight: calculateNetWeight(entry),
            netPrice: calculateNetPrice(entry),
          };
        }),
        date: new Date().toISOString()
      };

      console.log("Submitting bill details: ", billDetails);

      // Add the bill document to the PurchaseBills collection
      const billRef = await addDoc(collection(db, "PurchaseBills"), billDetails);

      // Update stock for each product
      for (const entry of productEntries) {
        await updateStock(entry);
      }

      // Reset form and show success message
      alert("Purchase Bill Added Successfully!");
      setSelectedSeller('');
      setProductEntries([{ productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1 }]);

      return billRef.id; // Return the bill ID
    } catch (error) {
      console.error("Error adding bill: ", error);
      alert(`An error occurred while adding the bill: ${error.message}`);
      return null;
    }
  };

  // Handle print functionality
  const handlePrint = async () => {
    const billId = await handleSubmit({ preventDefault: () => {} }); // Simulate form submission
    if (billId) {
      // Fetch the bill details from Firestore using the billId
      const billRef = doc(db, "PurchaseBills", billId);
      const billSnap = await getDoc(billRef);
      const billData = billSnap.data();

      // Generate the printable content
      const printableContent = `
        <h2>Purchase Bill</h2>
        <p><strong>Seller:</strong> ${billData.sellerName}</p>
        <p><strong>Contact:</strong> ${billData.sellerContact}</p>
        <p><strong>Date:</strong> ${new Date(billData.date).toLocaleString()}</p>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>Product</th>
              <th>Gram Weight</th>
              <th>Stone Weight</th>
              <th>Quantity</th>
              <th>Net Weight</th>
              <th>Net Price</th>
            </tr>
          </thead>
          <tbody>
            ${billData.products.map(product => `
              <tr>
                <td>${product.productName}</td>
                <td>${product.gramWeight}</td>
                <td>${product.stoneWeight}</td>
                <td>${product.quantity}</td>
                <td>${product.netWeight}</td>
                <td>$${product.netPrice}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Open a new window and write the printable content
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Purchase Bill</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            </style>
          </head>
          <body>
            ${printableContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="purbil-container">
       <button onClick={() => navigate(-1)} className="back-button" style={{ color: "#d6e8ee" }}><i className="bi bi-arrow-left"></i></button>

      <h2 className="purbil-title">Purchase Entry</h2>
      <form onSubmit={handleSubmit} className="purbil-form">
        <label className="purbil-label">Seller:</label>
        <select
          value={selectedSeller}
          onChange={(e) => setSelectedSeller(e.target.value)}
          className="purbil-select"
        >
          <option value="">Select Seller</option>
          {sellers.map(seller => (
            <option key={seller.id} value={seller.id}>
              {seller.dealerName} - {seller.contactNumber} - {seller.address}
            </option>
          ))}
        </select>
        <table className="purbil-table">
          <thead>
            <tr className="purbil-table-row">
              <th className="purbil-table-header">Product</th>
              <th className="purbil-table-header">Gram Weight</th>
              <th className="purbil-table-header">Stone Weight</th>
              <th className="purbil-table-header">Quantity</th>
              <th className="purbil-table-header">Net Weight</th>
              <th className="purbil-table-header">Net Price</th>
              <th className="purbil-table-header">Action</th>
            </tr>
          </thead>
          <tbody>
            {productEntries.map((entry, index) => (
              <tr key={index} className="purbil-table-row">
                <td>
                  <select
                    value={entry.productId}
                    onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                    className="purbil-select"
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.productName}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.gramWeight}
                    onChange={(e) => handleProductChange(index, 'gramWeight', parseFloat(e.target.value) || 0)}
                    className="purbil-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.stoneWeight}
                    onChange={(e) => handleProductChange(index, 'stoneWeight', parseFloat(e.target.value) || 0)}
                    className="purbil-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.quantity}
                    onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="purbil-input"
                  />
                </td>
                <td>{calculateNetWeight(entry)}</td>
                <td>${calculateNetPrice(entry)}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => removeProductEntry(index)}
                    className="purbil-button"
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={addProductEntry} className="purbil-button">➕  </button>
        <button type="submit" className="purbil-button">Save</button>
        <button type="button" onClick={handlePrint} className="purbil-button">Print</button>
      </form>
    </div>
  );
}

export default PurchaseBill;