/////////**************************************************************************************************************************************************** */
import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserBets } from "../features/roundSlice";

const UserBets = () => {
  const dispatch = useDispatch();
  const {
    userBets = [],
    betsPagination = { totalBets: 0, totalPages: 0, currentPage: 1 },
    loading,
    error,
  } = useSelector((state) => state.round);

  // Fetch bets when currentPage changes
  useEffect(() => {
    dispatch(fetchUserBets(betsPagination.currentPage));
  }, [dispatch, betsPagination.currentPage]);

  // Memoized page change handler
  const handlePageChange = useCallback(
    (newPage) => {
      dispatch(fetchUserBets(newPage));
    },
    [dispatch]
  );

  // Memoized date formatter
  const formatDate = useCallback((dateStr) => {
    return new Date(dateStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, []);

  // Pagination Button component for reusability
  const PaginationButton = ({ direction, disabled, onClick }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        disabled
          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
          : direction === "prev"
          ? "bg-[#2d1e21] text-[#ff5c5c] hover:bg-[#3d2629] border border-[#ff5c5c] hover:shadow-[0_0_12px_rgba(255,92,92,0.4)]"
          : "bg-[#1b3a3d] text-[#00ff88] hover:bg-[#264a4d] border border-[#00ff88] hover:shadow-[0_0_12px_rgba(0,255,136,0.4)]"
      }`}>
      {direction === "prev" ? "← Previous" : "Next →"}
    </button>
  );

  return (
    <div className="bg-gray-900 text-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-6 my-8 max-w-3xl mx-auto border border-gray-800 relative">
      {/* Decorative header accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5cffc1]  to-[#30ebc3] rounded-t-xl"></div>

      <h3 className="text-2xl font-semibold mb-6 text-center">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5cffe4] to-[#00ff88]">
          Your Bet History
        </span>
      </h3>

      {loading ? (
        <div className="text-center py-12">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-t-[#00ff88] border-r-[#ff5c5c] border-b-[#00ff88] border-l-[#ff5c5c] animate-spin"></div>
          </div>
          <p className="text-gray-400">Loading your bets...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 px-4 bg-[#2d1e21] border border-[#ff5c5c] rounded-lg shadow-[0_0_15px_rgba(255,92,92,0.2)]">
          <p className="text-[#ff5c5c] font-medium">Error: {error}</p>
        </div>
      ) : userBets.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700 shadow-inner">
          <div className="inline-block p-4 rounded-full bg-gray-700 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="mb-2 text-gray-300 font-medium">No bets available.</p>
          <p className="text-sm text-gray-400">
            Place your first bet to see your history!
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {userBets.map((bet) => (
            // For a single bet item within the UserBets component


            // For a single bet item within the UserBets component

<li
  key={bet._id}
  className="relative bg-gray-800 p-5 rounded-lg transition-all duration-200 shadow-[0_5px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] border border-gray-700 overflow-hidden"
>
  {/* Side indicator border - left for tails, right for heads */}
  <div 
    className={`absolute top-0 bottom-0 w-1.5 ${
      bet.side.toLowerCase() === "heads" 
        ? "right-0" 
        : "left-0"
    }`}
    style={{
      background: bet.side.toLowerCase() === "heads" 
        ? 'linear-gradient(to bottom, #00ff88, #00ff88)' 
        : 'linear-gradient(to bottom, #ff8a00, #ff8a00)'
    }}
  />
  
  <div className="flex justify-between items-center mb-4">
    <span className="font-bold text-lg text-gray-200">
      Bet <span className="text-[#00ff88]">#{bet._id.slice(-6)}</span>
    </span>
    <span className="text-xs text-gray-300 bg-gray-700 px-3 py-1.5 rounded-full shadow-inner">
      {formatDate(bet.createdAt)}
    </span>
  </div>
  
  <div className="grid grid-cols-2 gap-4 text-sm">
    <div className="bg-gray-750 bg-opacity-60 p-3 rounded-lg shadow-inner">
      <div className="flex items-center space-x-2">
        <span className="font-medium text-gray-400">Amount:</span>
        <span className="text-white font-semibold">Ksh {bet.amount.toLocaleString()}</span>
      </div>
    </div>
    
    <div className="bg-gray-750 bg-opacity-60 p-3 rounded-lg shadow-inner">
      <div className="flex items-center space-x-2">
        <span className="font-medium text-gray-400">Side:</span>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          bet.side.toLowerCase() === "heads" 
            ? "bg-[#1b3a3d] text-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.3)]" 
            : "bg-[#3a2a1b] text-[#ff8a00] shadow-[0_0_8px_rgba(255,138,0,0.3)]"
        }`}>
          {bet.side}
        </span>
      </div>
    </div>
    
    <div className="bg-gray-750 bg-opacity-60 p-3 rounded-lg shadow-inner">
      <div className="flex items-center space-x-2">
        <span className="font-medium text-gray-400">Result:</span>
        {/* Highlighted result area with stronger visual emphasis */}
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-bold ring-2 ring-offset-1 ring-offset-gray-800 ${
            bet.result === "win"
              ? "bg-green-900 text-green-400 ring-green-500 shadow-[0_0_12px_rgba(74,222,128,0.4)]"
              : bet.result === "Pending"
              ? "bg-yellow-900 text-yellow-400 ring-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.4)]"
              : bet.result === "loss"
              ? "bg-red-900 text-red-400 ring-red-500 shadow-[0_0_12px_rgba(248,113,113,0.4)]"
              : "bg-gray-700 text-gray-400 ring-gray-600"
          }`}
        >
          {bet.result || "Pending"}
        </span>
      </div>
    </div>
    
    <div className="bg-gray-750 bg-opacity-60 p-3 rounded-lg shadow-inner">
      <div className="flex items-center space-x-2">
        <span className="font-medium text-gray-400">Won:</span>
        <span className={`font-bold ${bet.amountWon > 0 ? "text-[#00ff88]" : "text-gray-400"}`}>
          Ksh {(bet.amountWon || 0).toLocaleString()}
        </span>
      </div>
    </div>
  </div>
</li>

            // <li
            //   key={bet._id}
            //   className={`border-x p-5 rounded-lg transition-all duration-200 shadow-[0_5px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] ${
            //     bet.side.toLowerCase() === "heads"
            //       ? "border-l-[4px] border-gradient-to-br from-[#00ff88] to-[#00d9ff]"
            //       : "border-r-[4px] border-gradient-to-r from-[#ff8a00] to-[#00ff88]"
            //   }`}
            //   style={{
            //     background: "linear-gradient(to bottom, #1c1c24, #262631)",
            //     borderImageSlice: 1,
            //     borderImageSource:
            //       bet.side.toLowerCase() === "heads"
            //         ? "linear-gradient(to right, #00ff88, #00d9ff)"
            //         : "linear-gradient(to right, #ff8a00, #00ff88)",
            //   }}>
            //   <div className="flex justify-between items-center mb-4">
            //     <span className="font-bold text-lg text-gray-200">
            //       Bet{" "}
            //       <span className="text-[#00ff88]">#{bet._id.slice(-6)}</span>
            //     </span>
            //     <span className="text-xs text-gray-300 bg-gray-700 px-3 py-1.5 rounded-full shadow-inner">
            //       {formatDate(bet.createdAt)}
            //     </span>
            //   </div>

            //   <div className="grid grid-cols-2 gap-4 text-sm">
            //     <div className="bg-gray-800 bg-opacity-60 p-3 rounded-lg shadow-inner">
            //       <div className="flex items-center space-x-2">
            //         <span className="font-medium text-gray-400">Amount:</span>
            //         <span className="text-white font-semibold">
            //           Ksh {bet.amount.toLocaleString()}
            //         </span>
            //       </div>
            //     </div>

            //     <div className="bg-gray-800 bg-opacity-60 p-3 rounded-lg shadow-inner">
            //       <div className="flex items-center space-x-2">
            //         <span className="font-medium text-gray-400">Side:</span>
            //         <span
            //           className={`px-3 py-1 rounded-full text-xs font-medium ${
            //             bet.side.toLowerCase() === "heads"
            //               ? "bg-[#1b3a3d] text-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.3)]"
            //               : "bg-[#3a2a1b] text-[#ff8a00] shadow-[0_0_8px_rgba(255,138,0,0.3)]"
            //           }`}>
            //           {bet.side}
            //         </span>
            //       </div>
            //     </div>

            //     <div className="bg-gray-800 bg-opacity-60 p-3 rounded-lg shadow-inner">
            //       <div className="flex items-center space-x-2">
            //         <span className="font-medium text-gray-400">Result:</span>
            //         {/* Highlighted result area with stronger visual emphasis */}
            //         <span
            //           className={`px-3 py-1.5 rounded-full text-xs font-bold ring-2 ring-offset-2 ring-offset-gray-800 ${
            //             bet.result === "win"
            //               ? "bg-green-900 text-green-400 ring-green-500 shadow-[0_0_12px_rgba(74,222,128,0.4)]"
            //               : bet.result === "Pending"
            //               ? "bg-yellow-900 text-yellow-400 ring-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.4)]"
            //               : bet.result === "loss"
            //               ? "bg-red-900 text-red-400 ring-red-500 shadow-[0_0_12px_rgba(248,113,113,0.4)]"
            //               : "bg-gray-700 text-gray-400 ring-gray-600"
            //           }`}>
            //           {bet.result || "Pending"}
            //         </span>
            //       </div>
            //     </div>

            //     <div className="bg-gray-800 bg-opacity-60 p-3 rounded-lg shadow-inner">
            //       <div className="flex items-center space-x-2">
            //         <span className="font-medium text-gray-400">Won:</span>
            //         <span
            //           className={`font-bold ${
            //             bet.amountWon > 0 ? "text-[#00ff88]" : "text-gray-400"
            //           }`}>
            //           Ksh {(bet.amountWon || 0).toLocaleString()}
            //         </span>
            //       </div>
            //     </div>
            //   </div>
            // </li>

            // <li
            //   key={bet._id}
            //   className="border border-gray-700 bg-gray-800 p-5 rounded-lg hover:bg-gray-750 transition-all duration-200 shadow-[0_5px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:translate-y-[-2px]"
            // >
            //   <div className="flex justify-between items-center mb-4">
            //     <span className="font-bold text-lg">
            //       <span className="text-[#ff5c5c]">Bet</span>
            //       <span className="text-[#00ff88]"> #{bet._id.slice(-6)}</span>
            //     </span>
            //     <span className="text-xs text-gray-300 bg-gray-700 px-3 py-1.5 rounded-full shadow-inner">
            //       {formatDate(bet.createdAt)}
            //     </span>
            //   </div>
            //   <div className="grid grid-cols-2 gap-4 text-sm">
            //     <div className="bg-gray-750 p-3 rounded-lg shadow-inner">
            //       <div className="flex items-center space-x-2">
            //         <span className="font-medium text-gray-400">Amount:</span>
            //         <span className="text-white font-semibold">Ksh {bet.amount.toLocaleString()}</span>
            //       </div>
            //     </div>
            //     <div className="bg-gray-750 p-3 rounded-lg shadow-inner">
            //       <div className="flex items-center space-x-2">
            //         <span className="font-medium text-gray-400">Side:</span>
            //         <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            //           bet.side.toLowerCase() === "heads"
            //             ? "bg-[#1b3a3d] text-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.3)]"
            //             : "bg-[#2d1e21] text-[#ff5c5c] shadow-[0_0_8px_rgba(255,92,92,0.3)]"
            //         }`}>
            //           {bet.side}
            //         </span>
            //       </div>
            //     </div>
            //     <div className="bg-gray-750 p-3 rounded-lg shadow-inner">
            //       <div className="flex items-center space-x-2">
            //         <span className="font-medium text-gray-400">Result:</span>
            //         <span
            //           className={`px-3 py-1 rounded-full text-xs font-medium ${
            //             bet.result === "win"
            //               ? "bg-green-900 text-green-400 shadow-[0_0_8px_rgba(74,222,128,0.2)]"
            //               : bet.result === "Pending"
            //               ? "bg-yellow-900 text-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.2)]"
            //               : bet.result
            //               ? "bg-[#2d1e21] text-[#ff5c5c] shadow-[0_0_8px_rgba(255,92,92,0.2)]"
            //               : "bg-gray-700 text-gray-400"
            //           }`}
            //         >
            //           {bet.result || "Pending"}
            //         </span>
            //       </div>
            //     </div>
            //     <div className="bg-gray-750 p-3 rounded-lg shadow-inner">
            //       <div className="flex items-center space-x-2">
            //         <span className="font-medium text-gray-400">Won:</span>
            //         <span className={`font-bold ${bet.amountWon > 0 ? "text-[#00ff88]" : "text-gray-400"}`}>
            //           Ksh {(bet.amountWon || 0).toLocaleString()}
            //         </span>
            //       </div>
            //     </div>
            //   </div>
            // </li>
          ))}
        </ul>
      )}

      {betsPagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-8 bg-gradient-to-r from-[#1b2428] via-gray-800 to-[#1b2428] p-4 rounded-lg border border-gray-700 shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
          <PaginationButton
            direction="prev"
            disabled={betsPagination.currentPage === 1}
            onClick={() => handlePageChange(betsPagination.currentPage - 1)}
          />
          <div className="text-center">
            <span className="text-gray-300 font-medium block">
              Page {betsPagination.currentPage} of {betsPagination.totalPages}
            </span>
            <span className="text-xs text-gray-400 block mt-1">
              {betsPagination.totalBets} total bets
            </span>
          </div>
          <PaginationButton
            direction="next"
            disabled={betsPagination.currentPage === betsPagination.totalPages}
            onClick={() => handlePageChange(betsPagination.currentPage + 1)}
          />
        </div>
      )}
    </div>
  );
};

export default UserBets;

///******************************************************************************************************************************** */
// import React, { useEffect, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchUserBets } from "../features/roundSlice";

// const UserBets = () => {
//   const dispatch = useDispatch();
//   const {
//     userBets = [],
//     betsPagination = { totalBets: 0, totalPages: 0, currentPage: 1 },
//     loading,
//     error
//   } = useSelector((state) => state.round);

//   // Fetch bets when currentPage changes
//   useEffect(() => {
//     dispatch(fetchUserBets(betsPagination.currentPage));
//   }, [dispatch, betsPagination.currentPage]);

//   // Memoized page change handler
//   const handlePageChange = useCallback((newPage) => {
//     dispatch(fetchUserBets(newPage));
//   }, [dispatch]);

//   // Memoized date formatter
//   const formatDate = useCallback((dateStr) => {
//     return new Date(dateStr).toLocaleString("en-US", {
//       dateStyle: "medium",
//       timeStyle: "short",
//     });
//   }, []);

//   // Pagination Button component for reusability
//   const PaginationButton = ({ direction, disabled, onClick }) => (
//     <button
//       disabled={disabled}
//       onClick={onClick}
//       className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
//         disabled
//           ? "bg-gray-700 text-gray-500 cursor-not-allowed"
//           : direction === "prev"
//             ? "bg-[#3d1b1b8a] text-[#ff5f5f] hover:bg-gray-700 border border-[#ff5f5f] hover:shadow-[0_0_10px_#ff5f5f60]"
//             : "bg-[#1b3a3d8a] text-[#00ff88] hover:bg-gray-700 border border-[#00ff88] hover:shadow-[0_0_10px_#00ff8860]"
//       }`}
//     >
//       {direction === "prev" ? "Previous" : "Next"}
//     </button>
//   );

//   return (
//     <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6 my-6 max-w-3xl mx-auto border border-gray-800 relative overflow-hidden">
//       {/* Decorative accent elements */}
//       <div className="absolute -top-10 -right-10 w-20 h-20 bg-red-500 opacity-20 rounded-full blur-xl"></div>
//       <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-green-500 opacity-20 rounded-full blur-xl"></div>

//       <div className="relative z-10">
//         <div className="flex items-center justify-center mb-6">
//           <div className="h-px w-16 bg-red-500 mr-4"></div>
//           <h3 className="text-2xl font-semibold text-white">
//             Your Bet <span className="text-[#ff5f5f]">History</span>
//           </h3>
//           <div className="h-px w-16 bg-[#00ff88] ml-4"></div>
//         </div>

//         {loading ? (
//           <div className="text-center py-10">
//             <div className="w-12 h-12 mx-auto mb-4 relative">
//               <div className="absolute inset-0 rounded-full border-2 border-t-[#00ff88] border-r-[#ff5f5f] border-b-[#00ff88] border-l-[#ff5f5f] animate-spin"></div>
//             </div>
//             <p className="text-gray-400">Loading your bets...</p>
//           </div>
//         ) : error ? (
//           <div className="text-center py-10 px-4">
//             <div className="w-16 h-16 mx-auto mb-4 text-red-500">
//               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <circle cx="12" cy="12" r="10"></circle>
//                 <path d="M15 9l-6 6M9 9l6 6"></path>
//               </svg>
//             </div>
//             <p className="text-red-400 font-medium">Error: {error}</p>
//           </div>
//         ) : userBets.length === 0 ? (
//           <div className="text-center py-10 text-gray-400 border border-dashed border-gray-700 rounded-lg bg-gray-800 bg-opacity-50">
//             <div className="w-16 h-16 mx-auto mb-4 text-gray-500">
//               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M19 9l-7 7-7-7"></path>
//               </svg>
//             </div>
//             <p className="mb-2">No bets available yet.</p>
//             <p className="text-sm">Place your first bet to see your history!</p>
//             <button className="mt-4 px-6 py-2 bg-[#3d1b1b8a] text-[#ff5f5f] rounded-full border border-[#ff5f5f] hover:shadow-[0_0_10px_#ff5f5f60] transition-all duration-200">
//               Place a Bet
//             </button>
//           </div>
//         ) : (
//           <ul className="space-y-4">
//             {userBets.map((bet, index) => (
//               <li
//                 key={bet._id}
//                 className="border border-gray-700 bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition-all duration-200 hover:shadow-md group relative overflow-hidden"
//               >
//                 {/* Decorative side accent */}
//                 <div className={`absolute top-0 left-0 h-full w-1 ${index % 2 === 0 ? 'bg-[#00ff88]' : 'bg-[#ff5f5f]'}`}></div>

//                 <div className="ml-2">
//                   <div className="flex justify-between items-center mb-3">
//                     <span className={`font-semibold ${index % 2 === 0 ? 'text-[#00ff88]' : 'text-[#ff5f5f]'}`}>
//                       Bet #{bet._id.slice(-6)}
//                     </span>
//                     <span className="text-xs text-gray-300 bg-gray-700 px-3 py-1 rounded-full flex items-center">
//                       <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <circle cx="12" cy="12" r="10"></circle>
//                         <path d="M12 6v6l4 2"></path>
//                       </svg>
//                       {formatDate(bet.createdAt)}
//                     </span>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4 text-sm">
//                     <div className="bg-gray-750 p-3 rounded-lg">
//                       <div className="flex items-center mb-1">
//                         <svg className="w-4 h-4 mr-2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                           <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>
//                         </svg>
//                         <span className="font-medium text-gray-400">Amount</span>
//                       </div>
//                       <span className="text-white font-semibold">Ksh {bet.amount.toLocaleString()}</span>
//                     </div>

//                     <div className="bg-gray-750 p-3 rounded-lg">
//                       <div className="flex items-center mb-1">
//                         <svg className="w-4 h-4 mr-2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                           <circle cx="12" cy="12" r="10"></circle>
//                           <path d="M12 8v4M12 16h.01"></path>
//                         </svg>
//                         <span className="font-medium text-gray-400">Side</span>
//                       </div>
//                       <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
//                         bet.side.toLowerCase() === "heads"
//                           ? "bg-[#1b3a3d8a] text-[#00ff88] border border-[#00ff8860]"
//                           : "bg-[#3d1b1b8a] text-[#ff5f5f] border border-[#ff5f5f60]"
//                       }`}>
//                         {bet.side}
//                       </span>
//                     </div>

//                     <div className="bg-gray-750 p-3 rounded-lg">
//                       <div className="flex items-center mb-1">
//                         <svg className="w-4 h-4 mr-2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                           <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
//                           <path d="M22 4L12 14.01l-3-3"></path>
//                         </svg>
//                         <span className="font-medium text-gray-400">Result</span>
//                       </div>
//                       <span
//                         className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
//                           bet.result === "win"
//                             ? "bg-green-900 text-green-400 border border-green-700"
//                             : bet.result === "Pending"
//                             ? "bg-yellow-900 text-yellow-400 border border-yellow-700"
//                             : bet.result
//                             ? "bg-[#3d1b1b8a] text-[#ff5f5f] border border-[#ff5f5f60]"
//                             : "bg-gray-700 text-gray-400 border border-gray-600"
//                         }`}
//                       >
//                         {bet.result || "Pending"}
//                       </span>
//                     </div>

//                     <div className="bg-gray-750 p-3 rounded-lg">
//                       <div className="flex items-center mb-1">
//                         <svg className="w-4 h-4 mr-2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                           <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v16m-8-8h16"></path>
//                         </svg>
//                         <span className="font-medium text-gray-400">Won</span>
//                       </div>
//                       <span className={`font-semibold ${bet.amountWon > 0 ? "text-[#00ff88]" : "text-gray-400"}`}>
//                         Ksh {(bet.amountWon || 0).toLocaleString()}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}

//         {betsPagination.totalPages > 1 && (
//           <div className="flex justify-between items-center mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700 relative overflow-hidden">
//             {/* Subtle gradient background */}
//             <div className="absolute inset-0 bg-gradient-to-r from-[#1b3a3d20] to-[#3d1b1b20] opacity-50"></div>

//             <div className="relative z-10 flex justify-between items-center w-full">
//               <PaginationButton
//                 direction="prev"
//                 disabled={betsPagination.currentPage === 1}
//                 onClick={() => handlePageChange(betsPagination.currentPage - 1)}
//               />

//               <div className="flex flex-col items-center">
//                 <span className="text-gray-300 font-medium flex items-center">
//                   <span className="text-[#ff5f5f] mr-1">{betsPagination.currentPage}</span>
//                   <span className="mx-1">/</span>
//                   <span className="text-[#00ff88]">{betsPagination.totalPages}</span>
//                 </span>
//                 <span className="text-xs text-gray-400 mt-1">
//                   ({betsPagination.totalBets} total bets)
//                 </span>
//               </div>

//               <PaginationButton
//                 direction="next"
//                 disabled={betsPagination.currentPage === betsPagination.totalPages}
//                 onClick={() => handlePageChange(betsPagination.currentPage + 1)}
//               />
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UserBets;

////********************************************************************************************************************************************** */

// import React, { useEffect, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchUserBets } from "../features/roundSlice";

// const UserBets = () => {
//   const dispatch = useDispatch();
//   const {
//     userBets = [],
//     betsPagination = { totalBets: 0, totalPages: 0, currentPage: 1 },
//     loading,
//     error
//   } = useSelector((state) => state.round);

//   // Fetch bets when currentPage changes
//   useEffect(() => {
//     dispatch(fetchUserBets(betsPagination.currentPage));
//   }, [dispatch, betsPagination.currentPage]);

//   // Memoized page change handler
//   const handlePageChange = useCallback((newPage) => {
//     dispatch(fetchUserBets(newPage));
//   }, [dispatch]);

//   // Memoized date formatter
//   const formatDate = useCallback((dateStr) => {
//     return new Date(dateStr).toLocaleString("en-US", {
//       dateStyle: "medium",
//       timeStyle: "short",
//     });
//   }, []);

//   // Pagination Button component for reusability
//   const PaginationButton = ({ direction, disabled, onClick }) => (
//     <button
//       disabled={disabled}
//       onClick={onClick}
//       className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
//         disabled
//           ? "bg-gray-700 text-gray-500 cursor-not-allowed"
//           : "bg-[#1b3a3d8a] text-[#00ff88] hover:bg-gray-700 border border-[#00ff88] hover:shadow-[0_0_10px_#00ff8860]"
//       }`}
//     >
//       {direction === "prev" ? "Previous" : "Next"}
//     </button>
//   );

//   return (
//     <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6 my-6 max-w-3xl mx-auto border border-gray-800">
//       <h3 className="text-2xl font-semibold mb-6 text-center text-[#00ff88]">
//         Your Bet History
//       </h3>

//       {loading ? (
//         <div className="text-center py-10">
//           <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-[#00ff88]" viewBox="0 0 24 24">
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
//           </svg>
//           <p className="text-gray-400">Loading your bets...</p>
//         </div>
//       ) : error ? (
//         <p className="text-center text-red-400 font-medium py-10">Error: {error}</p>
//       ) : userBets.length === 0 ? (
//         <div className="text-center py-10 text-gray-400">
//           <p className="mb-2">No bets available.</p>
//           <p className="text-sm">Place your first bet to see your history!</p>
//         </div>
//       ) : (
//         <ul className="space-y-4">
//           {userBets.map((bet) => (
//             <li
//               key={bet._id}
//               className="border border-gray-700 bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition-colors duration-150"
//             >
//               <div className="flex justify-between items-center mb-3">
//                 <span className="font-semibold text-[#00ff88]">
//                   Bet #{bet._id.slice(-6)}
//                 </span>
//                 <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
//                   {formatDate(bet.createdAt)}
//                 </span>
//               </div>
//               <div className="grid grid-cols-2 gap-3 text-sm">
//                 <div className="flex items-center space-x-2">
//                   <span className="font-medium text-gray-400">Amount:</span>
//                   <span className="text-white">Ksh {bet.amount.toLocaleString()}</span>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <span className="font-medium text-gray-400">Side:</span>
//                   <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                     bet.side.toLowerCase() === "heads"
//                       ? "bg-[#1b3a3d8a] text-[#00ff88]"
//                       : "bg-gray-700 text-gray-300"
//                   }`}>
//                     {bet.side}
//                   </span>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <span className="font-medium text-gray-400">Result:</span>
//                   <span
//                     className={`px-3 py-1 rounded-full text-xs font-medium ${
//                       bet.result === "win"
//                         ? "bg-green-900 text-green-400"
//                         : bet.result === "Pending"
//                         ? "bg-yellow-900 text-yellow-400"
//                         : bet.result
//                         ? "bg-red-900 text-red-400"
//                         : "bg-gray-700 text-gray-400"
//                     }`}
//                   >
//                     {bet.result || "Pending"}
//                   </span>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <span className="font-medium text-gray-400">Won:</span>
//                   <span className={`font-semibold ${bet.amountWon > 0 ? "text-[#00ff88]" : "text-gray-400"}`}>
//                     Ksh {(bet.amountWon || 0).toLocaleString()}
//                   </span>
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}

//       {betsPagination.totalPages > 1 && (
//         <div className="flex justify-between items-center mt-6 bg-gray-800 p-3 rounded-lg border border-gray-700">
//           <PaginationButton
//             direction="prev"
//             disabled={betsPagination.currentPage === 1}
//             onClick={() => handlePageChange(betsPagination.currentPage - 1)}
//           />
//           <span className="text-gray-300 font-medium">
//             Page {betsPagination.currentPage} of {betsPagination.totalPages}
//             <span className="text-sm text-gray-400 ml-2">({betsPagination.totalBets} bets)</span>
//           </span>
//           <PaginationButton
//             direction="next"
//             disabled={betsPagination.currentPage === betsPagination.totalPages}
//             onClick={() => handlePageChange(betsPagination.currentPage + 1)}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default UserBets;

// /************************************************************************************************************** */
// import React, { useEffect, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchUserBets } from "../features/roundSlice";

// const UserBets = () => {
//   const dispatch = useDispatch();
//   const {
//     userBets = [],
//     betsPagination = { totalBets: 0, totalPages: 0, currentPage: 1 },
//     loading,
//     error
//   } = useSelector((state) => state.round);

//   // Fetch bets when currentPage changes
//   useEffect(() => {
//     dispatch(fetchUserBets(betsPagination.currentPage));
//   }, [dispatch, betsPagination.currentPage]);

//   // Memoized page change handler
//   const handlePageChange = useCallback((newPage) => {
//     dispatch(fetchUserBets(newPage));
//   }, [dispatch]);

//   // Memoized date formatter
//   const formatDate = useCallback((dateStr) => {
//     return new Date(dateStr).toLocaleString("en-US", {
//       dateStyle: "medium",
//       timeStyle: "short",
//     });
//   }, []);

//   // Pagination Button component for reusability
//   const PaginationButton = ({ direction, disabled, onClick }) => (
//     <button
//       disabled={disabled}
//       onClick={onClick}
//       className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
//         disabled
//           ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//           : "bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800"
//       }`}
//     >
//       {direction === "prev" ? "Previous" : "Next"}
//     </button>
//   );

//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6 my-6 max-w-3xl mx-auto">
//       <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">
//         Your Bet History
//       </h3>

//       {loading ? (
//         <p className="text-center text-gray-500 animate-pulse">Loading...</p>
//       ) : error ? (
//         <p className="text-center text-red-600 font-medium">Error: {error}</p>
//       ) : userBets.length === 0 ? (
//         <p className="text-center text-gray-500">No bets available.</p>
//       ) : (
//         <ul className="space-y-4">
//           {userBets.map((bet) => (
//             <li
//               key={bet._id}
//               className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-150"
//             >
//               <div className="flex justify-between items-center mb-2">
//                 <span className="font-semibold text-blue-600">
//                   Bet ID: {bet._id.slice(-6)}
//                 </span>
//                 <span className="text-xs text-gray-400">
//                   {formatDate(bet.createdAt)}
//                 </span>
//               </div>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <p>
//                   <span className="font-medium">Amount:</span>{" "}
//                   <span className="text-gray-700">Ksh {bet.amount.toLocaleString()}</span>
//                 </p>
//                 <p>
//                   <span className="font-medium">Side:</span>{" "}
//                   <span className="text-gray-700">{bet.side}</span>
//                 </p>
//                 <p>
//                   <span className="font-medium">Result:</span>{" "}
//                   <span
//                     className={`font-semibold ${
//                       bet.result === "win"
//                         ? "text-green-600"
//                         : bet.result === "Pending"
//                         ? "text-yellow-600"
//                         : bet.result
//                         ? "text-red-600"
//                         : "text-gray-500"
//                     }`}
//                   >
//                     {bet.result || "Pending"}
//                   </span>
//                 </p>
//                 <p>
//                   <span className="font-medium">Won:</span>{" "}
//                   <span className="text-green-600 font-semibold">
//                     Ksh {(bet.amountWon || 0).toLocaleString()}
//                   </span>
//                 </p>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}

//       {betsPagination.totalPages > 1 && (
//         <div className="flex justify-center items-center gap-6 mt-6">
//           <PaginationButton
//             direction="prev"
//             disabled={betsPagination.currentPage === 1}
//             onClick={() => handlePageChange(betsPagination.currentPage - 1)}
//           />
//           <span className="text-gray-600 font-medium">
//             Page {betsPagination.currentPage} of {betsPagination.totalPages}
//             <span className="text-sm"> ({betsPagination.totalBets} bets)</span>
//           </span>
//           <PaginationButton
//             direction="next"
//             disabled={betsPagination.currentPage === betsPagination.totalPages}
//             onClick={() => handlePageChange(betsPagination.currentPage + 1)}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default UserBets;

/***************************************************************************************************************** */

// // src/components/UserBets.js
// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchUserBets } from "../features/roundSlice";

// const UserBets = () => {
//   const dispatch = useDispatch();
//   // Provide default values if not defined
//   const {
//     userBets = [],
//     betsPagination = { totalBets: 0, totalPages: 0, currentPage: 1 },
//     loading,
//     error
//   } = useSelector((state) => state.round);

//   useEffect(() => {
//     // Use optional chaining or default value to ensure currentPage exists
//     dispatch(fetchUserBets(betsPagination?.currentPage || 1));
//   }, [dispatch]);

//   const handlePageChange = (newPage) => {
//     dispatch(fetchUserBets(newPage));
//   };

//   const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

//   return (
//     <div className="bg-gray-50 rounded-lg shadow p-4 my-6">
//       <h3 className="text-xl font-bold mb-4 text-center">Your Bet History</h3>
//       {loading && <p className="text-center">Loading bets...</p>}
//       {error && <p className="text-center text-red-500">Error: {error}</p>}
//       {!loading && userBets.length === 0 && (
//         <p className="text-center text-gray-600">No bets found.</p>
//       )}
//       <ul className="space-y-4">
//         {userBets.map((bet) => (
//           <li key={bet._id} className="border p-3 rounded">
//             <div className="flex justify-between mb-1">
//               <span>
//                 <strong>Bet ID:</strong> {bet._id}
//               </span>
//               <span className="text-sm text-gray-500">
//                 {formatDate(bet.createdAt)}
//               </span>
//             </div>
//             <p>
//               <strong>Amount:</strong> Ksh {bet.amount} | <strong>Side:</strong>{" "}
//               {bet.side}
//             </p>
//             <p>
//               <strong>Result:</strong>{" "}
//               {bet.result ? bet.result : "Pending"}
//             </p>
//             {/* New line for amount won */}
//             <p>
//               <strong>Amount Won:</strong> Ksh {bet.amountWon}
//             </p>
//           </li>
//         ))}
//       </ul>
//       {/* Pagination Controls */}
//       <div className="flex justify-center items-center space-x-4 mt-4">
//         <button
//           disabled={betsPagination.currentPage === 1}
//           onClick={() => handlePageChange(betsPagination.currentPage - 1)}
//           className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
//         >
//           Prev
//         </button>
//         <span>
//           Page {betsPagination.currentPage} of {betsPagination.totalPages}
//         </span>
//         <button
//           disabled={
//             betsPagination.currentPage === betsPagination.totalPages ||
//             betsPagination.totalPages === 0
//           }
//           onClick={() => handlePageChange(betsPagination.currentPage + 1)}
//           className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// };

// export default UserBets;

// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchUserBets } from "../features/roundSlice";

// const UserBets = () => {
//   const dispatch = useDispatch();
//   // Provide default values if not defined
//   const {
//     userBets = [],
//     betsPagination = { totalBets: 0, totalPages: 0, currentPage: 1 },
//     loading,
//     error
//   } = useSelector((state) => state.round);

//   useEffect(() => {
//     // Use optional chaining or default value to ensure currentPage exists
//     dispatch(fetchUserBets(betsPagination?.currentPage || 1));
//   }, [dispatch]);

//   const handlePageChange = (newPage) => {
//     dispatch(fetchUserBets(newPage));
//   };

//   const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

//   return (
//     <div className="bg-gray-50 rounded-lg shadow p-4 my-6">
//       <h3 className="text-xl font-bold mb-4 text-center">Your Bet History</h3>
//       {loading && <p className="text-center">Loading bets...</p>}
//       {error && <p className="text-center text-red-500">Error: {error}</p>}
//       {!loading && userBets.length === 0 && (
//         <p className="text-center text-gray-600">No bets found.</p>
//       )}
//       <ul className="space-y-4">
//         {userBets.map((bet) => (
//           <li key={bet._id} className="border p-3 rounded">
//             <div className="flex justify-between mb-1">
//               <span>
//                 <strong>Bet ID:</strong> {bet._id}
//               </span>
//               <span className="text-sm text-gray-500">
//                 {formatDate(bet.createdAt)}
//               </span>
//             </div>
//             <p>
//               <strong>Amount:</strong> Ksh {bet.amount} | <strong>Side:</strong>{" "}
//               {bet.side}
//             </p>
//             <p>
//               <strong>Result:</strong>{" "}
//               {bet.result ? bet.result : "Pending"}
//             </p>
//           </li>
//         ))}
//       </ul>
//       {/* Pagination Controls */}
//       <div className="flex justify-center items-center space-x-4 mt-4">
//         <button
//           disabled={betsPagination.currentPage === 1}
//           onClick={() => handlePageChange(betsPagination.currentPage - 1)}
//           className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
//         >
//           Prev
//         </button>
//         <span>
//           Page {betsPagination.currentPage} of {betsPagination.totalPages}
//         </span>
//         <button
//           disabled={
//             betsPagination.currentPage === betsPagination.totalPages ||
//             betsPagination.totalPages === 0
//           }
//           onClick={() => handlePageChange(betsPagination.currentPage + 1)}
//           className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// };

// export default UserBets;
