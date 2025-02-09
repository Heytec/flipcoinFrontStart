// src/components/BetForm.js
import React, { useState } from 'react';
import { placeBet } from '../api/api';
import { useDispatch } from 'react-redux';
import { updateBalance } from '../features/authSlice';

const BetForm = ({ roundId }) => {
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState('heads');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const betData = { amount: parseFloat(amount), side, roundId };
      const token = localStorage.getItem('accessToken') || '';
      const result = await placeBet(betData, token);
      setMessage('Bet placed successfully!');
      dispatch(updateBalance(result.user.balance));
      setAmount('');
    } catch (error) {
      console.error('Error placing bet:', error);
      setMessage('Error placing bet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold mb-2">Place Your Bet</h3>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input 
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Bet Amount"
          className="border p-2 rounded"
          min="1"
          step="0.01"
          required
        />
        <div>
          <label className="mr-4">
            <input 
              type="radio"
              value="heads"
              checked={side === 'heads'}
              onChange={() => setSide('heads')}
            />
            Heads
          </label>
          <label className="mr-4">
            <input 
              type="radio"
              value="tails"
              checked={side === 'tails'}
              onChange={() => setSide('tails')}
            />
            Tails
          </label>
        </div>
        <button 
          type="submit" 
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Placing Bet...' : 'Place Bet'}
        </button>
      </form>
      {message && <p className="mt-2 text-center">{message}</p>}
    </div>
  );
};

export default BetForm;
