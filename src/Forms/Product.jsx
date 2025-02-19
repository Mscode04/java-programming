import React, { useState, useEffect } from 'react';
import { db } from "../Firebase/config";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom'; 
import './Product.css'; // Import separate CSS file

function Product() {
  const [productName, setProductName] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [productToDelete, setProductToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null); // Track which product is being edited
  const productsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "Products"));
    const productsList = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure productName exists, or set a default value
      if (!data.productName) {
        data.productName = "Unnamed Product";
      }
      return { id: doc.id, ...data };
    });
    setProducts(productsList);
    setLoading(false);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "Products"), {
        productName,
        productDetails,
      });
      toast.success('Product added successfully!');
      setProductName('');
      setProductDetails('');
      setShowAddForm(false);
      fetchProducts();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error('Error adding product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (deletePin === '2012') {
      try {
        await deleteDoc(doc(db, "Products", productToDelete.id));
        toast.success('Product deleted successfully!');
        setShowDeleteModal(false);
        setDeletePin('');
        fetchProducts();
      } catch (error) {
        console.error("Error deleting document: ", error);
        toast.error('Error deleting product. Please try again.');
      }
    } else {
      toast.error('Incorrect PIN. Please try again.');
    }
  };

  const handleUpdateProduct = async (product) => {
    try {
      await updateDoc(doc(db, "Products", product.id), {
        productName: product.productName,
        productDetails: product.productDetails,
      });
      toast.success('Product updated successfully!');
      setEditingProduct(null); // Stop editing
      fetchProducts(); // Refresh the product list
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error('Error updating product. Please try again.');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Normalize search term and product names for case-insensitive comparison
  const normalizedSearchTerm = searchTerm.toLowerCase();

  const filteredProducts = products.filter(product => {
    const normalizedProductName = product.productName ? product.productName.toLowerCase() : '';
    return normalizedProductName.includes(normalizedSearchTerm);
  });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (direction) => {
    if (direction === 'next' && currentPage < Math.ceil(filteredProducts.length / productsPerPage)) {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="product-container">
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

      <div className="product-header">
      <button className="adminreg-back-button" style={{ color: "#d6e8ee", backgroundColor: "transparent", border: "none" }} onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1 className="product-title">Products</h1>
        <button className="product-add-button" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Hide Form' : 'Add New'}
        </button>
      </div>

      {showAddForm && (
        <form className="product-form" onSubmit={handleAddProduct}>
          <div className="product-form-group">
            <label htmlFor="productName">Product Name:</label>
            <input
              type="text"
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              className="product-input"
            />
          </div>
          <div className="product-form-group">
            <label htmlFor="productDetails">Product Details:</label>
            <textarea
              id="productDetails"
              value={productDetails}
              onChange={(e) => setProductDetails(e.target.value)}
              className="product-input"
            />
          </div>
          <button type="submit" className="product-submit-button" disabled={loading}>
            {loading ? 'Adding...' : 'Save'}
          </button>
        </form>
      )}

      <div className="product-search">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearch}
          className="product-search-input"
        />
      </div>

      <table className="product-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Product Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentProducts.map(product => (
            <tr key={product.id}>
              <td>
                {editingProduct?.id === product.id ? (
                  <input
                    type="text"
                    value={editingProduct.productName}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, productName: e.target.value })
                    }
                  />
                ) : (
                  product.productName
                )}
              </td>
              <td>
                {editingProduct?.id === product.id ? (
                  <textarea
                    value={editingProduct.productDetails}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, productDetails: e.target.value })
                    }
                  />
                ) : (
                  product.productDetails
                )}
              </td>
              <td>
                {editingProduct?.id === product.id ? (
                  <>
                    <button className="product-save-button" onClick={() => handleUpdateProduct(editingProduct)}>
                      Save
                    </button>
                    <button className="product-cancel-button" onClick={() => setEditingProduct(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="product-update-button" onClick={() => setEditingProduct(product)}>
                      Update
                    </button>
                    <button className="product-delete-button" onClick={() => { setProductToDelete(product); setShowDeleteModal(true); }}>
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="product-pagination">
        <button
          className="product-pagination-button"
          onClick={() => paginate('prev')}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <button
          className="product-pagination-button"
          onClick={() => paginate('next')}
          disabled={currentPage === Math.ceil(filteredProducts.length / productsPerPage)}
        >
          Next
        </button>
      </div>

      {showDeleteModal && (
        <div className="product-delete-modal">
          <div className="product-delete-modal-content">
            <h2>Enter PIN to Delete</h2>
            <input
              type="password"
              placeholder="Enter PIN"
              value={deletePin}
              onChange={(e) => setDeletePin(e.target.value)}
              className="product-delete-modal-input"
            />
            <button onClick={handleDeleteProduct} className="product-delete-modal-button">Delete</button>
            <button onClick={() => setShowDeleteModal(false)} className="product-delete-modal-button">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Product;