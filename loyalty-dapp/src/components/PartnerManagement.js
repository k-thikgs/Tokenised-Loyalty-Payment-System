import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getLoyaltyContract } from '../web3';

function PartnerManagement() {
  const [partnerAddress, setPartnerAddress] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerList, setPartnerList] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load existing partners on component mount
  useEffect(() => {
    fetchPartners();
  }, []);

  // Fetch partners (in a real app, you'd track these in a database or from events)
  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      // This is a placeholder - in a real app, you would:
      // 1. Listen for partner approval events from your contract
      // 2. Or store partners in a database
      
      // For demo, we'll use mock data
      const mockPartners = [
        { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", name: "Fashion Store", isApproved: true },
        { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", name: "Electronics Shop", isApproved: true },
        { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", name: "Book Store", isApproved: false }
      ];
      
      setPartnerList(mockPartners);
    } catch (err) {
      console.error("Error fetching partners:", err);
      setStatus("Failed to load partners");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new partner
  const addPartner = async () => {
    if (!ethers.isAddress(partnerAddress)) {
      setStatus("Please enter a valid Ethereum address");
      return;
    }
    
    if (!partnerName) {
      setStatus("Please enter a partner name");
      return;
    }
    
    setIsLoading(true);
    try {
      // Call contract to approve partner
      const contract = await getLoyaltyContract();
      const tx = await contract.setApprovedPartner(partnerAddress, true);
      await tx.wait();
      
      // Add to local list
      setPartnerList([
        ...partnerList,
        { address: partnerAddress, name: partnerName, isApproved: true }
      ]);
      
      setPartnerAddress('');
      setPartnerName('');
      setStatus("Partner added successfully!");
    } catch (err) {
      console.error("Error adding partner:", err);
      setStatus("Failed to add partner: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle partner approval status
  const togglePartnerStatus = async (address, currentStatus) => {
    setIsLoading(true);
    try {
      // Call contract to change partner status
      const contract = await getLoyaltyContract();
      const tx = await contract.setApprovedPartner(address, !currentStatus);
      await tx.wait();
      
      // Update local list
      const updatedList = partnerList.map(partner => {
        if (partner.address === address) {
          return { ...partner, isApproved: !currentStatus };
        }
        return partner;
      });
      
      setPartnerList(updatedList);
      setStatus(`Partner status updated successfully!`);
    } catch (err) {
      console.error("Error updating partner status:", err);
      setStatus("Failed to update partner: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="partner-management">
      <h3>Manage Redemption Partners</h3>
      
      <div className="add-partner-form" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h4>Add New Partner</h4>
        <input
          type="text"
          placeholder="Partner Wallet Address"
          value={partnerAddress}
          onChange={(e) => setPartnerAddress(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <input
          type="text"
          placeholder="Partner Name"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <button 
          onClick={addPartner}
          disabled={isLoading}
          style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          {isLoading ? 'Processing...' : 'Add Partner'}
        </button>
      </div>
      
      {status && <p className="status-message">{status}</p>}
      
      <h4>Partner List</h4>
      {isLoading && <p>Loading partners...</p>}
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Address</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {partnerList.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '8px' }}>No partners found</td>
            </tr>
          ) : (
            partnerList.map((partner, index) => (
              <tr key={index}>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{partner.name}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{partner.address.slice(0, 6)}...{partner.address.slice(-4)}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                  <span style={{ 
                    color: partner.isApproved ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {partner.isApproved ? 'Approved' : 'Not Approved'}
                  </span>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                  <button 
                    onClick={() => togglePartnerStatus(partner.address, partner.isApproved)}
                    style={{ 
                      padding: '5px 10px', 
                      backgroundColor: partner.isApproved ? '#f44336' : '#4CAF50', 
                      color: 'white', 
                      border: 'none', 
                      cursor: 'pointer' 
                    }}
                  >
                    {partner.isApproved ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default PartnerManagement;