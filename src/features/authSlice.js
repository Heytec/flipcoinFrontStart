// authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../app/axiosInstance"; // Ensure this path is correct
import {
  ERROR_TYPES,
  ERROR_MESSAGES,
  // Assuming these helpers exist and are imported correctly from errorTypes.js
  // If not, the extractError function will use defaults.
  getErrorSeverity,
  shouldReportError
} from '../constants/errorTypes'; // Ensure this path is correct

// --- Updated Error Types ---
const AUTH_ERROR_TYPES = {
  ...ERROR_TYPES, // Include base error types if defined in errorTypes.js
  SEND_OTP_FAILED:   'SEND_OTP_FAILED',   // Keep for now, review usage
  VERIFY_OTP_FAILED: 'VERIFY_OTP_FAILED', // Keep for now, review usage
  USER_EXISTS:       'USER_EXISTS',
  OTP_INVALID:       'OTP_INVALID',
  // OTP_EXPIRED:       'OTP_EXPIRED', // REMOVED - Backend sends OTP_INVALID for this
  INVALID_PHONE:     'INVALID_PHONE',
  VALIDATION_ERROR:  'VALIDATION_ERROR',
  NOT_FOUND:         'NOT_FOUND',
  UNAUTHORIZED:      'UNAUTHORIZED',
  REVOKED_SESSION:   'REVOKED_SESSION',
  EXPIRED_SESSION:   'EXPIRED_SESSION',
  INVALID_TOKEN:     'INVALID_TOKEN',
  INVALID_MODE:      'INVALID_MODE'       // ADDED - For invalid 'mode' in otp/send
};

// --- Updated Error Messages ---
const AUTH_ERROR_MESSAGES = {
  ...ERROR_MESSAGES, // Include base messages if defined in errorTypes.js
  [AUTH_ERROR_TYPES.INVALID_PHONE]: 'Please enter a valid phone number (e.g., 07XXXXXXXX or +254XXXXXXXXX).',
  [AUTH_ERROR_TYPES.USER_EXISTS]: 'This phone number is already registered. Please login instead.',
  [AUTH_ERROR_TYPES.NOT_FOUND]: 'No account found with this phone number. Please register first.',
  [AUTH_ERROR_TYPES.OTP_INVALID]: 'Invalid or expired verification code. Please try again or request a new one.', // Updated message
  // [AUTH_ERROR_TYPES.OTP_EXPIRED]: 'Verification code has expired. Please request a new one.', // REMOVED
  [AUTH_ERROR_TYPES.VALIDATION_ERROR]: 'Please check your input and try again.', // Generic validation message
  [AUTH_ERROR_TYPES.UNAUTHORIZED]: 'Unauthorized access. Please login again.',
  [AUTH_ERROR_TYPES.REVOKED_SESSION]: 'Your session has been revoked. Please login again.',
  [AUTH_ERROR_TYPES.EXPIRED_SESSION]: 'Your session has expired. Please login again.',
  [AUTH_ERROR_TYPES.INVALID_TOKEN]: 'Invalid token. Please login again.',
  [AUTH_ERROR_TYPES.SEND_OTP_FAILED]: 'Failed to send verification code. Please try again.', // Keep for now
  [AUTH_ERROR_TYPES.VERIFY_OTP_FAILED]: 'Failed to verify code. Please try again.', // Keep for now
  [AUTH_ERROR_TYPES.INVALID_MODE]: 'An invalid operation mode was specified. Please contact support.', // ADDED Message
  // Add fallbacks from ERROR_TYPES if they exist and are needed
  [ERROR_TYPES.SERVICE_UNAVAILABLE]: ERROR_MESSAGES[ERROR_TYPES.SERVICE_UNAVAILABLE] || 'Cannot connect to the server. Please check your internet connection.',
  [ERROR_TYPES.UNKNOWN_ERROR]: ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR] || 'An unexpected error occurred. Please try again.'
};

// --- Updated extractError Helper Function ---
const extractError = (error) => {
  const data = error.response?.data;
  const defaultSeverity = 'error';
  const defaultShouldReport = true;

  // Helper to safely get severity
  const getSeverity = (code) => {
    try {
      // Check if getErrorSeverity function exists before calling
      return typeof getErrorSeverity === 'function' ? getErrorSeverity(code) : defaultSeverity;
    } catch {
      return defaultSeverity;
    }
  };

  // Helper to safely get reporting status
  const getShouldReport = (code) => {
    try {
      // Check if shouldReportError function exists before calling
      return typeof shouldReportError === 'function' ? shouldReportError(code) : defaultShouldReport;
    } catch {
      return defaultShouldReport;
    }
  };

  // 1) Standard APIError structure (root level)
  if (data?.code) {
    const { code, message, details } = data;
    // Prioritize specific message from map, fallback to backend message, then generic unknown error message
    const userMessage = AUTH_ERROR_MESSAGES[code] || message || AUTH_ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR];

    // 1.a) Bulk validation errors (e.g., from express-validator)
    if (code === AUTH_ERROR_TYPES.VALIDATION_ERROR && details?.errors && Array.isArray(details.errors)) {
      const fieldErrors = details.errors;
      // Join specific messages from backend if available
      const flatMessage = fieldErrors
        .map(e => e.msg || e.message) // Prefer 'msg'
        .filter(Boolean)
        .join('; ') || AUTH_ERROR_MESSAGES[code]; // Fallback to generic validation message

      return {
        message: flatMessage,
        code,
        details: fieldErrors, // Keep details for potential inline display
        severity: 'warning',
        timestamp: new Date().toISOString(),
        shouldReport: false // Don't usually report validation errors
      };
    }

    // 1.b) Single field validation or other errors with details object
    // Check if details exist, is an object, and is not the bulk error case already handled
    if (details && typeof details === 'object' && !(code === AUTH_ERROR_TYPES.VALIDATION_ERROR && details?.errors)) {
       // If details has its own message (like from APIError.validationError), use it, otherwise use the mapped/backend message
       const specificMessage = details.message || userMessage;
       return {
         message: specificMessage,
         code,
         details, // Keep the details object
         severity: getSeverity(code),
         timestamp: new Date().toISOString(),
         shouldReport: getShouldReport(code)
       };
     }

    // 1.c) All other APIError codes (without specific details structure or handled above)
    return {
      message: userMessage, // Use the mapped message or fallback
      code,
      details: details || null, // Ensure details is null if not present/relevant
      severity: getSeverity(code),
      timestamp: new Date().toISOString(),
      shouldReport: getShouldReport(code)
    };
  }

  // 2) Legacy shape under data.error (Simplified handling)
  if (data?.error?.code) {
     const { code, message, details } = data.error;
     // Prioritize specific message from map, fallback to backend message, then generic unknown error message
     const userMessage = AUTH_ERROR_MESSAGES[code] || message || AUTH_ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR];
     // Basic handling, similar to 1.c but using data.error properties
     return {
       message: userMessage,
       code,
       details: details || null,
       severity: getSeverity(code),
       timestamp: new Date().toISOString(),
       shouldReport: getShouldReport(code)
     };
  }

  // 3) Network errors (Axios specific: no response or explicit message)
  if (error.message === 'Network Error' || !error.response) {
    return {
      message: AUTH_ERROR_MESSAGES[ERROR_TYPES.SERVICE_UNAVAILABLE],
      code: ERROR_TYPES.SERVICE_UNAVAILABLE,
      details: null,
      severity: 'error',
      timestamp: new Date().toISOString(),
      shouldReport: true // Network errors should usually be reported
    };
  }

  // 4) Fallback for other unexpected JS errors or unknown structures
  console.error("Unknown error structure encountered in extractError:", error); // Log the raw error
  return {
    message: AUTH_ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR], // Fallback message
    code: ERROR_TYPES.UNKNOWN_ERROR, // Fallback code
    details: { rawError: error.message }, // Include raw message in details for context
    severity: 'error',
    timestamp: new Date().toISOString(),
    shouldReport: true // Report unknown errors
  };
};


// --- Updated Thunks ---

export const sendOTP = createAsyncThunk(
  "auth/sendOTP",
  async ({ phone, mode }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/otp/send", { phone, mode });
      // Assuming backend sends { message, expiresIn } on success
      return {
        message: response.data?.message || 'OTP sent successfully.', // Use backend message or default
        expiresIn: response.data?.expiresIn,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      // --- START: Detailed Error Logging ---
      console.error("--- Raw Axios Error in sendOTP ---");
      if (err.response) {
        // Log details if the server responded
        console.error("Status:", err.response.status);
        // Use try-catch for JSON.stringify in case data is not valid JSON
        try {
            console.error("Data:", JSON.stringify(err.response.data, null, 2));
        } catch (e) {
            console.error("Data (non-JSON or failed to stringify):", err.response.data);
        }
        console.error("Headers:", JSON.stringify(err.response.headers, null, 2));
      } else if (err.request) {
        // Log details if the request was made but no response received
        console.error("No response received. Request details:", err.request);
      } else {
        // Log details if there was an error setting up the request
        console.error("Error setting up request:", err.message);
      }
      console.error("Error Message:", err.message); // Log the basic error message
      // --- END: Detailed Error Logging ---

      // Process the error AFTER logging its raw form
      const errorData = extractError(err);

      // Log the processed error structure that will be stored in Redux state
      console.error('Processed Error Data (to be stored in state):', JSON.stringify(errorData, null, 2));

      return rejectWithValue(errorData); // Pass the structured error object to the reducer
    }
  }
);

export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async ({ phone, code, mode }, { rejectWithValue }) => {
    try {
      // Step 1: Verify OTP
      await axiosInstance.post("/otp/verify", { phone, code });
      // If verify fails, backend throws OTP_INVALID (as per current code)

      // Step 2: Proceed to Login or Register
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const response = await axiosInstance.post(endpoint, { phone, code }); // Send code again

      // Validate response structure
      if (!response.data?.data?.user || !response.data?.data?.tokens) {
          console.error("Invalid response structure from auth endpoint:", response.data);
          // Throw an error that extractError can hopefully parse, or create a specific one
          const err = new Error('Received invalid data after authentication.');
          err.response = { data: { code: ERROR_TYPES.UNKNOWN_ERROR, message: err.message } }; // Simulate APIError structure
          throw err;
      }
      const { user, tokens } = response.data.data;

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
       // --- START: Detailed Error Logging for verifyOTP ---
       console.error("--- Raw Axios Error in verifyOTP ---");
       if (err.response) {
         console.error("Status:", err.response.status);
         try {
             console.error("Data:", JSON.stringify(err.response.data, null, 2));
         } catch (e) {
             console.error("Data (non-JSON or failed to stringify):", err.response.data);
         }
         console.error("Headers:", JSON.stringify(err.response.headers, null, 2));
       } else if (err.request) {
         console.error("No response received. Request details:", err.request);
       } else {
         console.error("Error setting up request:", err.message);
       }
       console.error("Error Message:", err.message);
       // --- END: Detailed Error Logging for verifyOTP ---

      const errorData = extractError(err);

      // --- Updated Suggestions Logic ---
      switch (errorData.code) {
        case AUTH_ERROR_TYPES.USER_EXISTS:
          errorData.suggestion = 'This phone number is already registered. Please login instead.';
          errorData.action = 'NAV_LOGIN'; // Action for UI to navigate
          break;
        case AUTH_ERROR_TYPES.NOT_FOUND:
          errorData.suggestion = 'No account found with this number. Please register first.';
          errorData.action = 'NAV_REGISTER'; // Action for UI to navigate
          break;
        // case AUTH_ERROR_TYPES.OTP_EXPIRED: // Removed
        case AUTH_ERROR_TYPES.OTP_INVALID:
          errorData.suggestion = 'Invalid or expired code. Please check the code or request a new one.';
          errorData.action = 'RETRY_OTP'; // Action for UI to focus OTP input/allow resend
          break;
        case AUTH_ERROR_TYPES.INVALID_PHONE:
          // This case might be less likely here if phone validation happens in sendOTP, but keep for robustness
          errorData.suggestion = 'The phone number format is invalid. Please correct it (e.g., 07XXXXXXXX).';
          errorData.action = 'RETRY_PHONE'; // Action for UI to focus phone input
          break;
        case AUTH_ERROR_TYPES.VALIDATION_ERROR:
           // Use the specific message from errorData if available (e.g., joined bulk errors)
           errorData.suggestion = errorData.message || 'Please correct the highlighted fields and try again.';
           errorData.action = 'RETRY_FORM'; // Generic form retry action
           break;
        case AUTH_ERROR_TYPES.INVALID_MODE: // Added case
           errorData.suggestion = 'There was an issue processing the request type. Please try again or contact support.';
           errorData.action = 'RETRY';
           break;
        case AUTH_ERROR_TYPES.UNAUTHORIZED:
        case AUTH_ERROR_TYPES.REVOKED_SESSION:
        case AUTH_ERROR_TYPES.EXPIRED_SESSION:
        case AUTH_ERROR_TYPES.INVALID_TOKEN:
          errorData.suggestion = 'Your session is invalid or expired. Please login again.';
          errorData.action = 'FORCE_LOGOUT'; // Action for UI to clear state and redirect to login
          break;
        case ERROR_TYPES.SERVICE_UNAVAILABLE:
           errorData.suggestion = 'Could not connect to the server. Please check your connection and try again.';
           errorData.action = 'RETRY_CONNECTION';
           break;
        default: // Includes UNKNOWN_ERROR and any other backend codes not mapped
          errorData.suggestion = errorData.message || 'An unexpected error occurred. Please try again or contact support.';
          errorData.action = 'RETRY';
      }

      // Log the processed error for verifyOTP
      console.error('Processed Verify OTP/Auth Error (to be stored in state):', JSON.stringify(errorData, null, 2));

      return rejectWithValue(errorData);
    }
  }
);

export const performLogout = createAsyncThunk(
  "auth/logout",
  async (_, { getState, rejectWithValue }) => {
    const { refreshToken } = getState().auth; // Get token before try block

    // If no token, consider already logged out locally
    if (!refreshToken) {
      console.warn("Logout attempted without refresh token (already logged out locally).");
      // Resolve successfully as the state is already logged out
      return { success: true, message: "Already logged out.", timestamp: new Date().toISOString() };
    }

    try {
      await axiosInstance.post("/auth/logout", { refreshToken });
      // Success from backend
      return { success: true, message: "Logout successful.", timestamp: new Date().toISOString() };
    } catch (err) {
       // --- START: Detailed Error Logging for performLogout ---
       console.error("--- Raw Axios Error in performLogout ---");
       if (err.response) {
         console.error("Status:", err.response.status);
         try {
             console.error("Data:", JSON.stringify(err.response.data, null, 2));
         } catch (e) {
             console.error("Data (non-JSON or failed to stringify):", err.response.data);
         }
         console.error("Headers:", JSON.stringify(err.response.headers, null, 2));
       } else if (err.request) {
         console.error("No response received. Request details:", err.request);
       } else {
         console.error("Error setting up request:", err.message);
       }
       console.error("Error Message:", err.message);
       // --- END: Detailed Error Logging for performLogout ---

      const errorData = extractError(err);
      // Log the API error, but proceed to reject for local state cleanup
      console.error('Processed Logout API Error:', JSON.stringify(errorData, null, 2));
      // Reject even on API failure to ensure local state is cleared in the reducer
      return rejectWithValue(errorData);
    }
  }
);

// --- Updated Initial State ---
const initialState = {
  user: null,
  balance: null,
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  loading: false,
  error: null, // Stores the object from extractError { message, code, details, severity, timestamp, shouldReport, suggestion?, action? }
  lastAction: null,
  lastActionTimestamp: null,
  // Set initial status based on token presence
  authStatus: localStorage.getItem("accessToken") ? 'authenticated' : 'idle',
  retryCount: 0
};

// --- Updated Slice Reducers & ExtraReducers ---
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateAccessToken(state, action) {
      if (action.payload) {
        state.accessToken = action.payload;
        localStorage.setItem("accessToken", action.payload);
      } else {
        state.accessToken = null;
        localStorage.removeItem("accessToken");
      }
    },
    updateBalance(state, action) {
      const newBalance = parseFloat(action.payload);
      if (!isNaN(newBalance)) {
          state.balance = newBalance;
          if (state.user) {
              state.user.balance = newBalance; // Keep user object consistent if exists
          }
      } else {
          console.warn("Invalid payload received for updateBalance:", action.payload);
      }
    },
    clearError(state) {
      state.error = null;
      state.retryCount = 0; // Reset retries when error is explicitly cleared
    },
    // Manual logout action (optional, if needed for immediate UI changes without API call)
    // Generally, dispatching performLogout is preferred.
    logout(state) {
      state.user = null;
      state.balance = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      state.authStatus = 'idle';
      state.lastAction = 'MANUAL_LOGOUT'; // Indicate manual trigger
      state.lastActionTimestamp = new Date().toISOString();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      // Optionally clear other user-related persisted data
    },
  },
  extraReducers: (builder) => {
    builder
      // sendOTP
      .addCase(sendOTP.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear previous errors on new attempt
        state.lastAction = 'SEND_OTP';
        state.authStatus = 'pending_otp'; // Specific status
      })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.lastActionTimestamp = action.payload.timestamp;
        state.authStatus = 'otp_sent';
        state.retryCount = 0; // Reset retries on success
        state.error = null; // Ensure error is cleared on success
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Stores the structured error object from rejectWithValue
        state.authStatus = 'failed_otp'; // Specific status
        state.retryCount += 1;
      })

      // verifyOTP (covers verify + login/register)
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear previous errors on new attempt
        state.lastAction = 'VERIFY_OTP_AUTH';
        state.authStatus = 'pending_auth';
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.balance = action.payload.user?.balance ?? null; // Safely access balance
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.lastActionTimestamp = action.payload.timestamp;
        state.authStatus = 'authenticated';
        state.retryCount = 0; // Reset retries on success
        state.error = null; // Clear error on successful authentication
        // Persist tokens
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Stores the structured error object
        state.authStatus = 'failed_auth';
        state.retryCount += 1;
        // Do NOT clear tokens here on failure, allow retry if applicable (e.g., wrong OTP)
        // If the error action is FORCE_LOGOUT, the component should handle clearing state/redirecting
      })

      // performLogout
      .addCase(performLogout.pending, (state) => {
        state.loading = true; // Indicate loading state for logout
        state.error = null;
        state.lastAction = 'LOGOUT';
        state.authStatus = 'logging_out';
      })
      .addCase(performLogout.fulfilled, (state, action) => {
        state.loading = false;
        state.lastActionTimestamp = action.payload.timestamp;
        // Clear all auth state on successful logout (API or local)
        // Reset to initial state but keep authStatus idle and clear tokens explicitly
        Object.assign(state, initialState, { authStatus: 'idle', accessToken: null, refreshToken: null });
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .addCase(performLogout.rejected, (state, action) => {
        state.loading = false;
        // Store the error, but still clear local state as user intent was logout
        state.error = action.payload; // Keep the error object from rejectWithValue
        state.lastActionTimestamp = new Date().toISOString(); // Record timestamp even on failure
        // Reset to initial state, keep the error, ensure tokens are cleared
        Object.assign(state, initialState, { authStatus: 'idle', accessToken: null, refreshToken: null, error: action.payload });
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        // Log that local state was cleared despite API failure
        console.error("Logout API failed, but local state cleared. Error:", action.payload);
      });
  },
});

// --- Updated Selectors ---
export const selectAuthLoading     = (state) => state.auth.loading;
export const selectAuthErrorObject = (state) => state.auth.error; // Get the full error object
export const selectAuthErrorMessage = (state) => state.auth.error?.message || null;
export const selectAuthErrorCode   = (state) => state.auth.error?.code || null;
export const selectAuthErrorDetails = (state) => state.auth.error?.details || null; // Selector for details
export const selectAuthErrorSuggestion = (state) => state.auth.error?.suggestion || null;
export const selectAuthErrorAction = (state) => state.auth.error?.action || null; // Get suggested UI action
export const selectAuthStatus      = (state) => state.auth.authStatus;
export const selectIsAuthenticated = (state) => state.auth.authStatus === 'authenticated' && !!state.auth.accessToken;
export const selectUser            = (state) => state.auth.user;
export const selectBalance         = (state) => state.auth.balance;
export const selectCanRetry        = (state) => state.auth.retryCount < 3; // Example retry limit

export const { updateAccessToken, updateBalance, clearError, logout } = authSlice.actions;
export default authSlice.reducer;


// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";
// import {
//   ERROR_TYPES,
//   ERROR_MESSAGES,
//   getErrorMessage,
//   getErrorSeverity,
//   shouldReportError
// } from '../constants/errorTypes';

// // Expanded auth-specific error types
// const AUTH_ERROR_TYPES = {
//   ...ERROR_TYPES,
//   SEND_OTP_FAILED:   'SEND_OTP_FAILED',
//   VERIFY_OTP_FAILED: 'VERIFY_OTP_FAILED',
//   USER_EXISTS:       'USER_EXISTS',
//   OTP_INVALID:       'OTP_INVALID',
//   OTP_EXPIRED:       'OTP_EXPIRED',
//   INVALID_PHONE:     'INVALID_PHONE',
//   VALIDATION_ERROR:  'VALIDATION_ERROR',
//   NOT_FOUND:         'NOT_FOUND',
//   UNAUTHORIZED:      'UNAUTHORIZED',
//   REVOKED_SESSION:   'REVOKED_SESSION',
//   EXPIRED_SESSION:   'EXPIRED_SESSION',
//   INVALID_TOKEN:     'INVALID_TOKEN'
// };

// // Expanded error messages for auth-specific cases
// const AUTH_ERROR_MESSAGES = {
//   ...ERROR_MESSAGES,
//   [AUTH_ERROR_TYPES.INVALID_PHONE]: 'Please enter a valid phone number (e.g., 07XXXXXXXX or +254XXXXXXXXX).',
//   [AUTH_ERROR_TYPES.USER_EXISTS]: 'This phone number is already registered. Please login instead.',
//   [AUTH_ERROR_TYPES.NOT_FOUND]: 'No account found with this phone number. Please register first.',
//   [AUTH_ERROR_TYPES.OTP_INVALID]: 'Invalid verification code. Please try again.',
//   [AUTH_ERROR_TYPES.OTP_EXPIRED]: 'Verification code has expired. Please request a new one.',
//   [AUTH_ERROR_TYPES.VALIDATION_ERROR]: 'Please check your input and try again.',
//   [AUTH_ERROR_TYPES.UNAUTHORIZED]: 'Unauthorized access. Please login again.',
//   [AUTH_ERROR_TYPES.REVOKED_SESSION]: 'Your session has been revoked. Please login again.',
//   [AUTH_ERROR_TYPES.EXPIRED_SESSION]: 'Your session has expired. Please login again.',
//   [AUTH_ERROR_TYPES.INVALID_TOKEN]: 'Invalid token. Please login again.',
//   [AUTH_ERROR_TYPES.SEND_OTP_FAILED]: 'Failed to send verification code. Please try again.',
//   [AUTH_ERROR_TYPES.VERIFY_OTP_FAILED]: 'Failed to verify code. Please try again.'
// };

// // Helper function to extract and format error details
// const extractError = (error) => {
//   const data = error.response?.data;

//   // 1) APIError.toJSON() at the root
//   if (data?.code) {
//     const { code, message, details } = data;

//     // 1.a) Bulk validation errors
//     if (code === 'VALIDATION_ERROR' && details?.errors) {
//       const fieldErrors = details.errors;
//       const flatMessage = fieldErrors
//         .map(e => e.msg || e.message)
//         .join(', ');

//       return {
//         message: flatMessage || AUTH_ERROR_MESSAGES[code],
//         code,
//         details: fieldErrors,
//         severity: 'warning',
//         timestamp: new Date().toISOString(),
//         shouldReport: false
//       };
//     }

//     // 1.b) Single field validation or other errors
//     if (code === 'VALIDATION_ERROR' && details?.field) {
//       return {
//         message: details.message || AUTH_ERROR_MESSAGES[code],
//         code,
//         details,
//         severity: 'warning',
//         timestamp: new Date().toISOString(),
//         shouldReport: false
//       };
//     }

//     // 1.c) All other APIError codes
//     return {
//       message: AUTH_ERROR_MESSAGES[code] || message,
//       code,
//       details: details || {},
//       severity: getErrorSeverity(code),
//       timestamp: new Date().toISOString(),
//       shouldReport: shouldReportError(code)
//     };
//   }

//   // 2) Legacy shape under data.error (for backward compatibility)
//   if (data?.error) {
//     const { code, message, details } = data.error;

//     if (code === 'VALIDATION_ERROR' && details?.errors) {
//       const fieldErrors = details.errors;
//       const flatMessage = fieldErrors
//         .map(e => e.msg || e.message)
//         .join(', ');

//       return {
//         message: flatMessage || AUTH_ERROR_MESSAGES[code],
//         code,
//         details: fieldErrors,
//         severity: 'warning',
//         timestamp: new Date().toISOString(),
//         shouldReport: false
//       };
//     }

//     return {
//       message: AUTH_ERROR_MESSAGES[code] || message,
//       code,
//       details: details || {},
//       severity: getErrorSeverity(code),
//       timestamp: new Date().toISOString(),
//       shouldReport: shouldReportError(code)
//     };
//   }

//   // 3) Network errors
//   if (error.message === 'Network Error') {
//     return {
//       message: AUTH_ERROR_MESSAGES[ERROR_TYPES.SERVICE_UNAVAILABLE],
//       code: ERROR_TYPES.SERVICE_UNAVAILABLE,
//       severity: 'error',
//       timestamp: new Date().toISOString(),
//       shouldReport: true
//     };
//   }

//   // 4) Fallback
//   return {
//     message: AUTH_ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR] || error.message,
//     code: ERROR_TYPES.UNKNOWN_ERROR,
//     severity: 'error',
//     timestamp: new Date().toISOString(),
//     shouldReport: true
//   };
// };

// // Thunk to send OTP
// export const sendOTP = createAsyncThunk(
//   "auth/sendOTP",
//   async ({ phone, mode }, { rejectWithValue }) => {
//     try {
//       const response = await axiosInstance.post("/otp/send", { phone, mode });
//       return {
//         ...response.data,
//         timestamp: new Date().toISOString()
//       };
//     } catch (err) {
//       const errorData = extractError(err);
//       if (errorData.shouldReport) console.error('Send OTP Error:', errorData);
//       return rejectWithValue(errorData);
//     }
//   }
// );

// // Thunk to verify OTP, then register or login
// export const verifyOTP = createAsyncThunk(
//   "auth/verifyOTP",
//   async ({ phone, code, mode }, { rejectWithValue }) => {
//     try {
//       await axiosInstance.post("/otp/verify", { phone, code });
//       const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
//       const response = await axiosInstance.post(endpoint, { phone, code });
//       const { user, tokens } = response.data.data;
//       return {
//         user,
//         accessToken: tokens.accessToken,
//         refreshToken: tokens.refreshToken,
//         timestamp: new Date().toISOString()
//       };
//     } catch (err) {
//       const errorData = extractError(err);

//       // Add suggestions based on error code
//       switch (errorData.code) {
//         case AUTH_ERROR_TYPES.USER_EXISTS:
//           errorData.suggestion = 'Please login instead.';
//           errorData.action = 'LOGIN';
//           break;
//         case AUTH_ERROR_TYPES.NOT_FOUND:
//           errorData.suggestion = 'Please register a new account.';
//           errorData.action = 'REGISTER';
//           break;
//         case AUTH_ERROR_TYPES.OTP_EXPIRED:
//           errorData.suggestion = 'Request a new verification code.';
//           errorData.action = 'RESEND_OTP';
//           break;
//         case AUTH_ERROR_TYPES.OTP_INVALID:
//           errorData.suggestion = 'Please check the verification code and try again.';
//           errorData.action = 'RETRY';
//           break;
//         case AUTH_ERROR_TYPES.INVALID_PHONE:
//           errorData.suggestion = 'Enter a valid phone number (e.g., 07XXXXXXXX or +254XXXXXXXXX).';
//           errorData.action = 'RETRY';
//           break;
//         case AUTH_ERROR_TYPES.VALIDATION_ERROR:
//           errorData.suggestion = 'Please correct the input fields and try again.';
//           errorData.action = 'RETRY';
//           break;
//         case AUTH_ERROR_TYPES.UNAUTHORIZED:
//         case AUTH_ERROR_TYPES.REVOKED_SESSION:
//         case AUTH_ERROR_TYPES.EXPIRED_SESSION:
//         case AUTH_ERROR_TYPES.INVALID_TOKEN:
//           errorData.suggestion = 'Please login again to continue.';
//           errorData.action = 'LOGIN';
//           break;
//         default:
//           errorData.suggestion = 'Please try again or contact support.';
//           errorData.action = 'RETRY';
//       }

//       if (errorData.shouldReport) console.error('Verify OTP Error:', errorData);
//       return rejectWithValue(errorData);
//     }
//   }
// );

// // Thunk to perform logout
// export const performLogout = createAsyncThunk(
//   "auth/logout",
//   async (_, { getState, rejectWithValue }) => {
//     try {
//       const { refreshToken } = getState().auth;
//       if (!refreshToken) {
//         throw new Error(AUTH_ERROR_MESSAGES[ERROR_TYPES.UNAUTHORIZED]);
//       }
//       await axiosInstance.post("/auth/logout", { refreshToken });
//       return { success: true, timestamp: new Date().toISOString() };
//     } catch (err) {
//       const errorData = extractError(err);
//       if (errorData.shouldReport) console.error('Logout Error:', errorData);
//       return rejectWithValue(errorData);
//     }
//   }
// );

// // Initial state
// const initialState = {
//   user: null,
//   balance: null,
//   accessToken: localStorage.getItem("accessToken"),
//   refreshToken: localStorage.getItem("refreshToken"),
//   loading: false,
//   error: null,
//   lastAction: null,
//   lastActionTimestamp: null,
//   authStatus: 'idle',
//   retryCount: 0
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
//       if (state.user) state.user.balance = action.payload;
//     },
//     clearError(state) {
//       state.error = null;
//       state.retryCount = 0;
//     },
//     logout(state) {
//       Object.assign(state, { ...initialState, accessToken: null, refreshToken: null });
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
//         state.lastAction = 'SEND_OTP';
//         state.authStatus = 'pending';
//       })
//       .addCase(sendOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.lastActionTimestamp = action.payload.timestamp;
//         state.authStatus = 'otp_sent';
//         state.retryCount = 0;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.authStatus = 'failed';
//         state.retryCount += 1;
//       })

//       // verifyOTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.lastAction = 'VERIFY_OTP';
//         state.authStatus = 'pending';
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.balance = action.payload.user.balance;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//         state.lastActionTimestamp = action.payload.timestamp;
//         state.authStatus = 'authenticated';
//         state.retryCount = 0;
//         localStorage.setItem("accessToken", action.payload.accessToken);
//         localStorage.setItem("refreshToken", action.payload.refreshToken);
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.authStatus = 'failed';
//         state.retryCount += 1;
//       })

//       // performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.lastAction = 'LOGOUT';
//       })
//       .addCase(performLogout.fulfilled, (state, action) => {
//         state.loading = false;
//         state.lastActionTimestamp = action.payload.timestamp;
//         Object.assign(state, { ...initialState, accessToken: null, refreshToken: null });
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("refreshToken");
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.user = null;
//         state.balance = null;
//         state.accessToken = null;
//         state.refreshToken = null;
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("refreshToken");
//       });
//   },
// });

// // Selectors
// export const selectAuthError       = (state) => state.auth.error;
// export const selectAuthStatus      = (state) => state.auth.authStatus;
// export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);
// export const selectCanRetry        = (state) => state.auth.retryCount < 3;
// export const selectUser            = (state) => state.auth.user;
// export const selectBalance         = (state) => state.auth.balance;

// export const { updateAccessToken, updateBalance, clearError, logout } = authSlice.actions;
// export default authSlice.reducer;

// // authSlice.js
// // authSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";
// import {
//   ERROR_TYPES,
//   ERROR_MESSAGES,
//   getErrorMessage,
//   getErrorSeverity,
//   shouldReportError
// } from '../constants/errorTypes';

// // Auth-specific error types (you can keep or trim these as you like)
// const AUTH_ERROR_TYPES = {
//   ...ERROR_TYPES,
//   SEND_OTP_FAILED:   'SEND_OTP_FAILED',
//   VERIFY_OTP_FAILED: 'VERIFY_OTP_FAILED',
//   USER_EXISTS:       'USER_EXISTS',
//   OTP_INVALID:       'OTP_INVALID',
//   OTP_EXPIRED:       'OTP_EXPIRED',
//   INVALID_PHONE:     'INVALID_PHONE',
//   // …etc
// };

// // Helper function to extract and format error details
// const extractError = (error) => {
//   const data = error.response?.data;

//   // 1) Our APIError.toJSON() at the root
//   if (data?.code) {
//     const { code, message, details } = data;

//     // 1.a) Bulk validation errors
//     if (code === 'VALIDATION_ERROR' && details?.errors) {
//       const fieldErrors = details.errors;
//       const flatMessage = fieldErrors
//         .map(e => e.msg || e.message)
//         .join(', ');

//       return {
//         message: flatMessage,
//         code,
//         details: fieldErrors,
//         severity: 'warning',
//         timestamp: new Date().toISOString(),
//         shouldReport: false
//       };
//     }

//     // 1.b) All other APIError codes
//     return {
//       message: getErrorMessage(code, details) || message,
//       code,
//       details,
//       severity: getErrorSeverity(code),
//       timestamp: new Date().toISOString(),
//       shouldReport: shouldReportError(code)
//     };
//   }

//   // 2) Legacy shape under data.error
//   if (data?.error) {
//     const { code, message, details } = data.error;

//     if (code === 'VALIDATION_ERROR' && details?.errors) {
//       const fieldErrors = details.errors;
//       const flatMessage = fieldErrors
//         .map(e => e.msg || e.message)
//         .join(', ');

//       return {
//         message: flatMessage,
//         code,
//         details: fieldErrors,
//         severity: 'warning',
//         timestamp: new Date().toISOString(),
//         shouldReport: false
//       };
//     }

//     return {
//       message: getErrorMessage(code, details) || message,
//       code,
//       details,
//       severity: getErrorSeverity(code),
//       timestamp: new Date().toISOString(),
//       shouldReport: shouldReportError(code)
//     };
//   }

//   // 3) Network errors
//   if (error.message === 'Network Error') {
//     return {
//       message: ERROR_MESSAGES[ERROR_TYPES.SERVICE_UNAVAILABLE],
//       code: ERROR_TYPES.SERVICE_UNAVAILABLE,
//       severity: 'error',
//       timestamp: new Date().toISOString(),
//       shouldReport: true
//     };
//   }

//   // 4) Fallback
//   return {
//     message: error.message || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR],
//     code: ERROR_TYPES.UNKNOWN_ERROR,
//     severity: 'error',
//     timestamp: new Date().toISOString(),
//     shouldReport: true
//   };
// };

// // Thunk to send OTP
// export const sendOTP = createAsyncThunk(
//   "auth/sendOTP",
//   async ({ phone, mode }, { rejectWithValue }) => {
//     try {
//       const response = await axiosInstance.post("/otp/send", { phone, mode });
//       return {
//         ...response.data,
//         timestamp: new Date().toISOString()
//       };
//     } catch (err) {
//       const errorData = extractError(err);
//       if (errorData.shouldReport) console.error('Auth Error:', errorData);
//       return rejectWithValue(errorData);
//     }
//   }
// );

// // Thunk to verify OTP, then register or login
// export const verifyOTP = createAsyncThunk(
//   "auth/verifyOTP",
//   async ({ phone, code, mode }, { rejectWithValue }) => {
//     try {
//       await axiosInstance.post("/otp/verify", { phone, code });
//       const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
//       const response = await axiosInstance.post(endpoint, { phone, code });
//       const { user, tokens } = response.data.data;
//       return {
//         user,
//         accessToken: tokens.accessToken,
//         refreshToken: tokens.refreshToken,
//         timestamp: new Date().toISOString()
//       };
//     } catch (err) {
//       const errorData = extractError(err);

//       // add suggestions based on code
//       switch (errorData.code) {
//         case AUTH_ERROR_TYPES.USER_EXISTS:
//           errorData.suggestion = 'Please login instead';
//           errorData.action = 'LOGIN';
//           break;
//         case AUTH_ERROR_TYPES.NOT_FOUND:
//           errorData.suggestion = 'Register a new account';
//           errorData.action = 'REGISTER';
//           break;
//         case AUTH_ERROR_TYPES.OTP_EXPIRED:
//           errorData.suggestion = 'Request a new verification code';
//           errorData.action = 'RESEND_OTP';
//           break;
//         case AUTH_ERROR_TYPES.INVALID_PHONE:
//           errorData.suggestion = 'Enter a valid phone number (e.g. 07XXXXXXXX)';
//           break;
//       }

//       if (errorData.shouldReport) console.error('Auth Error:', errorData);
//       return rejectWithValue(errorData);
//     }
//   }
// );

// // Thunk to perform logout
// export const performLogout = createAsyncThunk(
//   "auth/logout",
//   async (_, { getState, rejectWithValue }) => {
//     try {
//       const { refreshToken } = getState().auth;
//       if (!refreshToken) {
//         throw new Error(ERROR_MESSAGES[ERROR_TYPES.UNAUTHORIZED]);
//       }
//       await axiosInstance.post("/auth/logout", { refreshToken });
//       return { success: true, timestamp: new Date().toISOString() };
//     } catch (err) {
//       const errorData = extractError(err);
//       if (errorData.shouldReport) console.error('Auth Error:', errorData);
//       return rejectWithValue(errorData);
//     }
//   }
// );

// // Initial state
// const initialState = {
//   user: null,
//   balance: null,
//   accessToken: localStorage.getItem("accessToken"),
//   refreshToken: localStorage.getItem("refreshToken"),
//   loading: false,
//   error: null,
//   lastAction: null,
//   lastActionTimestamp: null,
//   authStatus: 'idle',
//   retryCount: 0
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
//       if (state.user) state.user.balance = action.payload;
//     },
//     clearError(state) {
//       state.error = null;
//       state.retryCount = 0;
//     },
//     logout(state) {
//       Object.assign(state, { ...initialState, accessToken: null, refreshToken: null });
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
//         state.lastAction = 'SEND_OTP';
//         state.authStatus = 'pending';
//       })
//       .addCase(sendOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.lastActionTimestamp = action.payload.timestamp;
//         state.authStatus = 'otp_sent';
//         state.retryCount = 0;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.authStatus = 'failed';
//         state.retryCount += 1;
//       })

//       // verifyOTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.lastAction = 'VERIFY_OTP';
//         state.authStatus = 'pending';
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.balance = action.payload.user.balance;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//         state.lastActionTimestamp = action.payload.timestamp;
//         state.authStatus = 'authenticated';
//         state.retryCount = 0;
//         localStorage.setItem("accessToken", action.payload.accessToken);
//         localStorage.setItem("refreshToken", action.payload.refreshToken);
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.authStatus = 'failed';
//         state.retryCount += 1;
//       })

//       // performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.lastAction = 'LOGOUT';
//       })
//       .addCase(performLogout.fulfilled, (state, action) => {
//         state.loading = false;
//         state.lastActionTimestamp = action.payload.timestamp;
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.user = null;
//         state.balance = null;
//         state.accessToken = null;
//         state.refreshToken = null;
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("refreshToken");
//       });
//   },
// });

// // Selectors
// export const selectAuthError       = (state) => state.auth.error;
// export const selectAuthStatus      = (state) => state.auth.authStatus;
// export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);
// export const selectCanRetry        = (state) => state.auth.retryCount < 3;
// export const selectUser            = (state) => state.auth.user;
// export const selectBalance         = (state) => state.auth.balance;

// export const { updateAccessToken, updateBalance, clearError, logout } = authSlice.actions;
// export default authSlice.reducer;



// // authSlice.js 
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";
// import { 
//   ERROR_TYPES, 
//   ERROR_MESSAGES, 
//   getErrorMessage, 
//   getErrorSeverity,
//   shouldReportError 
// } from '../constants/errorTypes';

// // Auth-specific error types
// const AUTH_ERROR_TYPES = {
//   ...ERROR_TYPES,
//   SEND_OTP_FAILED: 'SEND_OTP_FAILED',
//   VERIFY_OTP_FAILED: 'VERIFY_OTP_FAILED',
//   MISSING_PHONE: 'MISSING_PHONE',
//   INVALID_PHONE: 'INVALID_PHONE',
//   OTP_INVALID: 'OTP_INVALID',
//   OTP_EXPIRED: 'OTP_EXPIRED',
//   USER_EXISTS: 'USER_EXISTS',
//   MISSING_OTP: 'MISSING_OTP',
//   LOGOUT_FAILED: 'LOGOUT_FAILED'
// };

// // Helper function to extract and format error details
// const extractError = (error) => {
//   if (error.response?.data?.error) {
//     const { code, message, details } = error.response.data.error;
//     return {
//       message: getErrorMessage(code, details) || message,
//       code,
//       details,
//       severity: getErrorSeverity(code),
//       timestamp: new Date().toISOString(),
//       shouldReport: shouldReportError(code)
//     };
//   }

//   if (error.message === 'Network Error') {
//     return {
//       message: ERROR_MESSAGES[ERROR_TYPES.SERVICE_UNAVAILABLE],
//       code: ERROR_TYPES.SERVICE_UNAVAILABLE,
//       severity: 'error',
//       timestamp: new Date().toISOString(),
//       shouldReport: true
//     };
//   }

//   return {
//     message: error.message || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR],
//     code: "UNKNOWN_ERROR",
//     severity: 'error',
//     timestamp: new Date().toISOString(),
//     shouldReport: true
//   };
// };

// // Thunk to send OTP
// export const sendOTP = createAsyncThunk(
//   "auth/sendOTP",
//   async ({ phone, mode }, { rejectWithValue }) => {
//     try {
//       const response = await axiosInstance.post("/otp/send", { phone, mode });
//       return {
//         ...response.data,
//         timestamp: new Date().toISOString()
//       };
//     } catch (error) {
//       const errorData = extractError(error);
//       if (errorData.shouldReport) {
//         console.error('Auth Error:', errorData);
//         // Add your error reporting service here
//       }
//       return rejectWithValue(errorData);
//     }
//   }
// );

// // Thunk to verify OTP, then register or login
// export const verifyOTP = createAsyncThunk(
//   "auth/verifyOTP",
//   async ({ phone, code, mode }, { rejectWithValue }) => {
//     try {
//       // First verify the OTP
//       await axiosInstance.post("/otp/verify", { phone, code });
//       // Then, depending on the mode, register or login the user
//       const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
//       const response = await axiosInstance.post(endpoint, { phone, code });
      
//       // Extract nested data from the API response.
//       // Our backend response looks like:
//       // { status, message, data: { user, tokens: { accessToken, refreshToken, ... } } }
//       const { user, tokens } = response.data.data;
      
//       // Return a flattened object so that extraReducers can directly read user and tokens.
//       return {
//         user,
//         accessToken: tokens.accessToken,
//         refreshToken: tokens.refreshToken,
//         timestamp: new Date().toISOString()
//       };
//     } catch (error) {
//       const errorData = extractError(error);
      
//       // Add action suggestions based on error code
//       // eslint-disable-next-line default-case
//       switch (errorData.code) {
//         case AUTH_ERROR_TYPES.USER_EXISTS:
//           errorData.suggestion = 'Please login instead';
//           errorData.action = 'LOGIN';
//           break;
//         case AUTH_ERROR_TYPES.USER_NOT_FOUND:
//           errorData.suggestion = 'Create a new account';
//           errorData.action = 'REGISTER';
//           break;
//         case AUTH_ERROR_TYPES.OTP_EXPIRED:
//           errorData.suggestion = 'Request a new verification code';
//           errorData.action = 'RESEND_OTP';
//           break;
//       }

//       if (errorData.shouldReport) {
//         console.error('Auth Error:', errorData);
//         // Add your error reporting service here
//       }
      
//       return rejectWithValue(errorData);
//     }
//   }
// );

// // Thunk to perform logout
// export const performLogout = createAsyncThunk(
//   "auth/logout",
//   async (_, { getState, rejectWithValue }) => {
//     try {
//       const { refreshToken } = getState().auth;
//       if (!refreshToken) {
//         throw new Error(ERROR_MESSAGES[AUTH_ERROR_TYPES.UNAUTHORIZED]);
//       }
//       await axiosInstance.post("/auth/logout", { refreshToken });
//       return { success: true, timestamp: new Date().toISOString() };
//     } catch (error) {
//       const errorData = extractError(error);
//       if (errorData.shouldReport) {
//         console.error('Auth Error:', errorData);
//         // Add your error reporting service here
//       }
//       return rejectWithValue(errorData);
//     }
//   }
// );

// // Initial state
// const initialState = {
//   user: null,
//   balance: null,
//   accessToken: localStorage.getItem("accessToken"),
//   refreshToken: localStorage.getItem("refreshToken"),
//   loading: false,
//   error: null,
//   lastAction: null,
//   lastActionTimestamp: null,
//   authStatus: 'idle', // 'idle' | 'pending' | 'authenticated' | 'failed'
//   retryCount: 0
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
//     clearError(state) {
//       state.error = null;
//       state.retryCount = 0;
//     },
//     logout(state) {
//       Object.assign(state, {
//         ...initialState,
//         accessToken: null,
//         refreshToken: null
//       });
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
//         state.lastAction = 'SEND_OTP';
//         state.authStatus = 'pending';
//       })
//       .addCase(sendOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.lastActionTimestamp = action.payload.timestamp;
//         state.authStatus = 'otp_sent';
//         state.retryCount = 0;
//       })
//       .addCase(sendOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.authStatus = 'failed';
//         state.retryCount += 1;
//       })
//       // verifyOTP
//       .addCase(verifyOTP.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.lastAction = 'VERIFY_OTP';
//         state.authStatus = 'pending';
//       })
//       .addCase(verifyOTP.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.balance = action.payload.user.balance;
//         state.accessToken = action.payload.accessToken;
//         state.refreshToken = action.payload.refreshToken;
//         state.lastActionTimestamp = action.payload.timestamp;
//         state.authStatus = 'authenticated';
//         state.retryCount = 0;
        
//         localStorage.setItem("accessToken", action.payload.accessToken);
//         localStorage.setItem("refreshToken", action.payload.refreshToken);
//       })
//       .addCase(verifyOTP.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.authStatus = 'failed';
//         state.retryCount += 1;
//       })
//       // performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.lastAction = 'LOGOUT';
//       })
//       .addCase(performLogout.fulfilled, (state, action) => {
//         state.loading = false;
//         state.lastActionTimestamp = action.payload.timestamp;
//         // Full logout will be handled by the synchronous logout reducer
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         // Still perform logout even if API call fails
//         state.user = null;
//         state.balance = null;
//         state.accessToken = null;
//         state.refreshToken = null;
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("refreshToken");
//       });
//   },
// });

// // Selectors
// export const selectAuthError = (state) => state.auth.error;
// export const selectAuthStatus = (state) => state.auth.authStatus;
// export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);
// export const selectCanRetry = (state) => state.auth.retryCount < 3;
// export const selectUser = (state) => state.auth.user;
// export const selectBalance = (state) => state.auth.balance;

// export const { 
//   updateAccessToken, 
//   updateBalance, 
//   clearError, 
//   logout 
// } = authSlice.actions;

// export default authSlice.reducer;

// src/features/authSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "../app/axiosInstance";

// // Helper function to extract error details from the response
// const extractError = (error) =>
//   error.response?.data?.error || { message: error.message, code: "UNKNOWN_ERROR" };

// // Thunk to send OTP
// export const sendOTP = createAsyncThunk(
//   "auth/sendOTP",
//   async ({ phone, mode }, thunkAPI) => {
//     try {
//       const response = await axiosInstance.post("/otp/send", { phone, mode });
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(extractError(error));
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
//       return thunkAPI.rejectWithValue(extractError(error));
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
//       return thunkAPI.rejectWithValue(extractError(error));
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
//   // error will hold an object { message, code } from the backend
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
//       state.error = null;
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
//         state.error = action.payload || { message: "Failed to send OTP", code: "SEND_OTP_FAILED" };
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
//         state.error = action.payload || { message: "OTP verification failed", code: "VERIFY_OTP_FAILED" };
//       })
//       // performLogout
//       .addCase(performLogout.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(performLogout.fulfilled, (state) => {
//         state.loading = false;
//         // Tokens will be cleared in the logout reducer via synchronous logout action
//       })
//       .addCase(performLogout.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || { message: "Logout failed", code: "LOGOUT_FAILED" };
//       });
//   },
// });

// export const { updateAccessToken, updateBalance, logout } = authSlice.actions;
// export default authSlice.reducer;

// // src/features/authSlice.js
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
