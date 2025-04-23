import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getLoyaltyContract, connectWallet, getUserPointsBalance, setupEventListeners } from './web3';
import IssuePointsForm from './components/IssuePointsForm';
import RedeemPoints from './components/RedeemPoints';
import StoreInterface from './components/StoreInterface';
import PartnerManagement from './components/PartnerManagement';
import EventTracking from './components/EventTracking';
import AdminChecker from './components/AdminChecker';
import DeployNewContract from './components/DeployNewContract';
import './App.css';

// Extended product data with better images and descriptions
const PRODUCTS = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    price: 0.01, // ETH
    pointsReward: 100,
    image: 'https://images.unsplash.com/photo-1585298723682-7115561c51b7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    description: 'High-quality wireless headphones with active noise cancellation, 30-hour battery life, and premium sound.',
    categories: ['Electronics', 'Audio']
  },
  {
    id: 2,
    name: 'Smart Fitness Watch',
    price: 0.02, // ETH
    pointsReward: 200,
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    description: 'Track your fitness goals with heart rate monitoring, sleep tracking, and smart notifications.',
    categories: ['Electronics', 'Fitness']
  },
  {
    id: 3,
    name: 'Portable Bluetooth Speaker',
    price: 0.005, // ETH
    pointsReward: 50,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    description: 'Waterproof speaker with rich bass, 12-hour battery life, and compact design perfect for any adventure.',
    categories: ['Electronics', 'Audio']
  },
  {
    id: 4,
    name: 'Organic Cotton T-Shirt',
    price: 0.008, // ETH
    pointsReward: 80,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    description: 'Sustainably sourced cotton t-shirt with modern fit and premium comfort.',
    categories: ['Fashion', 'Clothing']
  },
  {
    id: 5,
    name: 'Stainless Steel Water Bottle',
    price: 0.004, // ETH
    pointsReward: 40,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    description: 'Double-walled insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours.',
    categories: ['Lifestyle', 'Accessories']
  },
  {
    id: 6,
    name: 'Wireless Charging Pad',
    price: 0.006, // ETH
    pointsReward: 60,
    image: 'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices, sleek modern design.',
    categories: ['Electronics', 'Accessories']
  }
];

// Point to ETH conversion rate (for redemption)
const POINTS_TO_ETH_RATE = 1000; // 1000 points = 0.01 ETH

function App() {
  const [account, setAccount] = useState("");
  const [points, setPoints] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [cart, setCart] = useState([]);
  const [usePointsForPurchase, setUsePointsForPurchase] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [notification, setNotification] = useState(null);
  
  // Connect wallet
  const handleConnectWallet = async () => {
    try {
      const connectedAccount = await connectWallet();
      setAccount(connectedAccount);
      showNotification("Connected to wallet successfully!", "success");
    } catch (err) {
      console.error("Error connecting to wallet:", err);
      showNotification("Failed to connect wallet. Please try again.", "error");
    }
  };

  // Show temporary notification
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Get contract + check balance + ownership
  const fetchDetails = useCallback(async () => {
    if (!account) return;
    
    try {
      const contract = await getLoyaltyContract();
      const balance = await getUserPointsBalance(account);
      setPoints(balance);
      
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      
      // Check if the account is a registered store
      const storeInfo = await contract.stores(account);
      setIsStoreOwner(storeInfo.isActive);
    } catch (err) {
      console.error("Error fetching account details:", err);
    }
  }, [account]);

  // Set up blockchain event listeners
  useEffect(() => {
    let cleanup = () => {};
    
    if (account) {
      // Set up event listeners for the contract
      const setupEvents = async () => {
        try {
          // Listen for blockchain events related to points
          cleanup = await setupEventListeners((event) => {
            if (event.type === 'issued' || event.type === 'redeemed') {
              // If points were issued to or redeemed by the current user, refresh balance
              if (event.user.toLowerCase() === account.toLowerCase()) {
                fetchDetails();
                
                const actionType = event.type === 'issued' ? 'received' : 'redeemed';
                const message = `You ${actionType} ${parseFloat(event.amount).toFixed(0)} points`;
                showNotification(message, "success");
              }
            }
          });
        } catch (err) {
          console.error("Error setting up event listeners:", err);
        }
      };
      
      setupEvents();
    }
    
    // Additional DOM event listener for custom events from other components
    const handlePointsIssued = (event) => {
      // Check if current user is the recipient
      if (event.detail && event.detail.recipient && 
          event.detail.recipient.toLowerCase() === account.toLowerCase()) {
        fetchDetails();
        showNotification(`You received ${event.detail.amount} points!`, "success");
      } else {
        // Refresh anyway in case we're the admin who sent the points
        fetchDetails();
      }
    };
    
    // Listen for custom point issuance events
    window.addEventListener('pointsIssued', handlePointsIssued);
    
    // Auto-refresh balances periodically when connected
    const intervalId = setInterval(() => {
      if (account) {
        fetchDetails();
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      // Clean up all listeners
      if (cleanup) cleanup();
      window.removeEventListener('pointsIssued', handlePointsIssued);
      clearInterval(intervalId);
    };
  }, [account, fetchDetails]);

  // Initial fetch when account changes
  useEffect(() => {
    if (account) fetchDetails();
  }, [account, fetchDetails]);

  // Add product to cart
  const addToCart = (product) => {
    setCart([...cart, product]);
    showNotification(`Added ${product.name} to cart!`, "success");
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    const product = cart.find(item => item.id === productId);
    setCart(cart.filter(item => item.id !== productId));
    if (product) {
      showNotification(`Removed ${product.name} from cart`, "info");
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price, 0);
  };

  // Calculate total points to be earned
  const calculatePointsToEarn = () => {
    return cart.reduce((total, item) => total + item.pointsReward, 0);
  };

  // Calculate maximum points that can be used
  const maxPointsForPurchase = () => {
    if (!points) return 0;
    const totalEth = calculateTotal();
    const maxPointValue = totalEth * POINTS_TO_ETH_RATE;
    return Math.min(parseFloat(points), maxPointValue);
  };

  // Calculate discount from points
  const pointsDiscount = () => {
    if (!usePointsForPurchase || !points) return 0;
    const maxUsable = maxPointsForPurchase();
    return maxUsable / POINTS_TO_ETH_RATE;
  };

  // Calculate final price after points discount
  const finalPrice = () => {
    const total = calculateTotal();
    const discount = pointsDiscount();
    return Math.max(0, total - discount);
  };

  // Process purchase
  const processPurchase = async () => {
    if (cart.length === 0) return;
    
    try {
      setIsProcessing(true);
      showNotification("Processing your purchase...", "info");
      
      const contract = await getLoyaltyContract();
      const totalEth = finalPrice();
      
      // If using points for discount
      if (usePointsForPurchase && parseFloat(points) > 0) {
        const pointsToUse = maxPointsForPurchase();
        
        try {
          // Redeem points for discount
          const tx = await contract.redeemPoints(account, ethers.parseUnits(pointsToUse.toString(), 18));
          await tx.wait();
          showNotification(`Redeemed ${pointsToUse} points for a discount!`, "success");
        } catch (error) {
          console.error("Error redeeming points:", error);
          showNotification("Error redeeming points. Proceeding without discount.", "error");
        }
      }
      
      // Process the actual ETH payment for regular users
      try {
        // Check if total ETH to pay is greater than 0
        if (totalEth > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          
          // For a real purchase, you would pay ETH to a store address
          // This is a simulated store address - in a real app, this would be the store's wallet
          const storeAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
          
          // Send ETH transaction
          const tx = await signer.sendTransaction({
            to: storeAddress,
            value: ethers.parseEther(totalEth.toString())
          });
          
          await tx.wait();
          showNotification(`Payment of ${totalEth} ETH processed successfully!`, "success");
        }
      } catch (error) {
        console.error("Payment error:", error);
        showNotification(`Error processing payment: ${error.message}`, "error");
        setIsProcessing(false);
        return;
      }
      
      // Handle points issuance - either by admin or by simulated store
      try {
        if (isOwner) {
          // If admin, issue points directly
          const pointsToIssue = calculatePointsToEarn();
          const tx = await contract.issuePoints(account, ethers.parseUnits(pointsToIssue.toString(), 18));
          await tx.wait();
          showNotification(`Purchase successful! You earned ${pointsToIssue} loyalty points.`, "success");
        } else {
          // For regular users, simulate a store issuing points
          const pointsToEarn = calculatePointsToEarn();
          try {
            // Try to find an admin address that might be able to issue points
            // This is for demo purposes - in real world, the store would call this
            const owner = await contract.owner();
            
            showNotification(`Purchase successful! You would earn ${pointsToEarn} points in a real deployment.`, "success");
            showNotification("In a real implementation, the store would issue your points.", "info");
          } catch (err) {
            console.error("Error with points simulation:", err);
            showNotification(`Purchase successful! You would earn ${pointsToEarn} points in a production environment.`, "success");
          }
        }
      } catch (error) {
        console.error("Points issuance error:", error);
        showNotification("Purchase completed, but there was an error with points issuance.", "warning");
      }
      
      // Clear cart and refresh
      setCart([]);
      fetchDetails();
    } catch (err) {
      console.error("Purchase error:", err);
      showNotification(`Error processing purchase: ${err.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Get unique categories from products
  const categories = ['All', ...new Set(PRODUCTS.flatMap(product => product.categories))];
  
  // Filter products based on search term and category
  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.categories.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <h1>🛍️ Blockchain Loyalty Shop</h1>
        </div>
        
        <div className="header-actions">
          {account ? (
            <div className="user-info">
              <div className="account-info">
                <div className="address">
                  <span className="label">Connected:</span>
                  <span className="value">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
                </div>
                <div className="points">
                  <span className="label">Loyalty Points:</span>
                  <span className="value points-value">{points !== null ? parseFloat(points).toLocaleString() : "Loading..."}</span>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleConnectWallet}
              className="connect-button"
            >
              🔌 Connect MetaMask
            </button>
          )}
        </div>
      </header>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {account && (
        <nav className="main-nav">
          <ul>
            <li>
              <button 
                onClick={() => setActiveTab('shop')}
                className={activeTab === 'shop' ? 'active' : ''}
              >
                Shop
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('redeem')}
                className={activeTab === 'redeem' ? 'active' : ''}
              >
                Redeem Points
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('events')}
                className={activeTab === 'events' ? 'active' : ''}
              >
                Activity
              </button>
            </li>
            {isStoreOwner && (
              <li>
                <button 
                  onClick={() => setActiveTab('store')}
                  className={activeTab === 'store' ? 'active' : ''}
                >
                  Store Management
                </button>
              </li>
            )}
            {isOwner && (
              <li>
                <button 
                  onClick={() => setActiveTab('admin')}
                  className={activeTab === 'admin' ? 'active' : ''}
                >
                  Admin
                </button>
              </li>
            )}
            <li>
              <button 
                onClick={() => setActiveTab('adminChecker')}
                className={activeTab === 'adminChecker' ? 'active' : ''}
                style={{ backgroundColor: '#ff9800', color: 'white' }}
              >
                Admin Checker
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('deployContract')}
                className={activeTab === 'deployContract' ? 'active' : ''}
                style={{ backgroundColor: '#e91e63', color: 'white' }}
              >
                Deploy New Contract
              </button>
            </li>
          </ul>
        </nav>
      )}

      <main className="main-content">
        {account && activeTab === 'shop' && (
          <div className="shop-container">
            <div className="shop-filters">
              <div className="search-container">
                <input 
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="category-filter">
                <label>Category:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="category-select"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          
            <div className="shop-content">
              {/* Products section */}
              <div className="products-container">
                <h2>Products</h2>
                <div className="products-grid">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="product-card">
                      <div className="product-image-container">
                        <img src={product.image} alt={product.name} className="product-image" />
                      </div>
                      <div className="product-details">
                        <h3>{product.name}</h3>
                        <p className="product-description">{product.description}</p>
                        <div className="product-meta">
                          <div className="product-price">{product.price} ETH</div>
                          <div className="product-points">+{product.pointsReward} points</div>
                        </div>
                        <button 
                          onClick={() => addToCart(product)}
                          className="add-to-cart-button"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Cart section */}
              <div className="cart-container">
                <h2>Your Cart</h2>
                {cart.length === 0 ? (
                  <div className="empty-cart">
                    <p>Your cart is empty</p>
                    <p className="empty-cart-message">Add products to start earning loyalty points!</p>
                  </div>
                ) : (
                  <>
                    <div className="cart-items">
                      {cart.map(item => (
                        <div key={item.id} className="cart-item">
                          <img src={item.image} alt={item.name} className="cart-item-image" />
                          <div className="cart-item-details">
                            <h4>{item.name}</h4>
                            <p className="cart-item-price">{item.price} ETH</p>
                            <p className="cart-item-points">+{item.pointsReward} points</p>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="remove-button"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="cart-summary">
                      <div className="cart-total">
                        <span>Total:</span>
                        <span>{calculateTotal()} ETH</span>
                      </div>
                      <div className="cart-points">
                        <span>Points to Earn:</span>
                        <span>+{calculatePointsToEarn()}</span>
                      </div>
                      
                      {parseFloat(points) > 0 && (
                        <div className="use-points-option">
                          <label className="points-checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={usePointsForPurchase} 
                              onChange={() => setUsePointsForPurchase(!usePointsForPurchase)} 
                            />
                            <span>Use my points for discount</span>
                          </label>
                          
                          {usePointsForPurchase && (
                            <div className="points-discount-info">
                              <div className="discount-detail">
                                <span>Using {maxPointsForPurchase().toFixed(0)} points</span>
                              </div>
                              <div className="discount-detail">
                                <span>Discount:</span>
                                <span>{pointsDiscount().toFixed(4)} ETH</span>
                              </div>
                              <div className="final-price">
                                <span>Final Price:</span>
                                <span>{finalPrice().toFixed(4)} ETH</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button 
                        onClick={processPurchase}
                        disabled={isProcessing}
                        className="checkout-button"
                      >
                        {isProcessing ? 'Processing...' : 'Checkout'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {account && activeTab === 'redeem' && (
          <RedeemPoints 
            account={account} 
            onRedeemComplete={fetchDetails}
          />
        )}

        {account && activeTab === 'events' && (
          <EventTracking />
        )}

        {account && activeTab === 'store' && isStoreOwner && (
          <StoreInterface />
        )}

        {account && activeTab === 'admin' && isOwner && (
          <div className="admin-container">
            <h2>Admin Panel</h2>
            
            <div className="admin-section">
              <h3>Issue Loyalty Points</h3>
              <IssuePointsForm onIssueComplete={fetchDetails} />
            </div>
            
            <div className="admin-section">
              <h3>Partner Management</h3>
              <PartnerManagement />
            </div>

            <div className="admin-section">
              <div className="refresh-balance-section">
                <button 
                  onClick={fetchDetails}
                  className="refresh-button"
                >
                  🔄 Refresh Balances
                </button>
                <p className="refresh-hint">Click to manually refresh point balances</p>
              </div>
            </div>
          </div>
        )}

        {account && activeTab === 'adminChecker' && (
          <AdminChecker />
        )}

        {account && activeTab === 'deployContract' && (
          <DeployNewContract />
        )}

        {!account && (
          <div className="welcome-container">
            <div className="welcome-content">
              <h2>Welcome to Blockchain Loyalty Shop</h2>
              <p className="welcome-description">Connect your wallet to start shopping and earning loyalty points!</p>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🔐</div>
                  <h3>Secure Blockchain</h3>
                  <p>Your loyalty points are securely stored on the blockchain</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">💰</div>
                  <h3>Earn & Redeem</h3>
                  <p>Earn points with every purchase and redeem them for rewards</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔄</div>
                  <h3>Multiple Partners</h3>
                  <p>Use your points across our partner network for maximum value</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h3>Instant Rewards</h3>
                  <p>No waiting period - use your points immediately after earning</p>
                </div>
              </div>
              <button onClick={handleConnectWallet} className="welcome-connect-button">
                Connect Wallet to Begin
              </button>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px' }}>
                <button 
                  onClick={() => {
                    connectWallet().then(() => setActiveTab('adminChecker'));
                  }}
                  className="welcome-connect-button"
                  style={{ backgroundColor: '#ff9800' }}
                >
                  Admin Access Checker
                </button>
                <button 
                  onClick={() => {
                    connectWallet().then(() => setActiveTab('deployContract'));
                  }}
                  className="welcome-connect-button"
                  style={{ backgroundColor: '#e91e63' }}
                >
                  Deploy New Contract
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Blockchain Loyalty Program. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
