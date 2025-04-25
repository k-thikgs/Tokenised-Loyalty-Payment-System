import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getLoyaltyContract } from '../web3';
import './StoreInterface.css'; // Import the CSS file for styling

function StoreInterface() {
  const [storeInfo, setStoreInfo] = useState(null);
  const [customerAddress, setCustomerAddress] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState('');

  useEffect(() => {
    const initStore = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
          checkStoreRegistration(accounts[0]);
        }
      }
    };
    initStore();
  }, []);

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setConnectedAddress(accounts[0]);
      checkStoreRegistration(accounts[0]);
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setStatus("Failed to connect wallet");
    }
  };

  const checkStoreRegistration = async (address) => {
    try {
      setIsLoading(true);
      const contract = await getLoyaltyContract();
      const isApproved = await contract.approvedStores(address);
      setIsRegistered(isApproved);

      if (isApproved) {
        const store = await contract.stores(address);
        setStoreInfo({
          name: store.name,
          pointsRate: ethers.formatUnits(store.pointsRate, 0),
        });
      }
    } catch (err) {
      console.error("Error checking store registration:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const recordPurchase = async () => {
    if (!ethers.isAddress(customerAddress)) {
      setStatus("❌ Please enter a valid customer address");
      return;
    }

    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      setStatus("❌ Please enter a valid purchase amount");
      return;
    }

    try {
      setIsLoading(true);
      setStatus("⏳ Processing purchase...");

      const contract = await getLoyaltyContract();
      const amountInWei = ethers.parseEther(purchaseAmount);
      const tx = await contract.recordPurchase(customerAddress, amountInWei);
      await tx.wait();

      const pointsToEarn = (parseFloat(purchaseAmount) * parseFloat(storeInfo.pointsRate)).toFixed(0);
      setStatus(`✅ Purchase recorded successfully! Customer earned ${pointsToEarn} loyalty points.`);
      setCustomerAddress('');
      setPurchaseAmount('');
    } catch (err) {
      console.error("Error recording purchase:", err);
      setStatus("❌ Failed to record purchase: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="store-interface">
      <h2>Store Purchase Interface</h2>

      {!connectedAddress ? (
        <div className="connect-wallet">
          <p>Connect your store wallet to record customer purchases</p>
          <button onClick={connectWallet} className="btn-primary">
            Connect Store Wallet
          </button>
        </div>
      ) : isLoading ? (
        <p className="loading">Loading store information...</p>
      ) : !isRegistered ? (
        <div className="not-registered">
          <h3>Store Not Registered</h3>
          <p>This wallet address is not registered as an approved store.</p>
          <p>Please contact the loyalty program administrator to register your store.</p>
          <p><strong>Your address:</strong> {connectedAddress}</p>
        </div>
      ) : (
        <div>
          <div className="store-info">
            <img
              src={`https://picsum.photos/300/200?random=${Math.floor(Math.random() * 1000)}`}
              alt="Store"
              className="store-image"
            />
            <h3>Store Information</h3>
            <p><strong>Name:</strong> {storeInfo.name}</p>
            <p><strong>Address:</strong> {connectedAddress}</p>
            <p><strong>Points Rate:</strong> {storeInfo.pointsRate} points per ETH</p>
          </div>

          <div className="record-purchase">
            <h3>Record Customer Purchase</h3>
            <label>Customer Wallet Address:</label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="0x..."
            />

            <label>Purchase Amount (ETH):</label>
            <input
              type="number"
              step="0.001"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              placeholder="0.00"
            />

            {purchaseAmount && storeInfo && (
              <p className="points-info">
                Customer will earn {(parseFloat(purchaseAmount) * parseFloat(storeInfo.pointsRate)).toFixed(0)} loyalty points
              </p>
            )}

            <button onClick={recordPurchase} className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Record Purchase & Issue Points'}
            </button>

            {status && <p className={`status ${status.includes('❌') ? 'error' : 'success'}`}>{status}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default StoreInterface;