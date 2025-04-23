import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getLoyaltyContract } from '../web3';

function EventTracking() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, issued, redeemed, expired

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const contract = await getLoyaltyContract();
      
      // Get provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get the current block number
      const currentBlock = await provider.getBlockNumber();
      
      // Calculate block from 7 days ago (assumes ~15 second blocks)
      const blocksPerDay = 24 * 60 * 60 / 15; // Approx blocks per day
      const fromBlock = Math.max(0, currentBlock - (blocksPerDay * 7)); // Last 7 days
      
      // Fetch events
      const issuedEvents = await contract.queryFilter(
        contract.filters.PointsIssued(),
        fromBlock
      );
      
      const redeemedEvents = await contract.queryFilter(
        contract.filters.PointsRedeemed(),
        fromBlock
      );
      
      const expiredEvents = await contract.queryFilter(
        contract.filters.PointsExpired(),
        fromBlock
      );
      
      // Format events
      const formattedIssued = issuedEvents.map(event => ({
        id: `${event.transactionHash}-${event.logIndex}`,
        type: 'issued',
        user: event.args.user,
        amount: ethers.formatUnits(event.args.amount, 18),
        timestamp: new Date(), // In a real app, you'd get this from the block
        transactionHash: event.transactionHash
      }));
      
      const formattedRedeemed = redeemedEvents.map(event => ({
        id: `${event.transactionHash}-${event.logIndex}`,
        type: 'redeemed',
        user: event.args.user,
        amount: ethers.formatUnits(event.args.amount, 18),
        timestamp: new Date(),
        transactionHash: event.transactionHash
      }));
      
      const formattedExpired = expiredEvents.map(event => ({
        id: `${event.transactionHash}-${event.logIndex}`,
        type: 'expired',
        user: event.args.user,
        amount: ethers.formatUnits(event.args.amount, 18),
        timestamp: new Date(),
        transactionHash: event.transactionHash
      }));
      
      // Combine all events
      const allEvents = [
        ...formattedIssued,
        ...formattedRedeemed,
        ...formattedExpired
      ].sort((a, b) => b.timestamp - a.timestamp); // Most recent first
      
      setEvents(allEvents);
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on selected type
  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.type === filter);

  // Format address for display
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get event type badge styling
  const getEventBadgeStyle = (type) => {
    switch(type) {
      case 'issued':
        return { backgroundColor: '#4CAF50', color: 'white', padding: '3px 8px', borderRadius: '4px' };
      case 'redeemed':
        return { backgroundColor: '#2196F3', color: 'white', padding: '3px 8px', borderRadius: '4px' };
      case 'expired':
        return { backgroundColor: '#f44336', color: 'white', padding: '3px 8px', borderRadius: '4px' };
      default:
        return { backgroundColor: '#9E9E9E', color: 'white', padding: '3px 8px', borderRadius: '4px' };
    }
  };

  return (
    <div className="event-tracking">
      <h3>Loyalty Program Activity</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Filter: </label>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '5px 10px' }}
        >
          <option value="all">All Events</option>
          <option value="issued">Points Issued</option>
          <option value="redeemed">Points Redeemed</option>
          <option value="expired">Points Expired</option>
        </select>
        <button 
          onClick={loadEvents}
          style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>
      
      {loading ? (
        <p>Loading events...</p>
      ) : filteredEvents.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Event</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>User</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Amount</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Transaction</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map(event => (
              <tr key={event.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                  <span style={getEventBadgeStyle(event.type)}>
                    {event.type === 'issued' && 'Points Issued'}
                    {event.type === 'redeemed' && 'Points Redeemed'}
                    {event.type === 'expired' && 'Points Expired'}
                  </span>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{formatAddress(event.user)}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{event.amount} Points</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                  <a 
                    href={`https://etherscan.io/tx/${event.transactionHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#2196F3', textDecoration: 'none' }}
                  >
                    {formatAddress(event.transactionHash)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EventTracking;