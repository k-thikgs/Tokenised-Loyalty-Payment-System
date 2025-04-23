// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EnhancedLoyaltyProgram is ERC20, Ownable, ReentrancyGuard {
    // Struct to store user information
    struct User {
        uint256 points;
        uint256 lastActivity; // To track activity for expiration
    }

    mapping(address => User) private users;

    // Configurable expiration period for loyalty points (in seconds)
    uint256 public expirationPeriod;

    event PointsIssued(address indexed user, uint256 amount);
    event PointsRedeemed(address indexed user, uint256 amount);
    event PointsExpired(address indexed user, uint256 amount);
    event StoreRegistered(address indexed storeAddress, string name);
    event StoreRemoved(address indexed storeAddress);
    event PurchaseCompleted(address indexed user, address indexed store, uint256 amount, uint256 pointsEarned);

    // Mapping to handle approved partners/vendors for redeeming points
    mapping(address => bool) public approvedPartners;
    
    // Mapping to handle approved stores that can issue points
    mapping(address => bool) public approvedStores;
    
    // Store information
    struct Store {
        string name;
        bool isActive;
        uint256 pointsRate; // How many points per 1 ETH spent (e.g. 100 means 100 points per ETH)
    }
    
    mapping(address => Store) public stores;

    // Maximum points a user can redeem at once (safety limit)
    uint256 public maxRedeemablePoints;
    
    // Conversion rate for points to ETH when redeeming (e.g. 1000 points = 0.01 ETH)
    uint256 public pointsToEthRate;

    constructor(
        address initialOwner,
        string memory name,
        string memory symbol,
        uint256 _expirationPeriod,
        uint256 _maxRedeemablePoints,
        uint256 _pointsToEthRate
    ) ERC20(name, symbol) Ownable(initialOwner) {
        expirationPeriod = _expirationPeriod;
        maxRedeemablePoints = _maxRedeemablePoints;
        pointsToEthRate = _pointsToEthRate;
        _mint(initialOwner, 1000000 * 10 ** decimals()); // Initial supply to the owner
    }

    // Function to register a new store
    function registerStore(address storeAddress, string memory storeName, uint256 storePointsRate) public onlyOwner {
        require(storeAddress != address(0), "Invalid store address");
        require(bytes(storeName).length > 0, "Store name cannot be empty");
        require(storePointsRate > 0, "Points rate must be greater than zero");
        
        stores[storeAddress] = Store(storeName, true, storePointsRate);
        approvedStores[storeAddress] = true;
        
        emit StoreRegistered(storeAddress, storeName);
    }
    
    // Function to remove a store
    function removeStore(address storeAddress) public onlyOwner {
        require(stores[storeAddress].isActive, "Store not found or already inactive");
        
        stores[storeAddress].isActive = false;
        approvedStores[storeAddress] = false;
        
        emit StoreRemoved(storeAddress);
    }
    
    // Function for stores to record a purchase and issue points
    function recordPurchase(address customer, uint256 purchaseAmount) public nonReentrant {
        require(approvedStores[msg.sender], "Only approved stores can record purchases");
        require(customer != address(0), "Invalid customer address");
        require(purchaseAmount > 0, "Purchase amount must be greater than zero");
        
        Store storage store = stores[msg.sender];
        
        // Calculate points based on store's rate
        uint256 pointsToIssue = (purchaseAmount * store.pointsRate) / 1 ether;
        
        // Issue the points
        _mint(customer, pointsToIssue);
        users[customer].points += pointsToIssue;
        users[customer].lastActivity = block.timestamp;
        
        emit PointsIssued(customer, pointsToIssue);
        emit PurchaseCompleted(customer, msg.sender, purchaseAmount, pointsToIssue);
    }

    // Function to issue loyalty points to a user (onlyOwner)
    function issuePoints(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than zero");

        _mint(to, amount);
        users[to].points += amount;
        users[to].lastActivity = block.timestamp;

        emit PointsIssued(to, amount);
    }

    // Function to redeem loyalty points (non-reentrant for added security)
    function redeemPoints(address from, uint256 amount) public nonReentrant onlyOwner {
        require(from != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than zero");
        require(users[from].points >= amount, "Insufficient points");
        require(amount <= maxRedeemablePoints, "Exceeds max redeemable limit");

        _burn(from, amount);
        users[from].points -= amount;
        users[from].lastActivity = block.timestamp;

        emit PointsRedeemed(from, amount);
    }

    // Function to check and expire points if they are past the expiration period
    function expirePoints(address user) public onlyOwner {
        require(user != address(0), "Invalid user address");
        uint256 timeElapsed = block.timestamp - users[user].lastActivity;
        if (timeElapsed >= expirationPeriod && users[user].points > 0) {
            uint256 expiredAmount = users[user].points;
            _burn(user, expiredAmount);
            users[user].points = 0;

            emit PointsExpired(user, expiredAmount);
        }
    }

    // Function to add or remove an approved partner for redeeming points
    function setApprovedPartner(address partner, bool status) public onlyOwner {
        require(partner != address(0), "Invalid partner address");
        approvedPartners[partner] = status;
    }

    // Function to redeem points with an approved partner
    function redeemWithPartner(
        address from,
        uint256 amount,
        address partner
    ) public nonReentrant {
        require(approvedPartners[partner], "Partner not approved");
        require(users[from].points >= amount, "Insufficient points");
        require(amount <= maxRedeemablePoints, "Exceeds max redeemable limit");
        
        // Ensure the sender is either the user or an approved partner
        require(msg.sender == from || msg.sender == partner, "Unauthorized");

        _burn(from, amount);
        users[from].points -= amount;
        users[from].lastActivity = block.timestamp;

        emit PointsRedeemed(from, amount);
    }
    
    // Function to calculate ETH value of points
    function calculatePointsValue(uint256 pointsAmount) public view returns (uint256) {
        return (pointsAmount * 1 ether) / pointsToEthRate;
    }

    // View function to check points balance of a user
    function getPointsBalance(address user) public view returns (uint256) {
        return users[user].points;
    }

    // View function to check if points are expired
    function isExpired(address user) public view returns (bool) {
        if (users[user].points == 0) return false;
        uint256 timeElapsed = block.timestamp - users[user].lastActivity;
        return timeElapsed >= expirationPeriod;
    }

    // Function to update the expiration period (onlyOwner)
    function updateExpirationPeriod(uint256 newExpirationPeriod) public onlyOwner {
        expirationPeriod = newExpirationPeriod;
    }

    // Function to update the max redeemable points limit (onlyOwner)
    function updateMaxRedeemablePoints(uint256 newMaxRedeemablePoints) public onlyOwner {
        maxRedeemablePoints = newMaxRedeemablePoints;
    }
    
    // Function to update the points to ETH conversion rate
    function updatePointsToEthRate(uint256 newPointsToEthRate) public onlyOwner {
        require(newPointsToEthRate > 0, "Rate must be greater than zero");
        pointsToEthRate = newPointsToEthRate;
    }
}
