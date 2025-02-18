// // src/components/UserBets.js
// src/components/UserBets.js
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserBets } from "../features/roundSlice";

const UserBets = () => {
  const dispatch = useDispatch();
  // Provide default values if not defined
  const { 
    userBets = [], 
    betsPagination = { totalBets: 0, totalPages: 0, currentPage: 1 }, 
    loading, 
    error 
  } = useSelector((state) => state.round);

  useEffect(() => {
    // Use optional chaining or default value to ensure currentPage exists
    dispatch(fetchUserBets(betsPagination?.currentPage || 1));
  }, [dispatch]);

  const handlePageChange = (newPage) => {
    dispatch(fetchUserBets(newPage));
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

  return (
    <div className="bg-gray-50 rounded-lg shadow p-4 my-6">
      <h3 className="text-xl font-bold mb-4 text-center">Your Bet History</h3>
      {loading && <p className="text-center">Loading bets...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}
      {!loading && userBets.length === 0 && (
        <p className="text-center text-gray-600">No bets found.</p>
      )}
      <ul className="space-y-4">
        {userBets.map((bet) => (
          <li key={bet._id} className="border p-3 rounded">
            <div className="flex justify-between mb-1">
              <span>
                <strong>Bet ID:</strong> {bet._id}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(bet.createdAt)}
              </span>
            </div>
            <p>
              <strong>Amount:</strong> Ksh {bet.amount} | <strong>Side:</strong>{" "}
              {bet.side}
            </p>
            <p>
              <strong>Result:</strong>{" "}
              {bet.result ? bet.result : "Pending"}
            </p>
            {/* New line for amount won */}
            <p>
              <strong>Amount Won:</strong> Ksh {bet.amountWon}
            </p>
          </li>
        ))}
      </ul>
      {/* Pagination Controls */}
      <div className="flex justify-center items-center space-x-4 mt-4">
        <button
          disabled={betsPagination.currentPage === 1}
          onClick={() => handlePageChange(betsPagination.currentPage - 1)}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {betsPagination.currentPage} of {betsPagination.totalPages}
        </span>
        <button
          disabled={
            betsPagination.currentPage === betsPagination.totalPages ||
            betsPagination.totalPages === 0
          }
          onClick={() => handlePageChange(betsPagination.currentPage + 1)}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UserBets;

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
