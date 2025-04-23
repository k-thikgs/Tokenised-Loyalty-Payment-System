// filepath: /home/karthik-g-s/Desktop/Tokenised_loyalty/loyalty-dapp/src/components/RedeemPoints.js
import React from 'react';

const RedeemPoints = ({ account, onRedeemComplete }) => {
  const handleRedeem = () => {
    // Logic for redeeming points
    alert("Points redeemed!");
    onRedeemComplete();
  };

  return (
    <div>
      <h3>Redeem Points</h3>
      <button onClick={handleRedeem}>Redeem Points</button>
    </div>
  );
};

export default RedeemPoints;