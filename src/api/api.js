import axiosInstance from './axiosInstance';

export const fetchCurrentRound = async () => {
  const res = await axiosInstance.get('/currentRound');
  return res.data;
};

export const fetchRoundHistory = async () => {
  const res = await axiosInstance.get('/roundHistory');
  return res.data;
};

export const fetchJackpotPool = async () => {
  const res = await axiosInstance.get('/jackpotPool');
  return res.data;
};

export const placeBet = async (betData, token = '') => {
  const res = await axiosInstance.post('/placeBet', betData, {
    headers: { Authorization: token },
  });
  return res.data;
};

export default axiosInstance;

