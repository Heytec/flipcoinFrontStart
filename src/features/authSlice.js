import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk to send OTP for both registration and login.
export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async ({ phone, mode }, thunkAPI) => {
    try {
      // mode: 'register' or 'login'
      const response = await axios.post('http://localhost:5000/api/auth/sendOTP', { phone, mode });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Thunk to verify OTP and complete registration or login.
export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ phone, code, mode }, thunkAPI) => {
    try {
      // Choose endpoint based on mode
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const response = await axios.post(`http://localhost:5000/api${endpoint}`, { phone, code });
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response.data; // Expected: { user, accessToken, refreshToken }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    loading: false,
    error: null,
  },
  reducers: {
    updateAccessToken(state, action) {
      state.accessToken = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to send OTP';
      })
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'OTP verification failed';
      });
  },
});

export const { updateAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
