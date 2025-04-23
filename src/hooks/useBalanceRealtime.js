// // // src/hooks/useBalanceRealtime.

// src/hooks/useBalanceRealtime.js
import { useEffect } from 'react';
import Ably from 'ably';
import { useDispatch, useSelector } from 'react-redux';
// *** Import both updateBalance and updatePoints ***
import { updateBalance, updatePoints } from '../features/authSlice';

const useBalanceRealtime = () => {
  const dispatch = useDispatch();
  // Select the user ID to ensure we only run when logged in
  const userId = useSelector((state) => state.auth.user?.id);
  // Optional: Select current points/balance if needed for comparison/logging
  // const currentBalance = useSelector((state) => state.auth.balance);
  // const currentPoints = useSelector((state) => state.auth.points);

  useEffect(() => {
    // Only proceed if we have a user ID
    if (!userId) return;

    console.log(`Initializing Ably listener for user: ${userId}`);

    // IMPORTANT: In production switch to token-based auth
    // Ensure the API key is correctly set in your environment variables
    if (!process.env.REACT_APP_ABLY_API_KEY) {
        console.error("Ably API key is missing. Realtime updates will not work.");
        return;
    }
    const ably = new Ably.Realtime({
      key: process.env.REACT_APP_ABLY_API_KEY,
      // Consider adding clientId for better identification in Ably dashboard
      // clientId: userId
    });

    // 1) Watch for connection state changes
    const handleStateChange = (stateChange) => {
      // More informative log message
      console.log(`Ably connection state for user ${userId}: ${stateChange.previous} -> ${stateChange.current}`);
      if (stateChange.current === 'failed') {
          console.error("Ably connection failed:", stateChange.reason);
      }
    };
    ably.connection.on('stateChanged', handleStateChange);

    // 2) Subscribe to this user’s private channel
    const channelName = `user:${userId}`;
    const channel = ably.channels.get(channelName);
    console.log(`Subscribing to Ably channel: ${channelName}`);

    // Handler for balance updates
    const onBalanceUpdate = (message) => {
      console.log(`Received 'balance_update' on ${channelName}:`, message.data);
      const newBalance = message.data?.balance; // Use optional chaining
      // Validate that newBalance is a number before dispatching
      if (typeof newBalance === 'number') {
        // Optional: Log the change
        // console.log(`Dispatching updateBalance: ${currentBalance} -> ${newBalance}`);
        dispatch(updateBalance(newBalance));
      } else {
        console.warn(`Received invalid data for balance_update:`, message.data);
      }
    };

    // *** Handler for points updates ***
    const onPointsUpdate = (message) => {
      console.log(`Received 'points_update' on ${channelName}:`, message.data);
      const newPoints = message.data?.points; // Use optional chaining
      // Validate that newPoints is a number before dispatching
      if (typeof newPoints === 'number') {
        // Optional: Log the change
        // console.log(`Dispatching updatePoints: ${currentPoints} -> ${newPoints}`);
        // *** Dispatch the updatePoints action ***
        dispatch(updatePoints(newPoints));
        // Optional: Show notification for points earned if included
        // const pointsEarned = message.data?.pointsEarned;
        // if (typeof pointsEarned === 'number' && pointsEarned > 0) {
        //    showNotification(`You earned ${pointsEarned} points!`); // Requires a notification system
        // }
      } else {
        console.warn(`Received invalid data for points_update:`, message.data);
      }
    };

    // Subscribe to both events
    channel.subscribe('balance_update', onBalanceUpdate);
    channel.subscribe('points_update', onPointsUpdate); // *** Subscribe to points update ***

    // 3) Teardown function
    return () => {
      console.log(`Cleaning up Ably listener for user: ${userId}`);
      // Unsubscribe from specific events first
      try {
        channel.unsubscribe('balance_update', onBalanceUpdate);
        channel.unsubscribe('points_update', onPointsUpdate); // *** Unsubscribe from points update ***
        // Optional: Detach from channel if no other listeners remain
        // channel.detach((err) => {
        //   if (err) console.warn(`Error detaching from channel ${channelName}:`, err);
        // });
      } catch (unsubscribeErr) {
          console.warn(`Error during Ably channel unsubscribe for ${channelName}:`, unsubscribeErr);
      }

      // Remove connection state listener
      ably.connection.off('stateChanged', handleStateChange);

      // Close the Ably connection safely
      // Check state before closing to avoid errors if already closed/failed
      if (ably.connection.state === 'connected' || ably.connection.state === 'connecting') {
          try {
            ably.close();
            console.log(`Ably connection closed for user ${userId}.`);
          } catch (closeErr) {
            console.warn(`Error closing Ably connection for user ${userId}:`, closeErr);
          }
      } else {
          console.log(`Ably connection for user ${userId} was not 'connected' or 'connecting' (state: ${ably.connection.state}), skipping close().`);
      }
    };
    // Add userId to dependency array to re-run effect if user logs in/out
  }, [dispatch, userId]); // Use userId directly

  // This hook doesn't return anything, it just sets up the listener
};

export default useBalanceRealtime;







// // src/hooks/useBalanceRealtime.js
// import { useEffect } from 'react';
// import Ably from 'ably';
// import { useDispatch, useSelector } from 'react-redux';
// import { updateBalance } from '../features/authSlice';

// const useBalanceRealtime = () => {
//   const dispatch = useDispatch();
//   const user = useSelector((state) => state.auth.user);

//   useEffect(() => {
//     if (!user?.id) return;  // only run when we have a logged‑in user

//     // IMPORTANT: In production switch to token‑based auth
//     const ably = new Ably.Realtime({
//       key: process.env.REACT_APP_ABLY_API_KEY,
//     });

//     // 1) Watch for connection state changes
//     const handleStateChange = (stateChange) => {
//       console.log('Ably (balance) connection state:', stateChange.current);
//     };
//     ably.connection.on('stateChanged', handleStateChange);

//     // 2) Subscribe to this user’s private channel
//     const channel = ably.channels.get(`user:${user.id}`);
//     const onBalanceUpdate = (msg) => {
//       const newBalance = msg.data.balance;
//       dispatch(updateBalance(newBalance));
//     };
//     channel.subscribe('balance_update', onBalanceUpdate);

//     return () => {
//       // 3) Teardown: unsubscribe + remove state listener + close safely
//       channel.unsubscribe('balance_update', onBalanceUpdate);
//       ably.connection.off('stateChanged', handleStateChange);
//       try {
//         ably.close();
//       } catch (err) {
//         console.warn('Error closing Ably balance connection:', err);
//       }
//     };
//   }, [dispatch, user?.id]);
// };

// export default useBalanceRealtime;

// import { useEffect } from 'react';
// import Ably from 'ably';
// import { useDispatch, useSelector } from 'react-redux';
// import { updateBalance } from '../features/authSlice';

// // Initialize Ably client (ensure you use an appropriate authentication method in production)
// const ably = new Ably.Realtime({ key: process.env.REACT_APP_ABLY_API_KEY });

// const useBalanceRealtime = () => {
//   const dispatch = useDispatch();
//   const user = useSelector((state) => state.auth.user);

//   useEffect(() => {
//     if (user && user.id) {
//       const channelName = `user:${user.id}`;
//       // console.log(channelName)
//       const channel = ably.channels.get(channelName);

//       const onBalanceUpdate = (message) => {
//         // Assume message.data is in the form { balance: newBalance }
//         const newBalance = message.data.balance;
//         // console.log(newBalance)
//         dispatch(updateBalance(newBalance));
//       };

//       channel.subscribe('balance_update', onBalanceUpdate);
//       // console.info(`Subscribed to Ably channel ${channelName} for balance updates.`);

//       return () => {
//         channel.unsubscribe('balance_update', onBalanceUpdate);
//         // console.info(`Unsubscribed from Ably channel ${channelName}.`);
//       };
//     }
//   }, [dispatch, user]);
// };

// export default useBalanceRealtime;
