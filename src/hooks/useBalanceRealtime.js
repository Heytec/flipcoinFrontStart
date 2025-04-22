// // src/hooks/useBalanceRealtime.js
// src/hooks/useBalanceRealtime.js
import { useEffect } from 'react';
import Ably from 'ably';
import { useDispatch, useSelector } from 'react-redux';
import { updateBalance } from '../features/authSlice';

const useBalanceRealtime = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user?.id) return;  // only run when we have a logged‑in user

    // IMPORTANT: In production switch to token‑based auth
    const ably = new Ably.Realtime({
      key: process.env.REACT_APP_ABLY_API_KEY,
    });

    // 1) Watch for connection state changes
    const handleStateChange = (stateChange) => {
      console.log('Ably (balance) connection state:', stateChange.current);
    };
    ably.connection.on('stateChanged', handleStateChange);

    // 2) Subscribe to this user’s private channel
    const channel = ably.channels.get(`user:${user.id}`);
    const onBalanceUpdate = (msg) => {
      const newBalance = msg.data.balance;
      dispatch(updateBalance(newBalance));
    };
    channel.subscribe('balance_update', onBalanceUpdate);

    return () => {
      // 3) Teardown: unsubscribe + remove state listener + close safely
      channel.unsubscribe('balance_update', onBalanceUpdate);
      ably.connection.off('stateChanged', handleStateChange);
      try {
        ably.close();
      } catch (err) {
        console.warn('Error closing Ably balance connection:', err);
      }
    };
  }, [dispatch, user?.id]);
};

export default useBalanceRealtime;

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
