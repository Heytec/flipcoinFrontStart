// src/hooks/useBalanceRealtime.js
import { useEffect } from 'react';
import Ably from 'ably';
import { useDispatch, useSelector } from 'react-redux';
import { updateBalance } from '../features/authSlice';

// Initialize Ably client (ensure you use an appropriate authentication method in production)
const ably = new Ably.Realtime({ key: process.env.REACT_APP_ABLY_API_KEY });

const useBalanceRealtime = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user && user._id) {
      const channelName = `user:${user._id}`;
      console.log(channelName)
      const channel = ably.channels.get(channelName);

      const onBalanceUpdate = (message) => {
        // Assume message.data is in the form { balance: newBalance }
        const newBalance = message.data.balance;
        console.log(newBalance)
        dispatch(updateBalance(newBalance));
      };

      channel.subscribe('balance_update', onBalanceUpdate);
      console.info(`Subscribed to Ably channel ${channelName} for balance updates.`);

      return () => {
        channel.unsubscribe('balance_update', onBalanceUpdate);
        console.info(`Unsubscribed from Ably channel ${channelName}.`);
      };
    }
  }, [dispatch, user]);
};

export default useBalanceRealtime;
