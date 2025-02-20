import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserBets } from "../features/roundSlice";

const UserBets = () => {
  const dispatch = useDispatch();
  const { 
    userBets = [], 
    betsPagination = { totalBets: 0, totalPages: 0, currentPage: 1 }, 
    loading, 
    error 
  } = useSelector((state) => state.round);

  // Fetch bets when currentPage changes
  useEffect(() => {
    dispatch(fetchUserBets(betsPagination.currentPage));
  }, [dispatch, betsPagination.currentPage]);

  // Memoized page change handler
  const handlePageChange = useCallback((newPage) => {
    dispatch(fetchUserBets(newPage));
  }, [dispatch]);

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
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800"
      }`}
    >
      {direction === "prev" ? "Previous" : "Next"}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 my-6 max-w-3xl mx-auto">
      <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        Your Bet History
      </h3>

      {loading ? (
        <p className="text-center text-gray-500 animate-pulse">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600 font-medium">Error: {error}</p>
      ) : userBets.length === 0 ? (
        <p className="text-center text-gray-500">No bets available.</p>
      ) : (
        <ul className="space-y-4">
          {userBets.map((bet) => (
            <li
              key={bet._id}
              className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-blue-600">
                  Bet ID: {bet._id.slice(-6)}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(bet.createdAt)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>
                  <span className="font-medium">Amount:</span>{" "}
                  <span className="text-gray-700">Ksh {bet.amount.toLocaleString()}</span>
                </p>
                <p>
                  <span className="font-medium">Side:</span>{" "}
                  <span className="text-gray-700">{bet.side}</span>
                </p>
                <p>
                  <span className="font-medium">Result:</span>{" "}
                  <span
                    className={`font-semibold ${
                      bet.result === "win"
                        ? "text-green-600"
                        : bet.result === "Pending"
                        ? "text-yellow-600"
                        : bet.result
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {bet.result || "Pending"}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Won:</span>{" "}
                  <span className="text-green-600 font-semibold">
                    Ksh {(bet.amountWon || 0).toLocaleString()}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {betsPagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-6">
          <PaginationButton
            direction="prev"
            disabled={betsPagination.currentPage === 1}
            onClick={() => handlePageChange(betsPagination.currentPage - 1)}
          />
          <span className="text-gray-600 font-medium">
            Page {betsPagination.currentPage} of {betsPagination.totalPages} 
            <span className="text-sm"> ({betsPagination.totalBets} bets)</span>
          </span>
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
