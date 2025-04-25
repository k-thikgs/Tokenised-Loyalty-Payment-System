# Blockchain Loyalty Program

A decentralized loyalty program built on Ethereum blockchain technology that allows businesses to issue loyalty points to customers as ERC20 tokens, with a beautiful user interface for shopping, point redemption, and partner management.



## 📋 Table of Contents
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Project](#running-the-project)
- [Smart Contracts](#-smart-contracts)
- [User Guide](#-user-guide)
  - [Customer Experience](#customer-experience)
  - [Store Owner Experience](#store-owner-experience)
  - [Admin Experience](#admin-experience)
- [Admin Access Guide](#-admin-access-guide)
- [Deployment](#-deployment)


## ✨ Features

### For Customers
- Browse and purchase products using ETH
- Earn loyalty points with every purchase
- Use loyalty points for discounts on future purchases
- Redeem points with various partner businesses
- View transaction history and point balance
- Choose between different reward options

### For Businesses
- Issue loyalty points to customers
- Create customized reward structures
- Manage partner relationships
- Track customer engagement and loyalty metrics

### For Admins
- Manage the entire loyalty ecosystem
- Add/remove partner businesses
- Set point expiration policies
- Monitor system-wide metrics
- Deploy new smart contracts with updated parameters

## 🚀 Technology Stack

- **Blockchain**: Ethereum (Hardhat for local development)
- **Smart Contracts**: Solidity
- **Frontend**: React.js
- **Web3 Integration**: ethers.js
- **Development Environment**: Hardhat
- **Styling**: CSS3 with modern flexbox and grid layouts

## 📁 Project Structure

```
/Tokenised_loyalty
├── contracts/              # Smart contract code
│   └── EnhancedLoyaltyProgram.sol
├── scripts/                # Deployment scripts
│   └── deploy.js
├── test/                   # Test files for smart contracts
├── artifacts/              # Compiled contracts (generated)
├── loyalty-dapp/           # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── abis/          # Compiled contract ABIs
│   │   └── web3.js        # Web3 integration utilities
│   └── package.json       # Frontend dependencies
└── hardhat.config.js       # Hardhat configuration
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MetaMask browser extension
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tokenised-loyalty.git
cd tokenised-loyalty
```

2. Install dependencies for the Hardhat project:
```bash
npm install
```

3. Install dependencies for the React app:
```bash
cd loyalty-dapp
npm install
cd ..
```

### Running the Project

1. Start a local Ethereum blockchain using Hardhat:
```bash
npx hardhat node
```

2. In a new terminal window, deploy the smart contracts to the local blockchain:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
Note the contract address that gets printed in the console.

3. Update the contract address in `loyalty-dapp/src/web3.js`:
```javascript
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
```

4. Start the React application:
```bash
cd loyalty-dapp
npm start
```

5. Open your browser and navigate to http://localhost:3000

6. Connect your MetaMask wallet to the local Hardhat network (http://localhost:8545) and import one of the test accounts provided by Hardhat.

## 💼 Smart Contracts

The main contract is `EnhancedLoyaltyProgram.sol`, which implements:

- ERC20 token standard for loyalty points
- Point issuance and redemption functionality
- Partner business management
- Store registration and management
- Points expiration mechanism
- Admin controls

## 📝 User Guide

### Customer Experience

1. **Connect Wallet**: Click the "Connect Wallet" button to connect your MetaMask.
2. **Shop**: Browse the product catalog, filter by category or search.
3. **Add to Cart**: Add desired products to your cart.
4. **Checkout**: Complete purchase with ETH.
5. **Earn Points**: Points are automatically credited to your account.
6. **Redeem Points**: Navigate to the "Redeem Points" tab to use your points with different partners or for discounts.

### Store Owner Experience

1. **Register as Store**: Contact the admin to register your address as a store.
2. **Store Management**: Once registered, access the Store Management tab.
3. **Issue Points**: Record customer purchases and issue loyalty points.
4. **View Metrics**: Monitor customer engagement and loyalty metrics.

### Admin Experience

1. **Issue Points**: Manually issue points to any customer address.
2. **Partner Management**: Add or remove partner businesses.
3. **System Settings**: Configure point expiration periods and reward structures.

## 🔑 Admin Access Guide

If you're having trouble accessing the admin functionality:

1. **Admin Checker Tool**: Navigate to the "Admin Checker" tab to verify if your account is the admin.
2. **Deploy New Contract**: If needed, use the "Deploy New Contract" tab to deploy a fresh contract with your current account as admin.
3. **Update web3.js**: After deploying, update the contract address in `web3.js` as instructed.

The default admin in Hardhat is the first account with the private key:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## 🚀 Deployment

To deploy to a public Ethereum network:

1. Update `hardhat.config.js` with your network configuration.
2. Fund your deployment account with ETH for the target network.
3. Deploy using:
```bash
npx hardhat run scripts/deploy.js --network <network-name>
```
4. Update the contract address in the frontend application.
