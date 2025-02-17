// // // // // // // src/features/roundSlice.js
// src/features/roundSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance";

// Existing thunks...
export const fetchCurrentRound = createAsyncThunk(
  "round/fetchCurrentRound",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/game/currentRound");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchJackpotPool = createAsyncThunk(
  "round/fetchJackpotPool",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/game/jackpot");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const placeBet = createAsyncThunk(
  "round/placeBet",
  async (betData, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/game/bet", betData);
      // expected: { message, bet: [ ... ] }
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const startRound = createAsyncThunk(
  "round/startRound",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/game/startRound");
      // Assume response.data has a property `round`
      return response.data.round;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);



// NEW: Thunk to fetch paginated user bets.
export const fetchUserBets = createAsyncThunk(
  "round/fetchUserBets",
  async (page = 1, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/game/my-bets?page=${page}`);
      // Expected response: { bets, totalBets, totalPages, currentPage }
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);


// NEW: Thunk to fetch top winning bets filtered by period (daily, weekly, monthly)
export const fetchTopWins = createAsyncThunk(
  "round/fetchTopWins",
  async (filter = "daily", thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/game/top-wins?filter=${filter}`);
      // Expected response: { topWins: [ ... ] }
      return { topWins: response.data.topWins, filter };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const roundSlice = createSlice({
  name: "round",
  initialState: {
    currentRound: null,           // Active round data
    jackpot: 0,                   // Current jackpot amount
    betResults: [],               // Individual bet updates
    aggregatedBetResults: [],     // Aggregated results for all bets
    participantResults: [],       // Aggregated results by participant
    userBets: [],                 // Paginated user bets
    betsPagination: {             // Pagination info for user bets
      totalBets: 0,
      totalPages: 0,
      currentPage: 1,
    },
    // NEW state for top wins
    topWins: [],
    topWinsFilter: "daily",       // default filter
    loading: false,
    error: null,
    lastBet: null,
  },
  reducers: {
    roundUpdated: (state, action) => {
      state.currentRound = action.payload;
    },
    roundResultReceived: (state, action) => {
      state.currentRound = action.payload.round;
    },
    betResultReceived: (state, action) => {
      const index = state.betResults.findIndex(
        (bet) => bet.betId === action.payload.betId
      );
      if (index !== -1) {
        state.betResults[index] = action.payload;
      } else {
        state.betResults.push(action.payload);
      }
    },
    jackpotUpdated: (state, action) => {
      if (typeof action.payload.jackpotPool === "number") {
        state.jackpot = action.payload.jackpotPool;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCurrentRound
      .addCase(fetchCurrentRound.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentRound.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRound = action.payload;
      })
      .addCase(fetchCurrentRound.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchJackpotPool
      .addCase(fetchJackpotPool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJackpotPool.fulfilled, (state, action) => {
        state.loading = false;
        if (typeof action.payload?.jackpotPool === "number") {
          state.jackpot = action.payload.jackpotPool;
        }
      })
      .addCase(fetchJackpotPool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // placeBet
      .addCase(placeBet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeBet.fulfilled, (state, action) => {
        state.loading = false;
        const betArray = action.payload.bet;
        state.lastBet =
          Array.isArray(betArray) && betArray.length > 0 ? betArray[0] : null;
      })
      .addCase(placeBet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // startRound
      .addCase(startRound.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startRound.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRound = action.payload;
      })
      .addCase(startRound.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchUserBets
      .addCase(fetchUserBets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBets.fulfilled, (state, action) => {
        state.loading = false;
        state.userBets = action.payload.bets;
        state.betsPagination = {
          totalBets: action.payload.totalBets,
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage,
        };
      })
      .addCase(fetchUserBets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // NEW: fetchTopWins
      .addCase(fetchTopWins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopWins.fulfilled, (state, action) => {
        state.loading = false;
        state.topWins = action.payload.topWins;
        state.topWinsFilter = action.payload.filter;
      })
      .addCase(fetchTopWins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  roundUpdated,
  roundResultReceived,
  betResultReceived,
  jackpotUpdated,
  clearError,
} = roundSlice.actions;

export default roundSlice.reducer;


// // src/features/roundSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Thunk to fetch the current active round.
// export const fetchCurrentRound = createAsyncThunk(
//   "round/fetchCurrentRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/currentRound");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Thunk to fetch the current jackpot.
// export const fetchJackpotPool = createAsyncThunk(
//   "round/fetchJackpotPool",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/jackpot");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Thunk to place a bet.
// export const placeBet = createAsyncThunk(
//   "round/placeBet",
//   async (betData, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/game/bet", betData);
//       // expected: { message, bet: [ ... ] }
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Thunk to start a new round (if needed).
// export const startRound = createAsyncThunk(
//   "round/startRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/startRound");
//       // Assume response.data has a property `round`
//       return response.data.round;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // NEW: Thunk to fetch paginated user bets.
// export const fetchUserBets = createAsyncThunk(
//   "round/fetchUserBets",
//   async (page = 1, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get(`/game/my-bets?page=${page}`);
//       // Expected response: { bets, totalBets, totalPages, currentPage }
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// const roundSlice = createSlice({
//   name: "round",
//   initialState: {
//     currentRound: null,           // Active round data
//     jackpot: 0,                   // Current jackpot amount
//     betResults: [],               // Individual bet updates
//     aggregatedBetResults: [],     // Aggregated results for all bets
//     participantResults: [],       // Aggregated results by participant
//     userBets: [],                 // Paginated user bets
//     betsPagination: {             // Pagination info for user bets
//       totalBets: 0,
//       totalPages: 0,
//       currentPage: 1,
//     },
//     loading: false,
//     error: null,
//     lastBet: null,
//   },
//   reducers: {
//     roundUpdated: (state, action) => {
//       state.currentRound = action.payload;
//     },
//     roundResultReceived: (state, action) => {
//       state.currentRound = action.payload.round;
//     },
//     betResultReceived: (state, action) => {
//       const index = state.betResults.findIndex(
//         (bet) => bet.betId === action.payload.betId
//       );
//       if (index !== -1) {
//         state.betResults[index] = action.payload;
//       } else {
//         state.betResults.push(action.payload);
//       }
//     },
//     jackpotUpdated: (state, action) => {
//       if (typeof action.payload.jackpotPool === "number") {
//         state.jackpot = action.payload.jackpotPool;
//       }
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // fetchCurrentRound
//       .addCase(fetchCurrentRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCurrentRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(fetchCurrentRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // fetchJackpotPool
//       .addCase(fetchJackpotPool.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchJackpotPool.fulfilled, (state, action) => {
//         state.loading = false;
//         if (typeof action.payload?.jackpotPool === "number") {
//           state.jackpot = action.payload.jackpotPool;
//         }
//       })
//       .addCase(fetchJackpotPool.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // placeBet
//       .addCase(placeBet.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(placeBet.fulfilled, (state, action) => {
//         state.loading = false;
//         const betArray = action.payload.bet;
//         state.lastBet =
//           Array.isArray(betArray) && betArray.length > 0 ? betArray[0] : null;
//       })
//       .addCase(placeBet.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // startRound
//       .addCase(startRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(startRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(startRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // fetchUserBets
//       .addCase(fetchUserBets.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchUserBets.fulfilled, (state, action) => {
//         state.loading = false;
//         // Expected response: { bets, totalBets, totalPages, currentPage }
//         state.userBets = action.payload.bets;
//         state.betsPagination = {
//           totalBets: action.payload.totalBets,
//           totalPages: action.payload.totalPages,
//           currentPage: action.payload.currentPage,
//         };
//       })
//       .addCase(fetchUserBets.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const {
//   roundUpdated,
//   roundResultReceived,
//   betResultReceived,
//   jackpotUpdated,
//   clearError,
// } = roundSlice.actions;

// export default roundSlice.reducer;

// // src/features/roundSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Thunk to fetch the current active round.
// export const fetchCurrentRound = createAsyncThunk(
//   "round/fetchCurrentRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/currentRound");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Thunk to fetch the current jackpot.
// export const fetchJackpotPool = createAsyncThunk(
//   "round/fetchJackpotPool",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/jackpot");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Thunk to place a bet.
// export const placeBet = createAsyncThunk(
//   "round/placeBet",
//   async (betData, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/game/bet", betData);
//       // expected: { message, bet: [ ... ] }
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Thunk to start a new round (if needed).
// export const startRound = createAsyncThunk(
//   "round/startRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/startRound");
//       // Assume response.data has a property `round`
//       return response.data.round;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// const roundSlice = createSlice({
//   name: "round",
//   initialState: {
//     currentRound: null,           // Active round data
//     jackpot: 0,                   // Current jackpot amount
//     betResults: [],               // Individual bet updates
//     aggregatedBetResults: [],     // Aggregated results for all bets
//     participantResults: [],       // Aggregated results by participant
//     loading: false,
//     error: null,
//     lastBet: null,
//   },
//   reducers: {
//     // Example custom reducers
//     roundUpdated: (state, action) => {
//       state.currentRound = action.payload;
//     },
//     roundResultReceived: (state, action) => {
//       state.currentRound = action.payload.round;
//     },
//     betResultReceived: (state, action) => {
//       const index = state.betResults.findIndex(
//         (bet) => bet.betId === action.payload.betId
//       );
//       if (index !== -1) {
//         state.betResults[index] = action.payload;
//       } else {
//         state.betResults.push(action.payload);
//       }
//     },
//     // aggregatedBetResultsReceived: (state, action) => {
//     //   state.aggregatedBetResults = action.payload.results;
//     // },
//     // participantResultsReceived: (state, action) => {
//     //   state.participantResults = action.payload.results;
//     // },
//     jackpotUpdated: (state, action) => {
//       if (typeof action.payload.jackpotPool === "number") {
//         state.jackpot = action.payload.jackpotPool;
//       }
//     },

//     // ADD THIS: Clears the Redux error.
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // fetchCurrentRound
//       .addCase(fetchCurrentRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCurrentRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(fetchCurrentRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // fetchJackpotPool
//       .addCase(fetchJackpotPool.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchJackpotPool.fulfilled, (state, action) => {
//         state.loading = false;
//         if (typeof action.payload?.jackpotPool === "number") {
//           state.jackpot = action.payload.jackpotPool;
//         }
//       })
//       .addCase(fetchJackpotPool.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // placeBet
//       .addCase(placeBet.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(placeBet.fulfilled, (state, action) => {
//         state.loading = false;
//         const betArray = action.payload.bet;
//         state.lastBet =
//           Array.isArray(betArray) && betArray.length > 0 ? betArray[0] : null;
//       })
//       .addCase(placeBet.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // startRound
//       .addCase(startRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(startRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(startRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const {
//   roundUpdated,
//   roundResultReceived,
//   betResultReceived,
//   //aggregatedBetResultsReceived,
//   //participantResultsReceived,
//   jackpotUpdated,
//   clearError, // Export clearError to use in components
// } = roundSlice.actions;

// export default roundSlice.reducer;



// // src/features/roundSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Thunk to fetch the current active round.
// export const fetchCurrentRound = createAsyncThunk(
//   "round/fetchCurrentRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/currentRound");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// // Thunk to fetch the current jackpot.
// export const fetchJackpotPool = createAsyncThunk(
//   "round/fetchJackpotPool",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/jackpot");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// // Thunk to place a bet.
// export const placeBet = createAsyncThunk(
//   "round/placeBet",
//   async (betData, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/game/bet", betData);
//       return response.data; // expected: { message, bet: [ ... ] }
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// // NEW: Thunk to start a new round (if needed).  
// // This calls the backend endpoint that creates or returns a new round.
// export const startRound = createAsyncThunk(
//   "round/startRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/startRound");
//       // Assumes response.data contains a property 'round'
//       return response.data.round;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// const roundSlice = createSlice({
//   name: "round",
//   initialState: {
//     currentRound: null,           // Active round data
//     jackpot: 0,                   // Current jackpot amount
//     betResults: [],               // Individual bet result events
//     aggregatedBetResults: [],     // Aggregated results for all bets (by bet)
//     participantResults: [],       // Aggregated results by participant (list with their bets)
//     loading: false,
//     error: null,
//     lastBet: null,
//   },
//   reducers: {
//     roundUpdated: (state, action) => {
//       state.currentRound = action.payload;
//     },
//     roundResultReceived: (state, action) => {
//       state.currentRound = action.payload.round;
//     },
//     // Updated reducer: if an individual bet update already exists (matching betId),
//     // replace it; otherwise, push a new entry.
//     betResultReceived: (state, action) => {
//       const index = state.betResults.findIndex(
//         (bet) => bet.betId === action.payload.betId
//       );
//       if (index !== -1) {
//         state.betResults[index] = action.payload;
//       } else {
//         state.betResults.push(action.payload);
//       }
//     },
//     aggregatedBetResultsReceived: (state, action) => {
//       state.aggregatedBetResults = action.payload.results;
//     },
//     participantResultsReceived: (state, action) => {
//       state.participantResults = action.payload.results;
//     },
//     jackpotUpdated: (state, action) => {
//       if (typeof action.payload.jackpotPool === "number") {
//         state.jackpot = action.payload.jackpotPool;
//       }
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // fetchCurrentRound
//       .addCase(fetchCurrentRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCurrentRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(fetchCurrentRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // fetchJackpotPool
//       .addCase(fetchJackpotPool.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchJackpotPool.fulfilled, (state, action) => {
//         state.loading = false;
//         if (typeof action.payload?.jackpotPool === "number") {
//           state.jackpot = action.payload.jackpotPool;
//         }
//       })
//       .addCase(fetchJackpotPool.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // placeBet
//       .addCase(placeBet.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(placeBet.fulfilled, (state, action) => {
//         state.loading = false;
//         const betArray = action.payload.bet;
//         state.lastBet =
//           Array.isArray(betArray) && betArray.length > 0 ? betArray[0] : null;
//       })
//       .addCase(placeBet.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // startRound
//       .addCase(startRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(startRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(startRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const {
//   roundUpdated,
//   roundResultReceived,
//   betResultReceived,
//   aggregatedBetResultsReceived,
//   participantResultsReceived,
//   jackpotUpdated,
// } = roundSlice.actions;
// export default roundSlice.reducer;

// // src/features/roundSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Thunk to fetch the current active round.
// export const fetchCurrentRound = createAsyncThunk(
//   "round/fetchCurrentRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/currentRound");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// // Thunk to fetch the current jackpot.
// export const fetchJackpotPool = createAsyncThunk(
//   "round/fetchJackpotPool",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/jackpot");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// // Thunk to place a bet.
// export const placeBet = createAsyncThunk(
//   "round/placeBet",
//   async (betData, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/game/bet", betData);
//       return response.data; // expected: { message, bet: [ ... ] }
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// // NEW: Thunk to start a new round (if needed).
// export const startRound = createAsyncThunk(
//   "round/startRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/startRound");
//       // Assumes response.data contains a property 'round'
//       return response.data.round;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// const roundSlice = createSlice({
//   name: "round",
//   initialState: {
//     currentRound: null,           // Active round data
//     jackpot: 0,                   // Current jackpot amount
//     betResults: [],               // Individual bet result events
//     aggregatedBetResults: [],     // Aggregated results for all bets (by bet)
//     participantResults: [],       // Aggregated results by participant
//     loading: false,
//     error: null,
//     lastBet: null,
//   },
//   reducers: {
//     roundUpdated: (state, action) => {
//       state.currentRound = action.payload;
//     },
//     roundResultReceived: (state, action) => {
//       state.currentRound = action.payload.round;
//     },
//     betResultReceived: (state, action) => {
//       state.betResults.push(action.payload);
//     },
//     aggregatedBetResultsReceived: (state, action) => {
//       state.aggregatedBetResults = action.payload.results;
//     },
//     participantResultsReceived: (state, action) => {
//       state.participantResults = action.payload.results;
//     },
//     jackpotUpdated: (state, action) => {
//       if (typeof action.payload.jackpotPool === "number") {
//         state.jackpot = action.payload.jackpotPool;
//       }
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // fetchCurrentRound
//       .addCase(fetchCurrentRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCurrentRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(fetchCurrentRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // fetchJackpotPool
//       .addCase(fetchJackpotPool.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchJackpotPool.fulfilled, (state, action) => {
//         state.loading = false;
//         if (typeof action.payload?.jackpotPool === "number") {
//           state.jackpot = action.payload.jackpotPool;
//         }
//       })
//       .addCase(fetchJackpotPool.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // placeBet
//       .addCase(placeBet.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(placeBet.fulfilled, (state, action) => {
//         state.loading = false;
//         const betArray = action.payload.bet;
//         state.lastBet =
//           Array.isArray(betArray) && betArray.length > 0 ? betArray[0] : null;
//       })
//       .addCase(placeBet.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // startRound
//       .addCase(startRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(startRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(startRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const {
//   roundUpdated,
//   roundResultReceived,
//   betResultReceived,
//   aggregatedBetResultsReceived,
//   participantResultsReceived,
//   jackpotUpdated,
// } = roundSlice.actions;
// export default roundSlice.reducer;

// // src/features/roundSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Thunk to fetch the current active round.
// export const fetchCurrentRound = createAsyncThunk(
//   "round/fetchCurrentRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/currentRound");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// // Thunk to fetch the current jackpot.
// export const fetchJackpotPool = createAsyncThunk(
//   "round/fetchJackpotPool",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/jackpot");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// // Thunk to place a bet.
// export const placeBet = createAsyncThunk(
//   "round/placeBet",
//   async (betData, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/game/bet", betData);
//       return response.data; // expected: { message, bet: [ ... ] }
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// // NEW: Thunk to start a new round (if needed).  
// // This calls the backend endpoint that creates or returns a new round.
// export const startRound = createAsyncThunk(
//   "round/startRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/startRound");
//       // Assumes response.data contains a property 'round'
//       return response.data.round;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || error.message
//       );
//     }
//   }
// );

// const roundSlice = createSlice({
//   name: "round",
//   initialState: {
//     currentRound: null,           // Active round data
//     jackpot: 0,                   // Current jackpot amount
//     betResults: [],               // Individual bet result events
//     aggregatedBetResults: [],     // Aggregated results for all bets (by bet)
//     participantResults: [],       // Aggregated results by participant (list with their bets)
//     loading: false,
//     error: null,
//     lastBet: null,
//   },
//   reducers: {
//     roundUpdated: (state, action) => {
//       state.currentRound = action.payload;
//     },
//     roundResultReceived: (state, action) => {
//       state.currentRound = action.payload.round;
//     },
//     betResultReceived: (state, action) => {
//       state.betResults.push(action.payload);
//     },
//     aggregatedBetResultsReceived: (state, action) => {
//       state.aggregatedBetResults = action.payload.results;
//     },
//     participantResultsReceived: (state, action) => {
//       state.participantResults = action.payload.results;
//     },
//     jackpotUpdated: (state, action) => {
//       if (typeof action.payload.jackpotPool === "number") {
//         state.jackpot = action.payload.jackpotPool;
//       }
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // fetchCurrentRound
//       .addCase(fetchCurrentRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCurrentRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(fetchCurrentRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // fetchJackpotPool
//       .addCase(fetchJackpotPool.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchJackpotPool.fulfilled, (state, action) => {
//         state.loading = false;
//         if (typeof action.payload?.jackpotPool === "number") {
//           state.jackpot = action.payload.jackpotPool;
//         }
//       })
//       .addCase(fetchJackpotPool.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // placeBet
//       .addCase(placeBet.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(placeBet.fulfilled, (state, action) => {
//         state.loading = false;
//         const betArray = action.payload.bet;
//         state.lastBet =
//           Array.isArray(betArray) && betArray.length > 0 ? betArray[0] : null;
//       })
//       .addCase(placeBet.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // startRound (new)
//       .addCase(startRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(startRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(startRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const {
//   roundUpdated,
//   roundResultReceived,
//   betResultReceived,
//   aggregatedBetResultsReceived,
//   participantResultsReceived,
//   jackpotUpdated,
// } = roundSlice.actions;
// export default roundSlice.reducer;

// // src/features/roundSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Thunk to fetch the current active round.
// export const fetchCurrentRound = createAsyncThunk(
//   "round/fetchCurrentRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/currentRound");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Thunk to fetch the current jackpot.
// export const fetchJackpotPool = createAsyncThunk(
//   "round/fetchJackpotPool",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/jackpot");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // Thunk to place a bet.
// export const placeBet = createAsyncThunk(
//   "round/placeBet",
//   async (betData, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/game/bet", betData);
//       return response.data; // expected: { message, bet: [ ... ] }
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// const roundSlice = createSlice({
//   name: "round",
//   initialState: {
//     currentRound: null,           // Active round data
//     jackpot: 0,                   // Current jackpot amount
//     betResults: [],               // Individual bet result events
//     aggregatedBetResults: [],     // Aggregated results for all bets (by bet)
//     participantResults: [],       // Aggregated results by participant (list of participants with their bets)
//     loading: false,
//     error: null,
//     lastBet: null,
//   },
//   reducers: {
//     roundUpdated: (state, action) => {
//       state.currentRound = action.payload;
//     },
//     roundResultReceived: (state, action) => {
//       state.currentRound = action.payload.round;
//     },
//     betResultReceived: (state, action) => {
//       state.betResults.push(action.payload);
//     },
//     aggregatedBetResultsReceived: (state, action) => {
//       state.aggregatedBetResults = action.payload.results;
//     },
//     participantResultsReceived: (state, action) => {
//       state.participantResults = action.payload.results;
//     },
//     jackpotUpdated: (state, action) => {
//       if (typeof action.payload.jackpotPool === "number") {
//         state.jackpot = action.payload.jackpotPool;
//       }
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // fetchCurrentRound
//       .addCase(fetchCurrentRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCurrentRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(fetchCurrentRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // fetchJackpotPool
//       .addCase(fetchJackpotPool.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchJackpotPool.fulfilled, (state, action) => {
//         state.loading = false;
//         if (typeof action.payload?.jackpotPool === "number") {
//           state.jackpot = action.payload.jackpotPool;
//         }
//       })
//       .addCase(fetchJackpotPool.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // placeBet
//       .addCase(placeBet.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(placeBet.fulfilled, (state, action) => {
//         state.loading = false;
//         const betArray = action.payload.bet;
//         state.lastBet = Array.isArray(betArray) && betArray.length > 0 ? betArray[0] : null;
//       })
//       .addCase(placeBet.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const {
//   roundUpdated,
//   roundResultReceived,
//   betResultReceived,
//   aggregatedBetResultsReceived,
//   participantResultsReceived,
//   jackpotUpdated,
// } = roundSlice.actions;
// export default roundSlice.reducer;

// src/features/roundSlice.js
// src/features/roundSlice.js

// src/features/roundSlice.js

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// /**
//  * Thunk: Get the current active round (or null) from the server.
//  */
// export const fetchCurrentRound = createAsyncThunk(
//   "round/fetchCurrentRound",
//   async (_, thunkAPI) => {
//     try {
//       // Example: your backend route is /game/currentRound
//       const response = await axiosInstance.get("/game/currentRound");
//       // Returns null or { _id, roundNumber, ... }
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// /**
//  * Thunk: Get the current jackpot pool from the server.
//  */
// export const fetchJackpotPool = createAsyncThunk(
//   "round/fetchJackpotPool",
//   async (_, thunkAPI) => {
//     try {
//       // Example: your backend route is /game/jackpot
//       const response = await axiosInstance.get("/game/jackpot");
//       // Returns { jackpotPool: number }
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// /**
//  * Thunk: Place a bet in the current round.
//  * Expects { amount, side } in the payload.
//  * The backend returns:
//  *   { message: "Bet placed successfully",
//  *     bet: [ { _id, amount, side, ... } ] }
//  * => note that bet is an array.
//  */
// export const placeBet = createAsyncThunk(
//   "round/placeBet",
//   async (betData, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/game/bet", betData);
//       return response.data; // => { message, bet: [...] }
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// const roundSlice = createSlice({
//   name: "round",
//   initialState: {
//     currentRound: null, // The active round or null
//     jackpot: 0,         // Current jackpot value
//     loading: false,     // For UI loading states
//     error: null,        // Store errors for display
//     lastBet: null,      // Store the most recently placed bet(s)
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder

//       // -- fetchCurrentRound --
//       .addCase(fetchCurrentRound.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCurrentRound.fulfilled, (state, action) => {
//         state.loading = false;
//         // The server either returns null or a round object
//         state.currentRound = action.payload;
//       })
//       .addCase(fetchCurrentRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // -- fetchJackpotPool --
//       .addCase(fetchJackpotPool.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchJackpotPool.fulfilled, (state, action) => {
//         state.loading = false;
//         if (typeof action.payload?.jackpotPool === "number") {
//           state.jackpot = action.payload.jackpotPool;
//         }
//       })
//       .addCase(fetchJackpotPool.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // -- placeBet --
//       .addCase(placeBet.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(placeBet.fulfilled, (state, action) => {
//         state.loading = false;
//         // The backend returns: { message, bet: [ {...} ] }
//         const betArray = action.payload.bet;
//         // If you just want to store the entire array:
//         // state.lastBet = betArray;

//         // OR if you only want the *first* bet (since there's typically only one):
//         if (Array.isArray(betArray) && betArray.length > 0) {
//           state.lastBet = betArray[0];
//         } else {
//           state.lastBet = null;
//         }
//       })
//       .addCase(placeBet.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export default roundSlice.reducer;


//##################################################################### 
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// /**
//  * Get the current (active) round from the server (or null if no active round).
//  * The backend route is presumably /game/currentRound
//  */
// export const fetchCurrentRound = createAsyncThunk(
//   "round/fetchCurrentRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/currentRound");
//       // Returns either null or { ...roundData }
//       return response.data;
//     } catch (error) {
//       // Fallback to error message if no response data
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// /**
//  * Fetch the current jackpot pool from /game/jackpot
//  */
// export const fetchJackpotPool = createAsyncThunk(
//   "round/fetchJackpotPool",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/jackpot");
//       // returns { jackpotPool: number }
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// /**
//  * Place a bet in the current round.
//  * Expects { amount, side } in the payload.
//  */
// export const placeBet = createAsyncThunk(
//   "round/placeBet",
//   async (betData, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/game/bet", betData);
//       // returns { message, bet: { ... } }
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// const roundSlice = createSlice({
//   name: "round",
//   initialState: {
//     currentRound: null, // The current active round (or null)
//     jackpot: 0,
//     loading: false,
//     error: null,
//     lastBet: null, // optional
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       // fetchCurrentRound
//       .addCase(fetchCurrentRound.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchCurrentRound.fulfilled, (state, action) => {
//         state.loading = false;
//         // Either null or the active round object
//         state.currentRound = action.payload;
//       })
//       .addCase(fetchCurrentRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // fetchJackpotPool
//       .addCase(fetchJackpotPool.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchJackpotPool.fulfilled, (state, action) => {
//         state.loading = false;
//         if (typeof action.payload?.jackpotPool === "number") {
//           state.jackpot = action.payload.jackpotPool;
//         }
//       })
//       .addCase(fetchJackpotPool.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // placeBet
//       .addCase(placeBet.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(placeBet.fulfilled, (state, action) => {
//         state.loading = false;
//         state.lastBet = action.payload.bet;
//       })
//       .addCase(placeBet.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export default roundSlice.reducer;



///################################################################   las workigng #############333
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Async thunk to fetch the current round
// export const fetchCurrentRound = createAsyncThunk(
//   "round/fetchCurrentRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/round");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Async thunk to fetch the jackpot pool
// export const fetchJackpotPool = createAsyncThunk(
//   "round/fetchJackpotPool",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/game/jackpot");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Async thunk to start a new round
// export const startRound = createAsyncThunk(
//   "round/startRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/game/startRound");
//       // The API is expected to return an object with a `round` property.
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Async thunk to end a round (expects the round ID as its payload)
// export const endRound = createAsyncThunk(
//   "round/endRound",
//   async (roundId, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post(`/game/endRound/${roundId}`);
//       // The API is expected to return an object with a `round` property and outcome details.
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Async thunk to place a bet
// // Expects a payload with { amount, side }.
// export const placeBet = createAsyncThunk(
//   "round/placeBet",
//   async (betData, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/game/bet", betData);
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// const roundSlice = createSlice({
//   name: "round",
//   initialState: {
//     currentRound: null,
//     jackpot: 0,
//     loading: false,
//     error: null,
//     // Optional: store the result of the last bet.
//     lastBet: null,
//   },
//   reducers: {
//     setCurrentRound(state, action) {
//       state.currentRound = action.payload;
//     },
//     setJackpot(state, action) {
//       state.jackpot = action.payload;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Fetch current round cases
//       .addCase(fetchCurrentRound.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchCurrentRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(fetchCurrentRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // Fetch jackpot pool case
//       .addCase(fetchJackpotPool.fulfilled, (state, action) => {
//         state.jackpot = action.payload.jackpotPool;
//       })

//       // Start round cases
//       .addCase(startRound.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(startRound.fulfilled, (state, action) => {
//         state.loading = false;
//         // Update currentRound with the new round details returned by the API
//         state.currentRound = action.payload.round;
//       })
//       .addCase(startRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // End round cases
//       .addCase(endRound.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(endRound.fulfilled, (state, action) => {
//         state.loading = false;
//         // Update currentRound with the ended round details (including outcome)
//         state.currentRound = action.payload.round;
//       })
//       .addCase(endRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // Place bet cases
//       .addCase(placeBet.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(placeBet.fulfilled, (state, action) => {
//         state.loading = false;
//         // Optionally store the result of the placed bet:
//         state.lastBet = action.payload.bet;
//       })
//       .addCase(placeBet.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const { setCurrentRound, setJackpot } = roundSlice.actions;
// export default roundSlice.reducer;



// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Async thunk to fetch the current round
// export const fetchCurrentRound = createAsyncThunk(
//   "round/fetchCurrentRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/round");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Async thunk to fetch the jackpot pool
// export const fetchJackpotPool = createAsyncThunk(
//   "round/fetchJackpotPool",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/jackpotPool");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Async thunk to start a new round
// export const startRound = createAsyncThunk(
//   "round/startRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/game/startRound");
//       // The API is expected to return an object with a `round` property.
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// // Async thunk to end a round
// // This thunk expects the round ID as its payload.
// export const endRound = createAsyncThunk(
//   "round/endRound",
//   async (roundId, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post(`/game/endRound/${roundId}`);
//       // The API is expected to return an object with a `round` property and outcome details.
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// const roundSlice = createSlice({
//   name: "round",
//   initialState: { currentRound: null, jackpot: 0, loading: false, error: null },
//   reducers: {
//     setCurrentRound(state, action) {
//       state.currentRound = action.payload;
//     },
//     setJackpot(state, action) {
//       state.jackpot = action.payload;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Fetch current round cases
//       .addCase(fetchCurrentRound.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchCurrentRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(fetchCurrentRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // Fetch jackpot pool case
//       .addCase(fetchJackpotPool.fulfilled, (state, action) => {
//         state.jackpot = action.payload.jackpotPool;
//       })

//       // Start round cases
//       .addCase(startRound.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(startRound.fulfilled, (state, action) => {
//         state.loading = false;
//         // Update currentRound with the new round details returned by the API
//         state.currentRound = action.payload.round;
//       })
//       .addCase(startRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // End round cases
//       .addCase(endRound.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(endRound.fulfilled, (state, action) => {
//         state.loading = false;
//         // Update currentRound with the ended round details (including outcome)
//         state.currentRound = action.payload.round;
//       })
//       .addCase(endRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const { setCurrentRound, setJackpot } = roundSlice.actions;
// export default roundSlice.reducer;


// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// export const fetchCurrentRound = createAsyncThunk(
//   "round/fetchCurrentRound",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/round");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// export const fetchJackpotPool = createAsyncThunk(
//   "round/fetchJackpotPool",
//   async (_, thunkAPI) => {
//     try {
//       const response = await axiosInstance.get("/jackpotPool");
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// const roundSlice = createSlice({
//   name: "round",
//   initialState: { currentRound: null, jackpot: 0, loading: false, error: null },
//   reducers: {
//     setCurrentRound(state, action) {
//       state.currentRound = action.payload;
//     },
//     setJackpot(state, action) {
//       state.jackpot = action.payload;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchCurrentRound.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchCurrentRound.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentRound = action.payload;
//       })
//       .addCase(fetchCurrentRound.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(fetchJackpotPool.fulfilled, (state, action) => {
//         state.jackpot = action.payload.jackpotPool;
//       });
//   },
// });

// export const { setCurrentRound, setJackpot } = roundSlice.actions;
// export default roundSlice.reducer;
