// // // src/components/TopWinsBets.js
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTopWins } from "../features/roundSlice";

// Helper function to mask a phone number: show the first 2 digits and the last 3 digits.
const maskPhoneNumber = (phone) => {
  if (!phone) return "Unknown";
  // If the phone number is too short to mask (i.e. less than or equal to 5 digits), return it as is.
  if (phone.length <= 5) return phone;
  
  const firstTwo = phone.slice(0, 2);
  const lastThree = phone.slice(-3);
  // Replace the digits between with asterisks.
  const maskedMiddle = phone.slice(2, phone.length - 3).replace(/./g, "*");
  return firstTwo + maskedMiddle + lastThree;
};

const TopWinsBets = () => {
  const dispatch = useDispatch();
  const { topWins = [], loading, error } = useSelector((state) => state.round);
  const [filter, setFilter] = useState("daily");

  // Memoize filter change handler
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  // Fetch data only when filter changes
  useEffect(() => {
    dispatch(fetchTopWins(filter));
  }, [dispatch, filter]);

  // Memoized date formatter
  const formatDate = useCallback((dateStr) => {
    return new Date(dateStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, []);

  // Filter button component for reusability
  const FilterButton = ({ type, currentFilter, onClick }) => (
    <button
      className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
        currentFilter === type
          ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
      onClick={() => onClick(type)}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 my-6 max-w-2xl mx-auto">
      <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        Top 10 Wins ({filter.charAt(0).toUpperCase() + filter.slice(1)})
      </h3>

      <div className="flex justify-center gap-4 mb-6">
        <FilterButton type="daily" currentFilter={filter} onClick={handleFilterChange} />
        <FilterButton type="weekly" currentFilter={filter} onClick={handleFilterChange} />
        <FilterButton type="monthly" currentFilter={filter} onClick={handleFilterChange} />
      </div>

      {loading ? (
        <p className="text-center text-gray-500 animate-pulse">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600 font-medium">Error: {error}</p>
      ) : topWins.length === 0 ? (
        <p className="text-center text-gray-500">No wins available.</p>
      ) : (
        <ul className="space-y-4">
          {topWins.map((bet, idx) => (
            <li
              key={bet._id || idx}
              className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-blue-600">Rank #{idx + 1}</span>
                <span className="text-xs text-gray-400">{formatDate(bet.createdAt)}</span>
              </div>
              <p className="text-sm">
                <span className="font-medium">User:</span>{" "}
                {bet.user?.name ||
                  (bet.user?.phone && maskPhoneNumber(bet.user.phone)) ||
                  "Unknown"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Won:</span>{" "}
                <span className="text-green-600 font-semibold">Ksh {bet.amountWon.toLocaleString()}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopWinsBets;


// import React, { useEffect, useState, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchTopWins } from "../features/roundSlice";

// const TopWinsBets = () => {
//   const dispatch = useDispatch();
//   const { topWins = [], loading, error } = useSelector((state) => state.round);
//   const [filter, setFilter] = useState("daily");

//   // Memoize filter change handler
//   const handleFilterChange = useCallback((newFilter) => {
//     setFilter(newFilter);
//   }, []);

//   // Fetch data only when filter changes
//   useEffect(() => {
//     dispatch(fetchTopWins(filter));
//   }, [dispatch, filter]);

//   // Memoized date formatter
//   const formatDate = useCallback((dateStr) => {
//     return new Date(dateStr).toLocaleString("en-US", {
//       dateStyle: "medium",
//       timeStyle: "short",
//     });
//   }, []);

//   // Filter button component for reusability
//   const FilterButton = ({ type, currentFilter, onClick }) => (
//     <button
//       className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
//         currentFilter === type
//           ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
//           : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//       }`}
//       onClick={() => onClick(type)}
//     >
//       {type.charAt(0).toUpperCase() + type.slice(1)}
//     </button>
//   );

//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6 my-6 max-w-2xl mx-auto">
//       <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">
//         Top 10 Wins ({filter.charAt(0).toUpperCase() + filter.slice(1)})
//       </h3>

//       <div className="flex justify-center gap-4 mb-6">
//         <FilterButton type="daily" currentFilter={filter} onClick={handleFilterChange} />
//         <FilterButton type="weekly" currentFilter={filter} onClick={handleFilterChange} />
//         <FilterButton type="monthly" currentFilter={filter} onClick={handleFilterChange} />
//       </div>

//       {loading ? (
//         <p className="text-center text-gray-500 animate-pulse">Loading...</p>
//       ) : error ? (
//         <p className="text-center text-red-600 font-medium">Error: {error}</p>
//       ) : topWins.length === 0 ? (
//         <p className="text-center text-gray-500">No wins available.</p>
//       ) : (
//         <ul className="space-y-4">
//           {topWins.map((bet, idx) => (
//             <li
//               key={bet._id || idx}
//               className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-150"
//             >
//               <div className="flex justify-between items-center mb-2">
//                 <span className="font-bold text-blue-600">Rank #{idx + 1}</span>
//                 <span className="text-xs text-gray-400">{formatDate(bet.createdAt)}</span>
//               </div>
//               <p className="text-sm">
//                 <span className="font-medium">User:</span>{" "}
//                 {bet.user?.name || bet.user?.phone || "Unknown"}
//               </p>
//               <p className="text-sm">
//                 <span className="font-medium">Won:</span>{" "}
//                 <span className="text-green-600 font-semibold">Ksh {bet.amountWon.toLocaleString()}</span>
//               </p>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default TopWinsBets;
// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchTopWins } from "../features/roundSlice";

// const TopWinsBets = () => {
//   const dispatch = useDispatch();
//   const { topWins = [], topWinsFilter, loading, error } = useSelector(
//     (state) => state.round
//   );

//   // Local state for filter (defaults to "daily")
//   const [filter, setFilter] = useState("daily");

//   useEffect(() => {
//     dispatch(fetchTopWins(filter));
//   }, [dispatch, filter]);

//   const handleFilterChange = (newFilter) => {
//     setFilter(newFilter);
//   };

//   const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

//   return (
//     <div className="bg-white rounded-lg shadow p-4 my-6">
//       <h3 className="text-xl font-bold mb-4 text-center">
//         Top 10 Wins ({filter.charAt(0).toUpperCase() + filter.slice(1)})
//       </h3>

//       <div className="flex justify-center space-x-4 mb-4">
//         <button
//           className={`px-3 py-1 rounded ${filter === "daily" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
//           onClick={() => handleFilterChange("daily")}
//         >
//           Daily
//         </button>
//         <button
//           className={`px-3 py-1 rounded ${filter === "weekly" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
//           onClick={() => handleFilterChange("weekly")}
//         >
//           Weekly
//         </button>
//         <button
//           className={`px-3 py-1 rounded ${filter === "monthly" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
//           onClick={() => handleFilterChange("monthly")}
//         >
//           Monthly
//         </button>
//       </div>

//       {loading && <p className="text-center">Loading top wins...</p>}
//       {error && <p className="text-center text-red-500">Error: {error}</p>}
//       {!loading && topWins.length === 0 && (
//         <p className="text-center text-gray-600">No top wins found.</p>
//       )}
//       <ul className="space-y-3">
//         {topWins.map((bet, idx) => (
//           <li key={bet._id || idx} className="border p-3 rounded">
//             <div className="flex justify-between mb-1">
//               <span>
//                 <strong>Rank #{idx + 1}</strong>
//               </span>
//               <span className="text-sm text-gray-500">
//                 {formatDate(bet.createdAt)}
//               </span>
//             </div>
//             <p>
//               <strong>User:</strong>{" "}
//               {bet.user && bet.user.name
//                 ? bet.user.name
//                 : bet.user && bet.user.phone
//                 ? bet.user.phone
//                 : "Unknown"}
//             </p>
//             <p>
//               <strong>Amount Won:</strong> Ksh {bet.amountWon}
//             </p>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default TopWinsBets;
