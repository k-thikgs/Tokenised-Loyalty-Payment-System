import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getLoyaltyContract, calculatePointsValue } from '../web3';
import './RedeemPoints.css';

function RedeemPoints({ account, onRedeemComplete }) {
  const [redeemAmount, setRedeemAmount] = useState("");
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [status, setStatus] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [ethValue, setEthValue] = useState("0");
  const [rewardOptions, setRewardOptions] = useState([]);
  const [maxRedeemablePoints, setMaxRedeemablePoints] = useState(0);
  const [newMaxPoints, setNewMaxPoints] = useState("");
  const [showAdminControls, setShowAdminControls] = useState(false);

  // Fetch approved partners and check if user is owner
  useEffect(() => {
    if (account) {
      fetchPartners();
      checkOwnership();
      getPointsBalance();
      fetchMaxRedeemablePoints();
    }
  }, [account]);

  // Calculate ETH value when redemption amount changes
  useEffect(() => {
    if (redeemAmount && !isNaN(redeemAmount) && parseFloat(redeemAmount) > 0) {
      calculateEthValue(redeemAmount);
    } else {
      setEthValue("0");
    }
  }, [redeemAmount]);

  const getPointsBalance = async () => {
    try {
      const contract = await getLoyaltyContract();
      const balance = await contract.getPointsBalance(account);
      setPointsBalance(ethers.formatUnits(balance, 18));
    } catch (err) {
      console.error("Error fetching points balance:", err);
    }
  };

  const fetchMaxRedeemablePoints = async () => {
    try {
      const contract = await getLoyaltyContract();
      const maxPoints = await contract.maxRedeemablePoints();
      setMaxRedeemablePoints(ethers.formatUnits(maxPoints, 18));
    } catch (err) {
      console.error("Error fetching max redeemable points:", err);
    }
  };

  const updateMaxRedeemablePoints = async () => {
    if (!newMaxPoints || parseFloat(newMaxPoints) <= 0) {
      setStatus("Please enter a valid amount for max redeemable points");
      return;
    }

    try {
      setLoading(true);
      setStatus("⏳ Updating maximum redeemable points...");
      
      const contract = await getLoyaltyContract();
      const tx = await contract.updateMaxRedeemablePoints(ethers.parseUnits(newMaxPoints, 18));
      await tx.wait();
      
      setStatus("✅ Maximum redeemable points updated successfully!");
      setNewMaxPoints("");
      fetchMaxRedeemablePoints();
    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + (err.message || err.reason || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const calculateEthValue = async (amount) => {
    try {
      const value = await calculatePointsValue(amount);
      setEthValue(value);
    } catch (err) {
      console.error("Error calculating ETH value:", err);
    }
  };

  const fetchPartners = async () => {
    try {
      // In a real app, you'd fetch the partners from contract events or a backend
      // For now, using sample data
      const mockPartners = [
        { 
          address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 
          name: "Fashion Outlet", 
          image: "https://picsum.photos/id/1078/300/200",
          description: "Exclusive fashion items with premium quality"
        },
        { 
          address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 
          name: "Tech Haven", 
          image: "https://picsum.photos/id/60/300/200",
          description: "Latest electronics and gadgets"
        },
        { 
          address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", 
          name: "Gourmet Delights", 
          image: "https://picsum.photos/id/292/300/200",
          description: "Premium dining experiences and food items"
        }
      ];
      
      setPartners(mockPartners);
      
      // Default to first partner
      if (mockPartners.length > 0) {
        setSelectedPartner(mockPartners[0].address);
      }

      // Set reward options - in a real app, these would be fetched from a database
      setRewardOptions([
        { points: "1000", description: "10% discount on next purchase" },
        { points: "5000", description: "Free standard shipping for 3 months" },
        { points: "10000", description: "Exclusive member gift" },
        { points: "25000", description: "VIP access to special events" },
      ]);
      
    } catch (err) {
      console.error("Error fetching partners:", err);
    }
  };

  const checkOwnership = async () => {
    try {
      const contract = await getLoyaltyContract();
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch (err) {
      console.error("Error checking ownership:", err);
    }
  };

  // Redeem points as owner
  const redeemAsOwner = async () => {
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      setStatus("Please enter a valid amount");
      return;
    }

    if (parseFloat(redeemAmount) > parseFloat(maxRedeemablePoints)) {
      setStatus(`❌ Cannot redeem more than ${maxRedeemablePoints} points at once`);
      return;
    }

    try {
      setLoading(true);
      setStatus("⏳ Processing redemption...");
      
      const contract = await getLoyaltyContract();
      const tx = await contract.redeemPoints(account, ethers.parseUnits(redeemAmount, 18));
      await tx.wait();
      
      setStatus("✅ Points redeemed successfully!");
      setRedeemAmount("");
      getPointsBalance();
      
      if (onRedeemComplete) onRedeemComplete();
    } catch (err) {
      console.error(err);
      let errorMessage = err.message;
      // Extract the revert reason if available
      if (err.reason) {
        errorMessage = err.reason;
      } else if (err.data && err.data.message) {
        errorMessage = err.data.message;
      }
      setStatus("❌ Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Redeem points with partner
  const redeemWithPartner = async () => {
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      setStatus("Please enter a valid amount");
      return;
    }

    if (parseFloat(redeemAmount) > parseFloat(maxRedeemablePoints)) {
      setStatus(`❌ Cannot redeem more than ${maxRedeemablePoints} points at once`);
      return;
    }

    if (!selectedPartner) {
      setStatus("Please select a redemption partner");
      return;
    }

    try {
      setLoading(true);
      setStatus("⏳ Processing redemption...");
      
      const contract = await getLoyaltyContract();
      const tx = await contract.redeemWithPartner(
        account, 
        ethers.parseUnits(redeemAmount, 18), 
        selectedPartner
      );
      await tx.wait();
      
      setStatus("✅ Points redeemed successfully!");
      setRedeemAmount("");
      getPointsBalance();
      
      if (onRedeemComplete) onRedeemComplete();
    } catch (err) {
      console.error(err);
      let errorMessage = err.message;
      if (err.reason) {
        errorMessage = err.reason;
      } else if (err.data && err.data.message) {
        errorMessage = err.data.message;
      }
      setStatus("❌ Error: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectRewardOption = (points) => {
    setRedeemAmount(points);
  };

  const toggleAdminControls = () => {
    setShowAdminControls(!showAdminControls);
  };

  return (
    <div className="redeem-points-container">
      <h3>♻️ Redeem Your Points</h3>
      
      <div className="points-balance-card">
        <div className="points-balance">
          <span className="balance-number">{parseFloat(pointsBalance).toLocaleString()}</span>
          <span className="balance-label">Available Points</span>
        </div>
        <div className="max-redeemable">
          <span className="max-label">Max Redeemable:</span>
          <span className="max-value">{parseFloat(maxRedeemablePoints).toLocaleString()} points per transaction</span>
        </div>
      </div>
      
      {isOwner && (
        <div className="admin-controls">
          <button 
            onClick={toggleAdminControls}
            className="toggle-admin-button"
          >
            {showAdminControls ? 'Hide Admin Controls' : 'Show Admin Controls'}
          </button>
          
          {showAdminControls && (
            <div className="admin-settings-panel">
              <h4>Admin Settings</h4>
              <div className="admin-setting">
                <label>Update Maximum Redeemable Points:</label>
                <div className="admin-input-group">
                  <input
                    type="number"
                    placeholder="New max points limit"
                    value={newMaxPoints}
                    onChange={(e) => setNewMaxPoints(e.target.value)}
                    min="1"
                  />
                  <button 
                    onClick={updateMaxRedeemablePoints}
                    disabled={loading}
                    className="admin-action-button"
                  >
                    Update Limit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="redemption-options">
        <h4>Quick Redemption Options</h4>
        <div className="reward-options">
          {rewardOptions
            .filter(option => parseFloat(option.points) <= parseFloat(maxRedeemablePoints))
            .map((option, index) => (
              <div 
                key={index} 
                className={`reward-option ${redeemAmount === option.points ? 'selected' : ''}`}
                onClick={() => selectRewardOption(option.points)}
              >
                <div className="reward-points">{option.points}</div>
                <div className="reward-description">{option.description}</div>
              </div>
            ))}
        </div>
        {rewardOptions.some(option => parseFloat(option.points) > parseFloat(maxRedeemablePoints)) && (
          <div className="warning-message">
            Some reward options exceed the maximum redeemable points limit.
          </div>
        )}
      </div>
      
      <div className="redemption-form">
        <label>Amount to Redeem:</label>
        <input
          type="number"
          placeholder={`Enter amount (max ${maxRedeemablePoints})`}
          value={redeemAmount}
          onChange={(e) => setRedeemAmount(e.target.value)}
          min="1"
          max={maxRedeemablePoints}
        />
        
        {redeemAmount && ethValue && (
          <div className="eth-value-display">
            Estimated Value: {ethValue} ETH
          </div>
        )}
        
        {isOwner ? (
          <button 
            onClick={redeemAsOwner}
            disabled={loading || parseFloat(redeemAmount) > parseFloat(maxRedeemablePoints)}
            className="redeem-button"
          >
            {loading ? 'Processing...' : 'Redeem Points (Admin)'}
          </button>
        ) : (
          <>
            <label>Select Partner:</label>
            <div className="partner-selection">
              {partners.map(partner => (
                <div 
                  key={partner.address} 
                  className={`partner-card ${selectedPartner === partner.address ? 'selected' : ''}`}
                  onClick={() => setSelectedPartner(partner.address)}
                >
                  <img src={partner.image} alt={partner.name} />
                  <h4>{partner.name}</h4>
                  <p>{partner.description}</p>
                </div>
              ))}
            </div>
            
            <button 
              onClick={redeemWithPartner}
              disabled={loading || parseFloat(redeemAmount) > parseFloat(maxRedeemablePoints)}
              className="redeem-button"
            >
              {loading ? 'Processing...' : 'Redeem Points with Partner'}
            </button>
          </>
        )}
      </div>
      
      {status && (
        <div className={`status-message ${status.startsWith('❌') ? 'error' : status.startsWith('⏳') ? 'processing' : 'success'}`}>
          {status}
        </div>
      )}
    </div>
  );
}

export default RedeemPoints;