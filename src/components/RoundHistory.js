// // // // src/components/RoundHistory.js
// src/components/RoundHistory.js
// src/components/RoundHistory.js
// src/components/RoundHistory.js
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Ably from "ably";
import { updateHistory } from "../features/roundSlice";

// Define styles for each outcome.
const coinStyles = {
  heads:
    "bg-blue-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
  tails:
    "bg-green-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
  house:
    "bg-red-500 text-white font-bold p-2 rounded-full w-12 h-12 flex items-center justify-center",
};

const RoundHistory = () => {
  const dispatch = useDispatch();
  const { history, loading, error } = useSelector((state) => state.round);

  useEffect(() => {
    console.log("Initializing Ably connection for round history updates...");
    // IMPORTANT: In production, use token-based authentication.
    const ably = new Ably.Realtime({ key: process.env.REACT_APP_ABLY_API_KEY });
    // Subscribe to a dedicated channel (e.g., "round-history")
    const channel = ably.channels.get("round-history");

    channel.subscribe("roundHistoryUpdate", (msg) => {
      console.log("Received roundHistoryUpdate event:", msg.data);
      dispatch(updateHistory(msg.data));
    });

    // Clean up the Ably connection on unmount
    return () => {
      channel.unsubscribe();
      ably.close();
    };
  }, [dispatch]);

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4 text-center">Round History</h3>
      {loading && <p className="text-center">Loading history...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}
      <div className="flex flex-wrap justify-center gap-4">
        {history && history.length > 0 ? (
          history.map((round) => {
            // Only display rounds with outcome "heads", "tails", or "house"
            if (!["heads", "tails", "house"].includes(round.outcome)) {
              return null;
            }
            return (
              <div key={round._id} className="flex flex-col items-center">
                <div className={coinStyles[round.outcome]}>
                  {round.outcome === "house"
                    ? "E"
                    : round.outcome.charAt(0).toUpperCase()}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center">No round history available.</p>
        )}
      </div>
    </div>
  );
};

export default RoundHistory;


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
