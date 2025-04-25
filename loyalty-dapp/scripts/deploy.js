const { ethers } = require("hardhat");

async function main() {
    const EnhancedLoyaltyProgram = await ethers.getContractFactory("EnhancedLoyaltyProgram");
    console.log("Deploying with account:", (await ethers.getSigners())[0].address);

    const contract = await EnhancedLoyaltyProgram.deploy(
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // initialOwner
        "LoyaltyToken", // name
        "LTY", // symbol
        3600, // expirationPeriod
        1000, // maxRedeemablePoints
        100 // pointsToEthRate
    );

    console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});