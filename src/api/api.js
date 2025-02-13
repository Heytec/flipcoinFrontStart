import axiosInstance from '../app/axiosInstance';

// Fetch all rounds and assume the current round is the one with outcome === null.
export const fetchCurrentRound = async () => {
  const res = await axiosInstance.get('/game/rounds');
  // Assuming rounds are returned sorted by startTime descending,
  // pick the first round with outcome === null (if any)
  const rounds = res.data.rounds;
  const current = rounds.find((round) => !round.outcome);
  return current || null;
};

export const fetchRoundHistory = async () => {
  const res = await axiosInstance.get('/game/rounds');
  return res.data;
};

export const fetchJackpotPool = async () => {
  const res = await axiosInstance.get('/game/jackpot');
  return res.data;
};

export const placeBet = async (betData, token = '') => {
  const res = await axiosInstance.post('/game/bet', betData, {
    headers: { Authorization: token },
  });
  return res.data;
};

export default axiosInstance;

