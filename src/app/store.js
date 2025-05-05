// // src/app/store.js
// src/app/store.js

// src/app/store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import roundReducer from "../features/roundSlice";
import { chatReducer } from "../features/chatSlice";
import transactionReducer from "../features/transactionSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { createTransform } from "redux-persist";

// Create a transform that filters the auth slice state
const authTransform = createTransform(
  // transform state being persisted
  (inboundState, key) => {
    // Only persist selected keys from auth state.
    const { user, balance, accessToken, refreshToken } = inboundState;
    return { user, balance, accessToken, refreshToken };
  },
  // transform state being rehydrated (if needed)
  (outboundState, key) => outboundState,
  { whitelist: ["auth"] }
);

const persistConfig = {
  key: "root", // This will use "persist:root" in storage
  storage,
  //transforms: [authTransform],
  // Alternatively, if you only want to persist auth:
  // whitelist: ["auth"],
};

// Combine your reducers as before
const appReducer = combineReducers({
  auth: authReducer,
  round: roundReducer,
  chat: chatReducer,
  transaction: transactionReducer,
});

// Root reducer that resets state on logout
const rootReducer = (state, action) => {
  // When logging out, reset state (which will update the persisted data as well)
  if (action.type === "auth/logout") {
    state = undefined;
  }
  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
export default store;





// src/app/store.js
// import { configureStore, combineReducers } from "@reduxjs/toolkit";
// import authReducer from "../features/authSlice";
// import roundReducer from "../features/roundSlice";
// import { chatReducer } from "../features/chatSlice";
// import transactionReducer from "../features/transactionSlice";
// import { persistStore, persistReducer } from "redux-persist";
// import storage from "redux-persist/lib/storage";

// // Combine your reducers
// const appReducer = combineReducers({
//   auth: authReducer,
//   round: roundReducer,
//   chat: chatReducer,
//   transaction: transactionReducer,
// });

// // Root reducer to reset state on logout
// const rootReducer = (state, action) => {
//   // If the action is auth/logout, reset the entire store
//   if (action.type === "auth/logout") {
//     state = undefined;
//   }
//   return appReducer(state, action);
// };

// // Redux Persist configuration
// const persistConfig = {
//   key: "root", // This means 'persist:root' will be used in localStorage
//   storage,
//   // whitelist: ["auth"], // or choose slices to persist
// };

// const persistedReducer = persistReducer(persistConfig, rootReducer);

// const store = configureStore({
//   reducer: persistedReducer,
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: false,
//     }),
// });

// export const persistor = persistStore(store);
// export default store;


// src/app/store.js
// import { configureStore, combineReducers } from "@reduxjs/toolkit";
// import authReducer from "../features/authSlice";
// import roundReducer from "../features/roundSlice";
// import { chatReducer } from "../features/chatSlice";
// import transactionReducer from "../features/transactionSlice";
// import { persistStore, persistReducer } from "redux-persist";
// import storage from "redux-persist/lib/storage";

// // Combine your app's reducers.
// const appReducer = combineReducers({
//   auth: authReducer,
//   round: roundReducer,
//   chat: chatReducer,
//   transaction: transactionReducer,
// });

// // Root reducer resets state on logout.
// const rootReducer = (state, action) => {
//   if (action.type === "auth/logout") {
//     // Reset entire state (clears Redux Persist as well)
//     state = undefined;
//   }
//   return appReducer(state, action);
// };

// // Redux Persist configuration.
// const persistConfig = {
//   key: "root",
//   storage,
//   // Optionally, you can whitelist specific slices, for example:
//   // whitelist: ['auth']
// };

// const persistedReducer = persistReducer(persistConfig, rootReducer);

// const store = configureStore({
//   reducer: persistedReducer,
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       // Disable serializable check for redux-persist actions.
//       serializableCheck: false,
//     }),
// });

// export const persistor = persistStore(store);
// export default store;











// import { configureStore, combineReducers } from "@reduxjs/toolkit";
// import authReducer from "../features/authSlice";
// import roundReducer from "../features/roundSlice";
// import { chatReducer } from "../features/chatSlice";
// import transactionReducer from "../features/transactionSlice";
// import { persistStore, persistReducer } from "redux-persist";
// import storage from "redux-persist/lib/storage";

// // Combine your app's reducers.
// const appReducer = combineReducers({
//   auth: authReducer,
//   round: roundReducer,
//   chat: chatReducer,
//   transaction: transactionReducer,
// });

// // Root reducer resets state on logout.
// const rootReducer = (state, action) => {
//   if (action.type === "auth/logout") {
//     // Reset all state by setting it to undefined.
//     state = undefined;
//   }
//   return appReducer(state, action);
// };

// // Redux Persist configuration.
// const persistConfig = {
//   key: "root",
//   storage,
//   // Optionally, add a whitelist (or blacklist) of reducers to persist.
//   // whitelist: ["auth"],
// };

// const persistedReducer = persistReducer(persistConfig, rootReducer);

// const store = configureStore({
//   reducer: persistedReducer,
//   middleware: (getDefaultMiddleware) =>
//     // Disable serializableCheck for redux-persist actions.
//     getDefaultMiddleware({
//       serializableCheck: false,
//     }),
// });

// export const persistor = persistStore(store);
// export default store;








// import { configureStore, combineReducers } from "@reduxjs/toolkit";
// import authReducer from "../features/authSlice";
// import roundReducer from "../features/roundSlice";
// import { chatReducer } from "../features/chatSlice";
// import transactionReducer from "../features/transactionSlice";
// import { persistStore, persistReducer } from "redux-persist";
// import storage from "redux-persist/lib/storage"; // uses localStorage for web

// // Configure Redux Persist
// const persistConfig = {
//   key: "root",
//   storage,
//   // whitelist: ['auth'], // Uncomment to persist only the auth slice.
// };

// const rootReducer = combineReducers({
//   auth: authReducer,
//   round: roundReducer,
//   chat: chatReducer,
//   transaction: transactionReducer,
// });

// const persistedReducer = persistReducer(persistConfig, rootReducer);

// const store = configureStore({
//   reducer: persistedReducer,
//   // Disable serializableCheck for redux-persist actions.
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: false,
//     }),
// });

// export const persistor = persistStore(store);
// export default store;


//###############################  lat wokring


// import { configureStore } from "@reduxjs/toolkit";
// import authReducer from "../features/authSlice";
// import roundReducer from "../features/roundSlice";
// import { chatReducer } from "../features/chatSlice"; // Named export
// import transactionReducer from "../features/transactionSlice"; // New transaction slice

// const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     round: roundReducer,
//     chat: chatReducer,
//     transaction: transactionReducer,
//   },
// });

// export default store;
