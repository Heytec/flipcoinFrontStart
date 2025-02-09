// src/components/GameRoom.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentRound, fetchJackpotPool } from '../features/roundSlice';
import BetForm from './BetForm';
import CoinFlip from './CoinFlip';

const GameRoom = () => {
  const dispatch = useDispatch();
  const { currentRound, jackpot, loading, error } = useSelector((state) => state.round);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    dispatch(fetchCurrentRound());
    dispatch(fetchJackpotPool());
    const interval = setInterval(() => {
      dispatch(fetchCurrentRound());
      dispatch(fetchJackpotPool());
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    if (currentRound) {
      const countdownEnd = new Date(currentRound.countdownEndTime).getTime();
      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((countdownEnd - now) / 1000));
        setTimeLeft(diff);
      };
      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [currentRound]);

  if (loading) return <div className="text-center">Loading game data...</div>;
  if (error) return <div className="text-center text-red-600">Error: {error}</div>;

  return (
    <div className="bg-white p-6 rounded shadow">
      <h1 className="text-3xl font-bold mb-4 text-center">Real-time Betting Game</h1>
      {currentRound ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Round #{currentRound.roundNumber}</h2>
          <p className="mb-2">
            Betting closes in: <span className="font-bold">{timeLeft} seconds</span>
          </p>
          <p className="mb-2">
            Total Pool: <span className="font-bold">{currentRound.totalPool}</span>
          </p>
          <CoinFlip round={currentRound} />
          <BetForm roundId={currentRound._id} />
        </div>
      ) : (
        <div className="text-center">No active round at the moment. Please wait...</div>
      )}
      <div className="mt-4 text-center">
        <h3 className="text-xl">Current Jackpot: {jackpot}</h3>
      </div>
    </div>
  );
};

export default GameRoom;
