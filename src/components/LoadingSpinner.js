// src/components/LoadingSpinner.js
import React from "react";
import { FiRefreshCw } from "react-icons/fi";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-4">
    <FiRefreshCw className="animate-spin h-8 w-8 text-blue-500" />
  </div>
);

export default LoadingSpinner;
