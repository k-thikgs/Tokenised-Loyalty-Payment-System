### Step 1: Create New Components

**1. RedeemPoints.js**
```javascript
// filepath: /home/karthik-g-s/Desktop/Tokenised_loyalty/loyalty-dapp/src/components/RedeemPoints.js
import React from 'react';

const RedeemPoints = ({ account, onRedeemComplete }) => {
  // Logic for redeeming points goes here

  return (
    <div>
      <h2>Redeem Your Loyalty Points</h2>
      {/* Redeem points form and logic */}
      <button onClick={onRedeemComplete}>Redeem Points</button>
    </div>
  );
};

export default RedeemPoints;
```

**2. PartnerManagement.js**
```javascript
// filepath: /home/karthik-g-s/Desktop/Tokenised_loyalty/loyalty-dapp/src/components/PartnerManagement.js
import React from 'react';

const PartnerManagement = () => {
  // Logic for managing partners goes here

  return (
    <div>
      <h2>Manage Partners</h2>
      {/* Partner management UI */}
    </div>
  );
};

export default PartnerManagement;
```

**3. EventTracking.js**
```javascript
// filepath: /home/karthik-g-s/Desktop/Tokenised_loyalty/loyalty-dapp/src/components/EventTracking.js
import React from 'react';

const EventTracking = () => {
  // Logic for tracking events goes here

  return (
    <div>
      <h2>Event Tracking</h2>
      {/* Event tracking UI */}
    </div>
  );
};

export default EventTracking;
```

**4. StoreInterface.js**
```javascript
// filepath: /home/karthik-g-s/Desktop/Tokenised_loyalty/loyalty-dapp/src/components/StoreInterface.js
import React from 'react';

const StoreInterface = () => {
  // Logic for store interface goes here

  return (
    <div>
      <h2>Store Interface</h2>
      {/* Store interface UI */}
    </div>
  );
};

export default StoreInterface;
```

### Step 2: Update `App.js`

Now, update your `App.js` file to import and use these components.

```javascript
// filepath: /home/karthik-g-s/Desktop/Tokenised_loyalty/loyalty-dapp/src/App.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getLoyaltyContract } from './web3';
import IssuePointsForm from './components/IssuePointsForm';
import RedeemPoints from './components/RedeemPoints';
import PartnerManagement from './components/PartnerManagement';
import EventTracking from './components/EventTracking';
import StoreInterface from './components/StoreInterface';

// ... (rest of your existing code)

function App() {
  // ... (existing state and functions)

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ... (existing header and navigation) */}

      {account && activeTab === 'shop' && (
        <div style={{ display: 'flex' }}>
          {/* Products section */}
          <div style={{ flex: '3', padding: '0 15px' }}>
            <h2>Products</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {PRODUCTS.map(product => renderProduct(product))}
            </div>
          </div>
          
          {/* Cart section */}
          <div style={{ flex: '1', padding: '0 15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <h2>Your Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <>
                {cart.map(item => renderCartItem(item))}
                {/* ... (existing cart summary and checkout button) */}
              </>
            )}
          </div>
        </div>
      )}

      {account && activeTab === 'redeem' && (
        <RedeemPoints 
          account={account} 
          onRedeemComplete={fetchDetails}
        />
      )}

      {account && activeTab === 'admin' && isOwner && (
        <div>
          <h2>Admin Panel</h2>
          <IssuePointsForm onIssueComplete={fetchDetails} />
          <PartnerManagement />
          <EventTracking />
          <StoreInterface />
        </div>
      )}

      {/* ... (existing welcome message) */}
    </div>
  );
}

export default App;
```

### Summary of Changes
- Created four new components: `RedeemPoints`, `PartnerManagement`, `EventTracking`, and `StoreInterface`.
- Updated `App.js` to import and use these components based on the active tab.

Make sure to implement the necessary logic and UI in each of the new components as per your application's requirements.