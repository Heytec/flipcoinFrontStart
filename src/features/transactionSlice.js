// transactionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../app/axiosInstance'; // Adjust the path as needed

// Thunk to initiate an STK push transaction.
export const initiateSTKPush = createAsyncThunk(
  'transaction/initiateSTKPush',
  async ({ phone, amount, sessionId }, thunkAPI) => {
    try {
      const response = await axiosInstance.post('/mpesa/stkpush', { phone, amount, sessionId });
      return response.data; // Expected response: { message, data: { ... } }
    } catch (error) {
      const errorMsg = error.response?.data?.errorMessage || error.message;
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);

// Thunk to initiate a B2C transaction.
export const initiateB2C = createAsyncThunk(
  'transaction/initiateB2C',
  async ({ phone, amount, sessionId }, thunkAPI) => {
    try {
      const response = await axiosInstance.post('/mpesa/b2c', { phone, amount, sessionId });
      return response.data; // Expected response: { message, transactionResult: { ... } }
    } catch (error) {
      const errorMsg = error.response?.data?.errorMessage || error.message;
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);

// Thunk to fetch deposit history with pagination.
export const fetchDeposits = createAsyncThunk(
  'transaction/fetchDeposits',
  async ({ phone, page = 1, limit = 10 }, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/mpesa/deposits', { params: { phone, page, limit } });
      // Expected response: { message, data: deposits, pagination: { currentPage, totalPages, totalRecords } }
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.errorMessage || error.message;
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);

// Thunk to fetch withdrawal history with pagination.
export const fetchWithdrawals = createAsyncThunk(
  'transaction/fetchWithdrawals',
  async ({ phone, page = 1, limit = 10 }, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/mpesa/withdrawals', { params: { phone, page, limit } });
      // Expected response: { message, data: withdrawals, pagination: { currentPage, totalPages, totalRecords } }
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.errorMessage || error.message;
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);

const transactionSlice = createSlice({
  name: 'transaction',
  initialState: {
    deposits: [],
    depositsPagination: {},
    withdrawals: [],
    withdrawalsPagination: {},
    transactionStatus: null, // Holds the response from STK push or B2C transaction initiation.
    loading: false,
    error: null,
  },
  reducers: {
    // Clear the current transaction status (e.g., after displaying a notification).
    clearTransactionStatus(state) {
      state.transactionStatus = null;
    },
    // Clear the error message.
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle initiateSTKPush
      .addCase(initiateSTKPush.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.transactionStatus = null;
      })
      .addCase(initiateSTKPush.fulfilled, (state, action) => {
        state.loading = false;
        state.transactionStatus = action.payload;
      })
      .addCase(initiateSTKPush.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to initiate STK push transaction';
      })
      // Handle initiateB2C
      .addCase(initiateB2C.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.transactionStatus = null;
      })
      .addCase(initiateB2C.fulfilled, (state, action) => {
        state.loading = false;
        state.transactionStatus = action.payload;
      })
      .addCase(initiateB2C.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to initiate B2C transaction';
      })
      // Handle fetchDeposits
      .addCase(fetchDeposits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeposits.fulfilled, (state, action) => {
        state.loading = false;
        state.deposits = action.payload.data;
        state.depositsPagination = action.payload.pagination;
      })
      .addCase(fetchDeposits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch deposit history';
      })
      // Handle fetchWithdrawals
      .addCase(fetchWithdrawals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawals.fulfilled, (state, action) => {
        state.loading = false;
        state.withdrawals = action.payload.data;
        state.withdrawalsPagination = action.payload.pagination;
      })
      .addCase(fetchWithdrawals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch withdrawal history';
      });
  },
});

export const { clearTransactionStatus, clearError } = transactionSlice.actions;
export default transactionSlice.reducer;

/*
  Additional Considerations:

  1. Real-time Updates:
     - The backend MPESA controller uses Ably to publish 'balance_update' events when a deposit or withdrawal occurs.
     - Consider integrating an Ably (or WebSocket) client in your frontend to subscribe to these events.
     - When an event is received, dispatch appropriate actions (e.g., update the user balance in authSlice or refresh transaction histories).

  2. Error Handling:
     - The error messages returned from the backend may include details (such as 'Canceled by user' or specific error codes).
     - You might want to parse these error messages further to provide more user-friendly notifications in your UI.

  3. Pagination:
     - The deposit and withdrawal history endpoints return pagination information.
     - Ensure your UI components can access and use the pagination data (currentPage, totalPages, totalRecords) for proper navigation.

  4. Transaction Status Updates:
     - The response from initiating transactions (STK push or B2C) is stored in `transactionStatus`.
     - Depending on your business logic, you might implement additional logic (such as polling or real-time subscriptions) to update the transaction status if it is updated asynchronously via callbacks.
*/
