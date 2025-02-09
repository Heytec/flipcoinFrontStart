import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import roundReducer from '../features/roundSlice';
import chatReducer from '../features/chatSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    round: roundReducer,
    chat: chatReducer,
  },
});

export default store;
