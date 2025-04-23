import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EnhancedLoyaltyProgramABI from '../abis/EnhancedLoyaltyProgram.json';

function AdminChecker() {
  const [contractAddress, setContractAddress] = useState("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [contractOwner, setContractOwner] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [status, setStatus] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          setConnectedAccount(accounts[0]);
          checkOwner(accounts[0]);
        } else {
          setStatus('No accounts connected. Please connect an account.');
        }
      } catch (error) {
        console.error("Connection error:", error);
        setStatus('Error connecting to MetaMask: ' + error.message);
      }
    } else {
      setStatus('MetaMask not detected. Please install MetaMask.');
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnectedAccount(accounts[0]);
        checkOwner(accounts[0]);
      } catch (error) {
        console.error("Connection error:", error);
        setStatus('Error connecting to MetaMask: ' + error.message);
      }
    } else {
      setStatus('MetaMask not detected. Please install MetaMask.');
    }
  };

  const checkOwner = async (account) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddress,
        EnhancedLoyaltyProgramABI.abi,
        provider
      );
      
      const owner = await contract.owner();
      setContractOwner(owner);
      
      const isAccountOwner = owner.toLowerCase() === account.toLowerCase();
      setIsOwner(isAccountOwner);
      
      if (isAccountOwner) {
        setStatus(`Success! Your account is the contract owner.`);
      } else {
        setStatus(`Your account is NOT the contract owner. You need to connect with account: ${owner}`);
      }
    } catch (error) {
      console.error("Error checking owner:", error);
      setStatus('Error checking contract owner: ' + error.message);
    }
  };

  const importAdminAccount = async () => {
    if (!privateKey) {
      setStatus('Please enter a private key.');
      return;
    }

    setImporting(true);
    setStatus('Requesting MetaMask to import account...');

    try {
      const params = [{
        privateKey: privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
      }];
      
      // Try to import the account to MetaMask
      // Note: This requires user permission and may not be supported in all MetaMask versions
      const newAccount = await window.ethereum.request({
        method: 'eth_importRawKey',
        params
      });
      
      setStatus(`Account imported successfully! You can now connect with it.`);
      connectWallet(); // Connect with the newly imported account
    } catch (error) {
      console.error("Import error:", error);
      setStatus(`Error importing account: ${error.message}. Try importing manually in MetaMask.`);
      
      // Provide manual import instructions
      alert(
        "Unable to import automatically. Please import the account manually in MetaMask:\n\n" +
        "1. Open MetaMask\n" +
        "2. Click on your account icon (top-right)\n" +
        "3. Click 'Import Account'\n" +
        "4. Paste your private key and click 'Import'\n\n" +
        "Then refresh this page and connect with the imported account."
      );
    } finally {
      setPrivateKey(''); // Clear private key from state for security
      setImporting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{color: '#4CAF50', textAlign: 'center'}}>Admin Account Checker</h1>
      
      <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px'}}>
        <h3>Contract Information</h3>
        <p><strong>Contract Address:</strong> {contractAddress}</p>
        {contractOwner && (
          <p><strong>Contract Owner (Admin):</strong> {contractOwner}</p>
        )}
      </div>
      
      <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px'}}>
        <h3>Your Account</h3>
        {connectedAccount ? (
          <>
            <p><strong>Connected Account:</strong> {connectedAccount}</p>
            <p><strong>Admin Status:</strong> {isOwner ? '✅ You are the admin!' : '❌ Not admin'}</p>
          </>
        ) : (
          <p>No account connected</p>
        )}
        
        <button 
          onClick={connectWallet}
          style={{
            backgroundColor: '#4CAF50', 
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Connect Wallet
        </button>
      </div>
      
      <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px'}}>
        <h3>Import Admin Account</h3>
        <p>To import the admin account, enter its private key below:</p>
        <p style={{fontSize: '0.9em', color: '#666'}}>
          The Hardhat default admin private key is:<br/>
          <code>0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80</code>
        </p>
        
        <input 
          type="text"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          placeholder="Enter private key (0x...)"
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px'
          }}
        />
        
        <button 
          onClick={importAdminAccount}
          disabled={importing}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {importing ? 'Importing...' : 'Import Account'}
        </button>
      </div>
      
      <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px'}}>
        <h3>Troubleshooting Steps</h3>
        <ol>
          <li>Import the admin account using the Hardhat default private key above</li>
          <li>Connect with that account in MetaMask</li>
          <li>If it still doesn't work, the contract might have been deployed with a different owner</li>
          <li>Try checking the contract address on a block explorer to verify the owner</li>
        </ol>
      </div>
      
      {status && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: isOwner ? '#e8f5e9' : '#ffebee',
          color: isOwner ? '#2e7d32' : '#c62828',
          borderRadius: '5px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {status}
        </div>
      )}

      <div style={{marginTop: '30px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px', borderLeft: '4px solid #1565c0'}}>
        <h3 style={{color: '#1565c0'}}>Manual Account Import Instructions</h3>
        <p>If automatic import doesn't work, follow these steps:</p>
        <ol>
          <li>Open MetaMask extension</li>
          <li>Click on your account icon in the top right</li>
          <li>Click "Import Account"</li>
          <li>Paste the private key and click "Import"</li>
          <li>Switch to the imported account in MetaMask</li>
          <li>Refresh this page and connect with the imported account</li>
        </ol>
      </div>
    </div>
  );
}

export default AdminChecker;