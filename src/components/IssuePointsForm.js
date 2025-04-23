import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getLoyaltyContract } from '../web3';

function IssuePointsForm({ onIssueComplete }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleIssue = async () => {
    // Validation
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      setStatus('❌ Please enter a valid recipient address and amount');
      return;
    }

    try {
      setIsProcessing(true);
      setStatus("⏳ Processing transaction...");

      if (!window.ethereum) {
        setStatus("❌ MetaMask not found");
        return;
      }

      const contract = await getLoyaltyContract();
      
      // Issue points
      const tx = await contract.issuePoints(recipient, ethers.parseUnits(amount, 18));
      setStatus('⏳ Transaction submitted...');
      await tx.wait();

      setStatus('✅ Points issued successfully!');
      setAmount('');
      
      // Call the callback to refresh balances - this is the key fix
      if (onIssueComplete) {
        onIssueComplete();
      }
      
      // Optionally try to emit an event that can be picked up by other components
      window.dispatchEvent(new CustomEvent('pointsIssued', { 
        detail: { 
          recipient, 
          amount: parseFloat(amount)
        }
      }));
      
    } catch (err) {
      console.error("Error issuing points:", err);
      setStatus('❌ Error: ' + (err.message || err.reason || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="issue-form">
      <h3>💰 Issue Loyalty Points</h3>
      <div className="form-group">
        <label>Recipient Address:</label>
        <input
          type="text"
          placeholder="0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          disabled={isProcessing}
          className="input-field"
        />
      </div>
      <div className="form-group">
        <label>Amount:</label>
        <input
          type="number"
          placeholder="Amount of points"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isProcessing}
          className="input-field"
          min="1"
        />
      </div>
      <button 
        onClick={handleIssue} 
        disabled={isProcessing || !recipient || !amount}
        className="action-button"
      >
        {isProcessing ? 'Processing...' : 'Issue Points'}
      </button>
      {status && <p className={`status ${status.startsWith('❌') ? 'error' : status.startsWith('⏳') ? 'pending' : 'success'}`}>{status}</p>}
    </div>
  );
}

export default IssuePointsForm;
