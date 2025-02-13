// // // // // // authSlice.js
// src/features/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

// Thunk to send OTP
export const sendOTP = createAsyncThunk(
  "auth/sendOTP",
  async ({ phone, mode }, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/otp/send", { phone, mode });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Thunk to verify OTP, then register or login
export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async ({ phone, code, mode }, thunkAPI) => {
    try {
      // First, verify the OTP
      await axiosInstance.post("/otp/verify", { phone, code });
      // Then call the appropriate endpoint based on mode
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const response = await axiosInstance.post(endpoint, { phone, code });
      // Expected response: { user, accessToken, refreshToken, message }
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Thunk to perform logout
export const performLogout = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      const { refreshToken } = thunkAPI.getState().auth;
      if (!refreshToken) {
        throw new Error("No refresh token found");
      }
      await axiosInstance.post("/auth/logout", { refreshToken });
      return true;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial auth state
const initialState = {
  user: null,
  balance: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateAccessToken(state, action) {
      state.accessToken = action.payload;
      localStorage.setItem("accessToken", action.payload);
    },
    updateBalance(state, action) {
      state.balance = action.payload;
      if (state.user) {
        state.user.balance = action.payload;
      }
    },
    // Synchronous logout clears auth state and tokens
    logout(state) {
      state.user = null;
      state.balance = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
  extraReducers: (builder) => {
    builder
      // sendOTP
      .addCase(sendOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to send OTP";
      })
      // verifyOTP
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.balance = action.payload.user.balance;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        // Save tokens to localStorage for later use by axios interceptor
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "OTP verification failed";
      })
      // performLogout
      .addCase(performLogout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performLogout.fulfilled, (state) => {
        state.loading = false;
        // Tokens will be cleared in the logout reducer
      })
      .addCase(performLogout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Logout failed";
      });
  },
});

export const { updateAccessToken, updateBalance, logout } = authSlice.actions;
export default authSlice.reducer;

// src/features/authSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Thunk to send OTP
// export const sendOTP = createAsyncThunk(
//   "auth/sendOTP",
//   async ({ phone, mode }, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/otp/send", { phone, mode });
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to verify OTP, then register or login
// export const verifyOTP = createAsyncThunk(
//   "auth/verifyOTP",
//   async ({ phone, code, mode }, thunkAPI) => {
//     try {
//       // First, verify the OTP
//       await axiosInstance.post("/otp/verify", { phone, code });
//       // Then call the appropriate endpoint based on mode
//       const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
//       const response = await axiosInstance.post(endpoint, { phone, code });
//       // Expected response: { user, accessToken, refreshToken, message }
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to perform logout
// export const performLogout = createAsyncThunk(
//   "auth/logout",
//   async (_, thunkAPI) => {
//     try {
//       const { refreshToken } = thunkAPI.getState().auth;
//       if (!refreshToken) {
//         throw new Error("No refresh token found");
//       }
//       await axiosInstance.post("/auth/logout", { refreshToken });
//       return true;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Initial auth state
// const initialState = {
//   user: null,
//   balance: null,
//   accessToken: null,
//   refreshToken: null,
//   loading: false,
//   error: null,
// };

// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     updateAccessToken(state, action) {
//       state.accessToken = action.payload;
//       localStorage.setItem("accessToken", action.payload);
//     },
//     updateBalance(state, action) {
//       state.balance = action.payload;
//       if (state.user) {
//         state.user.balance = action.payload;
//       }
//     },
//     // Synchronous logout clears auth state and tokens
//     logout(state) {
//       state.user = null;
//       state.balance = null;
//       state.accessToken = null;
//       state.refreshToken = null;
//       localStorage.removeItem("accessToken");
//       localStorage.removeItem("refreshToken");
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // sendOTP
//       .addCase(sendOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(sendOTP.fulfilled, (state) => {
//         state.loading = false;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "Failed to send OTP";
//       })
//       // verifyOTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.balance = action.payload.user.balance;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//         // Save tokens to localStorage for later use by axios interceptor
//         localStorage.setItem("accessToken", action.payload.accessToken);
//         localStorage.setItem("refreshToken", action.payload.refreshToken);
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "OTP verification failed";
//       })
//       // performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(performLogout.fulfilled, (state) => {
//         state.loading = false;
//         // Tokens will be cleared in the logout reducer
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "Logout failed";
//       });
//   },
// });

// export const { updateAccessToken, updateBalance, logout } = authSlice.actions;
// export default authSlice.reducer;

// src/features/authSlice.js
// src/features/authSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Thunk to send OTP
// export const sendOTP = createAsyncThunk(
//   "auth/sendOTP",
//   async ({ phone, mode }, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/otp/send", { phone, mode });
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to verify OTP, then register or login
// export const verifyOTP = createAsyncThunk(
//   "auth/verifyOTP",
//   async ({ phone, code, mode }, thunkAPI) => {
//     try {
//       // First, verify the OTP
//       await axiosInstance.post("/otp/verify", { phone, code });
//       // Then call the appropriate endpoint based on mode
//       const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
//       const response = await axiosInstance.post(endpoint, { phone, code });
//       // Expected response: { user, accessToken, refreshToken, message }
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to perform logout
// export const performLogout = createAsyncThunk(
//   "auth/logout",
//   async (_, thunkAPI) => {
//     try {
//       const { refreshToken } = thunkAPI.getState().auth;
//       if (!refreshToken) {
//         throw new Error("No refresh token found");
//       }
//       await axiosInstance.post("/auth/logout", { refreshToken });
//       return true;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Initial auth state
// const initialState = {
//   user: null,
//   balance: null,
//   accessToken: null,
//   refreshToken: null,
//   loading: false,
//   error: null,
// };

// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     updateAccessToken(state, action) {
//       state.accessToken = action.payload;
//     },
//     updateBalance(state, action) {
//       state.balance = action.payload;
//       if (state.user) {
//         state.user.balance = action.payload;
//       }
//     },
//     // Synchronous logout clears auth state
//     logout(state) {
//       state.user = null;
//       state.balance = null;
//       state.accessToken = null;
//       state.refreshToken = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // sendOTP
//       .addCase(sendOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(sendOTP.fulfilled, (state) => {
//         state.loading = false;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "Failed to send OTP";
//       })
//       // verifyOTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.balance = action.payload.user.balance;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "OTP verification failed";
//       })
//       // performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(performLogout.fulfilled, (state) => {
//         state.loading = false;
//         // Optionally set your state here, but we'll also do a "logout" reducer
//         // dispatch below in App.js after the promise resolves.
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "Logout failed";
//       });
//   },
// });

// export const {
//   updateAccessToken,
//   updateBalance,
//   logout, // <--- important
// } = authSlice.actions;

// export default authSlice.reducer;


// src/features/authSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Thunk to send OTP for both registration and login.
// export const sendOTP = createAsyncThunk(
//   "auth/sendOTP",
//   async ({ phone, mode }, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/otp/send", { phone, mode });
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to verify OTP and then register or login.
// export const verifyOTP = createAsyncThunk(
//   "auth/verifyOTP",
//   async ({ phone, code, mode }, thunkAPI) => {
//     try {
//       // First, verify the OTP.
//       await axiosInstance.post("/otp/verify", { phone, code });
//       // Then, call the appropriate endpoint based on mode.
//       const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
//       const response = await axiosInstance.post(endpoint, { phone, code });
      
//       // Expected response: { user, accessToken, refreshToken, message }
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to perform logout by calling the backend endpoint.
// export const performLogout = createAsyncThunk(
//   "auth/logout",
//   async (_, thunkAPI) => {
//     try {
//       const { refreshToken } = thunkAPI.getState().auth;
//       if (!refreshToken) {
//         throw new Error("No refresh token found");
//       }
//       await axiosInstance.post("/auth/logout", { refreshToken });
//       return true;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Initial state.
// const initialState = {
//   user: null,
//   balance: null,
//   accessToken: null,
//   refreshToken: null,
//   loading: false,
//   error: null,
// };

// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     updateAccessToken(state, action) {
//       state.accessToken = action.payload;
//     },
//     updateBalance(state, action) {
//       state.balance = action.payload;
//       if (state.user) {
//         state.user.balance = action.payload;
//       }
//     },
//     // Synchronous logout clears auth state.
//     logout(state) {
//       state.user = null;
//       state.balance = null;
//       state.accessToken = null;
//       state.refreshToken = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Handle sendOTP
//       .addCase(sendOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(sendOTP.fulfilled, (state) => {
//         state.loading = false;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "Failed to send OTP";
//       })
//       // Handle verifyOTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.balance = action.payload.user.balance;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "OTP verification failed";
//       })
//       // Handle performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(performLogout.fulfilled, (state) => {
//         state.loading = false;
//         state.user = null;
//         state.balance = null;
//         state.accessToken = null;
//         state.refreshToken = null;
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "Logout failed";
//       });
//   },
// });

// export const { updateAccessToken, updateBalance, logout } = authSlice.actions;
// export default authSlice.reducer;




// // authSlice.js




//############################################################################   no persist 
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axiosInstance from '../app/axiosInstance'; // adjust the path as needed

// // Thunk to send OTP for both registration and login.
// export const sendOTP = createAsyncThunk(
//   'auth/sendOTP',
//   async ({ phone, mode }, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post('/otp/send', { phone, mode });
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to verify OTP and then register or login.
// export const verifyOTP = createAsyncThunk(
//   'auth/verifyOTP',
//   async ({ phone, code, mode }, thunkAPI) => {
//     try {
//       // First, verify the OTP.
//       await axiosInstance.post('/otp/verify', { phone, code });
//       // Then, call the appropriate endpoint based on mode.
//       const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
//       const response = await axiosInstance.post(endpoint, { phone, code });

//       // Store tokens in localStorage.
//       localStorage.setItem('accessToken', response.data.accessToken);
//       localStorage.setItem('refreshToken', response.data.refreshToken);

//       // Store the full user object in localStorage.
//       localStorage.setItem('user', JSON.stringify(response.data.user));

//       // Store balance separately in localStorage.
//       localStorage.setItem('balance', response.data.user.balance);

//       // Optionally, store the phone number separately if needed.
//       localStorage.setItem('phone', response.data.user.phone);

//       // Return the API response.
//       return response.data; // Expected: { user, accessToken, refreshToken, message }
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to perform logout by calling the backend endpoint.
// export const performLogout = createAsyncThunk(
//   'auth/logout',
//   async (_, thunkAPI) => {
//     try {
//       const refreshToken = localStorage.getItem('refreshToken');
//       if (!refreshToken) {
//         throw new Error('No refresh token found');
//       }
//       await axiosInstance.post('/auth/logout', { refreshToken });
//       return true;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Initialize the state by rehydrating from localStorage.
// const initialState = {
//   user: JSON.parse(localStorage.getItem('user')) || null,
//   balance: localStorage.getItem('balance')
//     ? parseFloat(localStorage.getItem('balance'))
//     : null,
//   accessToken: localStorage.getItem('accessToken') || null,
//   refreshToken: localStorage.getItem('refreshToken') || null,
//   loading: false,
//   error: null,
// };

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     updateAccessToken(state, action) {
//       state.accessToken = action.payload;
//       localStorage.setItem('accessToken', action.payload);
//     },
//     updateBalance(state, action) {
//       // Update balance in Redux state.
//       state.balance = action.payload;
//       // Optionally update balance on the user object if needed.
//       if (state.user) {
//         state.user.balance = action.payload;
//         localStorage.setItem('user', JSON.stringify(state.user));
//       }
//       // Store the balance separately.
//       localStorage.setItem('balance', action.payload);
//     },
//     // Synchronous logout: clears Redux state and localStorage.
//     logout(state) {
//       state.user = null;
//       state.balance = null;
//       state.accessToken = null;
//       state.refreshToken = null;
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('refreshToken');
//       localStorage.removeItem('phone');
//       localStorage.removeItem('user');
//       localStorage.removeItem('balance');
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Handle sendOTP
//       .addCase(sendOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(sendOTP.fulfilled, (state) => {
//         state.loading = false;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Failed to send OTP';
//       })
//       // Handle verifyOTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         // Set the balance separately from the user.
//         state.balance = action.payload.user.balance;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'OTP verification failed';
//       })
//       // Handle performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(performLogout.fulfilled, (state) => {
//         state.loading = false;
//         state.user = null;
//         state.balance = null;
//         state.accessToken = null;
//         state.refreshToken = null;
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//         localStorage.removeItem('phone');
//         localStorage.removeItem('user');
//         localStorage.removeItem('balance');
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Logout failed';
//       });
//   },
// });

// export const { updateAccessToken, updateBalance, logout } = authSlice.actions;
// export default authSlice.reducer;












// // authSlice.js
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axiosInstance from '../app/axiosInstance'; // adjust the path as needed

// // Thunk to send OTP for both registration and login.
// export const sendOTP = createAsyncThunk(
//   'auth/sendOTP',
//   async ({ phone, mode }, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post('/otp/send', { phone, mode });
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to verify OTP and then register or login.
// export const verifyOTP = createAsyncThunk(
//   'auth/verifyOTP',
//   async ({ phone, code, mode }, thunkAPI) => {
//     try {
//       // First, verify the OTP.
//       await axiosInstance.post('/otp/verify', { phone, code });
//       // Then, call the appropriate endpoint based on mode.
//       const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
//       const response = await axiosInstance.post(endpoint, { phone, code });

//       // Store tokens in localStorage.
//       localStorage.setItem('accessToken', response.data.accessToken);
//       localStorage.setItem('refreshToken', response.data.refreshToken);

//       // Store the full user object in localStorage.
//       localStorage.setItem('user', JSON.stringify(response.data.user));

//       // Optionally, store the phone number separately.
//       localStorage.setItem('phone', response.data.user.phone);
       
      

//       // Return the API response.
//       return response.data; // Expected: { user, accessToken, refreshToken, message }
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to perform logout by calling the backend endpoint.
// export const performLogout = createAsyncThunk(
//   'auth/logout',
//   async (_, thunkAPI) => {
//     try {
//       const refreshToken = localStorage.getItem('refreshToken');
//       if (!refreshToken) {
//         throw new Error('No refresh token found');
//       }
//       await axiosInstance.post('/auth/logout', { refreshToken });
//       return true;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Initialize the state by rehydrating the user from localStorage.
// const initialState = {
//   user: JSON.parse(localStorage.getItem('user')) || null,
//   accessToken: localStorage.getItem('accessToken') || null,
//   refreshToken: localStorage.getItem('refreshToken') || null,
//   loading: false,
//   error: null,
// };

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     updateAccessToken(state, action) {
//       state.accessToken = action.payload;
//       localStorage.setItem('accessToken', action.payload);
//     },
//     updateBalance(state, action) {
//       if (state.user) {
//         state.user.balance = action.payload;
//         // Keep the persisted user data updated.
//         localStorage.setItem('user', JSON.stringify(state.user));
//       }
//     },
//     // Synchronous logout (clears both Redux state and localStorage)
//     logout(state) {
//       state.user = null;
//       state.accessToken = null;
//       state.refreshToken = null;
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('refreshToken');
//       localStorage.removeItem('phone');
//       localStorage.removeItem('user');
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Handle sendOTP
//       .addCase(sendOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(sendOTP.fulfilled, (state) => {
//         state.loading = false;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Failed to send OTP';
//       })
//       // Handle verifyOTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'OTP verification failed';
//       })
//       // Handle performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(performLogout.fulfilled, (state) => {
//         state.loading = false;
//         state.user = null;
//         state.accessToken = null;
//         state.refreshToken = null;
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//         localStorage.removeItem('phone');
//         localStorage.removeItem('user');
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Logout failed';
//       });
//   },
// });

// export const { updateAccessToken, updateBalance, logout } = authSlice.actions;
// export default authSlice.reducer;

// authSlice.js
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axiosInstance from '../app/axiosInstance'; // adjust the path as needed

// // Thunk to send OTP for both registration and login.
// export const sendOTP = createAsyncThunk(
//   'auth/sendOTP',
//   async ({ phone, mode }, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post('/otp/send', { phone, mode });
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to verify OTP and then register or login.
// export const verifyOTP = createAsyncThunk(
//   'auth/verifyOTP',
//   async ({ phone, code, mode }, thunkAPI) => {
//     try {
//       // First, verify the OTP.
//       await axiosInstance.post('/otp/verify', { phone, code });
//       // Then, call the appropriate endpoint based on mode.
//       const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
//       const response = await axiosInstance.post(endpoint, { phone, code });
//       // Store tokens in localStorage.
//       localStorage.setItem('accessToken', response.data.accessToken);
//       localStorage.setItem('refreshToken', response.data.refreshToken);
//       // You can optionally save the phone as well if needed:
//       localStorage.setItem('phone', response.data.user.phone);
//       // Return the API response as-is.
//       return response.data; // Expected: { user, accessToken, refreshToken, message }
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to perform logout by calling the backend endpoint.
// export const performLogout = createAsyncThunk(
//   'auth/logout',
//   async (_, thunkAPI) => {
//     try {
//       const refreshToken = localStorage.getItem('refreshToken');
//       if (!refreshToken) {
//         throw new Error('No refresh token found');
//       }
//       await axiosInstance.post('/auth/logout', { refreshToken });
//       return true;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     user: null,
//     accessToken: localStorage.getItem('accessToken') || null,
//     refreshToken: localStorage.getItem('refreshToken') || null,
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     updateAccessToken(state, action) {
//       state.accessToken = action.payload;
//       localStorage.setItem('accessToken', action.payload);
//     },
//     updateBalance(state, action) {
//       if (state.user) {
//         state.user.balance = action.payload;
//       }
//     },
//     // Synchronous logout (if you wish to clear state without an API call)
//     logout(state) {
//       state.user = null;
//       state.accessToken = null;
//       state.refreshToken = null;
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('refreshToken');
//       localStorage.removeItem('phone');
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Handle sendOTP
//       .addCase(sendOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(sendOTP.fulfilled, (state) => {
//         state.loading = false;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Failed to send OTP';
//       })
//       // Handle verifyOTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         // Use the API response directly.
//         state.user = action.payload.user;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'OTP verification failed';
//       })
//       // Handle performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(performLogout.fulfilled, (state) => {
//         state.loading = false;
//         state.user = null;
//         state.accessToken = null;
//         state.refreshToken = null;
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//         localStorage.removeItem('phone');
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Logout failed';
//       });
//   },
// });

// export const { updateAccessToken, updateBalance, logout } = authSlice.actions;
// export default authSlice.reducer;

// // authSlice.js
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axiosInstance from '../app/axiosInstance'; // adjust the path as needed

// // Thunk to send OTP for both registration and login.
// export const sendOTP = createAsyncThunk(
//   'auth/sendOTP',
//   async ({ phone, mode }, thunkAPI) => {
//     try {
//       // Using the axios instance which has a baseURL set.
//       const response = await axiosInstance.post('/otp/send', { phone, mode });
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to verify OTP and then register or login.
// export const verifyOTP = createAsyncThunk(
//   'auth/verifyOTP',
//   async ({ phone, code, mode }, thunkAPI) => {
//     try {
//       // First, verify the OTP.
//       await axiosInstance.post('/otp/verify', { phone, code });
//       // Then, call the appropriate endpoint based on mode.
//       const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
//       const response = await axiosInstance.post(endpoint, { phone, code });
//       // Store tokens in localStorage.
//       localStorage.setItem('accessToken', response.data.accessToken);
//       localStorage.setItem('refreshToken', response.data.refreshToken);
//       return response.data; // Expected: { user, accessToken, refreshToken }
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to perform logout by calling the backend endpoint.
// export const performLogout = createAsyncThunk(
//   'auth/logout',
//   async (_, thunkAPI) => {
//     try {
//       // Retrieve the refreshToken from localStorage.
//       const refreshToken = localStorage.getItem('refreshToken');
//       if (!refreshToken) {
//         throw new Error('No refresh token found');
//       }
//       // Call the logout endpoint.
//       await axiosInstance.post('/auth/logout', { refreshToken });
//       return true;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     user: null,
//     accessToken: localStorage.getItem('accessToken') || null,
//     refreshToken: localStorage.getItem('refreshToken') || null,
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     updateAccessToken(state, action) {
//       state.accessToken = action.payload;
//       localStorage.setItem('accessToken', action.payload);
//     },
//     updateBalance(state, action) {
//       if (state.user) {
//         state.user.balance = action.payload;
//       }
//     },
//     // Synchronous logout (if you wish to clear state without an API call)
//     logout(state) {
//       state.user = null;
//       state.accessToken = null;
//       state.refreshToken = null;
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('refreshToken');
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Handle sendOTP
//       .addCase(sendOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(sendOTP.fulfilled, (state) => {
//         state.loading = false;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Failed to send OTP';
//       })
//       // Handle verifyOTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'OTP verification failed';
//       })
//       // Handle performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(performLogout.fulfilled, (state) => {
//         state.loading = false;
//         state.user = null;
//         state.accessToken = null;
//         state.refreshToken = null;
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Logout failed';
//       });
//   },
// });

// export const { updateAccessToken, updateBalance, logout } = authSlice.actions;
// export default authSlice.reducer;




// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// // Thunk to send OTP for both registration and login.
// export const sendOTP = createAsyncThunk(
//   'auth/sendOTP',
//   async ({ phone, mode }, thunkAPI) => {
//     try {
//       const response = await axios.post('http://localhost:5000/api/otp/send', { phone, mode });
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to verify OTP and then register or login.
// export const verifyOTP = createAsyncThunk(
//   'auth/verifyOTP',
//   async ({ phone, code, mode }, thunkAPI) => {
//     try {
//       // First, verify the OTP.
//       await axios.post('http://localhost:5000/api/otp/verify', { phone, code });
//       // Then, call the appropriate endpoint based on mode.
//       const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
//       const response = await axios.post(`http://localhost:5000/api${endpoint}`, { phone, code });
//       // Store tokens in localStorage.
//       localStorage.setItem('accessToken', response.data.accessToken);
//       localStorage.setItem('refreshToken', response.data.refreshToken);
//       return response.data; // Expected: { user, accessToken, refreshToken }
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to perform logout by calling the backend endpoint.
// export const performLogout = createAsyncThunk(
//   'auth/logout',
//   async (_, thunkAPI) => {
//     try {
//       // Retrieve the refreshToken from localStorage.
//       const refreshToken = localStorage.getItem('refreshToken');
//       if (!refreshToken) {
//         throw new Error('No refresh token found');
//       }
//       // Call the logout endpoint.
//       await axios.post('http://localhost:5000/api/auth/logout', { refreshToken });
//       return true;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     user: null,
//     accessToken: localStorage.getItem('accessToken') || null,
//     refreshToken: localStorage.getItem('refreshToken') || null,
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     updateAccessToken(state, action) {
//       state.accessToken = action.payload;
//       localStorage.setItem('accessToken', action.payload);
//     },
//     updateBalance(state, action) {
//       if (state.user) {
//         state.user.balance = action.payload;
//       }
//     },
//     // Synchronous logout (if you wish to clear state without an API call)
//     logout(state) {
//       state.user = null;
//       state.accessToken = null;
//       state.refreshToken = null;
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('refreshToken');
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Handle sendOTP
//       .addCase(sendOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(sendOTP.fulfilled, (state) => {
//         state.loading = false;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Failed to send OTP';
//       })
//       // Handle verifyOTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'OTP verification failed';
//       })
//       // Handle performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(performLogout.fulfilled, (state) => {
//         state.loading = false;
//         state.user = null;
//         state.accessToken = null;
//         state.refreshToken = null;
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Logout failed';
//       });
//   },
// });

// export const { updateAccessToken, updateBalance, logout } = authSlice.actions;
// export default authSlice.reducer;



// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// // Thunk to send OTP for both registration and login.
// export const sendOTP = createAsyncThunk(
//   'auth/sendOTP',
//   async ({ phone, mode }, thunkAPI) => {
//     try {
//       const response = await axios.post('http://localhost:5000/api/otp/send', { phone, mode });
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to verify OTP and then register or login.
// export const verifyOTP = createAsyncThunk(
//   'auth/verifyOTP',
//   async ({ phone, code, mode }, thunkAPI) => {
//     try {
//       // First, verify the OTP
//       await axios.post('http://localhost:5000/api/otp/verify', { phone, code });
//       // Then, call the appropriate endpoint based on mode.
//       const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
//       const response = await axios.post(`http://localhost:5000/api${endpoint}`, { phone, code });
//       localStorage.setItem('accessToken', response.data.accessToken);
//       localStorage.setItem('refreshToken', response.data.refreshToken);
//       return response.data; // Expected: { user, accessToken, refreshToken }
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     user: null,
//     accessToken: localStorage.getItem('accessToken') || null,
//     refreshToken: localStorage.getItem('refreshToken') || null,
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     updateAccessToken(state, action) {
//       state.accessToken = action.payload;
//       localStorage.setItem('accessToken', action.payload);
//     },
//     updateBalance(state, action) {
//       if (state.user) {
//         state.user.balance = action.payload;
//       }
//     },
//     logout(state) {
//       state.user = null;
//       state.accessToken = null;
//       state.refreshToken = null;
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('refreshToken');
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(sendOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(sendOTP.fulfilled, (state) => {
//         state.loading = false;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Failed to send OTP';
//       })
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'OTP verification failed';
//       });
//   },
// });

// export const { updateAccessToken, updateBalance, logout } = authSlice.actions;
// export default authSlice.reducer;


// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// // Thunk to send OTP for both registration and login.
// export const sendOTP = createAsyncThunk(
//   'auth/sendOTP',
//   async ({ phone, mode }, thunkAPI) => {
//     try {
//       const response = await axios.post('http://localhost:5000/api/otp/send', { phone, mode });
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Thunk to verify OTP and complete registration or login.
// export const verifyOTP = createAsyncThunk(
//   'auth/verifyOTP',
//   async ({ phone, code, mode }, thunkAPI) => {
//     try {
//       const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
//       const response = await axios.post(`http://localhost:5000/api${endpoint}`, { phone, code });
//       localStorage.setItem('accessToken', response.data.accessToken);
//       localStorage.setItem('refreshToken', response.data.refreshToken);
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     user: null,
//     accessToken: localStorage.getItem('accessToken') || null,
//     refreshToken: localStorage.getItem('refreshToken') || null,
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     updateAccessToken(state, action) {
//       state.accessToken = action.payload;
//       localStorage.setItem('accessToken', action.payload);
//     },
//     updateBalance(state, action) {
//       if (state.user) {
//         state.user.balance = action.payload;
//       }
//     },
//     logout(state) {
//       state.user = null;
//       state.accessToken = null;
//       state.refreshToken = null;
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('refreshToken');
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(sendOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(sendOTP.fulfilled, (state) => {
//         state.loading = false;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'Failed to send OTP';
//       })
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || 'OTP verification failed';
//       });
//   },
// });

// export const { updateAccessToken, updateBalance, logout } = authSlice.actions;
// export default authSlice.reducer;
