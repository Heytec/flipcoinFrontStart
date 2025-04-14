import React, { useEffect, useState } from 'react';
import { fetchRoundHistory } from '../api/api';

const Leaderboard = () => {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const data = await fetchRoundHistory();
      setRounds(data.rounds);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching round history:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (loading) return <div>Loading leaderboard...</div>;

  return (
    <div className="p-4  rounded shadow">
      <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
      <ul className="list-disc ml-6">
        {rounds.map((round) => (
          <li key={round._id}>
            Round #{round.roundNumber} - Outcome: {round.outcome || 'Pending'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
