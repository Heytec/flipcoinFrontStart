import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { accessToken } = useSelector((state) => state.auth);
  if (!accessToken) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default ProtectedRoute;
