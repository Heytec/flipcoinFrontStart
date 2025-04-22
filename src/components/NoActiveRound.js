// // src/components/NoActiveRound.js
// src/components/NoActiveRound.js
import React, { useEffect, useState } from "react";
import { FiAlertCircle, FiClock, FiRefreshCw } from "react-icons/fi";

// Accept refreshIntervalSeconds prop, provide a default (e.g., 10)
const NoActiveRound = ({ onRefresh, isLoading, refreshIntervalSeconds = 10 }) => {
  // Initialize countdown state with the passed interval
  const [countdown, setCountdown] = useState(refreshIntervalSeconds);

  useEffect(() => {
    // Reset countdown if the interval prop changes or countdown reaches 0
    if (countdown <= 0) {
      setCountdown(refreshIntervalSeconds); // Reset to the initial interval
      // Note: The actual refresh is handled by the parent component's setInterval
      // This just resets the visual timer for the *next* expected refresh.
    }

    // Start the timer interval
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    // Cleanup function to clear the timeout
    return () => clearTimeout(timer);

    // Depend on countdown and the interval prop
  }, [countdown, refreshIntervalSeconds]);

  // Add an effect to specifically handle prop changes, resetting the countdown
  useEffect(() => {
    setCountdown(refreshIntervalSeconds);
  }, [refreshIntervalSeconds]);


  return (
    <div className="bg-gradient-to-r from-[#0d1526] to-[#111c35] border-t-2 border-yellow-500 rounded-xl p-6 shadow-lg mb-6 transition-all duration-300">
      <div className="text-center space-y-6">
        {/* ... (icon and text content remains the same) ... */}
         <div className="bg-[#09101f] rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
          <FiAlertCircle className="w-8 h-8 text-yellow-500" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">
            No Active Round Available
          </h3>
          <p className="text-gray-300">
            The next betting round will start soon
          </p>
        </div>


        <div className="bg-[#0a121e] rounded-lg p-4 max-w-md mx-auto border border-gray-800">
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <FiClock className="w-5 h-5 text-[#00ffd5]" />
            {/* Display the current countdown value */}
            <span>Auto-refresh in: <span className="text-[#00ff88] font-medium">{countdown > 0 ? countdown : 0}s</span></span>
          </div>
        </div>

        {/* ... (button and help text remains the same) ... */}
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 rounded-lg shadow-md text-base font-medium text-white bg-gradient-to-r from-[#0066ff] to-[#0052cc] hover:from-[#0052cc] hover:to-[#004099] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 border border-[#0077ff]"
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

          <p className="text-sm text-gray-400">
            You can refresh manually or wait for auto-refresh
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoActiveRound;
// import React, { useEffect, useState } from "react";
// import { FiAlertCircle, FiClock, FiRefreshCw } from "react-icons/fi";

// const NoActiveRound = ({ onRefresh, isLoading }) => {
//   const [countdown, setCountdown] = useState(30);

//   useEffect(() => {
//     if (countdown > 0) {
//       const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [countdown]);

//   return (
//     <div className="bg-gradient-to-r from-[#0d1526] to-[#111c35] border-t-2 border-yellow-500 rounded-xl p-6 shadow-lg mb-6 transition-all duration-300">
//       <div className="text-center space-y-6">
//         <div className="bg-[#09101f] rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
//           <FiAlertCircle className="w-8 h-8 text-yellow-500" />
//         </div>

//         <div className="space-y-2">
//           <h3 className="text-xl font-bold text-white">
//             No Active Round Available
//           </h3>
//           <p className="text-gray-300">
//             The next betting round will start soon
//           </p>
//         </div>

//         <div className="bg-[#0a121e] rounded-lg p-4 max-w-md mx-auto border border-gray-800">
//           <div className="flex items-center justify-center space-x-2 text-gray-300">
//             <FiClock className="w-5 h-5 text-[#00ffd5]" />
//             <span>Auto-refresh in: <span className="text-[#00ff88] font-medium">{countdown}s</span></span>
//           </div>
//         </div>

//         <div className="flex flex-col items-center space-y-4">
//           <button
//             onClick={onRefresh}
//             disabled={isLoading}
//             className="inline-flex items-center px-6 py-3 rounded-lg shadow-md text-base font-medium text-white bg-gradient-to-r from-[#0066ff] to-[#0052cc] hover:from-[#0052cc] hover:to-[#004099] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 border border-[#0077ff]"
//           >
//             {isLoading ? (
//               <>
//                 <FiRefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
//                 Refreshing...
//               </>
//             ) : (
//               <>
//                 <FiRefreshCw className="-ml-1 mr-2 h-5 w-5" />
//                 Refresh Now
//               </>
//             )}
//           </button>

//           <p className="text-sm text-gray-400">
//             You can refresh manually or wait for auto-refresh
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NoActiveRound;

/******************************************************************************************************************************************************************************************************************************************************************************************/
// 
//  // src/components/NoActiveRound.js
// import React, { useEffect, useState } from "react";
// import { FiAlertCircle, FiClock, FiRefreshCw } from "react-icons/fi";

// const NoActiveRound = ({ onRefresh, isLoading }) => {
//   const [countdown, setCountdown] = useState(30);

//   useEffect(() => {
//     if (countdown > 0) {
//       const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [countdown]);

//   return (
//     <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg mb-6 transition-all duration-300">
//       <div className="text-center space-y-6">
//         <div className="bg-yellow-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
//           <FiAlertCircle className="w-8 h-8 text-yellow-500" />
//         </div>

//         <div className="space-y-2">
//           <h3 className="text-xl font-bold text-gray-900">
//             No Active Round Available
//           </h3>
//           <p className="text-gray-600">
//             The next betting round will start soon
//           </p>
//         </div>

//         <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
//           <div className="flex items-center justify-center space-x-2 text-gray-600">
//             <FiClock className="w-5 h-5" />
//             <span>Auto-refresh in: {countdown}s</span>
//           </div>
//         </div>

//         <div className="flex flex-col items-center space-y-4">
//           <button
//             onClick={onRefresh}
//             disabled={isLoading}
//             className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200"
//           >
//             {isLoading ? (
//               <>
//                 <FiRefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
//                 Refreshing...
//               </>
//             ) : (
//               <>
//                 <FiRefreshCw className="-ml-1 mr-2 h-5 w-5" />
//                 Refresh Now
//               </>
//             )}
//           </button>

//           <p className="text-sm text-gray-500">
//             You can refresh manually or wait for auto-refresh
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NoActiveRound;
