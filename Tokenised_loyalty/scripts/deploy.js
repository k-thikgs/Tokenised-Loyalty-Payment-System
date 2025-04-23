// filepath: /home/karthik-g-s/Desktop/Tokenised_loyalty/loyalty-dapp/src/App.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getLoyaltyContract } from './web3';
import IssuePointsForm from './components/IssuePointsForm';
import RedeemPoints from './components/RedeemPoints';
import PartnerManagement from './components/PartnerManagement';
import EventTracking from './components/EventTracking';
import StoreInterface from './components/StoreInterface';

// Sample product data
const PRODUCTS = [
  {
    id: 1,
    name: 'Premium Headphones',
    price: 0.01, // ETH
    pointsReward: 100,
    image: 'https://placeholder.pics/svg/150x150/DEDEDE/555555/headphones',
    description: 'High-quality wireless headphones with noise cancellation'
  },
  {
    id: 2,
    name: 'Smart Watch',
    price: 0.02, // ETH
    pointsReward: 200,
    image: 'https://placeholder.pics/svg/150x150/DEDEDE/555555/watch',
    description: 'Fitness tracker with heart rate monitoring and notifications'
  },
  {
    id: 3,
    name: 'Bluetooth Speaker',
    price: 0.005, // ETH
    pointsReward: 50,
    image: 'https://placeholder.pics/svg/150x150/DEDEDE/555555/speaker',
    description: 'Portable speaker with rich bass and 12-hour battery life'
  }
];

// Point to ETH conversion rate (for redemption)
const POINTS_TO_ETH_RATE = 1000; // 1000 points = 0.01 ETH

function App() {
  const [account, setAccount] = useState("");
  const [points, setPoints] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [cart, setCart] = useState([]);
  const [usePointsForPurchase, setUsePointsForPurchase] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');
  const [isProcessing, setIsProcessing] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(accounts[0]);
  };

  // Get contract + check balance + ownership
  const fetchDetails = async () => {
    if (!account) return;
    
    try {
      const contract = await getLoyaltyContract();
      const balance = await contract.getPointsBalance(account);
      setPoints(ethers.formatUnits(balance, 18));
      
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch (err) {
      console.error("Error fetching account details:", err);
    }
  };

  useEffect(() => {
    if (account) fetchDetails();
  }, [account]);

  // Add product to cart
  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
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
    const totalEth = calculateTotal();
    const maxPointValue = totalEth * POINTS_TO_ETH_RATE;
    return Math.min(points, maxPointValue);
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
      const contract = await getLoyaltyContract();
      const totalEth = finalPrice();
      
      // If using points for discount
      if (usePointsForPurchase && points > 0) {
        const pointsToUse = maxPointsForPurchase();
        alert(`You would redeem ${pointsToUse} points for a discount of ${pointsToUse/POINTS_TO_ETH_RATE} ETH`);
      }
      
      alert(`Processing payment of ${totalEth} ETH`);
      
      // After successful purchase, issue loyalty points
      if (isOwner) {
        const pointsToIssue = calculatePointsToEarn();
        const tx = await contract.issuePoints(account, ethers.parseUnits(pointsToIssue.toString(), 18));
        await tx.wait();
        alert(`Purchase successful! You earned ${pointsToIssue} loyalty points.`);
      } else {
        alert("Purchase successful! In a real app, the store would issue points to you.");
      }
      
      setCart([]);
      fetchDetails();
      setIsProcessing(false);
    } catch (err) {
      console.error("Purchase error:", err);
      alert("Error processing purchase: " + err.message);
      setIsProcessing(false);
    }
  };

  // Render product card
  const renderProduct = (product) => {
    return (
      <div key={product.id} style={{ border: '1px solid #ddd', padding: '15px', margin: '10px', borderRadius: '8px', width: '300px' }}>
        <img src={product.image} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <p><strong>Price:</strong> {product.price} ETH</p>
        <p><strong>Earn:</strong> {product.pointsReward} loyalty points</p>
        <button 
          onClick={() => addToCart(product)}
          style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer' }}
        >
          Add to Cart
        </button>
      </div>
    );
  };

  // Render cart item
  const renderCartItem = (item) => {
    return (
      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
        <div>
          <h4>{item.name}</h4>
          <p>{item.price} ETH</p>
        </div>
        <button 
          onClick={() => removeFromCart(item.id)}
          style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
        >
          Remove
        </button>
      </div>
    );
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🛍️ Blockchain Loyalty Shop</h1>
        
        <div>
          {account ? (
            <div style={{ textAlign: 'right' }}>
              <p><strong>Connected:</strong> {account.slice(0, 6)}...{account.slice(-4)}</p>
              <p><strong>Loyalty Points:</strong> {points !== null ? points : "Loading..."}</p>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}
            >
              🔌 Connect MetaMask
            </button>
          )}
        </div>
      </header>

      {account && (
        <nav style={{ marginBottom: '20px' }}>
          <ul style={{ display: 'flex', listStyle: 'none', padding: 0 }}>
            <li style={{ marginRight: '20px' }}>
              <button 
                onClick={() => setActiveTab('shop')}
                style={{ backgroundColor: activeTab === 'shop' ? '#4CAF50' : '#ddd', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
              >
                Shop
              </button>
            </li>
            <li style={{ marginRight: '20px' }}>
              <button 
                onClick={() => setActiveTab('redeem')}
                style={{ backgroundColor: activeTab === 'redeem' ? '#4CAF50' : '#ddd', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
              >
                Redeem Points
              </button>
            </li>
            {isOwner && (
              <li style={{ marginRight: '20px' }}>
                <button 
                  onClick={() => setActiveTab('partnerManagement')}
                  style={{ backgroundColor: activeTab === 'partnerManagement' ? '#4CAF50' : '#ddd', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
                >
                  Partner Management
                </button>
              </li>
            )}
            {isOwner && (
              <li style={{ marginRight: '20px' }}>
                <button 
                  onClick={() => setActiveTab('eventTracking')}
                  style={{ backgroundColor: activeTab === 'eventTracking' ? '#4CAF50' : '#ddd', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
                >
                  Event Tracking
                </button>
              </li>
            )}
            {isOwner && (
              <li>
                <button 
                  onClick={() => setActiveTab('storeInterface')}
                  style={{ backgroundColor: activeTab === 'storeInterface' ? '#4CAF50' : '#ddd', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
                >
                  Store Interface
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}

      {account && activeTab === 'shop' && (
        <div style={{ display: 'flex' }}>
          {/* Products section */}
          <div style={{ flex: '3', padding: '0 15px' }}>
            <h2>Products</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {PRODUCTS.map(product => renderProduct(product))}
            </div>
          </div>
          
          {/* Cart section */}
          <div style={{ flex: '1', padding: '0 15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <h2>Your Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <>
                {cart.map(item => renderCartItem(item))}
                
                <div style={{ marginTop: '20px' }}>
                  <p><strong>Total:</strong> {calculateTotal()} ETH</p>
                  <p><strong>Points to Earn:</strong> {calculatePointsToEarn()}</p>
                  
                  {Number(points) > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <label>
                        <input 
                          type="checkbox" 
                          checked={usePointsForPurchase} 
                          onChange={() => setUsePointsForPurchase(!usePointsForPurchase)} 
                        />
                        Use my points for discount
                      </label>
                      
                      {usePointsForPurchase && (
                        <>
                          <p>Using {maxPointsForPurchase()} points</p>
                          <p>Discount: {pointsDiscount()} ETH</p>
                          <p><strong>Final Price:</strong> {finalPrice()} ETH</p>
                        </>
                      )}
                    </div>
                  )}
                  
                  <button 
                    onClick={processPurchase}
                    disabled={isProcessing}
                    style={{ 
                      backgroundColor: '#4CAF50', 
                      color: 'white', 
                      border: 'none', 
                      padding: '10px 20px', 
                      marginTop: '10px',
                      width: '100%',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      opacity: isProcessing ? 0.7 : 1
                    }}
                  >
                    {isProcessing ? 'Processing...' : 'Checkout'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {account && activeTab === 'redeem' && (
        <div>
          <h2>Redeem Your Loyalty Points</h2>
          <RedeemPoints 
            account={account} 
            onRedeemComplete={fetchDetails}
          />
        </div>
      )}

      {account && activeTab === 'partnerManagement' && isOwner && (
        <div>
          <h2>Partner Management</h2>
          <PartnerManagement 
            account={account} 
            onUpdateComplete={fetchDetails}
          />
        </div>
      )}

      {account && activeTab === 'eventTracking' && isOwner && (
        <div>
          <h2>Event Tracking</h2>
          <EventTracking 
            account={account} 
          />
        </div>
      )}

      {account && activeTab === 'storeInterface' && isOwner && (
        <div>
          <h2>Store Interface</h2>
          <StoreInterface 
            account={account} 
          />
        </div>
      )}

      {!account && (
        <div style={{ textAlign: 'center', marginTop: '50px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h2>Welcome to Blockchain Loyalty Shop</h2>
          <p>Connect your wallet to start shopping and earning loyalty points!</p>
          <p>Our blockchain-based loyalty system lets you earn points with every purchase and redeem them for discounts.</p>
        </div>
      )}
    </div>
  );
}

export default App;