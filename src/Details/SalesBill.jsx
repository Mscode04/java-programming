import React, { useState, useEffect } from 'react';
import { db } from "../Firebase/config";
import './SalesBill.css'
import { collection, getDocs, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";

function SalesBill() {
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

  // Update stock when a product is sold
  const updateStock = async (entry) => {
    if (!entry.productId) return;

    const stockRef = doc(db, "Stock", entry.productId);
    const stockSnap = await getDoc(stockRef);

    if (stockSnap.exists()) {
      const currentStock = stockSnap.data().quantity;
      const currentNetWeight = stockSnap.data().netWeight;

      // Check if there is enough stock
      if (currentStock < entry.quantity || currentNetWeight < entry.gramWeight) {
        alert(`Insufficient stock for product: ${stockSnap.data().productName}`);
        return;
      }

      // Update stock quantity and net weight
      await updateDoc(stockRef, {
        quantity: currentStock - entry.quantity,
        netWeight: currentNetWeight - entry.gramWeight,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      alert("Product not found in stock!");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName || productEntries.some(entry => !entry.productId)) {
      alert("Please enter customer name and select products.");
      return;
    }

    try {
      const billDetails = {
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

      // Add sales bill to Firestore
      await addDoc(collection(db, "SalesBills"), billDetails);

      // Update stock for all products
      for (const entry of productEntries) {
        await updateStock(entry);
      }

      alert("Sales Bill Added Successfully!");

      // Reset form fields
      setCustomerName('');
      setProductEntries([{ productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1, discountAmount: 0 }]);
    } catch (error) {
      console.error("Error adding sales bill: ", error);
      alert("An error occurred while adding the sales bill.");
    }
  };

  return (
    <div className="salesBill-container">
      <h2 className="salesBill-title">Sales Bill</h2>
      <form onSubmit={handleSubmit} className="salesBill-form">
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer Name"
          required
          className="salesBill-input"
        />

        <table className="salesBill-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Gram Weight</th>
              <th>Stone Weight</th>
              <th>Quantity</th>
              <th>Discount Amount</th>
              <th>Net Weight</th>
              <th>Net Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {productEntries.map((entry, index) => (
              <tr key={index}>
                <td>
                  <select
                    value={entry.productId}
                    onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                    className="salesBill-select"
                  >
                    <option value="">Select Product</option>
                    {stockProducts.map((product) => (
                      <option key={product.id} value={product.id}>
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
                    className="salesBill-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.stoneWeight}
                    onChange={(e) => handleProductChange(index, 'stoneWeight', parseFloat(e.target.value))}
                    required
                    className="salesBill-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.quantity}
                    onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
                    required
                    className="salesBill-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.discountAmount}
                    onChange={(e) => handleProductChange(index, 'discountAmount', parseFloat(e.target.value))}
                    className="salesBill-input"
                  />
                </td>
                <td>{calculateNetWeight(entry)}g</td>
                <td>${calculateNetPrice(entry)}</td>
                <td>
                  <button type="button" onClick={() => removeProductEntry(index)} className="salesBill-button">
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" onClick={addProductEntry} className="salesBill-button">
          ➕ Add Product
        </button>
        <button type="submit" className="salesBill-button">Submit Sales Bill</button>
      </form>

      <div className="salesBill-total">
        <h3>Total Net Price: ${calculateTotalNetPrice()}</h3>
      </div>
    </div>
  );
}

export default SalesBill;