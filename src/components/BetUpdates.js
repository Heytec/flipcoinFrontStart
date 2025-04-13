
import React, {  useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Constant for currency symbol
const CURRENCY_SYMBOL = "Ksh ";

// Utility to mask phone number
const maskPhoneNumber = (phone) => {
  if (!phone) return "N/A";
  const strPhone = String(phone);
  return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
};

const BetItem = React.memo(({ bet, index, animationDelay, isWinner }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Control sequential appearance
  useEffect(() => {
    const appearTimer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay);

    return () => {
      clearTimeout(appearTimer);
    };
  }, [animationDelay]);

  if (!isVisible) return null;

  // Regular bet display (as in Image 1)
  if (!isWinner) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.4,
          type: "spring",
          stiffness: 100,
        }}
        className="flex flex-col items-center justify-center">
        <motion.div className="flex flex-col items-center justify-center text-center bg-gray-800 rounded-full p-2 w-10 h-10 border border-gray-700">
          <div className="font-medium text-xs text-green-400">
            {CURRENCY_SYMBOL}
            {Number(bet.betAmount).toFixed(0)}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Winner display (as in Image 2)
  return null; // Not used in single bet items when showing winners
});

const BetSection = React.memo(
  ({ title, bets, isWinnerSide, winningSide, playerCount, side }) => {
    const containerRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const [visibleBets, setVisibleBets] = useState([]);

    // Check screen size
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768); // md breakpoint
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);

      return () => {
        window.removeEventListener("resize", checkMobile);
      };
    }, []);

    // Update visible bets - show all available bets in mobile view
    useEffect(() => {
      if (bets.length > 0) {
        setVisibleBets(bets);
      } else {
        setVisibleBets([]);
      }
    }, [bets]);

    // Determine if this section is showing the winning side
    const showWinner = isWinnerSide && winningSide;

    // Define colors based on side (for desktop view)
    const sideColor = side === "heads" ? "red-500" : "green-500";
    const bgColor = side === "heads" ? "red-500/10" : "green-500/10";
    const borderColor = side === "heads" ? "red-500/20" : "green-500/20";

    // Define the label text (Heads/Tails)
    const sideLabel = side === "heads" ? "Heads" : "Tails";

    return (
      <div
        className={`rounded-lg shadow-md p-3 flex-1 ${
          showWinner ? "bg-gray-800" : ""
        } 
      md:p-0 md:rounded-none md:shadow-none ${isMobile ? "" : ""}`}>
        {/* Mobile view header */}
        <div className="flex items-center justify-between mb-2 md:hidden">
          <h4 className="text-base font-semibold text-white">
            {playerCount} {playerCount === 1 ? "Player" : "Players"}
          </h4>
        </div>

        {/* Desktop view header */}
        <div className={`hidden md:flex md:flex-col md:h-full`}>
          {/* Top section with icon and label */}
          <div className="hidden md:flex md:flex-col md:items-center md:justify-center md:p-2">
            <div
              className={`flex items-center justify-center rounded-full w-12 h-12 ${
                side === "heads" ? "bg-green-500" : "bg-blue-500"
              } mb-2`}>
              <span className="text-white text-xl font-bold">
                {side === "heads" ? "H" : "T"}
              </span>
            </div>
            <span
              className={`font-medium ${
                side === "heads" ? "text-green-500" : "text-blue-500"
              }`}>
              {sideLabel}
            </span>
          </div>

          {/* Player count and amount section */}
          <div
            className={`hidden md:block md:w-full md:py-2 md:px-3 bg-${bgColor} border-b border-${borderColor}`}>
            <div className="flex justify-between items-center">
              <span className="text-white">Players {playerCount}</span>
              <span className="text-white">
                {CURRENCY_SYMBOL}
                {bets
                  .reduce((sum, bet) => sum + Number(bet.betAmount), 0)
                  .toFixed(0)}
              </span>
            </div>
          </div>

          {/* Header labels section */}
          {/* <div className="hidden md:flex md:justify-between md:items-center md:p-2 md:border-b md:border-gray-700">
            <span className="text-white">Players</span>
            <span className="text-white">Bet</span>
          </div> */}
        </div>

        {bets.length > 0 ? (
          <div
            ref={containerRef}
            className="w-full">
            {/* Mobile view content */}
            <div className="md:hidden">
              {showWinner ? (
                // Winner display (as in Image 2)
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                  }}
                  className="w-full bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
                  <div className="font-bold text-sm text-green-400 mb-1">
                    {playerCount} {playerCount === 1 ? "WINNER" : "WINNERS"}
                  </div>
                  <div className="font-medium text-lg text-green-400">
                    {CURRENCY_SYMBOL}
                    {bets[0]?.winAmount || bets[0]?.betAmount || "0"}
                  </div>
                </motion.div>
              ) : (
              
                <div className="flex items-center justify-start gap-2 overflow-hidden flex-nowrap">
                  {visibleBets.map((bet, index) => (
                    <BetItem
                      key={bet.betId || `${bet.side}-${index}`}
                      bet={bet}
                      index={index}
                      isWinner={false}
                      animationDelay={index * 100}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop view content - user list like in Image 3 */}
            <div className="hidden md:block">
              {bets.map((bet, index) => (
                <div
                  key={bet.betId || `${bet.side}-${index}`}
                  className="flex justify-between items-center p-2 bg-gray-800 rounded-md my-1 mx-2">
                  <div className="flex items-center gap-2">
                    <div className="text-green-400 font-medium">
                      #{index + 1}
                    </div>
                    <div className="text-gray-400">
                      {bet.user
                        ? maskPhoneNumber(bet.user)
                        : maskPhoneNumber(
                            "254" + Math.floor(Math.random() * 900000 + 100000)
                          )}
                    </div>
                  </div>
                  <div className="text-green-400 font-medium">
                    Ksh {Number(bet.betAmount).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-3">
            <p className="text-xs text-gray-400 text-center">0 Players</p>
          </div>
        )}
      </div>
    );
  }
);

// Main BetUpdates component
const BetUpdates = React.memo(
  ({
    headBets = [],
    tailBets = [],
    currentRound = {},
    isResultsIn = false,
    winningSide = null,
  }) => {
    const [isMobile, setIsMobile] = useState(false);
    const noBets = headBets.length === 0 && tailBets.length === 0;

    // Check if we're on mobile
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);

      return () => {
        window.removeEventListener("resize", checkMobile);
      };
    }, []);

    return (
      <section className="h-auto w-full shadow-xl rounded-xl  ">
        {noBets ? (
          <p className="text-sm text-gray-400 text-center py-3 bg-gray-900 rounded-lg border border-gray-800 shadow-md">
            No bets have been placed yet
          </p>
        ) : (
          <div
            className={`w-full grid grid-cols-1 gap-2 md:gap-0 ${
              isMobile ? "" : ""
            }`}>
            {/* The bet sections */}
            <div className="grid grid-cols-2  md:grid-cols-2 gap-2">
              <div className=" border-r-2 border-green-600 md:border-r md:border-gray-700">
                <BetSection
                  title="Heads Bets"
                  bets={headBets}
                  isWinnerSide={isResultsIn}
                  winningSide={winningSide === "heads"}
                  playerCount={headBets.length}
                  side="heads"
                />
              </div>
              <div>
                <BetSection
                  title="Tails Bets"
                  bets={tailBets}
                  isWinnerSide={isResultsIn}
                  winningSide={winningSide === "tails"}
                  playerCount={tailBets.length}
                  side="tails"
                />
              </div>
            </div>
          </div>
        )}
      </section>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Return true if the component should NOT re-render

    // Check if result state has changed
    if (
      prevProps.isResultsIn !== nextProps.isResultsIn ||
      prevProps.winningSide !== nextProps.winningSide
    ) {
      return false; // Re-render if results state changed
    }

    // Check if currentRound has changed
    if (prevProps.currentRound?.id !== nextProps.currentRound?.id) {
      return false; // Re-render if round ID changed
    }

    // Check if the bets arrays have changed
    const headBetsChanged =
      prevProps.headBets.length !== nextProps.headBets.length ||
      JSON.stringify(prevProps.headBets) !== JSON.stringify(nextProps.headBets);

    const tailBetsChanged =
      prevProps.tailBets.length !== nextProps.tailBets.length ||
      JSON.stringify(prevProps.tailBets) !== JSON.stringify(nextProps.tailBets);

    if (headBetsChanged || tailBetsChanged) {
      return false; // Re-render if bets changed
    }

    return true; // Don't re-render otherwise
  }
);

// Example usage with sample data that matches Image 3


export default BetUpdates;

// //////******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************* */
// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "$";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay, isWinner }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if we're on mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     return () => {
//       clearTimeout(appearTimer);
//     };
//   }, [animationDelay]);

//   if (!isVisible) return null;

//   // Regular bet display (as in Image 1)
//   if (!isWinner) {
//     return (
//       <motion.div
//         initial={{ opacity: 0, scale: 0.8 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{
//           duration: 0.4,
//           type: "spring",
//           stiffness: 100,
//         }}
//         className="flex flex-col items-center justify-center"
//       >
//         <motion.div
//           className="flex flex-col items-center justify-center text-center bg-gray-800 rounded-full p-2 w-10 h-10 border border-gray-700"
//         >
//           <div className="font-medium text-xs text-green-400">
//             {CURRENCY_SYMBOL}{Number(bet.betAmount).toFixed(0)}
//           </div>
//         </motion.div>
//       </motion.div>
//     );
//   }

//   // Winner display (as in Image 2)
//   return null; // Not used in single bet items when showing winners
// });

// const BetSection = React.memo(({ title, bets, isWinnerSide, winningSide, playerCount, side }) => {
//   const containerRef = useRef(null);
//   const [isMobile, setIsMobile] = useState(false);
//   const [visibleBets, setVisibleBets] = useState([]);
//   const [maxItems, setMaxItems] = useState(5);

//   // Check screen size
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Calculate how many bets can fit in one row for mobile
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current) return;

//       const containerWidth = containerRef.current.offsetWidth;
//       // Each item is about 50px wide with margins on mobile
//       const itemWidth = 50;
//       const calculatedMaxItems = Math.floor(containerWidth / itemWidth);

//       // For mobile: calculate based on container width
//       // For desktop: show up to 7 items
//       setMaxItems(isMobile
//         ? Math.max(1, Math.min(calculatedMaxItems, 5))
//         : 7);
//     };

//     calculateVisibleItems();
//     window.addEventListener("resize", calculateVisibleItems);

//     return () => {
//       window.removeEventListener("resize", calculateVisibleItems);
//     };
//   }, [isMobile]);

//   // Update visible bets when maxItems changes
//   useEffect(() => {
//     if (bets.length > 0) {
//       setVisibleBets(bets.slice(0, maxItems));
//     } else {
//       setVisibleBets([]);
//     }
//   }, [bets, maxItems]);

//   // Determine if this section is showing the winning side
//   const showWinner = isWinnerSide && winningSide;

//   // Define colors based on side (for desktop view)
//   const sideColor = side === 'heads' ? 'red-500' : 'green-500';
//   const bgColor = side === 'heads' ? 'red-500/10' : 'green-500/10';
//   const borderColor = side === 'heads' ? 'red-500/20' : 'green-500/20';

//   // Define the label text (Heads/Tails)
//   const sideLabel = side === 'heads' ? 'Heads' : 'Tails';

//   return (
//     <div className={`rounded-lg shadow-md p-3 flex-1 ${showWinner ? 'bg-gray-800' : ''}
//       md:p-0 md:rounded-none md:shadow-none ${isMobile ? '' : ''}`}>
//       {/* Mobile view header */}
//       <div className="flex items-center justify-between mb-2 md:hidden">
//         <h4 className="text-base font-semibold text-white">
//           {playerCount} {playerCount === 1 ? "Player" : "Players"}
//         </h4>
//       </div>

//       {/* Desktop view header */}
//       <div className={`hidden md:flex md:flex-col md:h-full`}>
//         {/* Top section with icon and label */}
//         <div className={`hidden md:flex md:items-center md:justify-center md:flex-col md:p-2`}>
//           <div className={`flex items-center justify-center rounded-full w-12 h-12 bg-${sideColor} mb-2`}>
//             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
//               {side === 'heads' ? (
//                 <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
//               ) : (
//                 <path fillRule="evenodd" d="M10 17a1 1 0 01-1-1V5.414L5.707 8.707a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L11 5.414V16a1 1 0 01-1 1z" clipRule="evenodd" />
//               )}
//             </svg>
//           </div>
//           <span className={`text-${sideColor} font-medium`}>{sideLabel}</span>
//         </div>

//         {/* Player count and amount section */}
//         <div className={`hidden md:block md:w-full md:py-2 md:px-3 bg-${bgColor} border-b border-${borderColor}`}>
//           <div className="flex justify-between items-center">
//             <span className="text-white">Players {playerCount}</span>
//             <span className="text-white">${bets.length > 0 ? Number(bets[0]?.betAmount).toFixed(0) : '0'}</span>
//           </div>
//         </div>

//         {/* Header labels section */}
//         <div className="hidden md:flex md:justify-between md:items-center md:p-2 md:border-b md:border-gray-700">
//           <span className="text-white">Players</span>
//           <span className="text-white">Bet</span>
//         </div>
//       </div>

//       {bets.length > 0 ? (
//         <div ref={containerRef} className="w-full">
//           {/* Mobile view content */}
//           <div className="md:hidden">
//             {showWinner ? (
//               // Winner display (as in Image 2)
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.95 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{
//                   duration: 0.6,
//                   type: "spring",
//                   stiffness: 100,
//                 }}
//                 className="w-full bg-gray-800 rounded-lg p-3 border border-gray-700 text-center"
//               >
//                 <div className="font-bold text-sm text-green-400 mb-1">
//                   {playerCount} {playerCount === 1 ? "WINNER" : "WINNERS"}
//                 </div>
//                 <div className="font-medium text-lg text-green-400">
//                   {CURRENCY_SYMBOL}{bets[0]?.winAmount || bets[0]?.betAmount || "0"}
//                 </div>
//               </motion.div>
//             ) : (
//               // Regular bet display (as in Image 1) - multiple items in a row
//               <div className="flex items-center justify-center gap-2 flex-wrap">
//                 {visibleBets.map((bet, index) => (
//                   <BetItem
//                     key={bet.betId || `${bet.side}-${index}`}
//                     bet={bet}
//                     index={index}
//                     isWinner={false}
//                     animationDelay={index * 100}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Desktop view content - user list */}
//           <div className="hidden md:block">
//             {bets.slice(0, 7).map((bet, index) => (
//               <div
//                 key={bet.betId || `${bet.side}-${index}`}
//                 className={`flex justify-between items-center p-2 bg-gray-800/50 rounded-md my-1 mx-2`}
//               >
//                 <div className="flex items-center">
//                   <div className="bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center mr-2">
//                     <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
//                     </svg>
//                   </div>
//                   <span className="text-white text-sm">{bet.user || 'CsPnh'}</span>
//                 </div>
//                 <div className="flex items-center">
//                   <span className={`text-${sideColor} font-medium mr-2`}>${Number(bet.betAmount).toFixed(0)}</span>
//                   <div className="bg-teal-500 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold">T</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       ) : (
//         <div className="flex items-center justify-center p-3">
//           <p className="text-xs text-gray-400 text-center">
//             0 Players
//           </p>
//         </div>
//       )}
//     </div>
//   );
// });

// // Main BetUpdates component
// const BetUpdates = React.memo(
//   ({ headBets = [], tailBets = [], currentRound = {}, isResultsIn = false, winningSide = null }) => {
//     const [isMobile, setIsMobile] = useState(false);
//     const noBets = headBets.length === 0 && tailBets.length === 0;

//     // Check if we're on mobile
//     useEffect(() => {
//       const checkMobile = () => {
//         setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//       };

//       checkMobile();
//       window.addEventListener("resize", checkMobile);

//       return () => {
//         window.removeEventListener("resize", checkMobile);
//       };
//     }, []);

//     return (
//       <section className="h-auto ">
//         {noBets ? (
//           <p className="text-sm text-gray-400 text-center py-3 bg-gray-900 rounded-lg border border-gray-800 shadow-md">
//             No bets have been placed yet
//           </p>
//         ) : (
//           <div className={`grid grid-cols-2 gap-2 md:gap-0 ${isMobile ? '' : 'bg-gray-800/80 rounded-md overflow-hidden'}`}>
//             <BetSection
//               title="Heads Bets"
//               bets={headBets}
//               isWinnerSide={isResultsIn}
//               winningSide={winningSide === 'heads'}
//               playerCount={headBets.length}
//               side="heads"
//             />
//             <BetSection
//               title="Tails Bets"
//               bets={tailBets}
//               isWinnerSide={isResultsIn}
//               winningSide={winningSide === 'tails'}
//               playerCount={tailBets.length}
//               side="tails"
//             />
//           </div>
//         )}
//       </section>
//     );
//   },
//   (prevProps, nextProps) => {
//     // Custom comparison function for React.memo
//     // Return true if the component should NOT re-render

//     // Check if result state has changed
//     if (prevProps.isResultsIn !== nextProps.isResultsIn ||
//         prevProps.winningSide !== nextProps.winningSide) {
//       return false; // Re-render if results state changed
//     }

//     // Check if currentRound has changed
//     if (prevProps.currentRound?.id !== nextProps.currentRound?.id) {
//       return false; // Re-render if round ID changed
//     }

//     // Check if the bets arrays have changed
//     const headBetsChanged =
//       prevProps.headBets.length !== nextProps.headBets.length ||
//       JSON.stringify(prevProps.headBets) !== JSON.stringify(nextProps.headBets);

//     const tailBetsChanged =
//       prevProps.tailBets.length !== nextProps.tailBets.length ||
//       JSON.stringify(prevProps.tailBets) !== JSON.stringify(nextProps.tailBets);

//     if (headBetsChanged || tailBetsChanged) {
//       return false; // Re-render if bets changed
//     }

//     return true; // Don't re-render otherwise
//   }
// );

// // Example usage:
// const App = () => {
//   const [gameState, setGameState] = useState({
//     headBets: [
//       { betId: 'h1', betAmount: 15, side: 'heads', user: 'CsPnh' },
//       { betId: 'h2', betAmount: 10, side: 'heads', user: 'Player2' },
//       { betId: 'h3', betAmount: 20, side: 'heads', user: 'Player3' },
//       { betId: 'h4', betAmount: 5, side: 'heads', user: 'Player4' },
//       { betId: 'h5', betAmount: 25, side: 'heads', user: 'Player5' },
//       { betId: 'h6', betAmount: 15, side: 'heads', user: 'Player6' },
//       { betId: 'h7', betAmount: 30, side: 'heads', user: 'Player7' },
//       { betId: 'h8', betAmount: 12, side: 'heads', user: 'Player8' }, // Will not show in desktop view
//     ],
//     tailBets: [
//       { betId: 't1', betAmount: 15, side: 'tails', user: 'CsPnh' },
//       { betId: 't2', betAmount: 8, side: 'tails', user: 'User2' },
//       { betId: 't3', betAmount: 12, side: 'tails', user: 'User3' },
//       { betId: 't4', betAmount: 22, side: 'tails', user: 'User4' },
//       { betId: 't5', betAmount: 18, side: 'tails', user: 'User5' },
//     ],
//     isResultsIn: false,
//     winningSide: null
//   });

//   // Simulate game progression
//   const simulateResults = () => {
//     setTimeout(() => {
//       setGameState(prev => ({
//         ...prev,
//         isResultsIn: true,
//         winningSide: 'heads', // or 'tails'
//       }));
//     }, 3000);
//   };

//   useEffect(() => {
//     simulateResults();
//   }, []);

//   return (
//     <div className="p-4 bg-gray-900 text-white min-h-screen">
//       <BetUpdates
//         headBets={gameState.headBets}
//         tailBets={gameState.tailBets}
//         isResultsIn={gameState.isResultsIn}
//         winningSide={gameState.winningSide}
//         currentRound={{ id: 1 }}
//       />
//     </div>
//   );
// };

// export default BetUpdates;
//////******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************* */
// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "$";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay, isWinner }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if we're on mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     return () => {
//       clearTimeout(appearTimer);
//     };
//   }, [animationDelay]);

//   if (!isVisible) return null;

//   // Regular bet display (as in Image 1)
//   if (!isWinner) {
//     return (
//       <motion.div
//         initial={{ opacity: 0, scale: 0.8 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{
//           duration: 0.4,
//           type: "spring",
//           stiffness: 100,
//         }}
//         className="flex flex-col items-center justify-center"
//       >
//         <motion.div
//           className="flex flex-col items-center justify-center text-center bg-gray-800 rounded-full p-2 w-12 h-12 border border-gray-700"
//         >
//           <div className="font-medium text-sm text-green-400">
//             {CURRENCY_SYMBOL}{Number(bet.betAmount).toFixed(0)}
//           </div>
//         </motion.div>
//       </motion.div>
//     );
//   }

//   // Winner display (as in Image 2)
//   return null; // Not used in single bet items when showing winners
// });

// const BetSection = React.memo(({ title, bets, isWinnerSide, winningSide, playerCount, side }) => {
//   const containerRef = useRef(null);
//   const [isMobile, setIsMobile] = useState(false);
//   const [visibleBets, setVisibleBets] = useState([]);
//   const [maxItems, setMaxItems] = useState(3);

//   // Check screen size
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Calculate how many bets can fit in one row
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current) return;

//       const containerWidth = containerRef.current.offsetWidth;
//       // Each item is about 60px wide with margins
//       const itemWidth = 60;
//       const calculatedMaxItems = Math.floor(containerWidth / itemWidth);
//       setMaxItems(Math.max(1, Math.min(calculatedMaxItems, 3))); // Between 1 and 3
//     };

//     calculateVisibleItems();
//     window.addEventListener("resize", calculateVisibleItems);

//     return () => {
//       window.removeEventListener("resize", calculateVisibleItems);
//     };
//   }, []);

//   // Update visible bets when maxItems changes
//   useEffect(() => {
//     if (bets.length > 0) {
//       setVisibleBets(bets.slice(0, maxItems));
//     } else {
//       setVisibleBets([]);
//     }
//   }, [bets, maxItems]);

//   // Determine if this section is showing the winning side
//   const showWinner = isWinnerSide && winningSide;

//   // Define colors based on side (for desktop view)
//   const sideColor = side === 'heads' ? 'red-500' : 'green-500';
//   const bgColor = side === 'heads' ? 'red-500/10' : 'green-500/10';
//   const borderColor = side === 'heads' ? 'red-500/20' : 'green-500/20';

//   // Define the label text (using Heads/Tails instead of Down/Up)
//   const sideLabel = side === 'heads' ? 'Heads' : 'Tails';

//   return (
//     <div className={`rounded-lg shadow-md p-3 flex-1 ${showWinner ? 'bg-gray-800' : ''}
//       md:p-0 md:rounded-none md:shadow-none ${isMobile ? '' : ''}`}>
//       {/* Mobile view header */}
//       <div className="flex items-center justify-between mb-2 md:hidden">
//         <h4 className="text-base font-semibold text-white">
//           {playerCount} {playerCount === 1 ? "Player" : "Players"}
//         </h4>
//       </div>

//       {/* Desktop view header */}
//       <div className={`hidden md:flex md:flex-col md:h-full`}>
//         {/* Top section with icon and label */}
//         <div className={`hidden md:flex md:items-center md:justify-center md:flex-col md:p-2`}>
//           <div className={`flex items-center justify-center rounded-full w-12 h-12 bg-${sideColor} mb-2`}>
//             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
//               {side === 'heads' ? (
//                 <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
//               ) : (
//                 <path fillRule="evenodd" d="M10 17a1 1 0 01-1-1V5.414L5.707 8.707a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L11 5.414V16a1 1 0 01-1 1z" clipRule="evenodd" />
//               )}
//             </svg>
//           </div>
//           <span className={`text-${sideColor} font-medium`}>{sideLabel}</span>
//         </div>

//         {/* Player count and amount section */}
//         <div className={`hidden md:block md:w-full md:py-2 md:px-3 bg-${bgColor} border-b border-${borderColor}`}>
//           <div className="flex justify-between items-center">
//             <span className="text-white">Players {playerCount}</span>
//             <span className="text-white">${bets.length > 0 ? Number(bets[0]?.betAmount).toFixed(0) : '0'}</span>
//           </div>
//         </div>

//         {/* Header labels section */}
//         <div className="hidden md:flex md:justify-between md:items-center md:p-2 md:border-b md:border-gray-700">
//           <span className="text-white">Players</span>
//           <span className="text-white">Bet</span>
//         </div>
//       </div>

//       {bets.length > 0 ? (
//         <div ref={containerRef} className="w-full">
//           {/* Mobile view content */}
//           <div className="md:hidden">
//             {showWinner ? (
//               // Winner display (as in Image 2)
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.95 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{
//                   duration: 0.6,
//                   type: "spring",
//                   stiffness: 100,
//                 }}
//                 className="w-full bg-gray-800 rounded-lg p-3 border border-gray-700 text-center"
//               >
//                 <div className="font-bold text-sm text-green-400 mb-1">
//                   {playerCount} {playerCount === 1 ? "WINNER" : "WINNERS"}
//                 </div>
//                 <div className="font-medium text-lg text-green-400">
//                   {CURRENCY_SYMBOL}{bets[0]?.winAmount || bets[0]?.betAmount || "0"}
//                 </div>
//               </motion.div>
//             ) : (
//               // Regular bet display (as in Image 1)
//               <div className="flex items-center justify-center gap-3">
//                 {visibleBets.map((bet, index) => (
//                   <BetItem
//                     key={bet.betId || `${bet.side}-${index}`}
//                     bet={bet}
//                     index={index}
//                     isWinner={false}
//                     animationDelay={index * 200}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Desktop view content - user list */}
//           <div className="hidden md:block">
//             {bets.map((bet, index) => (
//               <div
//                 key={bet.betId || `${bet.side}-${index}`}
//                 className={`flex justify-between items-center p-2 bg-gray-800/50 rounded-md my-1 mx-2`}
//               >
//                 <div className="flex items-center">
//                   <div className="bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center mr-2">
//                     <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
//                     </svg>
//                   </div>
//                   <span className="text-white text-sm">{bet.user || 'CsPnh'}</span>
//                 </div>
//                 <div className="flex items-center">
//                   <span className={`text-${sideColor} font-medium mr-2`}>${Number(bet.betAmount).toFixed(0)}</span>
//                   <div className="bg-teal-500 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold">T</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       ) : (
//         <div className="flex items-center justify-center p-3">
//           <p className="text-xs text-gray-400 text-center">
//             0 Players
//           </p>
//         </div>
//       )}
//     </div>
//   );
// });

// // Main BetUpdates component
// const BetUpdates = React.memo(
//   ({ headBets = [], tailBets = [], currentRound = {}, isResultsIn = false, winningSide = null }) => {
//     const [isMobile, setIsMobile] = useState(false);
//     const noBets = headBets.length === 0 && tailBets.length === 0;

//     // Check if we're on mobile
//     useEffect(() => {
//       const checkMobile = () => {
//         setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//       };

//       checkMobile();
//       window.addEventListener("resize", checkMobile);

//       return () => {
//         window.removeEventListener("resize", checkMobile);
//       };
//     }, []);

//     return (
//       <section className="h-auto">
//         {noBets ? (
//           <p className="text-sm text-gray-400 text-center py-3 bg-gray-900 rounded-lg border border-gray-800 shadow-md">
//             No bets have been placed yet
//           </p>
//         ) : (
//           <div className={`grid grid-cols-2 gap-2 md:gap-0 ${isMobile ? '' : 'bg-gray-800/80 rounded-md overflow-hidden'}`}>
//             <BetSection
//               title="Heads Bets"
//               bets={headBets}
//               isWinnerSide={isResultsIn}
//               winningSide={winningSide === 'heads'}
//               playerCount={headBets.length}
//               side="heads"
//             />
//             <BetSection
//               title="Tails Bets"
//               bets={tailBets}
//               isWinnerSide={isResultsIn}
//               winningSide={winningSide === 'tails'}
//               playerCount={tailBets.length}
//               side="tails"
//             />
//           </div>
//         )}
//       </section>
//     );
//   },
//   (prevProps, nextProps) => {
//     // Custom comparison function for React.memo
//     // Return true if the component should NOT re-render

//     // Check if result state has changed
//     if (prevProps.isResultsIn !== nextProps.isResultsIn ||
//         prevProps.winningSide !== nextProps.winningSide) {
//       return false; // Re-render if results state changed
//     }

//     // Check if currentRound has changed
//     if (prevProps.currentRound?.id !== nextProps.currentRound?.id) {
//       return false; // Re-render if round ID changed
//     }

//     // Check if the bets arrays have changed
//     const headBetsChanged =
//       prevProps.headBets.length !== nextProps.headBets.length ||
//       JSON.stringify(prevProps.headBets) !== JSON.stringify(nextProps.headBets);

//     const tailBetsChanged =
//       prevProps.tailBets.length !== nextProps.tailBets.length ||
//       JSON.stringify(prevProps.tailBets) !== JSON.stringify(nextProps.tailBets);

//     if (headBetsChanged || tailBetsChanged) {
//       return false; // Re-render if bets changed
//     }

//     return true; // Don't re-render otherwise
//   }
// );

// // Example usage:
// const App = () => {
//   const [gameState, setGameState] = useState({
//     headBets: [
//       { betId: 'h1', betAmount: 15, side: 'heads', user: 'CsPnh' },
//     ],
//     tailBets: [
//       { betId: 't1', betAmount: 15, side: 'tails', user: 'CsPnh' },
//     ],
//     isResultsIn: false,
//     winningSide: null
//   });

//   // Simulate game progression
//   const simulateResults = () => {
//     setTimeout(() => {
//       setGameState(prev => ({
//         ...prev,
//         isResultsIn: true,
//         winningSide: 'heads', // or 'tails'
//       }));
//     }, 3000);
//   };

//   useEffect(() => {
//     simulateResults();
//   }, []);

//   return (
//     <div className="p-4 bg-gray-900 text-white min-h-screen">
//       <BetUpdates
//         headBets={gameState.headBets}
//         tailBets={gameState.tailBets}
//         isResultsIn={gameState.isResultsIn}
//         winningSide={gameState.winningSide}
//         currentRound={{ id: 1 }}
//       />
//     </div>
//   );
// };

// export default BetUpdates;

//////******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************* */
// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "$";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay, isWinner }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if we're on mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     return () => {
//       clearTimeout(appearTimer);
//     };
//   }, [animationDelay]);

//   if (!isVisible) return null;

//   // Regular bet display (as in Image 1)
//   if (!isWinner) {
//     return (
//       <motion.div
//         initial={{ opacity: 0, scale: 0.8 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{
//           duration: 0.4,
//           type: "spring",
//           stiffness: 100,
//         }}
//         className="flex flex-col items-center justify-center"
//       >
//         <motion.div
//           className="flex flex-col items-center justify-center text-center bg-gray-800 rounded-full p-2 w-12 h-12 border border-gray-700"
//         >
//           <div className="font-medium text-sm text-green-400">
//             {CURRENCY_SYMBOL}{Number(bet.betAmount).toFixed(0)}
//           </div>
//         </motion.div>
//       </motion.div>
//     );
//   }

//   // Winner display (as in Image 2)
//   return null; // Not used in single bet items when showing winners
// });

// const BetSection = React.memo(({ title, bets, isWinnerSide, winningSide, playerCount, side }) => {
//   const containerRef = useRef(null);
//   const [isMobile, setIsMobile] = useState(false);
//   const [visibleBets, setVisibleBets] = useState([]);
//   const [maxItems, setMaxItems] = useState(3);

//   // Check screen size
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Calculate how many bets can fit in one row
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current) return;

//       const containerWidth = containerRef.current.offsetWidth;
//       // Each item is about 60px wide with margins
//       const itemWidth = 60;
//       const calculatedMaxItems = Math.floor(containerWidth / itemWidth);
//       setMaxItems(Math.max(1, Math.min(calculatedMaxItems, 3))); // Between 1 and 3
//     };

//     calculateVisibleItems();
//     window.addEventListener("resize", calculateVisibleItems);

//     return () => {
//       window.removeEventListener("resize", calculateVisibleItems);
//     };
//   }, []);

//   // Update visible bets when maxItems changes
//   useEffect(() => {
//     if (bets.length > 0) {
//       setVisibleBets(bets.slice(0, maxItems));
//     } else {
//       setVisibleBets([]);
//     }
//   }, [bets, maxItems]);

//   // Determine if this section is showing the winning side
//   const showWinner = isWinnerSide && winningSide;

//   // Define colors based on side (for desktop view)
//   const sideColor = side === 'heads' ? 'red-500' : 'green-500';
//   const bgColor = side === 'heads' ? 'red-500/10' : 'green-500/10';
//   const borderColor = side === 'heads' ? 'red-500/20' : 'green-500/20';

//   // Define the label text ("Down" for heads, "Up" for tails)
//   const sideLabel = side === 'heads' ? 'Down' : 'Up';

//   return (
//     <div className={`rounded-lg shadow-md p-3 flex-1 ${showWinner ? 'bg-gray-800' : ''}
//       md:p-0 md:rounded-none md:shadow-none ${isMobile ? '' : ''}`}>
//       {/* Mobile view header */}
//       <div className="flex items-center justify-between mb-2 md:hidden">
//         <h4 className="text-base font-semibold text-white">
//           {playerCount} {playerCount === 1 ? "Player" : "Players"}
//         </h4>
//       </div>

//       {/* Desktop view header */}
//       <div className={`hidden md:flex md:flex-col md:h-full`}>
//         {/* Top section with icon and label */}
//         <div className={`hidden md:flex md:items-center md:justify-center md:flex-col md:p-2`}>
//           <div className={`flex items-center justify-center rounded-full w-12 h-12 bg-${sideColor} mb-2`}>
//             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
//               {side === 'heads' ? (
//                 <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
//               ) : (
//                 <path fillRule="evenodd" d="M10 17a1 1 0 01-1-1V5.414L5.707 8.707a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L11 5.414V16a1 1 0 01-1 1z" clipRule="evenodd" />
//               )}
//             </svg>
//           </div>
//           <span className={`text-${sideColor} font-medium`}>{sideLabel}</span>
//         </div>

//         {/* Player count and amount section */}
//         <div className={`hidden md:block md:w-full md:py-2 md:px-3 bg-${bgColor} border-b border-${borderColor}`}>
//           <div className="flex justify-between items-center">
//             <span className="text-white">Players {playerCount}</span>
//             <span className="text-white">${bets.length > 0 ? Number(bets[0]?.betAmount).toFixed(0) : '0'}</span>
//           </div>
//         </div>

//         {/* Header labels section */}
//         <div className="hidden md:flex md:justify-between md:items-center md:p-2 md:border-b md:border-gray-700">
//           <span className="text-white">Players</span>
//           <span className="text-white">Bet</span>
//         </div>
//       </div>

//       {bets.length > 0 ? (
//         <div ref={containerRef} className="w-full">
//           {/* Mobile view content */}
//           <div className="md:hidden">
//             {showWinner ? (
//               // Winner display (as in Image 2)
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.95 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{
//                   duration: 0.6,
//                   type: "spring",
//                   stiffness: 100,
//                 }}
//                 className="w-full bg-gray-800 rounded-lg p-3 border border-gray-700 text-center"
//               >
//                 <div className="font-bold text-sm text-green-400 mb-1">
//                   {playerCount} {playerCount === 1 ? "WINNER" : "WINNERS"}
//                 </div>
//                 <div className="font-medium text-lg text-green-400">
//                   {CURRENCY_SYMBOL}{bets[0]?.winAmount || bets[0]?.betAmount || "0"}
//                 </div>
//               </motion.div>
//             ) : (
//               // Regular bet display (as in Image 1)
//               <div className="flex items-center justify-center gap-3">
//                 {visibleBets.map((bet, index) => (
//                   <BetItem
//                     key={bet.betId || `${bet.side}-${index}`}
//                     bet={bet}
//                     index={index}
//                     isWinner={false}
//                     animationDelay={index * 200}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Desktop view content - user list */}
//           <div className="hidden md:block">
//             {bets.map((bet, index) => (
//               <div
//                 key={bet.betId || `${bet.side}-${index}`}
//                 className={`flex justify-between items-center p-2 bg-gray-800/50 rounded-md my-1 mx-2`}
//               >
//                 <div className="flex items-center">
//                   <div className="bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center mr-2">
//                     <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
//                     </svg>
//                   </div>
//                   <span className="text-white text-sm">{bet.user || 'CsPnh'}</span>
//                 </div>
//                 <div className="flex items-center">
//                   <span className={`text-${sideColor} font-medium mr-2`}>${Number(bet.betAmount).toFixed(0)}</span>
//                   <div className="bg-teal-500 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold">T</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       ) : (
//         <div className="flex items-center justify-center p-3">
//           <p className="text-xs text-gray-400 text-center">
//             0 Players
//           </p>
//         </div>
//       )}
//     </div>
//   );
// });

// // Main BetUpdates component
// const BetUpdates = React.memo(
//   ({ headBets = [], tailBets = [], currentRound = {}, isResultsIn = false, winningSide = null }) => {
//     const [isMobile, setIsMobile] = useState(false);
//     const noBets = headBets.length === 0 && tailBets.length === 0;

//     // Check if we're on mobile
//     useEffect(() => {
//       const checkMobile = () => {
//         setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//       };

//       checkMobile();
//       window.addEventListener("resize", checkMobile);

//       return () => {
//         window.removeEventListener("resize", checkMobile);
//       };
//     }, []);

//     return (
//       <section className="h-auto">
//         {noBets ? (
//           <p className="text-sm text-gray-400 text-center py-3 bg-gray-900 rounded-lg border border-gray-800 shadow-md">
//             No bets have been placed yet
//           </p>
//         ) : (
//           <div className={`grid grid-cols-2 gap-2 md:gap-0 ${isMobile ? '' : 'bg-gray-800/80 rounded-md overflow-hidden'}`}>
//             <BetSection
//               title="Heads Bets"
//               bets={headBets}
//               isWinnerSide={isResultsIn}
//               winningSide={winningSide === 'heads'}
//               playerCount={headBets.length}
//               side="heads"
//             />
//             <BetSection
//               title="Tails Bets"
//               bets={tailBets}
//               isWinnerSide={isResultsIn}
//               winningSide={winningSide === 'tails'}
//               playerCount={tailBets.length}
//               side="tails"
//             />
//           </div>
//         )}
//       </section>
//     );
//   },
//   (prevProps, nextProps) => {
//     // Custom comparison function for React.memo
//     // Return true if the component should NOT re-render

//     // Check if result state has changed
//     if (prevProps.isResultsIn !== nextProps.isResultsIn ||
//         prevProps.winningSide !== nextProps.winningSide) {
//       return false; // Re-render if results state changed
//     }

//     // Check if currentRound has changed
//     if (prevProps.currentRound?.id !== nextProps.currentRound?.id) {
//       return false; // Re-render if round ID changed
//     }

//     // Check if the bets arrays have changed
//     const headBetsChanged =
//       prevProps.headBets.length !== nextProps.headBets.length ||
//       JSON.stringify(prevProps.headBets) !== JSON.stringify(nextProps.headBets);

//     const tailBetsChanged =
//       prevProps.tailBets.length !== nextProps.tailBets.length ||
//       JSON.stringify(prevProps.tailBets) !== JSON.stringify(nextProps.tailBets);

//     if (headBetsChanged || tailBetsChanged) {
//       return false; // Re-render if bets changed
//     }

//     return true; // Don't re-render otherwise
//   }
// );

// // Example usage:
// const App = () => {
//   const [gameState, setGameState] = useState({
//     headBets: [
//       { betId: 'h1', betAmount: 15, side: 'heads', user: 'CsPnh' },
//     ],
//     tailBets: [
//       { betId: 't1', betAmount: 15, side: 'tails', user: 'CsPnh' },
//     ],
//     isResultsIn: false,
//     winningSide: null
//   });

//   // Simulate game progression
//   const simulateResults = () => {
//     setTimeout(() => {
//       setGameState(prev => ({
//         ...prev,
//         isResultsIn: true,
//         winningSide: 'heads', // or 'tails'
//       }));
//     }, 3000);
//   };

//   useEffect(() => {
//     simulateResults();
//   }, []);

//   return (
//     <div className="p-4 bg-gray-900 text-white min-h-screen">
//       <BetUpdates
//         headBets={gameState.headBets}
//         tailBets={gameState.tailBets}
//         isResultsIn={gameState.isResultsIn}
//         winningSide={gameState.winningSide}
//         currentRound={{ id: 1 }}
//       />
//     </div>
//   );
// };

// export default BetUpdates;

//////******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************* */

// import React, { useState, useEffect, useMemo } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Currency symbol
// const CURRENCY_SYMBOL = "$";

// // Utility to mask identity (can be a phone number or username)
// const maskIdentity = (value) => {
//   if (!value) return "Anonymous";
//   return String(value);
// };

// const PlayerItem = ({ player, side }) => {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 10 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.3 }}
//       className={`flex items-center justify-between px-3 py-2 rounded-md mb-2 ${
//         side === 'heads' ? 'bg-red-900/30' : 'bg-green-900/30'
//       }`}
//     >
//       <div className="flex items-center">
//         <div className="bg-amber-700 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
//           <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
//             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
//           </svg>
//         </div>
//         <span className="text-white text-sm font-medium">{maskIdentity(player.name || player.phone)}</span>
//       </div>
//       <div className="flex items-center">
//         <span className={`text-sm font-bold ${side === 'heads' ? 'text-red-400' : 'text-green-400'}`}>
//           {CURRENCY_SYMBOL}{Number(player.betAmount).toFixed(0)}
//         </span>
//         <span className="ml-2 text-white text-xs bg-teal-600 rounded-full w-5 h-5 flex items-center justify-center">
//           T
//         </span>
//       </div>
//     </motion.div>
//   );
// };

// const SectionHeader = ({ side, count, totalAmount }) => {
//   const isHeads = side === 'heads';
//   const bgColor = isHeads ? 'bg-red-400' : 'bg-green-400';
//   const textColor = 'text-white';

//   return (
//     <div className="mb-4">
//       <div className={`flex justify-center mb-2`}>
//         <div className={`${isHeads ? 'bg-red-500/80' : 'bg-green-500/80'} rounded-full p-3 w-12 h-12 flex items-center justify-center`}>
//           <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
//             {isHeads ? (
//               // Heads icon - simplified coin with H
//               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="currentColor" />
//             ) : (
//               // Tails icon - simplified coin with T
//               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="currentColor" />
//             )}
//           </svg>
//         </div>
//       </div>

//       <div className="text-center text-xl font-medium mb-2">
//         <span className={isHeads ? 'text-red-400' : 'text-green-400'}>
//           {isHeads ? 'Heads' : 'Tails'}
//         </span>
//       </div>

//       <div className={`${isHeads ? 'bg-red-900/30' : 'bg-green-900/30'} rounded-md p-2`}>
//         <div className="flex justify-between px-3 py-2">
//           <div className="text-gray-300 text-sm">
//             Players <span className={isHeads ? 'text-red-400' : 'text-green-400'}>{count}</span>
//           </div>
//           <div className={`font-medium ${isHeads ? 'text-red-400' : 'text-green-400'}`}>
//             {CURRENCY_SYMBOL}{totalAmount}
//           </div>
//         </div>
//         <div className="flex justify-between px-3 py-1 text-white text-sm font-medium">
//           <div>Players</div>
//           <div>Bet</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const BetUpdates = ({ headsBets = [], tailsBets = [], isResultsIn = false, winningSide = null }) => {
//   const [isMobile, setIsMobile] = useState(false);

//   // Check screen size
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Calculate total amounts
//   const headsTotal = useMemo(() => {
//     return headsBets.reduce((sum, bet) => sum + Number(bet.betAmount || 0), 0);
//   }, [headsBets]);

//   const tailsTotal = useMemo(() => {
//     return tailsBets.reduce((sum, bet) => sum + Number(bet.betAmount || 0), 0);
//   }, [tailsBets]);

//   return (
//     <div className="bg-gray-900 p-3 rounded-lg">
//       <div className="grid grid-cols-2 gap-4">
//         {/* Left Column - Heads */}
//         <div>
//           <SectionHeader side="heads" count={headsBets.length} totalAmount={headsTotal} />
//           <div className="space-y-1">
//             {headsBets.map((bet, index) => (
//               <PlayerItem key={bet.id || `heads-${index}`} player={bet} side="heads" />
//             ))}
//             {headsBets.length === 0 && (
//               <div className="text-center text-gray-500 py-2 text-sm">No players</div>
//             )}
//           </div>
//         </div>

//         {/* Right Column - Tails */}
//         <div>
//           <SectionHeader side="tails" count={tailsBets.length} totalAmount={tailsTotal} />
//           <div className="space-y-1">
//             {tailsBets.map((bet, index) => (
//               <PlayerItem key={bet.id || `tails-${index}`} player={bet} side="tails" />
//             ))}
//             {tailsBets.length === 0 && (
//               <div className="text-center text-gray-500 py-2 text-sm">No players</div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Example usage
// const App = () => {
//   const [bets, setBets] = useState({
//     headsBets: [
//       { id: 'h1', name: 'CsPnh', betAmount: 15, side: 'heads' }
//     ],
//     tailsBets: [
//       { id: 't1', name: 'CsPnh', betAmount: 15, side: 'tails' }
//     ],
//     isResultsIn: false,
//     winningSide: null
//   });

//   return (
//     <div className="p-4 bg-gray-800 min-h-screen">
//       <div className="max-w-lg mx-auto">
//         <BetUpdates
//           headsBets={bets.headsBets}
//           tailsBets={bets.tailsBets}
//           isResultsIn={bets.isResultsIn}
//           winningSide={bets.winningSide}
//         />
//       </div>
//     </div>
//   );
// };

// export default BetUpdates;
//////******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************* */
// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "$";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay, isWinner }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if we're on mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     return () => {
//       clearTimeout(appearTimer);
//     };
//   }, [animationDelay]);

//   if (!isVisible) return null;

//   // Regular bet display (as in Image 1)
//   if (!isWinner) {
//     return (
//       <motion.div
//         initial={{ opacity: 0, scale: 0.8 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{
//           duration: 0.4,
//           type: "spring",
//           stiffness: 100,
//         }}
//         className="flex flex-col items-center justify-center"
//       >
//         <motion.div
//           className="flex flex-col items-center justify-center text-center bg-gray-800 rounded-full p-2 w-12 h-12 border border-gray-700"
//         >
//           <div className="font-medium text-sm text-green-400">
//             {CURRENCY_SYMBOL}{Number(bet.betAmount).toFixed(0)}
//           </div>
//         </motion.div>
//       </motion.div>
//     );
//   }

//   // Winner display (as in Image 2)
//   return null; // Not used in single bet items when showing winners
// });

// const BetSection = React.memo(({ title, bets, isWinnerSide, winningSide, playerCount }) => {
//   const containerRef = useRef(null);
//   const [isMobile, setIsMobile] = useState(false);
//   const [visibleBets, setVisibleBets] = useState([]);
//   const [maxItems, setMaxItems] = useState(3);

//   // Check screen size
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Calculate how many bets can fit in one row
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current) return;

//       const containerWidth = containerRef.current.offsetWidth;
//       // Each item is about 60px wide with margins
//       const itemWidth = 60;
//       const calculatedMaxItems = Math.floor(containerWidth / itemWidth);
//       setMaxItems(Math.max(1, Math.min(calculatedMaxItems, 3))); // Between 1 and 3
//     };

//     calculateVisibleItems();
//     window.addEventListener("resize", calculateVisibleItems);

//     return () => {
//       window.removeEventListener("resize", calculateVisibleItems);
//     };
//   }, []);

//   // Update visible bets when maxItems changes
//   useEffect(() => {
//     if (bets.length > 0) {
//       setVisibleBets(bets.slice(0, maxItems));
//     } else {
//       setVisibleBets([]);
//     }
//   }, [bets, maxItems]);

//   // Determine if this section is showing the winning side
//   const showWinner = isWinnerSide && winningSide;

//   return (
//     <div className={`rounded-lg shadow-md p-3 flex-1 ${showWinner ? 'bg-gray-800' : ''}`}>
//       <div className="flex items-center justify-between mb-2">
//         <h4 className="text-base font-semibold text-white">
//           {playerCount} {playerCount === 1 ? "Player" : "Players"}
//         </h4>
//       </div>

//       {bets.length > 0 ? (
//         <div ref={containerRef} className="w-full">
//           {showWinner ? (
//             // Winner display (as in Image 2)
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{
//                 duration: 0.6,
//                 type: "spring",
//                 stiffness: 100,
//               }}
//               className="w-full bg-gray-800 rounded-lg p-3 border border-gray-700 text-center"
//             >
//               <div className="font-bold text-sm text-green-400 mb-1">
//                 {playerCount} {playerCount === 1 ? "WINNER" : "WINNERS"}
//               </div>
//               <div className="font-medium text-lg text-green-400">
//                 {CURRENCY_SYMBOL}{bets[0]?.winAmount || bets[0]?.betAmount || "0"}
//               </div>
//             </motion.div>
//           ) : (
//             // Regular bet display (as in Image 1)
//             <div className="flex items-center justify-center gap-3">
//               {visibleBets.map((bet, index) => (
//                 <BetItem
//                   key={bet.betId || `${bet.side}-${index}`}
//                   bet={bet}
//                   index={index}
//                   isWinner={false}
//                   animationDelay={index * 200}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="flex items-center justify-center p-3">
//           <p className="text-xs text-gray-400 text-center">
//             0 Players
//           </p>
//         </div>
//       )}
//     </div>
//   );
// });

// // Main BetUpdates component
// const BetUpdates = React.memo(
//   ({ headBets = [], tailBets = [], currentRound = {}, isResultsIn = false, winningSide = null }) => {
//     const noBets = headBets.length === 0 && tailBets.length === 0;

//     return (
//       <section className="h-auto">
//         {noBets ? (
//           <p className="text-sm text-gray-400 text-center py-3 bg-gray-900 rounded-lg border border-gray-800 shadow-md">
//             No bets have been placed yet
//           </p>
//         ) : (
//           <div className="grid grid-cols-2 gap-2">
//             <BetSection
//               title="Heads Bets"
//               bets={headBets}
//               isWinnerSide={isResultsIn}
//               winningSide={winningSide === 'heads'}
//               playerCount={headBets.length}
//             />
//             <BetSection
//               title="Tails Bets"
//               bets={tailBets}
//               isWinnerSide={isResultsIn}
//               winningSide={winningSide === 'tails'}
//               playerCount={tailBets.length}
//             />
//           </div>
//         )}
//       </section>
//     );
//   },
//   (prevProps, nextProps) => {
//     // Custom comparison function for React.memo
//     // Return true if the component should NOT re-render

//     // Check if result state has changed
//     if (prevProps.isResultsIn !== nextProps.isResultsIn ||
//         prevProps.winningSide !== nextProps.winningSide) {
//       return false; // Re-render if results state changed
//     }

//     // Check if currentRound has changed
//     if (prevProps.currentRound?.id !== nextProps.currentRound?.id) {
//       return false; // Re-render if round ID changed
//     }

//     // Check if the bets arrays have changed
//     const headBetsChanged =
//       prevProps.headBets.length !== nextProps.headBets.length ||
//       JSON.stringify(prevProps.headBets) !== JSON.stringify(nextProps.headBets);

//     const tailBetsChanged =
//       prevProps.tailBets.length !== nextProps.tailBets.length ||
//       JSON.stringify(prevProps.tailBets) !== JSON.stringify(nextProps.tailBets);

//     if (headBetsChanged || tailBetsChanged) {
//       return false; // Re-render if bets changed
//     }

//     return true; // Don't re-render otherwise
//   }
// );

// // Example usage:
// const App = () => {
//   const [gameState, setGameState] = useState({
//     headBets: [
//       { betId: 'h1', betAmount: 1, side: 'heads' },
//     ],
//     tailBets: [
//       { betId: 't1', betAmount: 1, side: 'tails' },
//     ],
//     isResultsIn: false,
//     winningSide: null
//   });

//   // Simulate game progression
//   const simulateResults = () => {
//     setTimeout(() => {
//       setGameState(prev => ({
//         ...prev,
//         isResultsIn: true,
//         winningSide: 'heads', // or 'tails'
//       }));
//     }, 3000);
//   };

//   useEffect(() => {
//     simulateResults();
//   }, []);

//   return (
//     <div className="p-4 bg-gray-900 text-white min-h-screen">
//       <BetUpdates
//         headBets={gameState.headBets}
//         tailBets={gameState.tailBets}
//         isResultsIn={gameState.isResultsIn}
//         winningSide={gameState.winningSide}
//         currentRound={{ id: 1 }}
//       />
//     </div>
//   );
// };

// export default BetUpdates;

//////******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************* */

// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "$";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay, isWinner, totalBets }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if we're on mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     return () => {
//       clearTimeout(appearTimer);
//     };
//   }, [animationDelay]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   if (!isVisible) return null;

//   // Regular bet display (as in Image 1)
//   if (!isWinner) {
//     return (
//       <motion.div
//         initial={{ opacity: 0, scale: 0.8 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{
//           duration: 0.4,
//           type: "spring",
//           stiffness: 100,
//         }}
//         className="flex flex-col items-center justify-center"
//       >
//         <motion.div
//           className="flex flex-col items-center justify-center text-center bg-gray-800 rounded-full p-2 w-12 h-12 border border-gray-700"
//         >
//           <div className="font-medium text-sm text-green-400">
//             {CURRENCY_SYMBOL}{Number(bet.betAmount).toFixed(0)}
//           </div>
//         </motion.div>
//       </motion.div>
//     );
//   }

//   // Winner display (as in Image 2)
//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.8 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{
//         duration: 0.6,
//         type: "spring",
//         stiffness: 100,
//       }}
//       className="flex flex-col items-center justify-center bg-gray-800 rounded-lg w-full p-4 border border-gray-700"
//     >
//       <div className="font-bold text-sm text-green-400 mb-1">
//         {totalBets} WINNER{totalBets !== 1 ? 'S' : ''}
//       </div>
//       <div className="font-medium text-lg text-green-400">
//         {CURRENCY_SYMBOL}{Number(bet.winAmount || bet.betAmount).toFixed(0)}
//       </div>
//     </motion.div>
//   );
// });

// const BetSection = React.memo(({ title, bets, isWinnerSide, winningSide }) => {
//   const containerRef = useRef(null);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check screen size
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Determine if this section is showing the winning side
//   const showWinner = isWinnerSide && winningSide;

//   return (
//     <div className={`rounded-lg shadow-md p-2 flex-1 ${showWinner ? 'bg-gray-900' : ''}`}>
//       <div className="flex items-center justify-between mb-2">
//         <h4 className="text-base font-semibold text-white">
//           {title}
//         </h4>
//         {bets.length > 0 && (
//           <span className={`text-xs ${showWinner ? 'text-green-400' : 'text-red-400'} bg-gray-800 px-2 py-0.5 rounded-full`}>
//             {bets.length}
//           </span>
//         )}
//       </div>
//       {bets.length > 0 ? (
//         <div
//           ref={containerRef}
//           className={`
//             flex items-center justify-center
//             ${showWinner ? '' : 'gap-2 flex-wrap'}
//           `}>
//           {showWinner ? (
//             <BetItem
//               key="winner"
//               bet={bets[0]} // Just use the first bet for display
//               isWinner={true}
//               totalBets={bets.length}
//               animationDelay={500}
//             />
//           ) : (
//             bets.map((bet, index) => (
//               <BetItem
//                 key={bet.betId || `${bet.side}-${index}`}
//                 bet={bet}
//                 index={index}
//                 isWinner={false}
//                 animationDelay={index * 300}
//               />
//             ))
//           )}
//         </div>
//       ) : (
//         <p className="text-xs text-gray-400 text-center py-3">
//           0 Players
//         </p>
//       )}
//     </div>
//   );
// });

// // Memoize the entire BetUpdates component with proper dependency check
// const BetUpdates = React.memo(
//   ({ headBets = [], tailBets = [], currentRound = {}, isResultsIn = false, winningSide = null }) => {
//     const noBets = headBets.length === 0 && tailBets.length === 0;

//     // Player count display
//     const headsCount = headBets.length;
//     const tailsCount = tailBets.length;

//     return (
//       <section className="h-auto">
//         {noBets ? (
//           <p className="text-sm text-gray-400 text-center py-3 bg-gray-900 rounded-lg border border-gray-800 shadow-md">
//             No bets have been placed yet
//           </p>
//         ) : (
//           <div className="grid grid-cols-2 gap-4">
//             <BetSection
//               title="Heads Bets"
//               bets={headBets}
//               isWinnerSide={isResultsIn}
//               winningSide={winningSide === 'heads'}
//             />
//             <BetSection
//               title="Tails Bets"
//               bets={tailBets}
//               isWinnerSide={isResultsIn}
//               winningSide={winningSide === 'tails'}
//             />
//           </div>
//         )}
//       </section>
//     );
//   },
//   (prevProps, nextProps) => {
//     // Custom comparison function for React.memo
//     // Return true if the component should NOT re-render

//     // Check if result state has changed
//     if (prevProps.isResultsIn !== nextProps.isResultsIn ||
//         prevProps.winningSide !== nextProps.winningSide) {
//       return false; // Re-render if results state changed
//     }

//     // Check if currentRound has changed
//     if (prevProps.currentRound?.id !== nextProps.currentRound?.id) {
//       return false; // Re-render if round ID changed
//     }

//     // Check if the bets arrays have changed
//     const headBetsChanged =
//       prevProps.headBets.length !== nextProps.headBets.length ||
//       JSON.stringify(prevProps.headBets) !== JSON.stringify(nextProps.headBets);

//     const tailBetsChanged =
//       prevProps.tailBets.length !== nextProps.tailBets.length ||
//       JSON.stringify(prevProps.tailBets) !== JSON.stringify(nextProps.tailBets);

//     if (headBetsChanged || tailBetsChanged) {
//       return false; // Re-render if bets changed
//     }

//     return true; // Don't re-render otherwise
//   }
// );

// // Example usage:
// const App = () => {
//   const [gameState, setGameState] = useState({
//     headBets: [
//       { betId: 'h1', betAmount: 1, side: 'heads' },
//     ],
//     tailBets: [
//       { betId: 't1', betAmount: 1, side: 'tails' },
//     ],
//     isResultsIn: false,
//     winningSide: null
//   });

//   // Simulate game progression
//   const simulateResults = () => {
//     // First, show the bets being placed
//     setTimeout(() => {
//       setGameState(prev => ({
//         ...prev,
//         isResultsIn: true,
//         winningSide: 'heads', // or 'tails'
//       }));
//     }, 3000);
//   };

//   useEffect(() => {
//     simulateResults();
//   }, []);

//   return (
//     <div className="p-4 bg-gray-900 text-white min-h-screen">
//       <BetUpdates
//         headBets={gameState.headBets}
//         tailBets={gameState.tailBets}
//         isResultsIn={gameState.isResultsIn}
//         winningSide={gameState.winningSide}
//         currentRound={{ id: 1 }}
//       />
//     </div>
//   );
// };

// export default BetUpdates;

//////******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************* */

// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh ";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isCompact, setIsCompact] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if we're on mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     // Only trigger compact animation on mobile
//     let compactTimer;
//     if (isMobile) {
//       compactTimer = setTimeout(() => {
//         setIsCompact(true);
//       }, animationDelay + 4000);
//     }

//     return () => {
//       clearTimeout(appearTimer);
//       if (compactTimer) clearTimeout(compactTimer);
//     };
//   }, [animationDelay, isMobile]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   if (!isVisible) return null;

//   return (
//     <motion.li
//       initial={{ opacity: 0, y: -5 }}
//       animate={{
//         opacity: 1,
//         y: 0,
//         width: isMobile && isCompact ? "65px" : "100%",
//         height: isMobile && isCompact ? "35px" : "auto",
//         borderRadius: isMobile && isCompact ? "9999px" : "0.375rem",
//       }}
//       transition={{
//         duration: 0.4,
//         type: "spring",
//         stiffness: 100,
//       }}
//       className="
//         flex
//         items-center
//         justify-center
//         bg-gray-800
//         shadow-sm
//         hover:shadow-md
//         border
//         border-gray-700
//         overflow-hidden
//         relative

//         my-0.5
//         w-full
//         min-w-20
//         md:my-1
//       ">
//       <AnimatePresence>
//         {!(isMobile && isCompact) && (
//           <motion.div
//             className="flex items-center justify-between w-full py-1 md:px-4 md:py-6 overflow-hidden "
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}>
//             <div className="flex items-center space-x-2 md:space-x-4 min-w-10
//              md:flex-1 md:mx-[-10px]">
//               {/* <span className="font-semibold text-xs md:text-sm text-green-400 whitespace-nowrap">
//                 #{index + 1}
//               </span> */}
//               <span className="text-xs md:text-sm text-gray-400 truncate md:overflow-visible  md:text-wrap md:whitespace-normal">
//                 {displayIdentifier}
//               </span>
//             </div>
// {/*
//             <div className="flex  items-center space-x-2 md:space-x-4 flex-shrink-0">
//               <h2 className="text-xs md:text-sm font-medium text-green-400 whitespace-nowrap">
//                 {CURRENCY_SYMBOL}
//                 {Number(bet.betAmount).toFixed(0)}
//               </h2>
//               {resultAmount && (
//                 <span
//                   className={`text-xs md:text-sm font-medium whitespace-nowrap ${
//                     bet.result === "win" ? "text-green-400" : "text-red-400"
//                   }`}>
//                   ({bet.result === "win" ? "+" : "-"}
//                   {CURRENCY_SYMBOL}
//                   {Number(resultAmount).toFixed(0)})
//                 </span>
//               )}
//             </div> */}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isMobile && isCompact && (
//           <motion.div
//             className="flex flex-col  items-center justify-center text-center"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3 }}>
//             <div className="font-bold text-xs text-green-400">#{index + 1}</div>
//             <div className="text-xs text-green-400 font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(0)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => {
//   const containerRef = useRef(null);
//   const [visibleCount, setVisibleCount] = useState(3); // Default for mobile
//   const [isMobile, setIsMobile] = useState(false);

//   // Check screen size
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Determine visible count for mobile
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current || !isMobile) return;

//       // Only calculate for mobile
//       const containerWidth = containerRef.current.offsetWidth;
//       const itemWidth = 55; // Approximate size of each circle with margins
//       const fittingItems = Math.floor(containerWidth / itemWidth);
//       setVisibleCount(Math.min(fittingItems, 3)); // Max 3 per row on mobile
//     };

//     if (isMobile) {
//       calculateVisibleItems();
//       window.addEventListener("resize", calculateVisibleItems);
//     } else {
//       // On desktop, show all bets
//       setVisibleCount(bets.length);
//     }

//     return () => {
//       window.removeEventListener("resize", calculateVisibleItems);
//     };
//   }, [isMobile, bets.length]);

//   // Get appropriate number of bets based on device
//   const visibleBets = isMobile ? bets.slice(0, visibleCount) : bets;
//   const hiddenBetsCount = isMobile
//     ? Math.max(0, bets.length - visibleCount)
//     : 0;

//   return (
//     <div className="rounded-xl shadow-md p-2 md:p-4 flex-1 md:border ml-2 md:ml-0 border-gray-800">
//       <h4 className="text-base font-semibold text-white mb-2 pb-1 border-b border-gray-700 flex justify-between items-center">
//         {title}
//         {bets.length > 0 && (
//           <span className="text-xs text-green-400 bg-gray-800 px-2 py-0.5 rounded-full">
//             {bets.length}
//           </span>
//         )}
//       </h4>
//       {bets.length > 0 ? (
//         <>
//           <div
//             ref={containerRef}
//             className={`
//               ${isMobile ? "grid grid-cols-3" : "flex flex-col"}
//               gap-1
//               md:gap-2
//               overflow-hidden
//               ${isMobile ? "md:max-h-none" : ""}
//             `}>
//             {visibleBets.map((bet, index) => (
//               <BetItem
//                 key={bet.betId || `${bet.side}-${index}`}
//                 bet={bet}
//                 index={index}
//                 animationDelay={index * 800} // Sequential appearance with 800ms delay
//               />
//             ))}
//           </div>
//         </>
//       ) : (
//         <p className="text-xs text-gray-400 text-center py-3">
//           No {title.toLowerCase()} yet
//         </p>
//       )}
//     </div>
//   );
// });

// // Memoize the entire BetUpdates component with proper dependency check
// const BetUpdates = React.memo(
//   ({ headBets = [], tailBets = [], currentRound = {} }) => {
//     const noBets = headBets.length === 0 && tailBets.length === 0;

//     return (
//       <section className="h-auto">
//         <h3 className="hidden md:block text-xl font-bold mb-3 text-center text-white py-2 rounded-lg shadow bg-gray-800 border-b-2 border-green-500">
//           Live Bet Updates
//         </h3>
//         {noBets ? (
//           <p className="text-sm text-gray-400 text-center py-3 bg-gray-900 rounded-lg border border-gray-800 shadow-md">
//             No bets have been placed yet
//           </p>
//         ) : (
//           <div className="grid grid-cols-2 gap-1 md:gap-3 ">
//             <BetSection title="Heads Bets" bets={headBets} />
//             <BetSection title="Tails Bets" bets={tailBets} />
//           </div>
//         )}
//       </section>
//     );
//   },
//   (prevProps, nextProps) => {
//     // Custom comparison function for React.memo
//     // Return true if the component should NOT re-render

//     // Check if currentRound has changed
//     if (prevProps.currentRound?.id !== nextProps.currentRound?.id) {
//       return false; // Re-render if round ID changed
//     }

//     // Check if the bets arrays have changed
//     const headBetsChanged =
//       prevProps.headBets.length !== nextProps.headBets.length ||
//       JSON.stringify(prevProps.headBets) !== JSON.stringify(nextProps.headBets);

//     const tailBetsChanged =
//       prevProps.tailBets.length !== nextProps.tailBets.length ||
//       JSON.stringify(prevProps.tailBets) !== JSON.stringify(nextProps.tailBets);

//     if (headBetsChanged || tailBetsChanged) {
//       return false; // Re-render if bets changed
//     }

//     return true; // Don't re-render otherwise
//   }
// );

// export default BetUpdates;

// ******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************* */

// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh ";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isCompact, setIsCompact] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if we're on mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     // Only trigger compact animation on mobile
//     let compactTimer;
//     if (isMobile) {
//       compactTimer = setTimeout(() => {
//         setIsCompact(true);
//       }, animationDelay + 4000);
//     }

//     return () => {
//       clearTimeout(appearTimer);
//       if (compactTimer) clearTimeout(compactTimer);
//     };
//   }, [animationDelay, isMobile]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   if (!isVisible) return null;

//   return (
//     <motion.li
//       initial={{ opacity: 0, y: -5 }}
//       animate={{
//         opacity: 1,
//         y: 0,
//         width: isMobile && isCompact ? "65px" : "100%",
//         height: isMobile && isCompact ? "35px" : "auto",
//         borderRadius: isMobile && isCompact ? "9999px" : "0.375rem",
//       }}
//       transition={{
//         duration: 0.4,
//         type: "spring",
//         stiffness: 100,
//       }}
//       className="
//         flex
//         items-center
//         justify-center
//         bg-gray-800
//         shadow-sm
//         hover:shadow-md
//         border
//         border-gray-700
//         overflow-hidden
//         relative
//         mx-1
//         my-0.5
//         w-full
//         md:my-1
//       ">
//       <AnimatePresence>
//         {!(isMobile && isCompact) && (
//           <motion.div
//             className="flex items-center justify-between w-full py-1 md:px-4 md:py-6 overflow-hidden"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}>
//             <div className="flex items-center space-x-2 md:space-x-4 min-w-0 md:flex-1 md:mx-[-10px]">
//               <span className="font-semibold text-xs md:text-sm text-green-400 whitespace-nowrap">
//                 #{index + 1}
//               </span>
//               <span className="text-xs md:text-sm text-gray-400 truncate md:overflow-visible  md:text-wrap md:whitespace-normal">
//                 {displayIdentifier}
//               </span>
//             </div>

//             <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
//               {/* {bet.result && (
//                 <h2
//                   className={`whitespace-nowrap text-xs md:text-sm ${
//                     bet.result === "win" ? "text-green-400" : "text-red-400"
//                   }`}>
//                   {bet.result}
//                 </h2>
//               )} */}
//               <h2 className="text-xs md:text-sm font-medium text-green-400 whitespace-nowrap">
//                 {CURRENCY_SYMBOL}
//                 {Number(bet.betAmount).toFixed(0)}
//               </h2>
//               {resultAmount && (
//                 <span
//                   className={`text-xs md:text-sm font-medium whitespace-nowrap ${
//                     bet.result === "win" ? "text-green-400" : "text-red-400"
//                   }`}>
//                   ({bet.result === "win" ? "+" : "-"}
//                   {CURRENCY_SYMBOL}
//                   {Number(resultAmount).toFixed(0)})
//                 </span>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isMobile && isCompact && (
//           <motion.div
//             className="flex flex-col items-center justify-center text-center"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3 }}>
//             <div className="font-bold text-xs text-green-400">#{index + 1}</div>
//             <div className="text-xs text-green-400 font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(0)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => {
//   const containerRef = useRef(null);
//   const [visibleCount, setVisibleCount] = useState(3); // Default for mobile
//   const [isMobile, setIsMobile] = useState(false);

//   // Check screen size
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Determine visible count for mobile
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current || !isMobile) return;

//       // Only calculate for mobile
//       const containerWidth = containerRef.current.offsetWidth;
//       const itemWidth = 55; // Approximate size of each circle with margins
//       const fittingItems = Math.floor(containerWidth / itemWidth);
//       setVisibleCount(Math.min(fittingItems, 3)); // Max 3 per row on mobile
//     };

//     if (isMobile) {
//       calculateVisibleItems();
//       window.addEventListener("resize", calculateVisibleItems);
//     } else {
//       // On desktop, show all bets
//       setVisibleCount(bets.length);
//     }

//     return () => {
//       window.removeEventListener("resize", calculateVisibleItems);
//     };
//   }, [isMobile, bets.length]);

//   // Get appropriate number of bets based on device
//   const visibleBets = isMobile ? bets.slice(0, visibleCount) : bets;
//   const hiddenBetsCount = isMobile
//     ? Math.max(0, bets.length - visibleCount)
//     : 0;

//   return (
//     <div className="bg-gray-900 rounded-xl shadow-md p-2 md:p-4 flex-1 border border-gray-800">
//       <h4 className="text-base font-semibold text-white mb-2 pb-1 border-b border-gray-700 flex justify-between items-center">
//         {title}
//         {bets.length > 0 && (
//           <span className="text-xs text-green-400 bg-gray-800 px-2 py-0.5 rounded-full">
//             {bets.length}
//           </span>
//         )}
//       </h4>
//       {bets.length > 0 ? (
//         <>
//           <div
//             ref={containerRef}
//             className={`
//               ${isMobile ? "grid grid-cols-3" : "flex flex-col"}
//               gap-1
//               md:gap-2
//               overflow-hidden
//               ${isMobile ? "md:max-h-none" : ""}
//             `}>
//             {visibleBets.map((bet, index) => (
//               <BetItem
//                 key={bet.betId || `${bet.side}-${index}`}
//                 bet={bet}
//                 index={index}
//                 animationDelay={index * 800} // Sequential appearance with 800ms delay
//               />
//             ))}
//           </div>
//           {/* {hiddenBetsCount > 0 && (
//             <div className="text-xs text-center text-green-400 mt-2 bg-gray-800 py-1 px-2 rounded-md">
//               +{hiddenBetsCount} more bets
//             </div>
//           )} */}
//         </>
//       ) : (
//         <p className="text-xs text-gray-400 text-center py-3">
//           No {title.toLowerCase()} yet
//         </p>
//       )}
//     </div>
//   );
// });

// const BetUpdates = ({ headBets = [], tailBets = [], currentRound={currentRound} }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;

//   return (
//     <section className="h-auto">
//       <h3 className="hidden md:block text-xl font-bold mb-3 text-center text-white py-2 rounded-lg shadow bg-gray-800 border-b-2 border-green-500">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-sm text-gray-400 text-center py-3 bg-gray-900 rounded-lg border border-gray-800 shadow-md">
//           No bets have been placed yet
//         </p>
//       ) : (
//         <div className="grid grid-cols-2 gap-2 md:gap-3">
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//           />
//         </div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

/********************************************************************************************************************************************************************** */

// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isCompact, setIsCompact] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if we're on mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     // Only trigger compact animation on mobile
//     let compactTimer;
//     if (isMobile) {
//       compactTimer = setTimeout(() => {
//         setIsCompact(true);
//       }, animationDelay + 4000);
//     }

//     return () => {
//       clearTimeout(appearTimer);
//       if (compactTimer) clearTimeout(compactTimer);
//     };
//   }, [animationDelay, isMobile]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   if (!isVisible) return null;

//   return (
//     <motion.li
//       initial={{ opacity: 0, y: -5 }}
//       animate={{
//         opacity: 1,
//         y: 0,
//         width: isMobile && isCompact ? "45px" : "100%",
//         height: isMobile && isCompact ? "45px" : "auto",
//         borderRadius: isMobile && isCompact ? "9999px" : "0.375rem",
//       }}
//       transition={{
//         duration: 0.4,
//         type: "spring",
//         stiffness: 100,
//       }}
//       className="
//         flex
//         items-center
//         justify-center
//         bg-lime-500
//         shadow-sm
//         hover:shadow-md
//         border
//         border-gray-100
//         overflow-hidden
//         relative
//         mx-0.5
//         my-0.5
//         w-full
//         md:my-1
//       ">
//       <AnimatePresence>
//         {!(isMobile && isCompact) && (
//           <motion.div
//             className="flex items-center justify-between w-full px-2 py-1 md:px-4 md:py-2"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}>
//             <div className="flex items-center space-x-2 md:space-x-4 min-w-0 md:flex-1  md:mx-[-10px]">
//               <span className="font-semibold text-xs md:text-sm text-gray-800 whitespace-nowrap">
//                 #{index + 1}
//               </span>
//               <span className="text-xs md:text-sm text-gray-600 truncate md:overflow-visible md:whitespace-normal ">
//                 {displayIdentifier}
//               </span>
//             </div>
//             <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
//               {bet.result && (
//                 <span
//                   className={`whitespace-nowrap text-xs md:text-sm ${
//                     bet.result === "win" ? "text-green-800" : "text-red-800"
//                   }`}>
//                   {bet.result}
//                 </span>
//               )}
//               <span className="text-xs md:text-sm font-medium text-gray-900 whitespace-nowrap">
//                 {CURRENCY_SYMBOL}
//                 {Number(bet.betAmount).toFixed(2)}
//               </span>
//               {resultAmount && (
//                 <span
//                   className={`text-xs md:text-sm  font-medium whitespace-nowrap ${
//                     bet.result === "win" ? "text-green-800" : "text-red-800"
//                   }`}
//                 >
//                   ({bet.result === "win" ? "+" : "-"}{CURRENCY_SYMBOL}{Number(resultAmount).toFixed(2)})
//                 </span>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isMobile && isCompact && (
//           <motion.div
//             className="flex flex-col items-center justify-center text-center"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3 }}>
//             <div className="font-bold text-xs text-gray-800">#{index + 1}</div>
//             <div className="text-xs text-gray-900  font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(2)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => {
//   const containerRef = useRef(null);
//   const [visibleCount, setVisibleCount] = useState(3); // Default for mobile
//   const [isMobile, setIsMobile] = useState(false);

//   // Check screen size
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Determine visible count for mobile
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current || !isMobile) return;

//       // Only calculate for mobile
//       const containerWidth = containerRef.current.offsetWidth;
//       const itemWidth = 55; // Approximate size of each circle with margins
//       const fittingItems = Math.floor(containerWidth / itemWidth);
//       setVisibleCount(Math.min(fittingItems, 3)); // Max 3 per row on mobile
//     };

//     if (isMobile) {
//       calculateVisibleItems();
//       window.addEventListener("resize", calculateVisibleItems);
//     } else {
//       // On desktop, show all bets
//       setVisibleCount(bets.length);
//     }

//     return () => {
//       window.removeEventListener("resize", calculateVisibleItems);
//     };
//   }, [isMobile, bets.length]);

//   // Get appropriate number of bets based on device
//   const visibleBets = isMobile ? bets.slice(0, visibleCount) : bets;
//   const hiddenBetsCount = isMobile ? Math.max(0, bets.length - visibleCount) : 0;

//   return (
//     <div className="bg-gradient-to-b from-gray-500 to-white rounded-xl shadow-md p-1 md:p-4 flex-1">
//       <h4 className="text-base font-semibold text-gray-800 mb-1 pb-1 border-b border-gray-200">
//         {title}{" "}
//         {bets.length > 0 && (
//           <span className="text-xs text-gray-600">({bets.length})</span>
//         )}
//       </h4>
//       {bets.length > 0 ? (
//         <>
//           <div
//             ref={containerRef}
//             className={`
//               ${isMobile ? 'grid grid-cols-3' : 'flex flex-col'}
//               gap-0.5
//               md:gap-1
//               overflow-hidden
//               ${isMobile ? 'md:max-h-none' : ''}
//             `}>
//             {visibleBets.map((bet, index) => (
//               <BetItem
//                 key={bet.betId || `${bet.side}-${index}`}
//                 bet={bet}
//                 index={index}
//                 animationDelay={index * 800} // Sequential appearance with 800ms delay
//               />
//             ))}
//           </div>
//           {hiddenBetsCount > 0 && (
//             <div className="text-xs text-center text-gray-600 mt-1">
//               +{hiddenBetsCount} more bets
//             </div>
//           )}
//         </>
//       ) : (
//         <p className="text-xs text-gray-500 text-center py-3">
//           No {title.toLowerCase()} yet
//         </p>
//       )}
//     </div>
//   );
// });

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;

//   return (
//     <section className="h-auto">
//       <h3 className="hidden md:block text-xl font-bold mb-2 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-xs text-gray-500 text-center py-3">No updates</p>
//       ) : (
//         <div className="grid grid-cols-2 gap-0.5 md:gap-2">
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//           />
//         </div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

/************************************************************************************************************************************************* */

// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isCompact, setIsCompact] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if we're on mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     // Only trigger compact animation on mobile
//     let compactTimer;
//     if (isMobile) {
//       compactTimer = setTimeout(() => {
//         setIsCompact(true);
//       }, animationDelay + 4000);
//     }

//     return () => {
//       clearTimeout(appearTimer);
//       if (compactTimer) clearTimeout(compactTimer);
//     };
//   }, [animationDelay, isMobile]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   if (!isVisible) return null;

//   return (
//     <motion.li
//       initial={{ opacity: 0, y: -5 }}
//       animate={{
//         opacity: 1,
//         y: 0,
//         width: isMobile && isCompact ? "45px" : "100%",
//         height: isMobile && isCompact ? "45px" : "auto",
//         borderRadius: isMobile && isCompact ? "9999px" : "0.375rem",
//       }}
//       transition={{
//         duration: 0.4,
//         type: "spring",
//         stiffness: 100,
//       }}
//       className="
//         flex
//         items-center
//         justify-center
//         bg-lime-500
//         shadow-sm
//         hover:shadow-md
//         border
//         border-gray-100
//         overflow-hidden
//         relative
//         mx-0.5
//         my-0.5
//         w-full
//         md:my-1
//       ">
//       <AnimatePresence>
//         {!(isMobile && isCompact) && (
//           <motion.div
//             className="flex items-center justify-between w-full px-2 py-1 md:px-4 md:py-2"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}>
//             <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
//               <span className="font-semibold text-xs md:text-sm text-gray-800 whitespace-nowrap">
//                 #{index + 1}
//               </span>
//               <span className="text-xs md:text-sm text-gray-600 truncate">
//                 {displayIdentifier}
//               </span>
//             </div>
//             <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
//               {bet.result && (
//                 <span
//                   className={`whitespace-nowrap text-xs md:text-sm ${
//                     bet.result === "win" ? "text-green-800" : "text-red-800"
//                   }`}>
//                   {bet.result}
//                 </span>
//               )}
//               <span className="text-xs md:text-sm font-medium text-gray-900 whitespace-nowrap">
//                 {CURRENCY_SYMBOL}
//                 {Number(bet.betAmount).toFixed(2)}
//               </span>
//               {resultAmount && (
//                 <span
//                   className={`text-xs md:text-sm font-medium whitespace-nowrap ${
//                     bet.result === "win" ? "text-green-800" : "text-red-800"
//                   }`}
//                 >
//                   ({bet.result === "win" ? "+" : "-"}{CURRENCY_SYMBOL}{Number(resultAmount).toFixed(2)})
//                 </span>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isMobile && isCompact && (
//           <motion.div
//             className="flex flex-col items-center justify-center text-center"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3 }}>
//             <div className="font-bold text-xs text-gray-800">#{index + 1}</div>
//             <div className="text-xs text-gray-900 font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(2)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => {
//   const containerRef = useRef(null);
//   const [visibleCount, setVisibleCount] = useState(3); // Default for mobile
//   const [isMobile, setIsMobile] = useState(false);

//   // Check screen size
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Determine visible count for mobile
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current || !isMobile) return;

//       // Only calculate for mobile
//       const containerWidth = containerRef.current.offsetWidth;
//       const itemWidth = 55; // Approximate size of each circle with margins
//       const fittingItems = Math.floor(containerWidth / itemWidth);
//       setVisibleCount(Math.min(fittingItems, 3)); // Max 3 per row on mobile
//     };

//     if (isMobile) {
//       calculateVisibleItems();
//       window.addEventListener("resize", calculateVisibleItems);
//     } else {
//       // On desktop, show all bets
//       setVisibleCount(bets.length);
//     }

//     return () => {
//       window.removeEventListener("resize", calculateVisibleItems);
//     };
//   }, [isMobile, bets.length]);

//   // Get appropriate number of bets based on device
//   const visibleBets = isMobile ? bets.slice(0, visibleCount) : bets;
//   const hiddenBetsCount = isMobile ? Math.max(0, bets.length - visibleCount) : 0;

//   return (
//     <div className="bg-gradient-to-b from-gray-500 to-white rounded-xl shadow-md p-1 md:p-4 flex-1">
//       <h4 className="text-base font-semibold text-gray-800 mb-1 pb-1 border-b border-gray-200">
//         {title}{" "}
//         {bets.length > 0 && (
//           <span className="text-xs text-gray-600">({bets.length})</span>
//         )}
//       </h4>
//       {bets.length > 0 ? (
//         <>
//           <div
//             ref={containerRef}
//             className={`
//               ${isMobile ? 'grid grid-cols-3' : 'flex flex-col'}
//               gap-0.5
//               md:gap-1
//               overflow-hidden
//               ${isMobile ? 'md:max-h-none' : ''}
//             `}>
//             {visibleBets.map((bet, index) => (
//               <BetItem
//                 key={bet.betId || `${bet.side}-${index}`}
//                 bet={bet}
//                 index={index}
//                 animationDelay={index * 800} // Sequential appearance with 800ms delay
//               />
//             ))}
//           </div>
//           {hiddenBetsCount > 0 && (
//             <div className="text-xs text-center text-gray-600 mt-1">
//               +{hiddenBetsCount} more bets
//             </div>
//           )}
//         </>
//       ) : (
//         <p className="text-xs text-gray-500 text-center py-3">
//           No {title.toLowerCase()} yet
//         </p>
//       )}
//     </div>
//   );
// });

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;

//   return (
//     <section className="h-auto">
//       <h3 className="hidden md:block text-xl font-bold mb-2 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-xs text-gray-500 text-center py-3">No updates</p>
//       ) : (
//         <div className="grid grid-cols-2 gap-0.5 md:gap-2">
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//           />
//         </div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

/***************************************************************************************************************************************/

// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isCompact, setIsCompact] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   // Check if we're on mobile
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     // Only trigger compact animation on mobile
//     let compactTimer;
//     if (isMobile) {
//       compactTimer = setTimeout(() => {
//         setIsCompact(true);
//       }, animationDelay + 4000);
//     }

//     return () => {
//       clearTimeout(appearTimer);
//       if (compactTimer) clearTimeout(compactTimer);
//     };
//   }, [animationDelay, isMobile]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   if (!isVisible) return null;

//   return (
//     <motion.li
//       initial={{ opacity: 0, y: -5 }}
//       animate={{
//         opacity: 1,
//         y: 0,
//         width: isMobile && isCompact ? "45px" : "100%",
//         height: isMobile && isCompact ? "45px" : "auto",
//         borderRadius: isMobile && isCompact ? "9999px" : "0.375rem",
//       }}
//       transition={{
//         duration: 0.4,
//         type: "spring",
//         stiffness: 100,
//       }}
//       className="
//         flex
//         items-center
//         justify-center
//         bg-lime-500
//         shadow-sm
//         hover:shadow-md
//         border
//         border-gray-100
//         overflow-hidden
//         relative
//         mx-0.5
//         my-0.5
//         w-full
//       ">
//       <AnimatePresence>
//         {!(isMobile && isCompact) && (
//           <motion.div
//             className="flex items-center justify-between w-full px-2 py-1"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}>
//             <div className="flex items-center space-x-2">
//               <span className="font-semibold text-xs text-gray-800">
//                 #{index + 1}
//               </span>
//               <span className="text-xs text-gray-600">{displayIdentifier}</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <span className="text-xs text-gray-700">
//                 {bet.result && (
//                   <span
//                     className={`${
//                       bet.result === "win" ? "text-green-800" : "text-red-800"
//                     }`}>
//                     {bet.result}
//                   </span>
//                 )}
//               </span>
//               <span className="text-xs font-medium text-gray-900">
//                 {CURRENCY_SYMBOL}
//                 {Number(bet.betAmount).toFixed(2)}
//               </span>
//               {resultAmount && (
//                 <span className={`text-xs font-medium ${bet.result === "win" ? "text-green-800" : "text-red-800"}`}>
//                   ({bet.result === "win" ? "+" : "-"}{CURRENCY_SYMBOL}{Number(resultAmount).toFixed(2)})
//                 </span>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isMobile && isCompact && (
//           <motion.div
//             className="flex flex-col items-center justify-center text-center"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3 }}>
//             <div className="font-bold text-xs text-gray-800">#{index + 1}</div>
//             <div className="text-xs text-gray-900 font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(2)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => {
//   const containerRef = useRef(null);
//   const [visibleCount, setVisibleCount] = useState(3); // Default for mobile
//   const [isMobile, setIsMobile] = useState(false);

//   // Check screen size
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768); // md breakpoint
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);

//     return () => {
//       window.removeEventListener("resize", checkMobile);
//     };
//   }, []);

//   // Determine visible count for mobile
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current || !isMobile) return;

//       // Only calculate for mobile
//       const containerWidth = containerRef.current.offsetWidth;
//       const itemWidth = 55; // Approximate size of each circle with margins
//       const fittingItems = Math.floor(containerWidth / itemWidth);
//       setVisibleCount(Math.min(fittingItems, 3)); // Max 3 per row on mobile
//     };

//     if (isMobile) {
//       calculateVisibleItems();
//       window.addEventListener("resize", calculateVisibleItems);
//     } else {
//       // On desktop, show all bets
//       setVisibleCount(bets.length);
//     }

//     return () => {
//       window.removeEventListener("resize", calculateVisibleItems);
//     };
//   }, [isMobile, bets.length]);

//   // Get appropriate number of bets based on device
//   const visibleBets = isMobile ? bets.slice(0, visibleCount) : bets;
//   const hiddenBetsCount = isMobile ? Math.max(0, bets.length - visibleCount) : 0;

//   return (
//     <div className="bg-gradient-to-b from-gray-500 to-white rounded-xl shadow-md p-1 md:p-3 flex-1">
//       <h4 className="text-base font-semibold text-gray-800 mb-1 pb-1 border-b border-gray-200">
//         {title}{" "}
//         {bets.length > 0 && (
//           <span className="text-xs text-gray-600">({bets.length})</span>
//         )}
//       </h4>
//       {bets.length > 0 ? (
//         <>
//           <div
//             ref={containerRef}
//             className={`
//               ${isMobile ? 'grid grid-cols-3' : 'flex flex-col'}
//               gap-0.5
//               overflow-hidden
//               ${isMobile ? 'md:max-h-none' : ''}
//             `}>
//             {visibleBets.map((bet, index) => (
//               <BetItem
//                 key={bet.betId || `${bet.side}-${index}`}
//                 bet={bet}
//                 index={index}
//                 animationDelay={index * 800} // Sequential appearance with 800ms delay
//               />
//             ))}
//           </div>
//           {hiddenBetsCount > 0 && (
//             <div className="text-xs text-center text-gray-600 mt-1">
//               +{hiddenBetsCount} more bets
//             </div>
//           )}
//         </>
//       ) : (
//         <p className="text-xs text-gray-500 text-center py-3">
//           No {title.toLowerCase()} yet
//         </p>
//       )}
//     </div>
//   );
// });

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;

//   return (
//     <section className="h-auto">
//       <h3 className="hidden md:block text-xl font-bold mb-1 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-1 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-xs text-gray-500 text-center py-3">No updates</p>
//       ) : (
//         <div className="grid grid-cols-2 gap-0.5">
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//           />
//         </div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

/******************************************************************************************************************* */

// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isCompact, setIsCompact] = useState(false);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     // Trigger animation to circle after the rectangle appears
//     const compactTimer = setTimeout(() => {
//       setIsCompact(true);
//     }, animationDelay + 4000);

//     return () => {
//       clearTimeout(appearTimer);
//       clearTimeout(compactTimer);
//     };
//   }, [animationDelay]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   if (!isVisible) return null;

//   return (
//     <motion.li
//       initial={{ opacity: 0, y: -5 }}
//       animate={{
//         opacity: 1,
//         y: 0,
//         width: isCompact ? "45px" : "100%",
//         height: isCompact ? "45px" : "30px",
//         borderRadius: isCompact ? "9999px" : "0.375rem",
//       }}
//       transition={{
//         duration: 0.4,
//         type: "spring",
//         stiffness: 100,
//       }}
//       className="
//         flex
//         items-center
//         justify-center
//         bg-lime-500
//         shadow-sm
//         hover:shadow-md
//         border
//         border-gray-100
//         overflow-hidden
//         relative
//         mx-0.5
//         my-0.5
//       ">
//       <AnimatePresence>
//         {!isCompact && (
//           <motion.div
//             className="flex items-center justify-between w-full px-2"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}>
//             <div className="flex items-center space-x-2">
//               <span className="font-semibold text-xs text-gray-800">
//                 #{index + 1}
//               </span>
//               <span className="text-xs text-gray-600">{displayIdentifier}</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <span className="text-xs text-gray-700">
//                 {bet.result && (
//                   <span
//                     className={`${
//                       bet.result === "win" ? "text-green-800" : "text-red-800"
//                     }`}>
//                     {bet.result}
//                   </span>
//                 )}
//               </span>
//               <span className="text-xs font-medium text-gray-900">
//                 {CURRENCY_SYMBOL}
//                 {Number(bet.betAmount).toFixed(2)}
//               </span>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isCompact && (
//           <motion.div
//             className="flex flex-col items-center justify-center text-center"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3 }}>
//             <div className="font-bold text-xs text-gray-800">#{index + 1}</div>
//             <div className="text-xs text-gray-900 font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(2)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => {
//   const containerRef = useRef(null);
//   const [visibleCount, setVisibleCount] = useState(3); // Default for mobile

//   // Determine how many items can fit based on container width
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current) return;

//       const containerWidth = containerRef.current.offsetWidth;
//       const itemWidth = 55; // 45px + margins (approximate size of each circle)
//       const fittingItems = Math.floor(containerWidth / itemWidth);

//       // Set visible count based on screen size
//       const isMobile = window.innerWidth < 768; // md breakpoint

//       if (isMobile) {
//         // For mobile: Only show what fits horizontally in one row
//         setVisibleCount(Math.min(fittingItems, 3)); // Max 3 per row on mobile
//       } else {
//         // For desktop: Show up to 9 items (3x3 grid)
//         setVisibleCount(9);
//       }
//     };

//     calculateVisibleItems();
//     window.addEventListener("resize", calculateVisibleItems);

//     return () => {
//       window.removeEventListener("resize", calculateVisibleItems);
//     };
//   }, []);

//   // Limit the number of displayed bets
//   const visibleBets = bets.slice(0, visibleCount);
//   const hiddenBetsCount = Math.max(0, bets.length - visibleCount);

//   return (
//     <div className="bg-gradient-to-b from-gray-500 to-white rounded-xl shadow-md p-1 md:p-3 flex-1">
//       <h4 className="text-base font-semibold text-gray-800 mb-1 pb-1 border-b border-gray-200">
//         {title}{" "}
//         {bets.length > 0 && (
//           <span className="text-xs text-gray-600">({bets.length})</span>
//         )}
//       </h4>
//       {bets.length > 0 ? (
//         <>
//           <div
//             ref={containerRef}
//             className="
//             grid
//             grid-cols-3
//             gap-0
//             md:max-h-[280px]
//             overflow-hidden
//             whitespace-nowrap
//           ">
//             {visibleBets.map((bet, index) => (
//               <BetItem
//                 key={bet.betId || `${bet.side}-${index}`}
//                 bet={bet}
//                 index={index}
//                 animationDelay={index * 800} // Sequential appearance with 800ms delay
//               />
//             ))}
//           </div>
//           {hiddenBetsCount > 0 && (
//             <div className="text-xs text-center text-gray-600 mt-1">
//               +{hiddenBetsCount} more bets
//             </div>
//           )}
//         </>
//       ) : (
//         <p className="text-xs text-gray-500 text-center py-3">
//           No {title.toLowerCase()} yet
//         </p>
//       )}
//     </div>
//   );
// });

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;

//   return (
//     <section className="h-auto">
//       <h3 className="hidden md:block text-xl font-bold mb-1 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-1 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-xs text-gray-500 text-center py-3">No updates</p>
//       ) : (
//         <div className="grid grid-cols-2  gap-0.5">
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//           />
//         </div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay, layoutMode }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isCompact, setIsCompact] = useState(false);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     // Trigger animation to circle after the rectangle appears
//     // Only do this after sections have moved side by side
//     const compactTimer = setTimeout(() => {
//       setIsCompact(true);
//     }, animationDelay + 2000); // 2 seconds after the initial appearance

//     return () => {
//       clearTimeout(appearTimer);
//       clearTimeout(compactTimer);
//     };
//   }, [animationDelay]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   if (!isVisible) return null;

//   return (
//     <motion.li
//       initial={{ opacity: 0, y: -5 }}
//       animate={{
//         opacity: 1,
//         y: 0,
//         width: isCompact ? "45px" : "100%",
//         height: isCompact ? "45px" : "30px",
//         borderRadius: isCompact ? "9999px" : "0.375rem",
//       }}
//       transition={{
//         duration: 0.4,
//         type: "spring",
//         stiffness: 100
//       }}
//       className="
//         flex
//         items-center
//         justify-center
//         bg-lime-500
//         shadow-sm
//         hover:shadow-md
//         border
//         border-gray-100
//         overflow-hidden
//         relative
//         mx-0.5
//         my-0.5
//       "
//     >
//       <AnimatePresence>
//         {!isCompact && (
//           <motion.div
//             className="flex items-center justify-between w-full px-2"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}
//           >
//             <div className="flex items-center space-x-2">
//               <span className="font-semibold text-xs text-gray-800">#{index + 1}</span>
//               <span className="text-xs text-gray-600">{displayIdentifier}</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <span className="text-xs text-gray-700">
//                 {bet.result &&
//                   <span className={`${bet.result === 'win' ? 'text-green-800' : 'text-red-800'}`}>
//                     {bet.result}
//                   </span>
//                 }
//               </span>
//               <span className="text-xs font-medium text-gray-900">
//                 {CURRENCY_SYMBOL}{Number(bet.betAmount).toFixed(2)}
//               </span>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isCompact && (
//           <motion.div
//             className="flex flex-col items-center justify-center text-center"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3 }}
//           >
//             <div className="font-bold text-xs text-gray-800">
//               #{index + 1}
//             </div>
//             <div className="text-xs text-gray-900 font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(2)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.li>
//   );
// });

// const BetSection = React.memo(({ title, bets, layoutMode }) => {
//   const containerRef = useRef(null);
//   const [visibleCount, setVisibleCount] = useState(3); // Default for mobile

//   // Determine how many items can fit based on container width
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current) return;

//       const containerWidth = containerRef.current.offsetWidth;
//       const itemWidth = 55; // 45px + margins (approximate size of each circle)
//       const fittingItems = Math.floor(containerWidth / itemWidth);

//       // Set visible count based on screen size
//       const isMobile = window.innerWidth < 768; // md breakpoint

//       if (isMobile) {
//         // For mobile: Only show what fits horizontally in one row
//         setVisibleCount(Math.min(fittingItems, 3)); // Max 3 per row on mobile
//       } else {
//         // For desktop: Show up to 9 items (3x3 grid)
//         setVisibleCount(9);
//       }
//     };

//     calculateVisibleItems();
//     window.addEventListener('resize', calculateVisibleItems);

//     return () => {
//       window.removeEventListener('resize', calculateVisibleItems);
//     };
//   }, []);

//   // Limit the number of displayed bets
//   const visibleBets = bets.slice(0, visibleCount);
//   const hiddenBetsCount = Math.max(0, bets.length - visibleCount);

//   return (
//     <motion.div
//       className="bg-gradient-to-b from-gray-500 to-white rounded-xl shadow-md p-1 md:p-3 flex-1"
//       layout
//       transition={{ duration: 0.5, type: "spring", stiffness: 60 }}
//     >
//       <h4 className="text-base font-semibold text-gray-800 mb-1 pb-1 border-b border-gray-200">
//         {title} {bets.length > 0 && <span className="text-xs text-gray-600">({bets.length})</span>}
//       </h4>
//       {bets.length > 0 ? (
//         <>
//           <div
//             ref={containerRef}
//             className="
//               flex
//               flex-row
//               flex-wrap
//               gap-0
//               md:max-h-[280px]
//               overflow-hidden
//               whitespace-nowrap
//             "
//           >
//             {visibleBets.map((bet, index) => (
//               <BetItem
//                 key={bet.betId || `${bet.side}-${index}`}
//                 bet={bet}
//                 index={index}
//                 animationDelay={index * 500} // Faster sequential appearance
//                 layoutMode={layoutMode}
//               />
//             ))}
//           </div>
//           {hiddenBetsCount > 0 && (
//             <div className="text-xs text-center text-gray-600 mt-1">
//               +{hiddenBetsCount} more bets
//             </div>
//           )}
//         </>
//       ) : (
//         <p className="text-xs text-gray-500 text-center py-3">
//           No {title.toLowerCase()} yet
//         </p>
//       )}
//     </motion.div>
//   );
// });

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;
//   const [layoutMode, setLayoutMode] = useState("initial");

//   // Set layout mode to animate sections side by side before items transition to circles
//   useEffect(() => {
//     if (noBets) return;

//     // Animate to side-by-side after the first few items appear
//     const sideByTimer = setTimeout(() => {
//       setLayoutMode("sideBySide");
//     }, 2000);

//     return () => clearTimeout(sideByTimer);
//   }, [headBets, tailBets, noBets]);

//   return (
//     <section className="h-auto">
//       <h3 className="hidden md:block text-xl font-bold mb-1 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-1 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-xs text-gray-500 text-center py-3">No updates</p>
//       ) : (
//         <motion.div
//           className="grid gap-2"
//           layout
//           animate={{
//             gridTemplateColumns: layoutMode === "sideBySide" ? "1fr 1fr" : "1fr"
//           }}
//           transition={{
//             duration: 0.5,
//             type: "spring",
//             stiffness: 60
//           }}
//         >
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//             layoutMode={layoutMode}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//             layoutMode={layoutMode}
//           />
//         </motion.div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

/*********************************************************************************************** */

// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay, onCompactChange }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isCompact, setIsCompact] = useState(false);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     // Trigger animation to circle after the rectangle appears
//     const compactTimer = setTimeout(() => {
//       setIsCompact(true);
//       // Notify parent component when this item becomes compact
//       onCompactChange(true);
//     }, animationDelay + 4000);

//     return () => {
//       clearTimeout(appearTimer);
//       clearTimeout(compactTimer);
//     };
//   }, [animationDelay, onCompactChange]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   if (!isVisible) return null;

//   return (
//     <motion.li
//       initial={{ opacity: 0, y: -5 }}
//       animate={{
//         opacity: 1,
//         y: 0,
//         width: isCompact ? "45px" : "100%",
//         height: isCompact ? "45px" : "30px",
//         borderRadius: isCompact ? "9999px" : "0.375rem",
//       }}
//       transition={{
//         duration: 0.4,
//         type: "spring",
//         stiffness: 100
//       }}
//       className="
//         flex
//         items-center
//         justify-center
//         bg-lime-500
//         shadow-sm
//         hover:shadow-md
//         border
//         border-gray-100
//         overflow-hidden
//         relative
//         mx-0.5
//         my-0.5
//       "
//     >
//       <AnimatePresence>
//         {!isCompact && (
//           <motion.div
//             className="flex items-center justify-between w-full px-2"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}
//           >
//             <div className="flex items-center space-x-2">
//               <span className="font-semibold text-xs text-gray-800">#{index + 1}</span>
//               <span className="text-xs text-gray-600">{displayIdentifier}</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <span className="text-xs text-gray-700">
//                 {bet.result &&
//                   <span className={`${bet.result === 'win' ? 'text-green-800' : 'text-red-800'}`}>
//                     {bet.result}
//                   </span>
//                 }
//               </span>
//               <span className="text-xs font-medium text-gray-900">
//                 {CURRENCY_SYMBOL}{Number(bet.betAmount).toFixed(2)}
//               </span>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isCompact && (
//           <motion.div
//             className="flex flex-col items-center justify-center text-center"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3 }}
//           >
//             <div className="font-bold text-xs text-gray-800">
//               #{index + 1}
//             </div>
//             <div className="text-xs text-gray-900 font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(2)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.li>
//   );
// });

// const BetSection = React.memo(({ title, bets, isCompactMode }) => {
//   const containerRef = useRef(null);
//   const [visibleCount, setVisibleCount] = useState(3); // Default for mobile

//   // Determine how many items can fit based on container width
//   useEffect(() => {
//     const calculateVisibleItems = () => {
//       if (!containerRef.current) return;

//       const containerWidth = containerRef.current.offsetWidth;
//       const itemWidth = 55; // 45px + margins (approximate size of each circle)
//       const fittingItems = Math.floor(containerWidth / itemWidth);

//       // Set visible count based on screen size
//       const isMobile = window.innerWidth < 768; // md breakpoint

//       if (isMobile) {
//         // For mobile: Only show what fits horizontally in one row
//         setVisibleCount(Math.min(fittingItems, 3)); // Max 3 per row on mobile
//       } else {
//         // For desktop: Show up to 9 items (3x3 grid)
//         setVisibleCount(9);
//       }
//     };

//     calculateVisibleItems();
//     window.addEventListener('resize', calculateVisibleItems);

//     return () => {
//       window.removeEventListener('resize', calculateVisibleItems);
//     };
//   }, []);

//   // Limit the number of displayed bets
//   const visibleBets = bets.slice(0, visibleCount);
//   const hiddenBetsCount = Math.max(0, bets.length - visibleCount);

//   return (
//     <motion.div
//       className="bg-gradient-to-b from-gray-500 to-white rounded-xl shadow-md p-1 md:p-3 flex-1"
//       animate={{
//         height: isCompactMode ? "auto" : "auto",
//         width: "100%",
//         transition: { duration: 0.5 }
//       }}
//     >
//       <h4 className="text-base font-semibold text-gray-800 mb-1 pb-1 border-b border-gray-200">
//         {title} {bets.length > 0 && <span className="text-xs text-gray-600">({bets.length})</span>}
//       </h4>
//       {bets.length > 0 ? (
//         <>
//           <div
//             ref={containerRef}
//             className={`
//             grid
//             ${isCompactMode ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}
//             gap-0
//             md:max-h-[280px]
//             overflow-hidden
//             whitespace-nowrap
//           `}>
//             {visibleBets.map((bet, index) => (
//               <BetItem
//                 key={bet.betId || `${bet.side}-${index}`}
//                 bet={bet}
//                 index={index}
//                 animationDelay={index * 800} // Sequential appearance with 800ms delay
//                 onCompactChange={() => {}} // This is handled at BetUpdates level now
//               />
//             ))}
//           </div>
//           {hiddenBetsCount > 0 && (
//             <div className="text-xs text-center text-gray-600 mt-1">
//               +{hiddenBetsCount} more bets
//             </div>
//           )}
//         </>
//       ) : (
//         <p className="text-xs text-gray-500 text-center py-3">
//           No {title.toLowerCase()} yet
//         </p>
//       )}
//     </motion.div>
//   );
// });

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;
//   const [isCompactMode, setIsCompactMode] = useState(false);

//   // Set compact mode after delay for all sections to be in sync
//   useEffect(() => {
//     if (noBets) return;

//     // Find maximum delay + transition time across all items
//     const maxItems = Math.max(
//       headBets.length > 0 ? Math.min(headBets.length, 9) : 0,
//       tailBets.length > 0 ? Math.min(tailBets.length, 9) : 0
//     );

//     // Calculate max transition time: last item delay + 4000ms for the compact transition
//     const maxTransitionTime = maxItems > 0 ? (maxItems - 1) * 800 + 4000 + 500 : 4000;

//     const timer = setTimeout(() => {
//       setIsCompactMode(true);
//     }, maxTransitionTime);

//     return () => clearTimeout(timer);
//   }, [headBets, tailBets, noBets]);

//   return (
//     <section className="h-auto">
//       <h3 className="hidden md:block text-xl font-bold mb-1 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-1 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-xs text-gray-500 text-center py-3">No updates</p>
//       ) : (
//         <motion.div
//           className="grid gap-0.5"
//           animate={{
//             gridTemplateColumns: isCompactMode ? "1fr 1fr" : "1fr",
//             transition: { duration: 0.6, ease: "easeInOut" }
//           }}
//         >
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//             isCompactMode={isCompactMode}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//             isCompactMode={isCompactMode}
//           />
//         </motion.div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

/************************************************************************************************************************************/

/*******************************************************************************************/

// import React, { useMemo, useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isCompact, setIsCompact] = useState(false);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     // Trigger animation to circle after the rectangle appears
//     const compactTimer = setTimeout(() => {
//       setIsCompact(true);
//     }, animationDelay + 4000);

//     return () => {
//       clearTimeout(appearTimer);
//       clearTimeout(compactTimer);
//     };
//   }, [animationDelay]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   if (!isVisible) return null;

//   return (
//     <motion.li
//       initial={{ opacity: 0, y: -5 }}
//       animate={{
//         opacity: 1,
//         y: 0,
//         width: isCompact ? "55px" : "100%",
//         height: isCompact ? "55px" : "1.25rem",
//         borderRadius: isCompact ? "9999px" : "0.375rem",
//       }}
//       transition={{
//         duration: 0.4,
//         type: "spring",
//         stiffness: 100
//       }}
//       className="
//         flex
//         items-center
//         justify-center
//         bg-lime-500
//         shadow-sm
//         hover:shadow-md
//         border
//         border-gray-100
//         overflow-hidden
//         relative
//         m-1
//       "
//     >
//       <AnimatePresence>
//         {!isCompact && (
//           <motion.div
//             className="flex items-center justify-between w-full px-2"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}
//           >
//             <div className="flex items-center space-x-2">
//               <span className="font-semibold text-xs text-gray-800">#{index + 1}</span>
//               <span className="text-xs text-gray-600">{displayIdentifier}</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <span className="text-xs text-gray-700">
//                 {bet.result &&
//                   <span className={`${bet.result === 'win' ? 'text-green-800' : 'text-red-800'}`}>
//                     {bet.result}
//                   </span>
//                 }
//               </span>
//               <span className="text-xs font-medium text-gray-900">
//                 {CURRENCY_SYMBOL}{Number(bet.betAmount).toFixed(2)}
//               </span>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isCompact && (
//           <motion.div
//             className="flex flex-col items-center justify-center text-center"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3 }}
//           >
//             <div className="font-bold text-xs text-gray-800">
//               #{index + 1}
//             </div>
//             <div className="text-xs text-gray-900 font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(2)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => {
//   // Limit the number of displayed bets to prevent overflow
//   const MAX_VISIBLE_BETS = 9;
//   const visibleBets = bets.slice(0, MAX_VISIBLE_BETS);
//   const hiddenBetsCount = Math.max(0, bets.length - MAX_VISIBLE_BETS);

//   return (
//     <div className="bg-gradient-to-b from-gray-500 to-white rounded-xl shadow-md p-2 md:p-5 flex-1">
//       <h4 className="text-lg font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-200">
//         {title} {bets.length > 0 && <span className="text-sm text-gray-600">({bets.length})</span>}
//       </h4>
//       {bets.length > 0 ? (
//         <>
//           <div
//             className="
//             grid
//             grid-cols-3
//             gap-0
//             md:max-h-[320px]
//             overflow-hidden
//           ">
//             {visibleBets.map((bet, index) => (
//               <BetItem
//                 key={bet.betId || `${bet.side}-${index}`}
//                 bet={bet}
//                 index={index}
//                 animationDelay={index * 800} // Sequential appearance with 800ms delay
//               />
//             ))}
//           </div>
//           {hiddenBetsCount > 0 && (
//             <div className="text-xs text-center text-gray-600 mt-2">
//               +{hiddenBetsCount} more bets
//             </div>
//           )}
//         </>
//       ) : (
//         <p className="text-gray-500 text-center py-4">
//           No {title.toLowerCase()} yet
//         </p>
//       )}
//     </div>
//   );
// });

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;

//   return (
//     <section className="">
//       <h3 className="hidden md:block text-2xl font-bold mb-2 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-gray-500 text-center py-4">No updates</p>
//       ) : (
//         <div className="grid grid-cols-2 gap-0.5">
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//           />
//         </div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

/********************************************************************************************************************* */

// import React, { useMemo, useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index, animationDelay }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [isCompact, setIsCompact] = useState(false);

//   // Control sequential appearance
//   useEffect(() => {
//     const appearTimer = setTimeout(() => {
//       setIsVisible(true);
//     }, animationDelay);

//     // Trigger animation to circle after the rectangle appears
//     const compactTimer = setTimeout(() => {
//       setIsCompact(true);
//     }, animationDelay + 4000);

//     return () => {
//       clearTimeout(appearTimer);
//       clearTimeout(compactTimer);
//     };
//   }, [animationDelay]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   if (!isVisible) return null;

//   return (
//     <motion.li
//       initial={{ opacity: 0, y: -5 }}
//       animate={{
//         opacity: 1,
//         y: 0,
//         width: isCompact ? "4rem" : "100%",
//         height: isCompact ? "4rem" : "1.25rem",
//         borderRadius: isCompact ? "9999px" : "0.375rem",
//       }}
//       transition={{
//         duration: 0.4,
//         type: "spring",
//         stiffness: 100
//       }}
//       className="
//         flex
//         items-center
//         justify-center
//         bg-lime-500
//         shadow-sm
//         hover:shadow-md
//         border
//         border-gray-100
//         overflow-hidden
//         relative
//         m-1
//       "
//     >
//       <AnimatePresence>
//         {!isCompact && (
//           <motion.div
//             className="flex items-center justify-between w-full px-2"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}
//           >
//             <div className="flex items-center space-x-2">
//               <span className="font-semibold text-xs text-gray-800">#{index + 1}</span>
//               <span className="text-xs text-gray-600">{displayIdentifier}</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <span className="text-xs text-gray-700">
//                 {bet.result &&
//                   <span className={`${bet.result === 'win' ? 'text-green-800' : 'text-red-800'}`}>
//                     {bet.result}
//                   </span>
//                 }
//               </span>
//               <span className="text-xs font-medium text-gray-900">
//                 {CURRENCY_SYMBOL}{Number(bet.betAmount).toFixed(2)}
//               </span>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isCompact && (
//           <motion.div
//             className="flex flex-col items-center justify-center text-center"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3 }}
//           >
//             <div className="font-bold text-xs text-gray-800">
//               #{index + 1}
//             </div>
//             <div className="text-xs text-gray-900 font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(2)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => {
//   // Limit the number of displayed bets to prevent overflow
//   const MAX_VISIBLE_BETS = 9;
//   const visibleBets = bets.slice(0, MAX_VISIBLE_BETS);
//   const hiddenBetsCount = Math.max(0, bets.length - MAX_VISIBLE_BETS);

//   return (
//     <div className="bg-gradient-to-b from-gray-500 to-white rounded-xl shadow-md p-2 md:p-5 flex-1">
//       <h4 className="text-lg font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-200">
//         {title} {bets.length > 0 && <span className="text-sm text-gray-600">({bets.length})</span>}
//       </h4>
//       {bets.length > 0 ? (
//         <>
//           <div
//             className="
//             grid
//             grid-cols-3
//             gap-0
//             md:max-h-[320px]
//             overflow-hidden
//           ">
//             {visibleBets.map((bet, index) => (
//               <BetItem
//                 key={bet.betId || `${bet.side}-${index}`}
//                 bet={bet}
//                 index={index}
//                 animationDelay={index * 800} // Sequential appearance with 800ms delay
//               />
//             ))}
//           </div>
//           {hiddenBetsCount > 0 && (
//             <div className="text-xs text-center text-gray-600 mt-2">
//               +{hiddenBetsCount} more bets
//             </div>
//           )}
//         </>
//       ) : (
//         <p className="text-gray-500 text-center py-4">
//           No {title.toLowerCase()} yet
//         </p>
//       )}
//     </div>
//   );
// });

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;

//   return (
//     <section className="">
//       <h3 className="hidden md:block text-2xl font-bold mb-2 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-gray-500 text-center py-4">No updates</p>
//       ) : (
//         <div className="grid grid-cols-2 gap-0.5">
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//           />
//         </div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

/********************************************************************************************************************************** */

// import React, { useMemo, useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index }) => {
//   const [isCompact, setIsCompact] = useState(false);

//   // Trigger animation after a delay
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsCompact(true);
//     }, 3000 + index * 200); // Stagger the animations

//     return () => clearTimeout(timer);
//   }, [index]);

//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   return (
//     <motion.li
//       initial={{ opacity: 0, y: -10 }}
//       animate={{
//         opacity: 1,
//         y: 0,
//         width: isCompact ? "5rem" : "100%",
//         height: "5rem",
//         borderRadius: isCompact ? "9999px" : "0.5rem",
//       }}
//       transition={{
//         duration: 0.5,
//         type: "spring",
//         stiffness: 100,
//       }}
//       className="
//         flex
//         items-center
//         justify-center
//         bg-lime-500
//         shadow-sm
//         hover:shadow-md
//         border
//         border-gray-100
//         overflow-hidden
//         relative
//       ">
//       <AnimatePresence>
//         {!isCompact && (
//           <motion.div
//             className="flex items-center justify-between w-full px-3"
//             initial={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}>
//             <div className="font-semibold text-xs text-gray-800">
//               #{index + 1}
//             </div>
//             <div className="text-xs text-gray-900 font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(2)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isCompact && (
//           <motion.div
//             className="flex flex-col items-center justify-center text-center"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.3 }}>
//             <div className="font-bold text-sm text-gray-800">#{index + 1}</div>
//             <div className="text-xs text-gray-900 font-medium">
//               {CURRENCY_SYMBOL}
//               {Number(bet.betAmount).toFixed(2)}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => (
//   <div className="bg-gradient-to-b from-gray-500 to-white rounded-xl shadow-md p-2 md:p-5 flex-1">
//     <h4 className="text-lg font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-200">
//       {title}
//     </h4>
//     {bets.length > 0 ? (
//       <ul
//         className="
//         grid
//         grid-cols-3
//         gap-2
//         md:max-h-[320px]
//         md:overflow-y-auto
//         custom-scrollbar
//         pb-2
//         md:pb-0
//       ">
//         {bets.map((bet, index) => (
//           <BetItem
//             key={bet.betId || `${bet.side}-${index}`}
//             bet={bet}
//             index={index}
//           />
//         ))}
//       </ul>
//     ) : (
//       <p className="text-gray-500 text-center py-4">
//         No {title.toLowerCase()} yet
//       </p>
//     )}
//   </div>
// ));

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;

//   return (
//     <section className="">
//       <h3 className="hidden md:block text-2xl font-bold mb-2 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-gray-500 text-center py-4">No updates</p>
//       ) : (
//         <div className="grid grid-cols-2 gap-0.5">
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//           />
//         </div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

/***************************************************************************************************************************** */

// import React, { useMemo } from "react";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index }) => {
//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   return (
//     <li
//       className="
//       flex flex-row
//       items-center
//       justify-between
//       bg-lime-500
//       rounded-lg
//       shadow-sm
//       hover:shadow-md
//       transition-all
//       duration-200
//       border
//       border-gray-100
//       px-3
//       h-5
//       overflow-hidden
//     ">
//       <div className="flex items-center">
//         <span className="font-semibold text-xs text-gray-800">
//           #{index + 1}
//         </span>
//       </div>
//       <div className="flex items-center">
//         <p className="text-xs text-gray-900">
//           <span className="font-medium">
//             {CURRENCY_SYMBOL}
//             {Number(bet.betAmount).toFixed(2)}
//           </span>
//         </p>
//       </div>
//     </li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => (
//   <div className="bg-gradient-to-b from-gray-500 to-white rounded-xl shadow-md p-2 md:p-5 flex-1">
//     <h4 className="text-lg font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-200">
//       {title}
//     </h4>
//     {bets.length > 0 ? (
//       <ul
//         className="
//         flex
//         flex-col
//         gap-2
//         md:max-h-[320px]
//         md:overflow-y-auto
//         custom-scrollbar
//         pb-2
//         md:pb-0
//       ">
//         {bets.map((bet, index) => (
//           <BetItem
//             key={bet.betId || `${bet.side}-${index}`}
//             bet={bet}
//             index={index}
//           />
//         ))}
//       </ul>
//     ) : (
//       <p className="text-gray-500 text-center py-4">
//         No {title.toLowerCase()} yet
//       </p>
//     )}
//   </div>
// ));

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;

//   return (
//     <section className="">
//       <h3 className="hidden md:block text-2xl font-bold mb-2 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-gray-500 text-center py-4">No updates</p>
//       ) : (
//         <div className="grid grid-cols-2 gap-0.5">
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//           />
//         </div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

/***************************************************************************************************************************/

// import React, { useMemo } from "react";

// // Constant for currency symbol
// const CURRENCY_SYMBOL = "Ksh";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index }) => {
//   const displayIdentifier = useMemo(
//     () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
//     [bet.phone]
//   );

//   const resultAmount = useMemo(() => {
//     if (bet.result === "win") return bet.winAmount || bet.betAmount;
//     if (bet.result === "loss") return bet.lossAmount || bet.betAmount;
//     return null;
//   }, [bet]);

//   return (
//     <li
//       className="
//       flex flex-col md:flex-row
//       items-center
//       bg-lime-500
//       rounded-2xl
//       md:rounded-lg
//       shadow-sm
//       hover:shadow-md
//       transition-all
//       duration-200
//       border
//       border-gray-100
//       p-2
//       md:space-y-0
//       md:space-x-4
//     ">
//       <div className="flex justify-center items-center w-full md:w-auto">
//         <span className="font-semibold text-sm text-gray-800">
//           Bet #{index + 1}
//         </span>
//       </div>
//       <div className="flex flex-row md:flex-col items-center justify-center space-x-4 md:space-x-0 md:space-y-2 w-full">
//         <p className="text-gray-700 text-center">
//           Amount <br />
//           <span className="font-medium text-gray-900">
//             {CURRENCY_SYMBOL}
//             {Number(bet.betAmount).toFixed(2)}
//           </span>
//         </p>
//       </div>
//     </li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => (
//   <div className="bg-gradient-to-b from-gray-500 to-white rounded-xl shadow-md p-2 md:p-5 flex-1">
//     <h4 className="text-lg font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-200">
//       {title}
//     </h4>
//     {bets.length > 0 ? (
//       <ul
//         className="
//         flex
//         flex-row
//         md:flex-col
//         gap-3
//         overflow-x-auto
//         md:overflow-x-visible
//         md:max-h-[320px]
//         md:overflow-y-auto
//         custom-scrollbar
//         pb-2
//         md:pb-0
//       ">
//         {bets.map((bet, index) => (
//           <BetItem
//             key={bet.betId || `${bet.side}-${index}`}
//             bet={bet}
//             index={index}
//           />
//         ))}
//       </ul>
//     ) : (
//       <p className="text-gray-500 text-center py-4">
//         No {title.toLowerCase()} yet
//       </p>
//     )}
//   </div>
// ));

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   const noBets = headBets.length === 0 && tailBets.length === 0;

//   return (
//     <section className="">
//       <h3 className="hidden md:block text-2xl font-bold  mb-2 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       {noBets ? (
//         <p className="text-gray-500 text-center py-4">No updates</p>
//       ) : (
//         <div className="grid grid-cols-2 gap-0.5">
//           <BetSection
//             title="Heads Bets"
//             bets={headBets}
//           />
//           <BetSection
//             title="Tails Bets"
//             bets={tailBets}
//           />
//         </div>
//       )}
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

/************************************************************************************************************************* */

/* <p
          className={`font-medium text-center ${
            bet.result === "win"
              ? "text-green-600"
              : bet.result === "loss"
              ? "text-red-600"
              : "text-gray-500"
          }`}>
          {bet.result === "win"
            ? "Won"
            : bet.result === "loss"
            ? "Lost"
            : "Pending"}
        </p> */

//********************************************************************************************************************************************************************************************************************************************************* */
