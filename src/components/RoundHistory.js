// src/components/RoundHistory.js
// src/components/RoundHistory.js
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Ably from "ably";
import { updateHistory } from "../features/roundSlice";

const outcomeStyles = {
  heads: "bg-blue-500 hover:bg-blue-600 text-white",
  tails: "bg-green-500 hover:bg-green-600 text-white",
  house: "bg-red-500 hover:bg-red-600 text-white",
};

const RoundItem = React.memo(({ round }) => (
  <div className="relative group transition-all duration-300">
    <div 
      className={`${outcomeStyles[round.outcome]} w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-transform duration-300 group-hover:scale-110`}
    >
      {round.outcome === "house" ? "E" : round.outcome.charAt(0).toUpperCase()}
    </div>
    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
      Round {round.roundNumber}
    </div>
  </div>
));

const RoundHistory = () => {
  const dispatch = useDispatch();
  const { history = [], loading, error } = useSelector((state) => state.round);
  const [isExpanded, setIsExpanded] = useState(false);

  const validHistory = useMemo(
    () => history.filter((round) => ["heads", "tails", "house"].includes(round.outcome)),
    [history]
  );

  useEffect(() => {
    let ablyInstance;
    let channel;

    const setupAbly = async () => {
      try {
        ablyInstance = new Ably.Realtime({
          key: process.env.REACT_APP_ABLY_API_KEY,
          clientId: `round-history-${Date.now()}`,
        });

        await ablyInstance.connection.once("connected");
        channel = ablyInstance.channels.get("round-history");

        channel.subscribe("roundHistoryUpdate", (msg) => {
          dispatch(updateHistory(msg.data));
        });
      } catch (err) {
        console.error("Ably connection failed:", err);
      }
    };

    setupAbly();

    return () => {
      if (channel) channel.unsubscribe();
      if (ablyInstance) ablyInstance.close();
    };
  }, [dispatch]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-xl font-semibold text-gray-800">Round History</h3>
        <svg
          className={`w-6 h-6 text-gray-600 transform transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {loading && (
        <div className="flex justify-center py-6" role="status" aria-live="polite">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
            />
          </svg>
          <span className="sr-only">Loading round history...</span>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-center">
          {error}
        </div>
      )}

      {!loading && !error && isExpanded && (
        <div className="mt-6">
          {validHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No completed rounds yet</p>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-2">
              {validHistory.slice(0, 20).map((round) => (
                <RoundItem key={round._id} round={round} />
              ))}
            </div>
          )}
          {validHistory.length > 20 && (
            <p className="text-center text-gray-500 mt-2 text-sm">
              Showing 20 of {validHistory.length} rounds
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(RoundHistory);

// import React, { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import Ably from "ably";
// import { updateHistory } from "../features/roundSlice";

// const outcomeStyles = {
//   heads: "bg-blue-600 text-white",
//   tails: "bg-green-600 text-white",
//   house: "bg-red-600 text-white",
// };

// const RoundItem = React.memo(({ round }) => (
//   <div className="flex flex-col items-center group relative transition-transform duration-300 hover:scale-105">
//     <div 
//       className={`${outcomeStyles[round.outcome]} w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg`}
//     >
//       {round.outcome === "house" ? "E" : round.outcome.charAt(0).toUpperCase()}
//     </div>
//     <span className="absolute -bottom-6 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//       Round {round.roundNumber}
//     </span>
//   </div>
// ));

// const RoundHistory = () => {
//   const dispatch = useDispatch();
//   const { history = [], loading, error } = useSelector((state) => state.round);
//   const [showDropdown, setShowDropdown] = useState(false);

//   // Filter rounds with valid outcomes
//   const validHistory = useMemo(
//     () =>
//       history.filter((round) =>
//         ["heads", "tails", "house"].includes(round.outcome)
//       ),
//     [history]
//   );

//   // Ably connection setup
//   useEffect(() => {
//     let ablyInstance;
//     let channel;

//     const setupAbly = async () => {
//       try {
//         ablyInstance = new Ably.Realtime({
//           key: process.env.REACT_APP_ABLY_API_KEY,
//           clientId: `round-history-${Date.now()}`,
//         });

//         await ablyInstance.connection.once("connected");
//         channel = ablyInstance.channels.get("round-history");

//         channel.subscribe("roundHistoryUpdate", (msg) => {
//           dispatch(updateHistory(msg.data));
//         });
//       } catch (err) {
//         console.error("Ably connection failed:", err);
//       }
//     };

//     setupAbly();

//     return () => {
//       if (channel) channel.unsubscribe();
//       if (ablyInstance) ablyInstance.close();
//     };
//   }, [dispatch]);

//   return (
//     <section className="my-8 px-4">
//       <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center bg-gradient-to-r from-gray-100 to-gray-200 py-3 rounded-lg shadow-md">
//         Round History
//       </h3>

//       {loading && (
//         <div className="text-center py-4" role="status" aria-live="polite">
//           <svg
//             className="animate-spin h-8 w-8 mx-auto text-blue-500"
//             viewBox="0 0 24 24"
//             aria-hidden="true"
//           >
//             <circle
//               className="opacity-25"
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//               fill="none"
//             />
//             <path
//               className="opacity-75"
//               fill="currentColor"
//               d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
//             />
//           </svg>
//           <span className="sr-only">Loading round history...</span>
//         </div>
//       )}

//       {error && (
//         <p className="text-center text-red-600 bg-red-50 p-3 rounded-lg mb-4">
//           {error}
//         </p>
//       )}

//       {!loading && !error && (
//         <>
//           <div className="flex justify-center mb-4">
//             <button
//               onClick={() => setShowDropdown(!showDropdown)}
//               className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200"
//             >
//               {showDropdown ? "Hide Round History" : "Show Round History"}
//             </button>
//           </div>

//           {showDropdown && (
//             <div className="p-4 border rounded-lg bg-gray-50">
//               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 justify-center">
//                 {validHistory.map((round) => (
//                   <RoundItem key={round._id} round={round} />
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       )}
//     </section>
//   );
// };

// export default React.memo(RoundHistory);


// // src/components/RoundHistory.js
// // src/components/RoundHistory.js
// // src/components/RoundHistory.js
// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import Ably from "ably";
// import { updateHistory } from "../features/roundSlice";

// // Define styles for each outcome.
// const coinStyles = {
//   heads:
//     "bg-blue-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
//   tails:
//     "bg-green-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
//   house:
//     "bg-red-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
// };

// const RoundHistory = () => {
//   const dispatch = useDispatch();
//   const { history, loading, error } = useSelector((state) => state.round);

//   useEffect(() => {
//     console.log("Initializing Ably connection for round history updates...");
//     // IMPORTANT: In production, use token-based authentication.
//     const ably = new Ably.Realtime({ key: process.env.REACT_APP_ABLY_API_KEY });
//     // Subscribe to a dedicated channel (e.g., "round-history")
//     const channel = ably.channels.get("round-history");

//     channel.subscribe("roundHistoryUpdate", (msg) => {
//       console.log("Received roundHistoryUpdate event:", msg.data);
//       dispatch(updateHistory(msg.data));
//     });

//     // Clean up the Ably connection on unmount
//     return () => {
//       channel.unsubscribe();
//       ably.close();
//     };
//   }, [dispatch]);

//   return (
//     <div className="mt-8">
//       <h3 className="text-xl font-semibold mb-4 text-center">Round History</h3>
//       {loading && <p className="text-center">Loading history...</p>}
//       {error && <p className="text-center text-red-600">{error}</p>}
//       <div className="flex flex-wrap justify-center gap-4">
//         {history && history.length > 0 ? (
//           history.map((round) => {
//             // Only display rounds with outcome "heads", "tails", or "house"
//             if (!["heads", "tails", "house"].includes(round.outcome)) {
//               return null;
//             }
//             return (
//               <div key={round._id} className="flex flex-col items-center">
//                 <div className={coinStyles[round.outcome]}>
//                   {round.outcome === "house"
//                     ? "E"
//                     : round.outcome.charAt(0).toUpperCase()}
//                 </div>
//               </div>
//             );
//           })
//         ) : (
//           <p className="text-center">No round history available.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default RoundHistory;


// // src/components/RoundHistory.js
// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import Ably from "ably";
// import { updateHistory } from "../features/roundSlice";

// // You can replace these with your own coin images/icons
// const coinStyles = {
//   heads:
//     "bg-blue-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
//   tails:
//     "bg-green-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
// };

// const RoundHistory = () => {
//   const dispatch = useDispatch();
//   const { history, loading, error } = useSelector((state) => state.round);

//   useEffect(() => {
//     console.log("Initializing Ably connection for round history updates...");
//     // IMPORTANT: In production, use token-based authentication.
//     const ably = new Ably.Realtime({ key: process.env.REACT_APP_ABLY_API_KEY });
//     // Subscribe to a dedicated channel (e.g., "round-history")
//     const channel = ably.channels.get("round-history");

//     channel.subscribe("roundHistoryUpdate", (msg) => {
//       console.log("Received roundHistoryUpdate event:", msg.data);
//       dispatch(updateHistory(msg.data));
//     });

//     // Clean up the Ably connection on unmount
//     return () => {
//       channel.unsubscribe();
//       ably.close();
//     };
//   }, [dispatch]);

//   return (
//     <div className="mt-8">
//       <h3 className="text-xl font-semibold mb-4 text-center">Round History</h3>
//       {loading && <p className="text-center">Loading history...</p>}
//       {error && <p className="text-center text-red-600">{error}</p>}
//       <div className="flex flex-wrap justify-center gap-4">
//         {history && history.length > 0 ? (
//           history.map((round) => {
//             // Only display rounds with outcome 'heads' or 'tails'
//             if (round.outcome !== "heads" && round.outcome !== "tails") {
//               return null;
//             }
//             return (
//               <div key={round._id} className="flex flex-col items-center">
//                 <div className={coinStyles[round.outcome]}>
//                   {round.outcome.charAt(0).toUpperCase()}
//                 </div>
//               </div>
//             );
//           })
//         ) : (
//           <p className="text-center">No round history available.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default RoundHistory;

// // src/components/RoundHistory.js
// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchRoundHistory } from "../features/roundSlice";

// // You can replace these with your own coin images/icons
// const coinStyles = {
//   heads:
//     "bg-blue-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
//   tails:
//     "bg-green-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
// };

// const RoundHistory = () => {
//   const dispatch = useDispatch();
//   const { history, loading, error } = useSelector((state) => state.round);

//   // Automatically fetch round history on mount and every 10 seconds
//   useEffect(() => {
//     // Initial fetch
//     dispatch(fetchRoundHistory());

//     // Set up interval for automatic fetching
//     const intervalId = setInterval(() => {
//       dispatch(fetchRoundHistory());
//     }, 10000); // fetch every 10 seconds

//     // Clean up the interval on component unmount
//     return () => clearInterval(intervalId);
//   }, [dispatch]);

//   return (
//     <div className="mt-8">
//       <h3 className="text-xl font-semibold mb-4 text-center">Round History</h3>
//       {loading && <p className="text-center">Loading history...</p>}
//       {error && <p className="text-center text-red-600">{error}</p>}
//       <div className="flex flex-wrap justify-center gap-4">
//         {history && history.length > 0 ? (
//           history.map((round) => {
//             // Only display rounds with outcome 'heads' or 'tails'
//             if (round.outcome !== "heads" && round.outcome !== "tails") {
//               return null;
//             }
//             return (
//               <div key={round._id} className="flex flex-col items-center">
//                 <div className={coinStyles[round.outcome]}>
//                   {round.outcome.charAt(0).toUpperCase()}
//                 </div>
//               </div>
//             );
//           })
//         ) : (
//           <p className="text-center">No round history available.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default RoundHistory;

// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchRoundHistory } from "../features/roundSlice";

// // You can replace these with your own coin images/icons
// const coinStyles = {
//   heads: "bg-blue-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
//   tails: "bg-green-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
// };

// const RoundHistory = () => {
//   const dispatch = useDispatch();
//   const { history, loading, error } = useSelector((state) => state.round);

//   useEffect(() => {
//     dispatch(fetchRoundHistory());
//   }, [dispatch]);

//   return (
//     <div className="mt-8">
//       <h3 className="text-xl font-semibold mb-4 text-center">Round History</h3>
//       {loading && <p className="text-center">Loading history...</p>}
//       {error && <p className="text-center text-red-600">{error}</p>}
//       <div className="flex flex-wrap justify-center gap-4">
//         {history && history.length > 0 ? (
//           history.map((round) => {
//             // Only display rounds with outcome 'heads' or 'tails'
//             if (round.outcome !== "heads" && round.outcome !== "tails") {
//               return null;
//             }
//             return (
//               <div
//                 key={round._id}
//                 className="flex flex-col items-center"
//               >
//                 <div className={coinStyles[round.outcome]}>
//                   {/* You could replace the text with an SVG or image if desired */}
//                   {round.outcome.charAt(0).toUpperCase()}
//                 </div>
//                 <span className="text-sm mt-1">#{round.roundNumber}</span>
//               </div>
//             );
//           })
//         ) : (
//           <p className="text-center">No round history available.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default RoundHistory;
