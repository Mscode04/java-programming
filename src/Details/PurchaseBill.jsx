import React, { useState, useEffect } from 'react';
import { db } from "../Firebase/config";
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import './PurchaseBill.css'
function PurchaseBill() {
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [goldRate, setGoldRate] = useState(0);
  const [selectedSeller, setSelectedSeller] = useState('');
  const [productEntries, setProductEntries] = useState([{ productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1 }]);

  useEffect(() => {
    fetchSellers();
    fetchProducts();
    fetchGoldRate();
  }, []);

  const fetchSellers = async () => {
    const querySnapshot = await getDocs(collection(db, "Sellers"));
    setSellers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "Products"));
    setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchGoldRate = async () => {
    const today = new Date().toISOString().split('T')[0];
    const querySnapshot = await getDocs(collection(db, "goldPrices"));
    const rate = querySnapshot.docs.find(doc => doc.data().date === today)?.data().amount || 0;
    setGoldRate(rate);
  };

  const handleProductChange = (index, field, value) => {
    const updatedEntries = [...productEntries];
    updatedEntries[index][field] = value;
    setProductEntries(updatedEntries);
  };

  const addProductEntry = () => {
    setProductEntries([...productEntries, { productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1 }]);
  };

  const removeProductEntry = (index) => {
    if (productEntries.length > 1) {
      setProductEntries(productEntries.filter((_, i) => i !== index));
    }
  };

  const calculateNetWeight = (entry) => entry.gramWeight - entry.stoneWeight;
  const calculateNetPrice = (entry) => calculateNetWeight(entry) * goldRate * entry.quantity;

  const updateStock = async (entry) => {
    if (!entry.productId) return;

    const stockRef = doc(db, "Stock", entry.productId);
    const stockSnap = await getDoc(stockRef);
    const product = products.find(p => p.id === entry.productId);
    if (!product) return;

    const netWeight = calculateNetWeight(entry);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSeller || productEntries.some(entry => !entry.productId)) {
      alert("Please select a seller and products.");
      return;
    }

    try {
      const billDetails = {
        sellerId: selectedSeller,
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

      // Add the bill document to the PurchaseBills collection
      await addDoc(collection(db, "PurchaseBills"), billDetails);

      // Update stock for each product
      for (const entry of productEntries) {
        await updateStock(entry);
      }

      alert("Purchase Bill Added Successfully!");
      setSelectedSeller('');
      setProductEntries([{ productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1 }]);
    } catch (error) {
      console.error("Error adding bill: ", error);
      alert("An error occurred while adding the bill.");
    }
  };

  return (
    <div className="purbil-container">
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
            <option key={seller.id} value={seller.id}>{seller.dealerName}</option>
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
        <button type="button" onClick={addProductEntry} className="purbil-button">➕ Add Product</button>
        <button type="submit" className="purbil-button">Submit</button>
      </form>
    </div>
  );
}

export default PurchaseBill;