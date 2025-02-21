import React, { useState, useEffect } from 'react';
import { db } from "../Firebase/config";
import { collection, getDocs, addDoc } from "firebase/firestore";
import './Quotationsbill.css'
function Quotationsbill() {
  const [stockProducts, setStockProducts] = useState([]); // Products from Stock collection
  const [goldRate, setGoldRate] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [productEntries, setProductEntries] = useState([
    { productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1, discountAmount: 0 },
  ]);

  useEffect(() => {
    fetchStockProducts();
    fetchGoldRate();
  }, []);

  // Fetch products from the Stock collection
  const fetchStockProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "Stock"));
    setStockProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Fetch today's gold rate
  const fetchGoldRate = async () => {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const goldRateQuery = collection(db, "goldPrices");
    const querySnapshot = await getDocs(goldRateQuery);

    let rate = 0;
    querySnapshot.forEach((doc) => {
      if (doc.data().date === today) {
        rate = doc.data().amount;
      }
    });

    if (rate > 0) {
      setGoldRate(rate);
    } else {
      console.log("No gold rate found for today!");
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
    setProductEntries([
      ...productEntries,
      { productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1, discountAmount: 0 },
    ]);
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
  const calculateNetPrice = (entry) => {
    const netWeightPrice = calculateNetWeight(entry) * goldRate * entry.quantity;
    return netWeightPrice - entry.discountAmount;
  };

  // Calculate total net price for all products
  const calculateTotalNetPrice = () => {
    return productEntries.reduce((total, entry) => total + calculateNetPrice(entry), 0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName || productEntries.some(entry => !entry.productId)) {
      alert("Please enter customer name and select products.");
      return;
    }

    try {
      const quotationDetails = {
        customerName,
        goldRate,
        products: productEntries.map((entry) => {
          const product = stockProducts.find((p) => p.id === entry.productId);
          return {
            productId: entry.productId,
            productName: product ? product.productName : 'Unknown Product',
            gramWeight: entry.gramWeight,
            stoneWeight: entry.stoneWeight,
            quantity: entry.quantity,
            discountAmount: entry.discountAmount,
            netWeight: calculateNetWeight(entry),
            netPrice: calculateNetPrice(entry),
          };
        }),
        totalNetPrice: calculateTotalNetPrice(),
        date: new Date().toISOString(),
      };

      // Add quotation to Firestore
      await addDoc(collection(db, "Quotations"), quotationDetails);

      alert("Quotation Created Successfully!");

      // Reset form fields
      setCustomerName('');
      setProductEntries([{ productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1, discountAmount: 0 }]);
    } catch (error) {
      console.error("Error creating quotation: ", error);
      alert("An error occurred while creating the quotation.");
    }
  };

  return (
    <div className="qurbil-container">
      <h2 className="qurbil-title">Quotation</h2>
      <form onSubmit={handleSubmit} className="qurbil-form">
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer Name"
          required
          className="qurbil-input"
        />

        <table className="qurbil-table">
          <thead>
            <tr>
              <th className="qurbil-th">Product</th>
              <th className="qurbil-th">Gram Weight</th>
              <th className="qurbil-th">Stone Weight</th>
              <th className="qurbil-th">Quantity</th>
              <th className="qurbil-th">Discount Amount</th>
              <th className="qurbil-th">Net Weight</th>
              <th className="qurbil-th">Net Price</th>
              <th className="qurbil-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {productEntries.map((entry, index) => (
              <tr key={index} className="qurbil-tr">
                <td>
                  <select
                    value={entry.productId}
                    onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                    className="qurbil-select"
                  >
                    <option value="">Select Product</option>
                    {stockProducts.map((product) => (
                      <option key={product.id} value={product.id} className="qurbil-option">
                        {product.productName} (Stock: {product.quantity}, Net Weight: {product.netWeight}g)
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.gramWeight}
                    onChange={(e) => handleProductChange(index, 'gramWeight', parseFloat(e.target.value))}
                    required
                    className="qurbil-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.stoneWeight}
                    onChange={(e) => handleProductChange(index, 'stoneWeight', parseFloat(e.target.value))}
                    required
                    className="qurbil-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.quantity}
                    onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
                    required
                    className="qurbil-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.discountAmount}
                    onChange={(e) => handleProductChange(index, 'discountAmount', parseFloat(e.target.value))}
                    className="qurbil-input"
                  />
                </td>
                <td className="qurbil-td">{calculateNetWeight(entry)}g</td>
                <td className="qurbil-td">${calculateNetPrice(entry)}</td>
                <td>
                  <button type="button" onClick={() => removeProductEntry(index)} className="qurbil-button">
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" onClick={addProductEntry} className="qurbil-button">
          ➕ Add Product
        </button>
        <button type="submit" className="qurbil-button">Create Quotation</button>
      </form>

      <div className="qurbil-total">
        <h3 className="qurbil-total-price">Total Net Price: ${calculateTotalNetPrice()}</h3>
      </div>
    </div>
  );
}

export default Quotationsbill;