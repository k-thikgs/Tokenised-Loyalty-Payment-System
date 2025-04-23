import { ethers } from "ethers";
import EnhancedLoyaltyProgram from "./abis/EnhancedLoyaltyProgram.json";

const CONTRACT_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"; // Update this after deployment

// Get the loyalty contract with signer
export async function getLoyaltyContract() {
  if (!window.ethereum) throw new Error("MetaMask not found");

  await window.ethereum.request({ method: "eth_requestAccounts" });

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return new ethers.Contract(CONTRACT_ADDRESS, EnhancedLoyaltyProgram.abi, signer);
}

// Connect to wallet and return address
export async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    return accounts[0];
  } catch (error) {
    console.error("Error connecting to wallet:", error);
    throw new Error("Failed to connect wallet");
  }
}

// Get user points balance
export async function getUserPointsBalance(address) {
  try {
    const contract = await getLoyaltyContract();
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, 18);
  } catch (error) {
    console.error("Error getting points balance:", error);
    throw error;
  }
}

// Calculate ETH value of points
export async function calculatePointsValue(pointsAmount) {
  try {
    const contract = await getLoyaltyContract();
    const value = await contract.calculatePointsValue(ethers.parseUnits(pointsAmount.toString(), 18));
    return ethers.formatEther(value);
  } catch (error) {
    console.error("Error calculating points value:", error);
    throw error;
  }
}

// Check if address is owner
export async function isContractOwner(address) {
  try {
    const contract = await getLoyaltyContract();
    const owner = await contract.owner();
    return owner.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error("Error checking owner:", error);
    return false;
  }
}

// Listen for blockchain events
export async function setupEventListeners(callback) {
  try {
    const contract = await getLoyaltyContract();
    
    // Listen for points issued events (both direct and through Transfer events)
    contract.on("PointsIssued", (user, amount, event) => {
      console.log("Points issued event:", user, amount);
      callback({
        type: "issued",
        user,
        amount: ethers.formatUnits(amount, 18),
        transactionHash: event.log.transactionHash
      });
    });
    
    // Listen for points redeemed events
    contract.on("PointsRedeemed", (user, amount, event) => {
      console.log("Points redeemed event:", user, amount);
      callback({
        type: "redeemed",
        user,
        amount: ethers.formatUnits(amount, 18),
        transactionHash: event.log.transactionHash
      });
    });
    
    // Listen for direct ERC20 Transfer events as well
    // This is important because token transfers might not trigger the PointsIssued event
    contract.on("Transfer", (from, to, amount, event) => {
      console.log("Transfer event:", from, to, amount);
      
      // If it's a transfer from the zero address, it's a mint (points issued)
      if (from === "0x0000000000000000000000000000000000000000") {
        callback({
          type: "issued",
          user: to,
          amount: ethers.formatUnits(amount, 18),
          transactionHash: event.log.transactionHash
        });
      } 
      // If it's a transfer to a user (not a redemption burn), notify as points received
      else if (to !== "0x0000000000000000000000000000000000000000") {
        callback({
          type: "transferred",
          from,
          to,
          amount: ethers.formatUnits(amount, 18),
          transactionHash: event.log.transactionHash
        });
      }
      // If it's a transfer to the zero address, it might be a burn (points redeemed)
      else if (to === "0x0000000000000000000000000000000000000000") {
        callback({
          type: "burned",
          from,
          amount: ethers.formatUnits(amount, 18),
          transactionHash: event.log.transactionHash
        });
      }
    });
    
    // Return a cleanup function to remove all event listeners
    return () => {
      contract.removeAllListeners("PointsIssued");
      contract.removeAllListeners("PointsRedeemed");
      contract.removeAllListeners("Transfer");
    };
  } catch (error) {
    console.error("Error setting up event listeners:", error);
    return () => {};
  }
}

// Helper to update a user's balance in real time
export async function refreshPointsBalance(userAddress) {
  if (!userAddress) return 0;
  
  try {
    return await getUserPointsBalance(userAddress);
  } catch (error) {
    console.error("Error refreshing balance:", error);
    return null;
  }
}