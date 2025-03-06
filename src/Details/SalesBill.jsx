import React, { useState, useEffect } from 'react';
import { db } from "../Firebase/config";
import './SalesBill.css';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";

function SalesBill() {
  const [stockProducts, setStockProducts] = useState([]); // Products from Stock collection
  const [goldRate, setGoldRate] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const navigate = useNavigate();
  const [productEntries, setProductEntries] = useState([
    { productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1, discountAmount: 0, makerCharge: 0 },
  ]);
  const [exchangeProducts, setExchangeProducts] = useState([
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

  // Handle changes in exchange product entries
  const handleExchangeProductChange = (index, field, value) => {
    const updatedEntries = [...exchangeProducts];
    updatedEntries[index][field] = value;
    setExchangeProducts(updatedEntries);
  };

  // Add a new product entry
  const addProductEntry = () => {
    setProductEntries([
      ...productEntries,
      { productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1, discountAmount: 0, makerCharge: 0 },
    ]);
  };

  // Add a new exchange product entry
  const addExchangeProductEntry = () => {
    setExchangeProducts([
      ...exchangeProducts,
      { productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1, discountAmount: 0 },
    ]);
  };

  // Remove a product entry
  const removeProductEntry = (index) => {
    if (productEntries.length > 1) {
      setProductEntries(productEntries.filter((_, i) => i !== index));
    }
  };

  // Remove an exchange product entry
  const removeExchangeProductEntry = (index) => {
    if (exchangeProducts.length > 1) {
      setExchangeProducts(exchangeProducts.filter((_, i) => i !== index));
    }
  };

  // Calculate net weight for a product entry
  const calculateNetWeight = (entry) => entry.gramWeight - entry.stoneWeight;

  // Calculate net price for a product entry
  const calculateNetPrice = (entry, isExchange = false) => {
    const netWeightPrice = calculateNetWeight(entry) * goldRate * entry.quantity;
    if (isExchange) {
      return netWeightPrice - entry.discountAmount; // No maker charge for exchange products
    }
    return netWeightPrice - entry.discountAmount + entry.makerCharge; // Include maker charge for products
  };

  // Calculate total net price for all products
  const calculateTotalNetPrice = () => {
    const totalProductsPrice = productEntries.reduce((total, entry) => total + calculateNetPrice(entry), 0);
    const totalExchangeProductsPrice = exchangeProducts.reduce((total, entry) => total + calculateNetPrice(entry, true), 0);
    return totalProductsPrice - totalExchangeProductsPrice; // Deduct exchange product value
  };

  // Update stock when a product is sold or exchanged
  const updateStock = async (entry, isExchange = false) => {
    if (!entry.productId) return;

    const stockRef = doc(db, "Stock", entry.productId);
    const stockSnap = await getDoc(stockRef);

    if (stockSnap.exists()) {
      const currentStock = stockSnap.data().quantity;
      const currentNetWeight = stockSnap.data().netWeight;

      // For exchange products, add to stock
      if (isExchange) {
        await updateDoc(stockRef, {
          quantity: currentStock + entry.quantity,
          netWeight: currentNetWeight + entry.gramWeight,
          lastUpdated: new Date().toISOString(),
        });
      } 
      // For sold products, subtract from stock
      else {
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
      }
    } else {
      alert("Product not found in stock!");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName || productEntries.some(entry => !entry.productId)) {
      alert("Please enter customer name and select products.");
      return null;
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
            makerCharge: entry.makerCharge, // Add maker charge for products
            netWeight: calculateNetWeight(entry),
            netPrice: calculateNetPrice(entry),
          };
        }),
        exchangeProducts: exchangeProducts.map((entry) => {
          const product = stockProducts.find((p) => p.id === entry.productId);
          return {
            productId: entry.productId,
            productName: product ? product.productName : 'Unknown Product',
            gramWeight: entry.gramWeight,
            stoneWeight: entry.stoneWeight,
            quantity: entry.quantity,
            discountAmount: entry.discountAmount,
            netWeight: calculateNetWeight(entry),
            netPrice: calculateNetPrice(entry, true), // No maker charge for exchange products
          };
        }),
        totalNetPrice: calculateTotalNetPrice(),
        date: new Date().toISOString(),
      };

      // Add sales bill to Firestore
      const billRef = await addDoc(collection(db, "SalesBills"), billDetails);

      // Update stock for all products
      for (const entry of productEntries) {
        await updateStock(entry);
      }

      // Update stock for exchange products
      for (const entry of exchangeProducts) {
        await updateStock(entry, true);
      }

      alert("Sales Bill Added Successfully!");

      // Reset form fields
      setCustomerName('');
      setProductEntries([{ productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1, discountAmount: 0, makerCharge: 0 }]);
      setExchangeProducts([{ productId: '', gramWeight: 0, stoneWeight: 0, quantity: 1, discountAmount: 0 }]);

      return billRef.id; // Return the bill ID
    } catch (error) {
      console.error("Error adding sales bill: ", error);
      alert("An error occurred while adding the sales bill.");
      return null;
    }
  };

  // Handle print functionality
  const handlePrint = async () => {
    const billId = await handleSubmit({ preventDefault: () => {} }); // Simulate form submission
    if (billId) {
      // Fetch the bill details from Firestore using the billId
      const billRef = doc(db, "SalesBills", billId);
      const billSnap = await getDoc(billRef);
      const billData = billSnap.data();

      // Generate the printable content
      const printableContent = `
        <h2>Sales Bill</h2>
        <p><strong>Customer Name:</strong> ${billData.customerName}</p>
        <p><strong>Date:</strong> ${new Date(billData.date).toLocaleString()}</p>
        <p><strong>Gold Rate:</strong> $${billData.goldRate}/g</p>
        <h3>Products</h3>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>Product</th>
              <th>Gram Weight</th>
              <th>Stone Weight</th>
              <th>Quantity</th>
              <th>Discount Amount</th>
              <th>Maker Charge</th>
              <th>Net Weight</th>
              <th>Net Price</th>
            </tr>
          </thead>
          <tbody>
            ${billData.products.map(product => `
              <tr>
                <td>${product.productName}</td>
                <td>${product.gramWeight}g</td>
                <td>${product.stoneWeight}g</td>
                <td>${product.quantity}</td>
                <td>$${product.discountAmount}</td>
                <td>$${product.makerCharge}</td>
                <td>${product.netWeight}g</td>
                <td>$${product.netPrice}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <h3>Exchange Products</h3>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>Product</th>
              <th>Gram Weight</th>
              <th>Stone Weight</th>
              <th>Quantity</th>
              <th>Discount Amount</th>
              <th>Net Weight</th>
              <th>Net Price</th>
            </tr>
          </thead>
          <tbody>
            ${billData.exchangeProducts.map(product => `
              <tr>
                <td>${product.productName}</td>
                <td>${product.gramWeight}g</td>
                <td>${product.stoneWeight}g</td>
                <td>${product.quantity}</td>
                <td>$${product.discountAmount}</td>
                <td>${product.netWeight}g</td>
                <td>$${product.netPrice}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <h3>Total Net Price: $${billData.totalNetPrice}</h3>
      `;

      // Open a new window and write the printable content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Popup blocked! Please allow popups for this site and try again.");
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Sales Bill</title>
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
    <div className="salesBill-container">
       <button onClick={() => navigate(-1)} className="back-button" style={{ color: "#d6e8ee" }}><i className="bi bi-arrow-left"></i></button>

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

        <h3>Products</h3>
        <table className="salesBill-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Gram Weight</th>
              <th>Stone Weight</th>
              <th>Quantity</th>
              <th>Discount Amount</th>
              <th>Maker Charge</th>
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
                <td>
                  <input
                    type="number"
                    value={entry.makerCharge}
                    onChange={(e) => handleProductChange(index, 'makerCharge', parseFloat(e.target.value))}
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

        <h3>Exchange Products</h3>
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
            {exchangeProducts.map((entry, index) => (
              <tr key={index}>
                <td>
                  <select
                    value={entry.productId}
                    onChange={(e) => handleExchangeProductChange(index, 'productId', e.target.value)}
                    className="salesBill-select"
                  >
                    <option value="">Select Exchange Product</option>
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
                    onChange={(e) => handleExchangeProductChange(index, 'gramWeight', parseFloat(e.target.value))}
                    required
                    className="salesBill-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.stoneWeight}
                    onChange={(e) => handleExchangeProductChange(index, 'stoneWeight', parseFloat(e.target.value))}
                    required
                    className="salesBill-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.quantity}
                    onChange={(e) => handleExchangeProductChange(index, 'quantity', parseInt(e.target.value))}
                    required
                    className="salesBill-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={entry.discountAmount}
                    onChange={(e) => handleExchangeProductChange(index, 'discountAmount', parseFloat(e.target.value))}
                    className="salesBill-input"
                  />
                </td>
                <td>{calculateNetWeight(entry)}g</td>
                <td>${calculateNetPrice(entry, true)}</td>
                <td>
                  <button type="button" onClick={() => removeExchangeProductEntry(index)} className="salesBill-button">
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" onClick={addExchangeProductEntry} className="salesBill-button">
          ➕ Add Exchange Product
        </button>

        <button type="submit" className="salesBill-button">Submit Sales Bill</button>
        <button type="button" onClick={handlePrint} className="salesBill-button">Print</button>
      </form>

      <div className="salesBill-total">
        <h3>Total Net Price: ${calculateTotalNetPrice()}</h3>
      </div>
    </div>
  );
}

export default SalesBill;