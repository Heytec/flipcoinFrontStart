import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../api/axiosInstance';

export const fetchCurrentRound = createAsyncThunk(
  'round/fetchCurrentRound',
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/currentRound');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const fetchJackpotPool = createAsyncThunk(
  'round/fetchJackpotPool',
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/jackpotPool');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

const roundSlice = createSlice({
  name: 'round',
  initialState: { currentRound: null, jackpot: 0, loading: false, error: null },
  reducers: {
    setCurrentRound(state, action) {
      state.currentRound = action.payload;
    },
    setJackpot(state, action) {
      state.jackpot = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentRound.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentRound.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRound = action.payload;
      })
      .addCase(fetchCurrentRound.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchJackpotPool.fulfilled, (state, action) => {
        state.jackpot = action.payload.jackpotPool;
      });
  },
});

export const { setCurrentRound, setJackpot } = roundSlice.actions;
export default roundSlice.reducer;
