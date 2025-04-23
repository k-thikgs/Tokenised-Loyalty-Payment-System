import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EnhancedLoyaltyProgramABI from '../abis/EnhancedLoyaltyProgram.json';

function DeployNewContract() {
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [status, setStatus] = useState('');
  const [newContractAddress, setNewContractAddress] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Connect to wallet on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          setConnectedAccount(accounts[0]);
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
        setStatus('Wallet connected successfully.');
      } catch (error) {
        console.error("Connection error:", error);
        setStatus('Error connecting to MetaMask: ' + error.message);
      }
    } else {
      setStatus('MetaMask not detected. Please install MetaMask.');
    }
  };

  const deployNewContract = async () => {
    if (!connectedAccount) {
      setStatus('Please connect your wallet first.');
      return;
    }

    setIsDeploying(true);
    setStatus('Deploying new contract...');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get the contract factory from the ABI
      const factory = new ethers.ContractFactory(
        EnhancedLoyaltyProgramABI.abi, 
        EnhancedLoyaltyProgramABI.bytecode, 
        signer
      );
      
      // Deploy the contract with the connected account as the owner
      const deployedContract = await factory.deploy(
        connectedAccount, // initialOwner - set to the connected account
        "LoyaltyToken", // name
        "LTY", // symbol
        3600, // expirationPeriod
        1000, // maxRedeemablePoints
        100 // pointsToEthRate
      );
      
      // Wait for the contract to be deployed
      await deployedContract.waitForDeployment();
      
      // Get the contract address
      const contractAddress = await deployedContract.getAddress();
      setNewContractAddress(contractAddress);
      setDeploymentSuccess(true);
      
      setStatus(`Contract deployed successfully at address: ${contractAddress}`);
    } catch (error) {
      console.error("Deployment error:", error);
      setStatus(`Error deploying contract: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const verifyOwnership = async () => {
    if (!connectedAccount || !newContractAddress) {
      setStatus('Need connected wallet and deployed contract to verify ownership.');
      return;
    }

    setIsVerifying(true);
    setStatus('Verifying ownership...');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        newContractAddress,
        EnhancedLoyaltyProgramABI.abi,
        provider
      );
      
      const owner = await contract.owner();
      
      if (owner.toLowerCase() === connectedAccount.toLowerCase()) {
        setStatus('✅ Success! You are the owner of the newly deployed contract.');
      } else {
        setStatus(`❌ Error: You (${connectedAccount}) are not the owner of the contract. The owner is: ${owner}`);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus(`Error verifying ownership: ${error.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
      <h1 style={{ color: '#4CAF50', textAlign: 'center' }}>Deploy New Contract</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Your Account</h3>
        {connectedAccount ? (
          <p><strong>Connected Account:</strong> {connectedAccount}</p>
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
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Deploy New Contract</h3>
        <p>This will deploy a new instance of the EnhancedLoyaltyProgram contract with your account as the owner.</p>
        
        <button 
          onClick={deployNewContract}
          disabled={isDeploying || !connectedAccount}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            opacity: isDeploying || !connectedAccount ? 0.7 : 1
          }}
        >
          {isDeploying ? 'Deploying...' : 'Deploy Contract'}
        </button>
      </div>
      
      {deploymentSuccess && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '5px', borderLeft: '4px solid #4CAF50' }}>
          <h3>Contract Successfully Deployed!</h3>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ marginRight: '10px', flexGrow: 1 }}><strong>New Contract Address:</strong> {newContractAddress}</p>
            <button 
              onClick={() => copyToClipboard(newContractAddress)}
              style={{
                backgroundColor: copied ? '#4CAF50' : '#f1f1f1',
                color: copied ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px',
                padding: '5px 10px',
                cursor: 'pointer'
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          <div style={{ marginTop: '15px' }}>
            <button 
              onClick={verifyOwnership}
              disabled={isVerifying}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '10px 15px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Ownership'}
            </button>
          </div>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h4>Next Steps:</h4>
            <ol style={{ paddingLeft: '20px' }}>
              <li>Copy the contract address above</li>
              <li>Open the <code>web3.js</code> file in the <code>src</code> folder</li>
              <li>Replace the <code>CONTRACT_ADDRESS</code> value with the new address</li>
              <li>Restart the application</li>
              <li>You should now be able to log in as admin using your connected account</li>
            </ol>
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {`// Update this line in web3.js
const CONTRACT_ADDRESS = "${newContractAddress}"; // Update this after deployment`}
            </div>
          </div>
        </div>
      )}
      
      {status && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: status.includes('Success') ? '#e8f5e9' : status.includes('Error') ? '#ffebee' : '#e3f2fd',
          color: status.includes('Success') ? '#2e7d32' : status.includes('Error') ? '#c62828' : '#1565c0',
          borderRadius: '5px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {status}
        </div>
      )}
    </div>
  );
}

export default DeployNewContract;