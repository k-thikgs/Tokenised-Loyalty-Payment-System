// filepath: /home/karthik-g-s/Desktop/Tokenised_loyalty/loyalty-dapp/src/components/RedeemPoints.js
import React from 'react';

const RedeemPoints = ({ account, onRedeemComplete }) => {
  const handleRedeem = () => {
    // Logic for redeeming points
    alert("Redeeming points...");
    onRedeemComplete();
  };

  return (
    <div>
      <h3>Redeem Your Points</h3>
      <button onClick={handleRedeem}>Redeem Points</button>
    </div>
  );
};

export default RedeemPoints;