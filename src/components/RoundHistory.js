
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Ably from "ably";
import { updateHistory } from "../features/roundSlice";
import { ChevronDown, ChevronUp, Clock, AlertCircle, RefreshCw } from "lucide-react";

// Enhanced outcome styles with more vibrant colors and better contrast
const outcomeStyles = {
  heads: {
    bg: "bg-emerald-600",
    hover: "hover:bg-emerald-500",
    text: "text-white",
    border: "border-emerald-400",
    icon: "H"
  },
  tails: {
    bg: "bg-blue-600",
    hover: "hover:bg-blue-500",
    text: "text-white",
    border: "border-blue-400",
    icon: "T"
  },
  house: {
    bg: "bg-amber-500",
    hover: "hover:bg-amber-400",
    text: "text-gray-900",
    border: "border-amber-300",
    icon: "J"
  }
};

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
};


// Enhanced round item with better visual feedback
const RoundItem = React.memo(({ round }) => {
  const style = outcomeStyles[round.outcome];
  
  return (
    <div className="relative group w-[50px]">
      <div 
        className={`${style.bg} ${style.hover} ${style.text} w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shadow-lg transition-all duration-300 group-hover:scale-110 border-2 ${style.border}`}
      >
        {style.icon}
      </div>
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-gray-700">
        Round {round.roundNumber}
      </div>
    </div>
  );
});

// Legend component to explain the outcome colors
const OutcomeLegend = () => (
  <div className="flex space-x-3 mt-2 justify-center text-xs text-gray-400">
    {Object.entries(outcomeStyles).map(([key, style]) => (
      <div key={key} className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${style.bg} mr-1`}></div>
        <span className="capitalize">{key}</span>
      </div>
    ))}
  </div>
);

const RoundHistory = () => {
  const dispatch = useDispatch();
  const { history = [], loading, error } = useSelector((state) => state.round);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile(); // 👈 detect mobile
  const displayCount = isMobile ? 7: 20;

  const validHistory = useMemo(
    () => history.filter((round) => ["heads", "tails", "house"].includes(round.outcome)),
    [history]
  );

  

  // Sort by newest first to show latest results
  const sortedHistory = useMemo(() => 
    [...validHistory].sort((a, b) => b.roundNumber - a.roundNumber),
    [validHistory]
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
          setIsAnimating(true);
          dispatch(updateHistory(msg.data));
          setTimeout(() => setIsAnimating(false), 1000);
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

  // Show only the latest 10 rounds when not expanded
  // const displayedRounds = isExpanded ? sortedHistory : sortedHistory.slice(0, 10);
  const displayedRounds = isExpanded ? sortedHistory : sortedHistory.slice(0, displayCount);

  return (
    <div className={`bg-gray-900 rounded-xl shadow-xl p-3 border border-gray-800 transition-all duration-300 ${isAnimating ? 'bg-gray-800' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-green-400 mr-2" />
          <h3 className="text-xl font-bold text-white">Round History</h3>
        </div>
        
        {validHistory.length > 0 && (
          <div className="flex items-center">
            <span className="text-green-400 text-sm font-medium px-3 py-1 bg-gray-800 rounded-full border border-gray-700 shadow-inner">
              {validHistory.length} {validHistory.length === 1 ? 'round' : 'rounds'}
            </span>
          </div>
        )}
      </div>
      
      <OutcomeLegend />
    
      {loading && (
        <div className="flex flex-col items-center justify-center py-10" role="status" aria-live="polite">
          <RefreshCw className="animate-spin h-10 w-10 text-green-500 mb-2" />
          <span className="text-gray-400 text-sm mt-2">Loading round history...</span>
        </div>
      )}
    
      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 text-red-400 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
          
        </div>
      )}
    
      {!loading && !error && (
        <div className="mt-2">
          {validHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-8 border border-dashed border-gray-800 rounded-lg">
              <p className="mb-2">No completed rounds yet</p>
              <p className="text-sm text-gray-500">Results will appear here after rounds finish</p>
            </div>
          ) : (
            <div>
              <div classNa me=" overflow-hidden md:overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className={`flex flex-row  pl-0.5 justify-start gap-1.5 overflow-hidden ${isExpanded&& "flex-wrap justify-center gap-3"}`}>
                  {displayedRounds.map((round) => (
                    <RoundItem key={round._id} round={round} />
                  ))}
                </div>
              </div>
              
              {validHistory.length > 5 && (
                <div className="flex justify-center mt-6 md:hidden">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-all duration-200 text-sm font-medium border border-gray-700 shadow-md"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        {/* Show all {validHistory.length} rounds */}
                        Show more rounds


                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(RoundHistory);
/************************************************************************************************************************************* ************************************************************************************************************************************** ************************************************************************************************************************************** */


// import React, { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import Ably from "ably";
// import { updateHistory } from "../features/roundSlice";
// import { ChevronDown, ChevronUp, Clock, AlertCircle, RefreshCw } from "lucide-react";

// // Enhanced outcome styles with more vibrant colors and better contrast
// const outcomeStyles = {
//   heads: {
//     bg: "bg-emerald-600",
//     hover: "hover:bg-emerald-500",
//     text: "text-white",
//     border: "border-emerald-400",
//     icon: "H"
//   },
//   tails: {
//     bg: "bg-blue-600",
//     hover: "hover:bg-blue-500",
//     text: "text-white",
//     border: "border-blue-400",
//     icon: "T"
//   },
//   jackpot: {
//     bg: "bg-amber-500",
//     hover: "hover:bg-amber-400",
//     text: "text-gray-900",
//     border: "border-amber-300",
//     icon: "J"
//   }
// };

// const useIsMobile = (breakpoint = 768) => {
//   const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth < breakpoint);
//     };

//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, [breakpoint]);

//   return isMobile;
// };


// // Enhanced round item with better visual feedback
// const RoundItem = React.memo(({ round }) => {
//   const style = outcomeStyles[round.outcome];
  
//   return (
//     <div className="relative group w-[50px]">
//       <div 
//         className={`${style.bg} ${style.hover} ${style.text} w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shadow-lg transition-all duration-300 group-hover:scale-110 border-2 ${style.border}`}
//       >
//         {style.icon}
//       </div>
//       <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-gray-700">
//         Round {round.roundNumber}
//       </div>
//     </div>
//   );
// });

// // Legend component to explain the outcome colors
// const OutcomeLegend = () => (
//   <div className="flex space-x-3 mt-2 justify-center text-xs text-gray-400">
//     {Object.entries(outcomeStyles).map(([key, style]) => (
//       <div key={key} className="flex items-center">
//         <div className={`w-3 h-3 rounded-full ${style.bg} mr-1`}></div>
//         <span className="capitalize">{key}</span>
//       </div>
//     ))}
//   </div>
// );

// const RoundHistory = () => {
//   const dispatch = useDispatch();
//   const { history = [], loading, error } = useSelector((state) => state.round);
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [isAnimating, setIsAnimating] = useState(false);
//   const isMobile = useIsMobile(); // 👈 detect mobile
//   const displayCount = isMobile ? 7: 20;

//   const validHistory = useMemo(
//     () => history.filter((round) => ["heads", "tails", "jackpot"].includes(round.outcome)),
//     [history]
//   );

  

//   // Sort by newest first to show latest results
//   const sortedHistory = useMemo(() => 
//     [...validHistory].sort((a, b) => b.roundNumber - a.roundNumber),
//     [validHistory]
//   );

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
//           setIsAnimating(true);
//           dispatch(updateHistory(msg.data));
//           setTimeout(() => setIsAnimating(false), 1000);
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

//   // Show only the latest 10 rounds when not expanded
//   // const displayedRounds = isExpanded ? sortedHistory : sortedHistory.slice(0, 10);
//   const displayedRounds = isExpanded ? sortedHistory : sortedHistory.slice(0, displayCount);

//   return (
//     <div className={`bg-gray-900 rounded-xl shadow-xl p-3 border border-gray-800 transition-all duration-300 ${isAnimating ? 'bg-gray-800' : ''}`}>
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center">
//           <Clock className="w-5 h-5 text-green-400 mr-2" />
//           <h3 className="text-xl font-bold text-white">Round History</h3>
//         </div>
        
//         {validHistory.length > 0 && (
//           <div className="flex items-center">
//             <span className="text-green-400 text-sm font-medium px-3 py-1 bg-gray-800 rounded-full border border-gray-700 shadow-inner">
//               {validHistory.length} {validHistory.length === 1 ? 'round' : 'rounds'}
//             </span>
//           </div>
//         )}
//       </div>
      
//       <OutcomeLegend />
    
//       {loading && (
//         <div className="flex flex-col items-center justify-center py-10" role="status" aria-live="polite">
//           <RefreshCw className="animate-spin h-10 w-10 text-green-500 mb-2" />
//           <span className="text-gray-400 text-sm mt-2">Loading round history...</span>
//         </div>
//       )}
    
//       {error && (
//         <div className="mt-4 bg-red-900/30 border border-red-800 text-red-400 p-4 rounded-lg flex items-center">
//           <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
//           <p>{error}</p>
          
//         </div>
//       )}
    
//       {!loading && !error && (
//         <div className="mt-2">
//           {validHistory.length === 0 ? (
//             <div className="text-center text-gray-400 py-8 border border-dashed border-gray-800 rounded-lg">
//               <p className="mb-2">No completed rounds yet</p>
//               <p className="text-sm text-gray-500">Results will appear here after rounds finish</p>
//             </div>
//           ) : (
//             <div>
              
//               <div classNa me=" overflow-hidden md:overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
//                 <div className={`flex flex-row  pl-0.5 ]  justify-center gap-1.5 overflow-hidden md:overflow-visible ${isExpanded&& "flex-wrap justify-center gap-3"}`}>
//                   {displayedRounds.map((round) => (
//                     <RoundItem key={round._id} round={round} />
//                   ))}
//                 </div>
//               </div>
              
//               {validHistory.length > 5 && (
//                 <div className="flex justify-center mt-6 md:hidden">
//                   <button
//                     onClick={() => setIsExpanded(!isExpanded)}
//                     className="flex items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-all duration-200 text-sm font-medium border border-gray-700 shadow-md"
//                   >
//                     {isExpanded ? (
//                       <>
//                         <ChevronUp className="w-4 h-4 mr-1" />
//                         Show less
//                       </>
//                     ) : (
//                       <>
//                         <ChevronDown className="w-4 h-4 mr-1" />
//                         {/* Show all {validHistory.length} rounds */}
//                         Show more rounds


//                       </>
//                     )}
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default React.memo(RoundHistory);
/************************************************************************************************************************************* ************************************************************************************************************************************** ************************************************************************************************************************************** */

// src/components/RoundHistory.js
// import React, { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import Ably from "ably";
// import { updateHistory } from "../features/roundSlice";

// // Updated outcome styles to match the dark theme
// const outcomeStyles = {
//   heads: "bg-green-500 hover:bg-green-600 text-white",
//   tails: "bg-blue-500 hover:bg-blue-600 text-white",
//   house: "bg-yellow-500 hover:bg-yellow-600 text-black",
// };

// const RoundItem = React.memo(({ round }) => (
//   <div className="relative group transition-all duration-300">
//     <div 
//       className={`${outcomeStyles[round.outcome]} w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-transform duration-300 group-hover:scale-110`}
//     >
//       {round.outcome === "house" ? "E" : round.outcome.charAt(0).toUpperCase()}
//     </div>
//     <div className="absolute top-10 left-5 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
//       Round {round.roundNumber}
//     </div>
//   </div>
// ));

// const RoundHistory = () => {
//   const dispatch = useDispatch();
//   const { history = [], loading, error } = useSelector((state) => state.round);
//   const [isExpanded, setIsExpanded] = useState(false);

//   const validHistory = useMemo(
//     () => history.filter((round) => ["heads", "tails", "house"].includes(round.outcome)),
//     [history]
//   );

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
//     <div className="bg-gray-900 rounded-xl shadow-lg p-4 border border-gray-800 transition-all duration-300">
//       <div className="flex justify-between items-center">
//         <h3 className="text-xl font-semibold text-white">Round History</h3>
//         {validHistory.length > 0 && (
//           <span className="text-green-400 text-xs font-medium px-2 py-1 bg-gray-800 rounded-full">
//             {validHistory.length} rounds
//           </span>
//         )}
//       </div>
    
//       {loading && (
//         <div className="flex justify-center py-6" role="status" aria-live="polite">
//           <svg
//             className="animate-spin h-8 w-8 text-green-500"
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
//         <div className="mt-4 bg-red-900/30 border border-red-800 text-red-400 p-3 rounded-lg text-center">
//           {error}
//         </div>
//       )}
    
//       {!loading && !error && (
//         <div className="mt-4">
//           {validHistory.length === 0 ? (
//             <p className="text-center text-gray-400 py-4">No completed rounds yet</p>
//           ) : (
//             <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
//               <div className="flex md:flex-wrap gap-3 min-w-max md:min-w-0">
//                 {(isExpanded ? validHistory : validHistory.slice(0, 7)).map((round) => (
//                   <RoundItem key={round._id} round={round} className="flex-shrink-0" />
//                 ))}
//               </div>
//               {validHistory.length > 8 && !isExpanded && (
//                 <button
//                   onClick={() => setIsExpanded(true)}
//                   className="mt-3 text-green-400 hover:text-green-300 text-sm flex items-center transition-colors duration-200"
//                 >
//                   Show more
//                   <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
//                   </svg>
//                 </button>
//               )}
//               {isExpanded && (
//                 <button
//                   onClick={() => setIsExpanded(false)}
//                   className="mt-3 text-green-400 hover:text-green-300 text-sm flex items-center transition-colors duration-200"
//                 >
//                   Show less
//                   <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
//                   </svg>
//                 </button>
//               )}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default React.memo(RoundHistory);


/************************************************************************************************************************************* */



// // src/components/RoundHistory.js
// // src/components/RoundHistory.js
// import React, { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import Ably from "ably";
// import { updateHistory } from "../features/roundSlice";

// const outcomeStyles = {
//   heads: "bg-blue-500 hover:bg-blue-600 text-white",
//   tails: "bg-green-500 hover:bg-green-600 text-white",
//   house: "bg-red-500 hover:bg-red-600 text-white",
// };

// const RoundItem = React.memo(({ round }) => (
//   <div className="relative group transition-all duration-300">
//     <div 
//       className={`${outcomeStyles[round.outcome]} w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-transform duration-300 group-hover:scale-110`}
//     >
//       {round.outcome === "house" ? "E" : round.outcome.charAt(0).toUpperCase()}
//     </div>
//     <div className="absolute top-4 left-4 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
//       Round {round.roundNumber}
//     </div>
//   </div>
// ));

// const RoundHistory = () => {
//   const dispatch = useDispatch();
//   const { history = [], loading, error } = useSelector((state) => state.round);
//   const [isExpanded, setIsExpanded] = useState(false);

//   const validHistory = useMemo(
//     () => history.filter((round) => ["heads", "tails", "house"].includes(round.outcome)),
//     [history]
//   );

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
//     <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300">
//     <div className="flex justify-between items-center">
//       <h3 className="text-xl font-semibold text-gray-800">Round History</h3>
//     </div>
  
//     {loading && (
//       <div className="flex justify-center py-6" role="status" aria-live="polite">
//         <svg
//           className="animate-spin h-8 w-8 text-blue-500"
//           viewBox="0 0 24 24"
//           aria-hidden="true"
//         >
//           <circle
//             className="opacity-25"
//             cx="12"
//             cy="12"
//             r="10"
//             stroke="currentColor"
//             strokeWidth="4"
//             fill="none"
//           />
//           <path
//             className="opacity-75"
//             fill="currentColor"
//             d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
//           />
//         </svg>
//         <span className="sr-only">Loading round history...</span>
//       </div>
//     )}
  
//     {error && (
//       <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-center">
//         {error}
//       </div>
//     )}
  
//     {!loading && !error && (
//       <div className="mt-6">
//         {validHistory.length === 0 ? (
//           <p className="text-center text-gray-500 py-4">No completed rounds yet</p>
//         ) : (
//           <div className="overflow-x-auto pb-2">
//             <div className="flex md:flex-wrap gap-3 min-w-max md:min-w-0">
//               {validHistory.slice(0, 7).map((round) => (
//                 <RoundItem key={round._id} round={round} className="flex-shrink-0" />
//               ))}
//               {validHistory.length > 7 && (
//                 <div className="hidden md:flex md:flex-wrap gap-3">
//                   {validHistory.slice(7).map((round) => (
//                     <RoundItem key={round._id} round={round} />
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     )}
//   </div>
//   );
// };

// export default React.memo(RoundHistory);


/************************************************************************************************************************************************* */

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
