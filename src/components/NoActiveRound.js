// src/components/NoActiveRound.js
import React, { useEffect, useState } from "react";
import { FiAlertCircle, FiClock, FiRefreshCw } from "react-icons/fi";

const NoActiveRound = ({ onRefresh, isLoading }) => {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg mb-6 transition-all duration-300">
      <div className="text-center space-y-6">
        <div className="bg-yellow-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <FiAlertCircle className="w-8 h-8 text-yellow-500" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">
            No Active Round Available
          </h3>
          <p className="text-gray-600">
            The next betting round will start soon
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <FiClock className="w-5 h-5" />
            <span>Auto-refresh in: {countdown}s</span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <FiRefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Refreshing...
              </>
            ) : (
              <>
                <FiRefreshCw className="-ml-1 mr-2 h-5 w-5" />
                Refresh Now
              </>
            )}
          </button>

          <p className="text-sm text-gray-500">
            You can refresh manually or wait for auto-refresh
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoActiveRound;
