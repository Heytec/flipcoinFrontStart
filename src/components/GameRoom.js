import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearError, fetchCurrentRound } from "../features/roundSlice";
import useAblyGameRoom from "../hooks/useAblyGameRoom";
import useBalanceRealtime from "../hooks/useBalanceRealtime";
import BetForm from "./BetForm";
import CoinFlip from "./CoinFlip";
import UserBets from "./UserBets";
import TopWinsBets from "./TopWinsBets";
import ActiveBet from "./ActiveBet";
import BetUpdates from "./BetUpdates";
import RoundHistory from "./RoundHistory";
import { toast as originalToast } from "react-toastify";
import ToastContainerWrapper from "./ToastContainerWrapper";
import NoActiveRound from "./NoActiveRound";
import LoadingSpinner from "./LoadingSpinner";
import GameRoomTabs from "./GameRoomTabs";

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Toast wrapper to log and guard against null/undefined
const toast = {
  success: (message, options) => {
    console.log("toast.success called:", { message, options });
    if (message) originalToast.success(message, options);
    else console.warn("Blocked null/undefined toast.success");
  },
  error: (message, options) => {
    console.log("toast.error called:", { message, options });
    if (message) originalToast.error(message, options);
    else console.warn("Blocked null/undefined toast.error");
  },
  info: (message, options) => {
    console.log("toast.info called:", { message, options });
    if (message) originalToast.info(message, options);
    else console.warn("Blocked null/undefined toast.info");
  },
  dismiss: () => originalToast.dismiss(),
};

export const formatResultMessage = (round) => {
  console.log("formatResultMessage called with:", round);
  if (!round?.outcome) {
    return { message: "Round outcome not available", type: "info" };
  }
  return {
    message: `Round ${round.roundNumber}: ${
      round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1)
    } wins!`,
    type: "info",
  };
};

export const getErrorMessage = (err) => {
  // Return empty string for null/undefined to avoid "null" string
  if (!err) {
    console.log("getErrorMessage called with null/undefined, returned: ''");
    return "";
  }
  const msg =
    err?.message ||
    (typeof err === "string" ? err : JSON.stringify(err)) ||
    "";
  console.log("getErrorMessage called with:", err, "returned:", msg);
  return msg;
};

const GameRoom = () => {
  const dispatch = useDispatch();
  const { currentRound, jackpot, betResults = [], loading, error } = useSelector(
    (state) => state.round
  );
  const authUser = useSelector((state) => state.auth.user);

  const [timeLeft, setTimeLeft] = useState(0);
  const [activeTab, setActiveTab] = useState("activeBet");
  const timerRef = useRef(null);
  const autoRefreshRef = useRef(null);
  const processedBetsRef = useRef(new Set());

  useAblyGameRoom();
  useBalanceRealtime();


  const errorMsg = useMemo(() => getErrorMessage(error), [error]);
  const noActiveRoundError = useMemo(() => {
    const result =
      !loading &&
      (errorMsg.toLowerCase().includes("no active round") || !currentRound);
    console.log("noActiveRoundError:", result, { loading, errorMsg, currentRound });
    return result;
  }, [loading, currentRound, errorMsg]);

  const userActiveBets = useMemo(() => {
    if (!authUser || !currentRound) return [];
    return betResults.filter(
      (bet) =>
        bet.roundId === currentRound._id &&
        (bet.user === authUser._id || bet.phone === authUser.phone)
    );
  }, [betResults, currentRound, authUser]);

  const canBet = useMemo(() => {
    if (!authUser || !currentRound) return false;
    return !betResults.some(
      (bet) =>
        bet.roundId === currentRound._id &&
        (bet.user === authUser._id || bet.phone === authUser.phone) &&
        !bet.result
    );
  }, [betResults, authUser, currentRound]);

  const currentBets = useMemo(
    () => ({
      head: betResults.filter(
        (bet) => bet.side === "heads" && bet.roundId === currentRound?._id
      ),
      tail: betResults.filter(
        (bet) => bet.side === "tails" && bet.roundId === currentRound?._id
      ),
    }),
    [betResults, currentRound]
  );

  const handleBetResult = useCallback(
    (bet) => {
      console.log("handleBetResult called with:", bet);
      const betKey = `${bet.betId || bet._id}_${bet.result}`;
      if (
        !authUser ||
        !currentRound ||
        !bet.result ||
        processedBetsRef.current.has(betKey)
      ) {
        console.log("handleBetResult skipped:", { betKey, authUser, currentRound });
        return;
      }

      const isUserBet = bet.user === authUser._id || bet.phone === authUser.phone;
      if (!isUserBet || bet.gameRound !== currentRound._id) return;

      processedBetsRef.current.add(betKey);
      const amount =
        bet.result === "win"
          ? bet.winAmount || bet.betAmount
          : bet.lossAmount || bet.betAmount;
      const message =
        bet.result === "win"
          ? `🎉 Round #${currentRound.roundNumber}: You won $${Number(amount).toFixed(2)}!`
          : `💫 Round #${currentRound.roundNumber}: You lost $${Number(amount).toFixed(2)}`;

      if (message) {
        toast[bet.result === "win" ? "success" : "error"](message, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: `toast-${bet.result}`,
          toastId: betKey,
        });
      } else {
        console.warn("No message generated for bet result:", bet);
      }
    },
    [authUser, currentRound]
  );

  const handleRefresh = useCallback(
    debounce(async () => {
      console.log("handleRefresh triggered");
      toast.dismiss();
      try {
        await dispatch(fetchCurrentRound()).unwrap();
        toast.success("Game refreshed");
      } catch (err) {
        toast.error("Refresh failed");
      }
    }, 500),
    [dispatch]
  );

  useEffect(() => {
    console.log("betResults useEffect:", { betResults, authUser, currentRound });
    if (!betResults.length || !authUser || !currentRound) return;

    betResults.forEach((bet) => {
      if (bet.result) handleBetResult(bet);
    });
  }, [betResults, handleBetResult, authUser, currentRound]);

  useEffect(() => {
    console.log("currentRound useEffect:", currentRound);
    if (!currentRound) return;

    if (currentRound.outcome && currentRound.outcome !== "processing") {
      setTimeLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const now = Date.now();
    const countdownEnd = new Date(currentRound.countdownEndTime).getTime();
    const endTime = new Date(currentRound.endTime).getTime();
    const targetTime = now < countdownEnd ? countdownEnd : endTime;

    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timerRef.current);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentRound]);

  useEffect(() => {
    console.log("noActiveRoundError useEffect:", noActiveRoundError);
    if (noActiveRoundError) {
      autoRefreshRef.current = setInterval(() => dispatch(fetchCurrentRound()), 10000);
      return () => clearInterval(autoRefreshRef.current);
    }
  }, [noActiveRoundError, dispatch]);

  useEffect(() => {
    console.log("errorMsg useEffect:", errorMsg);
    // Only show toast for meaningful errors
    if (
      errorMsg &&
      !errorMsg.toLowerCase().includes("no active round") &&
      errorMsg !== "null" // Explicitly block "null" string
    ) {
      toast.error(errorMsg);
    }
  }, [errorMsg]);

  useEffect(() => {
    console.log("Component mounted or updated:", { loading, currentRound, betResults });
  }, [loading, currentRound, betResults]);

  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-lg text-gray-700">Please log in to play</p>
        </div>
      </div>
    );
  }

  const toastStyles = `
    .toast-success {
      background-color: #10B981;
      color: white;
      font-weight: 500;
    }
    .toast-error {
      background-color: #EF4444;
      color: white;
      font-weight: 500;
    }
  `;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <style>{toastStyles}</style>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Coin Flip Game</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>

      {loading && <LoadingSpinner />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <RoundHistory />
        </div>
        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-xl p-6 shadow-lg hover:scale-105 transition-transform duration-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white uppercase tracking-wide">
              Jackpot
            </h3>
            <p className="text-3xl font-bold text-white mt-2 drop-shadow-md">
              ${Number(jackpot || 0).toFixed(2)}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white">
                Total Pool
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {noActiveRoundError ? (
            <NoActiveRound onRefresh={handleRefresh} isLoading={loading} />
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Round #{currentRound?.roundNumber || "N/A"}
                  </h2>
                  {currentRound?.outcome === null && (
                    <span className="text-lg font-medium text-blue-600">
                      {timeLeft}s Left
                    </span>
                  )}
                </div>
                <CoinFlip round={currentRound} />
                {currentRound?.outcome === null &&
                  (Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
                    canBet ? (
                      <BetForm
                        roundId={currentRound._id}
                        onBetSuccess={(amount, side) => {
                          const msg = `Bet $${amount} on ${side}!`;
                          if (msg) toast.success(msg);
                        }}
                        onBetError={(err) => {
                          if (err) toast.error(err);
                        }}
                      />
                    ) : (
                      <p className="text-yellow-600 font-medium mt-4">
                        You already placed a bet for this round.
                      </p>
                    )
                  ) : (
                    <p className="text-red-500 font-medium mt-4">Betting Closed</p>
                  ))}
              </div>
              <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              <div className="bg-white rounded-xl shadow-md p-6">
                {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
                {activeTab === "betHistory" && <UserBets />}
                {activeTab === "topWins" && <TopWinsBets />}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <BetUpdates headBets={currentBets.head} tailBets={currentBets.tail} />
        </div>
      </div>

      <ToastContainerWrapper />
    </div>
  );
};

export default React.memo(GameRoom);
// import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// // export const formatResultMessage = (round) => {
// //   if (!round?.outcome) return null;
// //   return {
// //     message: `Round ${round.roundNumber}: ${
// //       round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1)
// //     } wins!`,
// //     type: "info",
// //   };
// // };
// export const formatResultMessage = (round) => {
//   if (!round?.outcome) {
//     return { message: "Round outcome not available", type: "info" };
//   }
//   return {
//     message: `Round ${round.roundNumber}: ${round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1)} wins!`,
//     type: "info",
//   };
// };


// export const getErrorMessage = (err) => {
//   return err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || "";
// };

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } = useSelector(
//     (state) => state.round
//   );
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const processedBetsRef = useRef(new Set());

//   useAblyGameRoom();

//   const errorMsg = useMemo(() => getErrorMessage(error), [error]);
//   const noActiveRoundError = useMemo(
//     () =>
//       !loading && (errorMsg.toLowerCase().includes("no active round") || !currentRound),
//     [loading, currentRound, errorMsg]
//   );

//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter(
//       (bet) =>
//         bet.roundId === currentRound._id &&
//         (bet.user === authUser._id || bet.phone === authUser.phone)
//     );
//   }, [betResults, currentRound, authUser]);

//   // Only allow a new bet if there's no unresolved bet in the current round
//   const canBet = useMemo(() => {
//     if (!authUser || !currentRound) return false;
//     return !betResults.some(
//       (bet) =>
//         bet.roundId === currentRound._id &&
//         (bet.user === authUser._id || bet.phone === authUser.phone) &&
//         !bet.result
//     );
//   }, [betResults, authUser, currentRound]);

//   const currentBets = useMemo(
//     () => ({
//       head: betResults.filter(
//         (bet) => bet.side === "heads" && bet.roundId === currentRound?._id
//       ),
//       tail: betResults.filter(
//         (bet) => bet.side === "tails" && bet.roundId === currentRound?._id
//       ),
//     }),
//     [betResults, currentRound]
//   );

//   const handleBetResult = useCallback(
//     (bet) => {
//       const betKey = `${bet.betId || bet._id}_${bet.result}`;
//       if (
//         !authUser ||
//         !currentRound ||
//         !bet.result ||
//         processedBetsRef.current.has(betKey)
//       )
//         return;

//       const isUserBet = bet.user === authUser._id || bet.phone === authUser.phone;
//       if (!isUserBet || bet.gameRound !== currentRound._id) return;

//       processedBetsRef.current.add(betKey);
//       const amount =
//         bet.result === "win" ? bet.winAmount || bet.betAmount : bet.lossAmount || bet.betAmount;
//       const message =
//         bet.result === "win"
//           ? `🎉 Round #${currentRound.roundNumber}: You won $${Number(amount).toFixed(2)}!`
//           : `💫 Round #${currentRound.roundNumber}: You lost $${Number(amount).toFixed(2)}`;

//       toast[bet.result === "win" ? "success" : "error"](message, {
//         position: "top-center",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         className: `toast-${bet.result}`,
//         toastId: betKey,
//       });

//       console.log(`Toast triggered for bet ${bet.betId || bet._id}: ${message}`);
//     },
//     [authUser, currentRound]
//   );

//   const handleRefresh = useCallback(async () => {
//     try {
//       await dispatch(fetchCurrentRound()).unwrap();
//       toast.success("Game refreshed");
//     } catch (err) {
//       toast.error("Refresh failed");
//     }
//   }, [dispatch]);

//   useEffect(() => {
//     if (!betResults.length || !authUser || !currentRound) return;

//     console.log("Current betResults:", betResults); // Debug log
//     betResults.forEach((bet) => {
//       if (bet.result) handleBetResult(bet);
//     });
//   }, [betResults, handleBetResult, authUser, currentRound]);

//   useEffect(() => {
//     if (!currentRound) return;

//     if (currentRound.outcome && currentRound.outcome !== "processing") {
//       setTimeLeft(0);
//       if (timerRef.current) clearInterval(timerRef.current);
//       return;
//     }

//     const now = Date.now();
//     const countdownEnd = new Date(currentRound.countdownEndTime).getTime();
//     const endTime = new Date(currentRound.endTime).getTime();
//     const targetTime = now < countdownEnd ? countdownEnd : endTime;

//     timerRef.current = setInterval(() => {
//       const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0) clearInterval(timerRef.current);
//     }, 1000);

//     return () => clearInterval(timerRef.current);
//   }, [currentRound]);

//   useEffect(() => {
//     if (noActiveRoundError) {
//       autoRefreshRef.current = setInterval(() => dispatch(fetchCurrentRound()), 10000);
//       return () => clearInterval(autoRefreshRef.current);
//     }
//   }, [noActiveRoundError, dispatch]);

//   useEffect(() => {
//     if (errorMsg && !errorMsg.toLowerCase().includes("no active round")) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   if (!authUser) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           <p className="text-lg text-gray-700">Please log in to play</p>
//         </div>
//       </div>
//     );
//   }

//   const toastStyles = `
//     .toast-success {
//       background-color: #10B981;
//       color: white;
//       font-weight: 500;
//     }
//     .toast-error {
//       background-color: #EF4444;
//       color: white;
//       font-weight: 500;
//     }
//   `;

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       <style>{toastStyles}</style>
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold text-gray-800">Coin Flip Game</h1>
//         <button
//           onClick={handleRefresh}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         >
//           Refresh
//         </button>
//       </div>

//       {loading && <LoadingSpinner />}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//         <div className="md:col-span-2">
//           <RoundHistory />
//         </div>
//         <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-xl p-6 shadow-lg hover:scale-105 transition-transform duration-200">
//           <div className="text-center">
//             <h3 className="text-lg font-semibold text-white uppercase tracking-wide">Jackpot</h3>
//             <p className="text-3xl font-bold text-white mt-2 drop-shadow-md">
//               ${Number(jackpot || 0).toFixed(2)}
//             </p>
//             <div className="mt-3 flex justify-center gap-2">
//               <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white">
//                 Total Pool
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 space-y-6">
//           {noActiveRoundError ? (
//             <NoActiveRound onRefresh={handleRefresh} isLoading={loading} />
//           ) : (
//             <div className="space-y-6">
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-xl font-semibold text-gray-800">
//                     Round #{currentRound?.roundNumber || "N/A"}
//                   </h2>
//                   {currentRound?.outcome === null && (
//                     <span className="text-lg font-medium text-blue-600">
//                       {timeLeft}s Left
//                     </span>
//                   )}
//                 </div>
//                 <CoinFlip round={currentRound} />
//                 {currentRound?.outcome === null &&
//                   (Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//                     canBet ? (
//                       <BetForm
//                         roundId={currentRound._id}
//                         onBetSuccess={(amount, side) =>
//                           toast.success(`Bet $${amount} on ${side}!`)
//                         }
//                         onBetError={(err) => toast.error(err)}
//                       />
//                     ) : (
//                       <p className="text-yellow-600 font-medium mt-4">
//                         You already placed a bet for this round.
//                       </p>
//                     )
//                   ) : (
//                     <p className="text-red-500 font-medium mt-4">Betting Closed</p>
//                   ))}
//               </div>
//               <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//                 {activeTab === "betHistory" && <UserBets />}
//                 {activeTab === "topWins" && <TopWinsBets />}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="space-y-6">
//           <BetUpdates headBets={currentBets.head} tailBets={currentBets.tail} />
//         </div>
//       </div>

//       <ToastContainerWrapper />
//     </div>
//   );
// };

// export default React.memo(GameRoom);

// // // src/components/GameRoom.js
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// export const formatResultMessage = (round) => {
//   if (!round?.outcome) return null;
//   return {
//     message: `Round ${round.roundNumber}: ${
//       round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1)
//     } wins!`,
//     type: "info",
//   };
// };

// export const getErrorMessage = (err) => {
//   return err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || "";
// };

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } = useSelector(
//     (state) => state.round
//   );
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const processedBetsRef = useRef(new Set());

//   useAblyGameRoom();

//   const errorMsg = useMemo(() => getErrorMessage(error), [error]);
//   const noActiveRoundError = useMemo(
//     () =>
//       !loading && (errorMsg.toLowerCase().includes("no active round") || !currentRound),
//     [loading, currentRound, errorMsg]
//   );

//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter(
//       (bet) =>
//         bet.roundId === currentRound._id &&
//         (bet.user === authUser._id || bet.phone === authUser.phone)
//     );
//   }, [betResults, currentRound, authUser]);

//   // Check for unresolved bets, but only for rounds that haven't ended
//   const hasUnresolvedBet = useMemo(() => {
//     if (!authUser || !currentRound) return false;
//     return betResults.some(
//       (bet) =>
//         (bet.user === authUser._id || bet.phone === authUser.phone) &&
//         !bet.result && // Unresolved
//         bet.roundId !== currentRound._id // Exclude current round for this check
//     );
//   }, [betResults, authUser, currentRound]);

//   const canBet = useMemo(() => {
//     return (
//       !userActiveBets.length && // No bet in current round
//       !hasUnresolvedBet // No unresolved bets in previous rounds
//     );
//   }, [userActiveBets, hasUnresolvedBet]);

//   const currentBets = useMemo(
//     () => ({
//       head: betResults.filter(
//         (bet) => bet.side === "heads" && bet.roundId === currentRound?._id
//       ),
//       tail: betResults.filter(
//         (bet) => bet.side === "tails" && bet.roundId === currentRound?._id
//       ),
//     }),
//     [betResults, currentRound]
//   );

//   const handleBetResult = useCallback(
//     (bet) => {
//       const betKey = `${bet.betId || bet._id}_${bet.result}`;
//       if (
//         !authUser ||
//         !currentRound ||
//         !bet.result ||
//         processedBetsRef.current.has(betKey)
//       )
//         return;

//       const isUserBet = bet.user === authUser._id || bet.phone === authUser.phone;
//       if (!isUserBet || bet.gameRound !== currentRound._id) return;

//       processedBetsRef.current.add(betKey);
//       const amount =
//         bet.result === "win" ? bet.winAmount || bet.betAmount : bet.lossAmount || bet.betAmount;
//       const message =
//         bet.result === "win"
//           ? `🎉 Round #${currentRound.roundNumber}: You won $${Number(amount).toFixed(2)}!`
//           : `💫 Round #${currentRound.roundNumber}: You lost $${Number(amount).toFixed(2)}`;

//       toast[bet.result === "win" ? "success" : "error"](message, {
//         position: "top-center",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         className: `toast-${bet.result}`,
//         toastId: betKey,
//       });

//       console.log(`Toast triggered for bet ${bet.betId || bet._id}: ${message}`);
//     },
//     [authUser, currentRound]
//   );

//   const handleRefresh = useCallback(async () => {
//     try {
//       await dispatch(fetchCurrentRound()).unwrap();
//       toast.success("Game refreshed");
//     } catch (err) {
//       toast.error("Refresh failed");
//     }
//   }, [dispatch]);

//   useEffect(() => {
//     if (!betResults.length || !authUser || !currentRound) return;

//     console.log("Current betResults:", betResults); // Debug log
//     betResults.forEach((bet) => {
//       if (bet.result) handleBetResult(bet);
//     });
//   }, [betResults, handleBetResult, authUser, currentRound]);

//   useEffect(() => {
//     if (!currentRound) return;

//     if (currentRound.outcome && currentRound.outcome !== "processing") {
//       setTimeLeft(0);
//       if (timerRef.current) clearInterval(timerRef.current);
//       return;
//     }

//     const now = Date.now();
//     const countdownEnd = new Date(currentRound.countdownEndTime).getTime();
//     const endTime = new Date(currentRound.endTime).getTime();
//     const targetTime = now < countdownEnd ? countdownEnd : endTime;

//     timerRef.current = setInterval(() => {
//       const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0) clearInterval(timerRef.current);
//     }, 1000);

//     return () => clearInterval(timerRef.current);
//   }, [currentRound]);

//   useEffect(() => {
//     if (noActiveRoundError) {
//       autoRefreshRef.current = setInterval(() => dispatch(fetchCurrentRound()), 10000);
//       return () => clearInterval(autoRefreshRef.current);
//     }
//   }, [noActiveRoundError, dispatch]);

//   useEffect(() => {
//     if (errorMsg && !errorMsg.toLowerCase().includes("no active round")) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   if (!authUser) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           <p className="text-lg text-gray-700">Please log in to play</p>
//         </div>
//       </div>
//     );
//   }

//   const toastStyles = `
//     .toast-success {
//       background-color: #10B981;
//       color: white;
//       font-weight: 500;
//     }
//     .toast-error {
//       background-color: #EF4444;
//       color: white;
//       font-weight: 500;
//     }
//   `;

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       <style>{toastStyles}</style>
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold text-gray-800">Coin Flip Game</h1>
//         <button
//           onClick={handleRefresh}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         >
//           Refresh
//         </button>
//       </div>

//       {loading && <LoadingSpinner />}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//         <div className="md:col-span-2">
//           <RoundHistory />
//         </div>
//         <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-xl p-6 shadow-lg hover:scale-105 transition-transform duration-200">
//           <div className="text-center">
//             <h3 className="text-lg font-semibold text-white uppercase tracking-wide">Jackpot</h3>
//             <p className="text-3xl font-bold text-white mt-2 drop-shadow-md">
//               ${Number(jackpot || 0).toFixed(2)}
//             </p>
//             <div className="mt-3 flex justify-center gap-2">
//               <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white">
//                 Total Pool
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 space-y-6">
//           {noActiveRoundError ? (
//             <NoActiveRound onRefresh={handleRefresh} isLoading={loading} />
//           ) : (
//             <div className="space-y-6">
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-xl font-semibold text-gray-800">
//                     Round #{currentRound?.roundNumber || "N/A"}
//                   </h2>
//                   {currentRound?.outcome === null && (
//                     <span className="text-lg font-medium text-blue-600">
//                       {timeLeft}s Left
//                     </span>
//                   )}
//                 </div>
//                 <CoinFlip round={currentRound} />
//                 {currentRound?.outcome === null && (
//                   Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//                     canBet ? (
//                       <BetForm
//                         roundId={currentRound._id}
//                         onBetSuccess={(amount, side) =>
//                           toast.success(`Bet $${amount} on ${side}!`)
//                         }
//                         onBetError={(err) => toast.error(err)}
//                       />
//                     ) : (
//                       <p className="text-yellow-600 font-medium mt-4">
//                         {userActiveBets.length
//                           ? "You already placed a bet this round."
//                           : "Please wait for your previous bet to resolve."}
//                       </p>
//                     )
//                   ) : (
//                     <p className="text-red-500 font-medium mt-4">Betting Closed</p>
//                   )
//                 )}
//               </div>
//               <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//                 {activeTab === "betHistory" && <UserBets />}
//                 {activeTab === "topWins" && <TopWinsBets />}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="space-y-6">
//           <BetUpdates headBets={currentBets.head} tailBets={currentBets.tail} />
//         </div>
//       </div>

//       <ToastContainerWrapper />
//     </div>
//   );
// };

// export default React.memo(GameRoom);
// import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// export const formatResultMessage = (round) => {
//   if (!round?.outcome) return null;
//   return {
//     message: `Round ${round.roundNumber}: ${
//       round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1)
//     } wins!`,
//     type: "info",
//   };
// };

// export const getErrorMessage = (err) => {
//   return err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || "";
// };

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } = useSelector(
//     (state) => state.round
//   );
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const processedBetsRef = useRef(new Set());

//   useAblyGameRoom();

//   const errorMsg = useMemo(() => getErrorMessage(error), [error]);
//   const noActiveRoundError = useMemo(
//     () =>
//       !loading && (errorMsg.toLowerCase().includes("no active round") || !currentRound),
//     [loading, currentRound, errorMsg]
//   );

//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter(
//       (bet) =>
//         bet.roundId === currentRound._id &&
//         (bet.user === authUser._id || bet.phone === authUser.phone)
//     );
//   }, [betResults, currentRound, authUser]);

//   // Check for any unresolved bets across all rounds
//   const hasUnresolvedBet = useMemo(() => {
//     if (!authUser) return false;
//     return betResults.some(
//       (bet) =>
//         (bet.user === authUser._id || bet.phone === authUser.phone) &&
//         !bet.result // No result means the round hasn't ended
//     );
//   }, [betResults, authUser]);

//   const canBet = useMemo(() => {
//     return (
//       !userActiveBets.length && // No bet in current round
//       !hasUnresolvedBet // No unresolved bets in any round
//     );
//   }, [userActiveBets, hasUnresolvedBet]);

//   const currentBets = useMemo(
//     () => ({
//       head: betResults.filter(
//         (bet) => bet.side === "heads" && bet.roundId === currentRound?._id
//       ),
//       tail: betResults.filter(
//         (bet) => bet.side === "tails" && bet.roundId === currentRound?._id
//       ),
//     }),
//     [betResults, currentRound]
//   );

//   const handleBetResult = useCallback(
//     (bet) => {
//       const betKey = `${bet.betId || bet._id}_${bet.result}`;
//       if (
//         !authUser ||
//         !currentRound ||
//         !bet.result ||
//         processedBetsRef.current.has(betKey)
//       )
//         return;

//       const isUserBet = bet.user === authUser._id || bet.phone === authUser.phone;
//       if (!isUserBet || bet.gameRound !== currentRound._id) return;

//       processedBetsRef.current.add(betKey);
//       const amount =
//         bet.result === "win" ? bet.winAmount || bet.betAmount : bet.lossAmount || bet.betAmount;
//       const message =
//         bet.result === "win"
//           ? `🎉 Round #${currentRound.roundNumber}: You won $${Number(amount).toFixed(2)}!`
//           : `💫 Round #${currentRound.roundNumber}: You lost $${Number(amount).toFixed(2)}`;

//       toast[bet.result === "win" ? "success" : "error"](message, {
//         position: "top-center",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         className: `toast-${bet.result}`,
//         toastId: betKey,
//       });

//       console.log(`Toast triggered for bet ${bet.betId || bet._id}: ${message}`);
//     },
//     [authUser, currentRound]
//   );

//   const handleRefresh = useCallback(async () => {
//     try {
//       await dispatch(fetchCurrentRound()).unwrap();
//       toast.success("Game refreshed");
//     } catch (err) {
//       toast.error("Refresh failed");
//     }
//   }, [dispatch]);

//   useEffect(() => {
//     if (!betResults.length || !authUser || !currentRound) return;

//     betResults.forEach((bet) => {
//       if (bet.result) handleBetResult(bet);
//     });
//   }, [betResults, handleBetResult, authUser, currentRound]);

//   useEffect(() => {
//     if (!currentRound) return;

//     if (currentRound.outcome && currentRound.outcome !== "processing") {
//       setTimeLeft(0);
//       if (timerRef.current) clearInterval(timerRef.current);
//       return;
//     }

//     const now = Date.now();
//     const countdownEnd = new Date(currentRound.countdownEndTime).getTime();
//     const endTime = new Date(currentRound.endTime).getTime();
//     const targetTime = now < countdownEnd ? countdownEnd : endTime;

//     timerRef.current = setInterval(() => {
//       const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0) clearInterval(timerRef.current);
//     }, 1000);

//     return () => clearInterval(timerRef.current);
//   }, [currentRound]);

//   useEffect(() => {
//     if (noActiveRoundError) {
//       autoRefreshRef.current = setInterval(() => dispatch(fetchCurrentRound()), 10000);
//       return () => clearInterval(autoRefreshRef.current);
//     }
//   }, [noActiveRoundError, dispatch]);

//   useEffect(() => {
//     if (errorMsg && !errorMsg.toLowerCase().includes("no active round")) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   if (!authUser) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           <p className="text-lg text-gray-700">Please log in to play</p>
//         </div>
//       </div>
//     );
//   }

//   const toastStyles = `
//     .toast-success {
//       background-color: #10B981;
//       color: white;
//       font-weight: 500;
//     }
//     .toast-error {
//       background-color: #EF4444;
//       color: white;
//       font-weight: 500;
//     }
//   `;

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       <style>{toastStyles}</style>
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold text-gray-800">Coin Flip Game</h1>
//         <button
//           onClick={handleRefresh}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         >
//           Refresh
//         </button>
//       </div>

//       {loading && <LoadingSpinner />}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//         <div className="md:col-span-2">
//           <RoundHistory />
//         </div>
//         <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-xl p-6 shadow-lg hover:scale-105 transition-transform duration-200">
//           <div className="text-center">
//             <h3 className="text-lg font-semibold text-white uppercase tracking-wide">Jackpot</h3>
//             <p className="text-3xl font-bold text-white mt-2 drop-shadow-md">
//               ${Number(jackpot || 0).toFixed(2)}
//             </p>
//             <div className="mt-3 flex justify-center gap-2">
//               <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white">
//                 Total Pool
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 space-y-6">
//           {noActiveRoundError ? (
//             <NoActiveRound onRefresh={handleRefresh} isLoading={loading} />
//           ) : (
//             <div className="space-y-6">
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-xl font-semibold text-gray-800">
//                     Round #{currentRound?.roundNumber || "N/A"}
//                   </h2>
//                   {currentRound?.outcome === null && (
//                     <span className="text-lg font-medium text-blue-600">
//                       {timeLeft}s Left
//                     </span>
//                   )}
//                 </div>
//                 <CoinFlip round={currentRound} />
//                 {currentRound?.outcome === null && (
//                   Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//                     canBet ? (
//                       <BetForm
//                         roundId={currentRound._id}
//                         onBetSuccess={(amount, side) =>
//                           toast.success(`Bet $${amount} on ${side}!`)
//                         }
//                         onBetError={(err) => toast.error(err)}
//                       />
//                     ) : (
//                       <p className="text-yellow-600 font-medium mt-4">
//                         {userActiveBets.length
//                           ? "You already placed a bet this round."
//                           : "Please wait for your previous bet to resolve."}
//                       </p>
//                     )
//                   ) : (
//                     <p className="text-red-500 font-medium mt-4">Betting Closed</p>
//                   )
//                 )}
//               </div>
//               <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//                 {activeTab === "betHistory" && <UserBets />}
//                 {activeTab === "topWins" && <TopWinsBets />}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="space-y-6">
//           <BetUpdates headBets={currentBets.head} tailBets={currentBets.tail} />
//         </div>
//       </div>

//       <ToastContainerWrapper />
//     </div>
//   );
// };

// export default React.memo(GameRoom);

// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// export const formatResultMessage = (round) => {
//   if (!round?.outcome) return null;
//   return {
//     message: `Round ${round.roundNumber}: ${
//       round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1)
//     } wins!`,
//     type: "info",
//   };
// };

// export const getErrorMessage = (err) => {
//   return err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || "";
// };

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } = useSelector(
//     (state) => state.round
//   );
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const processedBetsRef = useRef(new Set());

//   // Assume useAblyGameRoom updates Redux state with real-time events
//   useAblyGameRoom();

//   const errorMsg = useMemo(() => getErrorMessage(error), [error]);
//   const noActiveRoundError = useMemo(
//     () =>
//       !loading && (errorMsg.toLowerCase().includes("no active round") || !currentRound),
//     [loading, currentRound, errorMsg]
//   );

//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter(
//       (bet) =>
//         bet.roundId === currentRound._id &&
//         (bet.user === authUser._id || bet.phone === authUser.phone)
//     );
//   }, [betResults, currentRound, authUser]);

//   const currentBets = useMemo(
//     () => ({
//       head: betResults.filter(
//         (bet) => bet.side === "heads" && bet.roundId === currentRound?._id
//       ),
//       tail: betResults.filter(
//         (bet) => bet.side === "tails" && bet.roundId === currentRound?._id
//       ),
//     }),
//     [betResults, currentRound]
//   );

//   const handleBetResult = useCallback(
//     (bet) => {
//       const betKey = `${bet.betId || bet._id}_${bet.result}`;
//       if (
//         !authUser ||
//         !currentRound ||
//         !bet.result ||
//         processedBetsRef.current.has(betKey)
//       )
//         return;

//       const isUserBet = bet.user === authUser._id || bet.phone === authUser.phone;
//       if (!isUserBet || bet.gameRound !== currentRound._id) return;

//       processedBetsRef.current.add(betKey);
//       const amount =
//         bet.result === "win" ? bet.winAmount || bet.betAmount : bet.lossAmount || bet.betAmount;
//       const message =
//         bet.result === "win"
//           ? `🎉 Round #${currentRound.roundNumber}: You won $${Number(amount).toFixed(2)}!`
//           : `💫 Round #${currentRound.roundNumber}: You lost $${Number(amount).toFixed(2)}`;

//       toast[bet.result === "win" ? "success" : "error"](message, {
//         position: "top-center",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         className: `toast-${bet.result}`,
//         toastId: betKey,
//       });

//       console.log(`Toast triggered for bet ${bet.betId || bet._id}: ${message}`);
//     },
//     [authUser, currentRound]
//   );

//   const handleRefresh = useCallback(async () => {
//     try {
//       await dispatch(fetchCurrentRound()).unwrap();
//       toast.success("Game refreshed");
//     } catch (err) {
//       toast.error("Refresh failed");
//     }
//   }, [dispatch]);

//   useEffect(() => {
//     if (!betResults.length || !authUser || !currentRound) return;

//     betResults.forEach((bet) => {
//       if (bet.result) handleBetResult(bet);
//     });
//   }, [betResults, handleBetResult, authUser, currentRound]);

//   useEffect(() => {
//     if (!currentRound) return;

//     if (currentRound.outcome && currentRound.outcome !== "processing") {
//       setTimeLeft(0);
//       if (timerRef.current) clearInterval(timerRef.current);
//       return;
//     }

//     // Sync with countdownEndTime (betting phase) or endTime (round phase)
//     const now = Date.now();
//     const countdownEnd = new Date(currentRound.countdownEndTime).getTime();
//     const endTime = new Date(currentRound.endTime).getTime();
//     const targetTime = now < countdownEnd ? countdownEnd : endTime;

//     timerRef.current = setInterval(() => {
//       const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0) clearInterval(timerRef.current);
//     }, 1000);

//     return () => clearInterval(timerRef.current);
//   }, [currentRound]);

//   useEffect(() => {
//     if (noActiveRoundError) {
//       autoRefreshRef.current = setInterval(() => dispatch(fetchCurrentRound()), 10000);
//       return () => clearInterval(autoRefreshRef.current);
//     }
//   }, [noActiveRoundError, dispatch]);

//   useEffect(() => {
//     if (errorMsg && !errorMsg.toLowerCase().includes("no active round")) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   if (!authUser) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           <p className="text-lg text-gray-700">Please log in to play</p>
//         </div>
//       </div>
//     );
//   }

//   const toastStyles = `
//     .toast-success {
//       background-color: #10B981;
//       color: white;
//       font-weight: 500;
//     }
//     .toast-error {
//       background-color: #EF4444;
//       color: white;
//       font-weight: 500;
//     }
//   `;

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       <style>{toastStyles}</style>
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold text-gray-800">Coin Flip Game</h1>
//         <button
//           onClick={handleRefresh}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         >
//           Refresh
//         </button>
//       </div>

//       {loading && <LoadingSpinner />}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//         <div className="md:col-span-2">
//           <RoundHistory />
//         </div>
//         <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-xl p-6 shadow-lg hover:scale-105 transition-transform duration-200">
//           <div className="text-center">
//             <h3 className="text-lg font-semibold text-white uppercase tracking-wide">Jackpot</h3>
//             <p className="text-3xl font-bold text-white mt-2 drop-shadow-md">
//               ${Number(jackpot || 0).toFixed(2)}
//             </p>
//             <div className="mt-3 flex justify-center gap-2">
//               <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white">
//                 Total Pool
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 space-y-6">
//           {noActiveRoundError ? (
//             <NoActiveRound onRefresh={handleRefresh} isLoading={loading} />
//           ) : (
//             <div className="space-y-6">
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-xl font-semibold text-gray-800">
//                     Round #{currentRound?.roundNumber || "N/A"}
//                   </h2>
//                   {currentRound?.outcome === null && (
//                     <span className="text-lg font-medium text-blue-600">
//                       {timeLeft}s Left
//                     </span>
//                   )}
//                 </div>
//                 <CoinFlip round={currentRound} />
//                 {currentRound?.outcome === null && (
//                   Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//                     <BetForm
//                       roundId={currentRound._id}
//                       onBetSuccess={(amount, side) =>
//                         toast.success(`Bet $${amount} on ${side}!`)
//                       }
//                       onBetError={(err) => toast.error(err)}
//                     />
//                   ) : (
//                     <p className="text-red-500 font-medium mt-4">Betting Closed</p>
//                   )
//                 )}
//               </div>
//               <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//                 {activeTab === "betHistory" && <UserBets />}
//                 {activeTab === "topWins" && <TopWinsBets />}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="space-y-6">
//           <BetUpdates headBets={currentBets.head} tailBets={currentBets.tail} />
//         </div>
//       </div>

//       <ToastContainerWrapper />
//     </div>
//   );
// };

// export default React.memo(GameRoom);
// // src/components/GameRoom.js
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// export const formatResultMessage = (round) => {
//   if (!round?.outcome) return null;
//   return {
//     message: `Round ${round.roundNumber}: ${round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1)} wins!`,
//     type: "info",
//   };
// };

// export const getErrorMessage = (err) => {
//   return err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || "";
// };

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } = useSelector(
//     (state) => state.round
//   );
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const processedBetsRef = useRef(new Set());

//   useAblyGameRoom();

//   const errorMsg = useMemo(() => getErrorMessage(error), [error]);
//   const noActiveRoundError = useMemo(() => 
//     !loading && (errorMsg.toLowerCase().includes("no active round") || !currentRound),
//     [loading, currentRound, errorMsg]
//   );

//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter(bet => 
//       bet.roundId === currentRound._id && 
//       (bet.user === authUser._id || bet.phone === authUser.phone)
//     );
//   }, [betResults, currentRound, authUser]);

//   const currentBets = useMemo(() => ({
//     head: betResults.filter(bet => bet.side === "heads" && bet.roundId === currentRound?._id),
//     tail: betResults.filter(bet => bet.side === "tails" && bet.roundId === currentRound?._id)
//   }), [betResults, currentRound]);

//   const handleBetResult = useCallback((bet) => {
//     const betKey = `${bet._id}_${bet.result}`;
//     if (!authUser || !currentRound || processedBetsRef.current.has(betKey)) return;

//     const isUserBet = bet.user === authUser._id || bet.phone === authUser.phone;
//     if (isUserBet && bet.roundId === currentRound._id && bet.result) {
//       processedBetsRef.current.add(betKey);
//       toast[bet.result === "win" ? "success" : "error"](
//         bet.result === "win"
//           ? `🎉 Round #${currentRound.roundNumber}: You won $${Number(bet.winAmount || bet.amount).toFixed(2)}!`
//           : `💫 Round #${currentRound.roundNumber}: You lost $${Number(bet.betAmount).toFixed(2)}`,
//         {
//           position: "top-center",
//           autoClose: 5000,
//           className: `toast-${bet.result}`
//         }
//       );
//     }
//   }, [authUser, currentRound]);

//   const handleRefresh = useCallback(async () => {
//     try {
//       await dispatch(fetchCurrentRound()).unwrap();
//       toast.success("Game refreshed");
//     } catch (err) {
//       toast.error("Refresh failed");
//     }
//   }, [dispatch]);

//   useEffect(() => {
//     betResults.forEach(handleBetResult);
//   }, [betResults, handleBetResult]);

//   useEffect(() => {
//     if (!currentRound) return;

//     if (currentRound.outcome) {
//       setTimeLeft(0);
//       if (timerRef.current) clearInterval(timerRef.current);
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();
//     timerRef.current = setInterval(() => {
//       const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0) clearInterval(timerRef.current);
//     }, 1000);

//     return () => clearInterval(timerRef.current);
//   }, [currentRound]);

//   useEffect(() => {
//     if (noActiveRoundError) {
//       autoRefreshRef.current = setInterval(() => dispatch(fetchCurrentRound()), 10000);
//       return () => clearInterval(autoRefreshRef.current);
//     }
//   }, [noActiveRoundError, dispatch]);

//   useEffect(() => {
//     if (errorMsg && !errorMsg.toLowerCase().includes("no active round")) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   if (!authUser) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           <p className="text-lg text-gray-700">Please log in to play</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold text-gray-800">Coin Flip Game</h1>
//         <button 
//           onClick={handleRefresh}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         >
//           Refresh
//         </button>
//       </div>

//       {loading && <LoadingSpinner />}
      
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//         <div className="md:col-span-2">
//           <RoundHistory />
//         </div>
//         <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-xl p-6 shadow-lg hover:scale-105 transition-transform duration-200">
//           <div className="text-center">
//             <h3 className="text-lg font-semibold text-white uppercase tracking-wide">Jackpot</h3>
//             <p className="text-3xl font-bold text-white mt-2 drop-shadow-md">
//               ${Number(jackpot || 0).toFixed(2)}
//             </p>
//             <div className="mt-3 flex justify-center gap-2">
//               <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white">
//                 Total Pool
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 space-y-6">
//           {noActiveRoundError ? (
//             <NoActiveRound onRefresh={handleRefresh} isLoading={loading} />
//           ) : (
//             <div className="space-y-6">
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-xl font-semibold text-gray-800">
//                     Round #{currentRound?.roundNumber || "N/A"}
//                   </h2>
//                   {currentRound?.outcome === null && (
//                     <span className="text-lg font-medium text-blue-600">
//                       {timeLeft}s Left
//                     </span>
//                   )}
//                 </div>
//                 <CoinFlip round={currentRound} />
//                 {currentRound?.outcome === null && (
//                   Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//                     <BetForm
//                       roundId={currentRound._id}
//                       onBetSuccess={(amount, side) => 
//                         toast.success(`Bet $${amount} on ${side}!`)
//                       }
//                       onBetError={(err) => toast.error(err)}
//                     />
//                   ) : (
//                     <p className="text-red-500 font-medium mt-4">Betting Closed</p>
//                   )
//                 )}
//               </div>
//               <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//                 {activeTab === "betHistory" && <UserBets />}
//                 {activeTab === "topWins" && <TopWinsBets />}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="space-y-6">
//           <BetUpdates headBets={currentBets.head} tailBets={currentBets.tail} />
//         </div>
//       </div>

//       <ToastContainerWrapper />
//     </div>
//   );
// };

// export default React.memo(GameRoom);

// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// export const formatResultMessage = (round) => {
//   if (!round?.outcome) return null;
//   return {
//     message: `Round ${round.roundNumber}: ${round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1)} wins!`,
//     type: "info",
//   };
// };

// export const getErrorMessage = (err) => {
//   // Simplified error handling
//   return err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || "";
// };

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } = useSelector(
//     (state) => state.round
//   );
//   const authUser = useSelector((state) => state.auth.user);

//   // State management
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const processedBetsRef = useRef(new Set());

//   useAblyGameRoom();

//   // Memoized computations
//   const errorMsg = useMemo(() => getErrorMessage(error), [error]);
//   const noActiveRoundError = useMemo(() => 
//     !loading && (errorMsg.toLowerCase().includes("no active round") || !currentRound),
//     [loading, currentRound, errorMsg]
//   );

//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter(bet => 
//       bet.roundId === currentRound._id && 
//       (bet.user === authUser._id || bet.phone === authUser.phone)
//     );
//   }, [betResults, currentRound, authUser]);

//   const currentBets = useMemo(() => ({
//     head: betResults.filter(bet => bet.side === "heads" && bet.roundId === currentRound?._id),
//     tail: betResults.filter(bet => bet.side === "tails" && bet.roundId === currentRound?._id)
//   }), [betResults, currentRound]);

//   // Callback functions
//   const handleBetResult = useCallback((bet) => {
//     const betKey = `${bet._id}_${bet.result}`;
//     if (!authUser || !currentRound || processedBetsRef.current.has(betKey)) return;

//     const isUserBet = bet.user === authUser._id || bet.phone === authUser.phone;
//     if (isUserBet && bet.roundId === currentRound._id && bet.result) {
//       processedBetsRef.current.add(betKey);
//       toast[bet.result === "win" ? "success" : "error"](
//         bet.result === "win"
//           ? `🎉 Round #${currentRound.roundNumber}: You won $${Number(bet.winAmount || bet.amount).toFixed(2)}!`
//           : `💫 Round #${currentRound.roundNumber}: You lost $${Number(bet.betAmount).toFixed(2)}`,
//         {
//           position: "top-center",
//           autoClose: 5000,
//           className: `toast-${bet.result}`
//         }
//       );
//     }
//   }, [authUser, currentRound]);

//   const handleRefresh = useCallback(async () => {
//     try {
//       await dispatch(fetchCurrentRound()).unwrap();
//       toast.success("Game refreshed");
//     } catch (err) {
//       toast.error("Refresh failed");
//     }
//   }, [dispatch]);

//   // Effects
//   useEffect(() => {
//     betResults.forEach(handleBetResult);
//   }, [betResults, handleBetResult]);

//   useEffect(() => {
//     if (!currentRound) return;

//     if (currentRound.outcome) {
//       setTimeLeft(0);
//       if (timerRef.current) clearInterval(timerRef.current);
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();
//     timerRef.current = setInterval(() => {
//       const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0) clearInterval(timerRef.current);
//     }, 1000);

//     return () => clearInterval(timerRef.current);
//   }, [currentRound]);

//   useEffect(() => {
//     if (noActiveRoundError) {
//       autoRefreshRef.current = setInterval(() => dispatch(fetchCurrentRound()), 10000);
//       return () => clearInterval(autoRefreshRef.current);
//     }
//   }, [noActiveRoundError, dispatch]);

//   useEffect(() => {
//     if (errorMsg && !errorMsg.toLowerCase().includes("no active round")) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   if (!authUser) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           <p className="text-lg text-gray-700">Please log in to play</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold text-gray-800">Coin Flip Game</h1>
//         <button 
//           onClick={handleRefresh}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//         >
//           Refresh
//         </button>
//       </div>

//       {loading && <LoadingSpinner />}
      
//       {/* Round History and Jackpot at the top */}
//       <RoundHistory />
//       <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-4 text-center text-white mb-6">
//         <h3 className="text-xl font-bold">Jackpot: ${Number(jackpot || 0).toFixed(2)}</h3>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 space-y-6">
//           {noActiveRoundError ? (
//             <NoActiveRound onRefresh={handleRefresh} isLoading={loading} />
//           ) : (
//             <div className="space-y-6">
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h2 className="text-xl font-semibold">
//                     Round #{currentRound?.roundNumber || "N/A"}
//                   </h2>
//                   {currentRound?.outcome === null && (
//                     <span className="text-lg font-medium text-blue-600">
//                       {timeLeft}s Left
//                     </span>
//                   )}
//                 </div>
//                 <CoinFlip round={currentRound} />
//                 {currentRound?.outcome === null && (
//                   Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//                     <BetForm
//                       roundId={currentRound._id}
//                       onBetSuccess={(amount, side) => 
//                         toast.success(`Bet $${amount} on ${side}!`)
//                       }
//                       onBetError={(err) => toast.error(err)}
//                     />
//                   ) : (
//                     <p className="text-red-500 font-medium mt-4">Betting Closed</p>
//                   )
//                 )}
//               </div>
//               {/* GameRoomTabs below Coin Flip */}
//               <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//               <div className="bg-white rounded-xl shadow-md p-6">
//                 {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//                 {activeTab === "betHistory" && <UserBets />}
//                 {activeTab === "topWins" && <TopWinsBets />}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Bet Updates beside Coin Flip */}
//         <div className="space-y-6">
//           <BetUpdates headBets={currentBets.head} tailBets={currentBets.tail} />
//         </div>
//       </div>

//       <ToastContainerWrapper />
//     </div>
//   );
// };

// export default React.memo(GameRoom);

// import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// export const formatResultMessage = (round) => {
//   if (!round?.outcome) return null;
//   return {
//     message: `Round ${round.roundNumber}: ${round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1)} wins!`,
//     type: "info",
//   };
// };

// export const getErrorMessage = (err) => {
//   // Simplified error handling
//   return err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || "";
// };

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } = useSelector(
//     (state) => state.round
//   );
//   const authUser = useSelector((state) => state.auth.user);

//   // State management
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const processedBetsRef = useRef(new Set());

//   useAblyGameRoom();

//   // Memoized computations
//   const errorMsg = useMemo(() => getErrorMessage(error), [error]);
//   const noActiveRoundError = useMemo(() => 
//     !loading && (errorMsg.toLowerCase().includes("no active round") || !currentRound),
//     [loading, currentRound, errorMsg]
//   );

//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter(bet => 
//       bet.roundId === currentRound._id && 
//       (bet.user === authUser._id || bet.phone === authUser.phone)
//     );
//   }, [betResults, currentRound, authUser]);

//   const currentBets = useMemo(() => ({
//     head: betResults.filter(bet => bet.side === "heads" && bet.roundId === currentRound?._id),
//     tail: betResults.filter(bet => bet.side === "tails" && bet.roundId === currentRound?._id)
//   }), [betResults, currentRound]);

//   // Callback functions
//   const handleBetResult = useCallback((bet) => {
//     const betKey = `${bet._id}_${bet.result}`;
//     if (!authUser || !currentRound || processedBetsRef.current.has(betKey)) return;

//     const isUserBet = bet.user === authUser._id || bet.phone === authUser.phone;
//     if (isUserBet && bet.roundId === currentRound._id && bet.result) {
//       processedBetsRef.current.add(betKey);
//       toast[bet.result === "win" ? "success" : "error"](
//         bet.result === "win"
//           ? `🎉 Round #${currentRound.roundNumber}: You won $${Number(bet.winAmount || bet.amount).toFixed(2)}!`
//           : `💫 Round #${currentRound.roundNumber}: You lost $${Number(bet.betAmount).toFixed(2)}`,
//         {
//           position: "top-center",
//           autoClose: 5000,
//           className: `toast-${bet.result}`
//         }
//       );
//     }
//   }, [authUser, currentRound]);

//   const handleRefresh = useCallback(async () => {
//     try {
//       await dispatch(fetchCurrentRound()).unwrap();
//       toast.success("Game refreshed");
//     } catch (err) {
//       toast.error("Refresh failed");
//     }
//   }, [dispatch]);

//   // Effects
//   useEffect(() => {
//     betResults.forEach(handleBetResult);
//   }, [betResults, handleBetResult]);

//   useEffect(() => {
//     if (!currentRound) return;

//     if (currentRound.outcome) {
//       setTimeLeft(0);
//       if (timerRef.current) clearInterval(timerRef.current);
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();
//     timerRef.current = setInterval(() => {
//       const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0) clearInterval(timerRef.current);
//     }, 1000);

//     return () => clearInterval(timerRef.current);
//   }, [currentRound]);

//   useEffect(() => {
//     if (noActiveRoundError) {
//       autoRefreshRef.current = setInterval(() => dispatch(fetchCurrentRound()), 10000);
//       return () => clearInterval(autoRefreshRef.current);
//     }
//   }, [noActiveRoundError, dispatch]);

//   useEffect(() => {
//     if (errorMsg && !errorMsg.toLowerCase().includes("no active round")) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   if (!authUser) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           <p className="text-lg text-gray-700">Please log in to play</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold text-gray-800">Coin Flip Game</h1>
//         <button 
//           onClick={handleRefresh}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//         >
//           Refresh
//         </button>
//       </div>

//       {loading && <LoadingSpinner />}
      
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 space-y-6">
//           {noActiveRoundError ? (
//             <NoActiveRound onRefresh={handleRefresh} isLoading={loading} />
//           ) : (
//             <div className="bg-white rounded-xl shadow-md p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-semibold">
//                   Round #{currentRound?.roundNumber || "N/A"}
//                 </h2>
//                 {currentRound?.outcome === null && (
//                   <span className="text-lg font-medium text-blue-600">
//                     {timeLeft}s Left
//                   </span>
//                 )}
//               </div>
//               <CoinFlip round={currentRound} />
//               {currentRound?.outcome === null && (
//                 Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//                   <BetForm
//                     roundId={currentRound._id}
//                     onBetSuccess={(amount, side) => 
//                       toast.success(`Bet $${amount} on ${side}!`)
//                     }
//                     onBetError={(err) => toast.error(err)}
//                   />
//                 ) : (
//                   <p className="text-red-500 font-medium mt-4">Betting Closed</p>
//                 )
//               )}
//             </div>
//           )}

//           <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-4 text-center text-white">
//             <h3 className="text-xl font-bold">Jackpot: ${Number(jackpot || 0).toFixed(2)}</h3>
//           </div>
//         </div>

//         <div className="space-y-6">
//           <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//           <div className="bg-white rounded-xl shadow-md p-6">
//             {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//             {activeTab === "betHistory" && <UserBets />}
//             {activeTab === "topWins" && <TopWinsBets />}
//           </div>
//           <BetUpdates headBets={currentBets.head} tailBets={currentBets.tail} />
//         </div>
//       </div>

//       <RoundHistory />
//       <ToastContainerWrapper />
//     </div>
//   );
// };

// export default React.memo(GameRoom);


// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// // Helper function to format result message
// export const formatResultMessage = (round) => {
//   if (!round || !round.outcome) return null;
//   const outcome = round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1);
//   return {
//     message: `Round ${round.roundNumber}: ${outcome} wins!`,
//     type: "info",
//   };
// };

// // Helper function to extract error message
// export const getErrorMessage = (err) => {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string" ? err.error : JSON.stringify(err.error);
//   return JSON.stringify(err);
// };

// // Main GameRoom Component
// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } = useSelector(
//     (state) => state.round
//   );
//   const authUser = useSelector((state) => state.auth.user);

//   // Component state
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const [betResult, setBetResult] = useState(null);
//   const [showBetResult, setShowBetResult] = useState(false);

//   // Refs
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const displayedOutcomeForRound = useRef(null);
//   const processedBetsRef = useRef(new Set());

//   // Custom hook for real-time updates
//   useAblyGameRoom();

//   // Memoized values
//   const errorMsg = getErrorMessage(error);
//   const noActiveRoundError = useMemo(() => {
//     if (loading) return false;
//     return errorMsg.toLowerCase().includes("no active round") || !currentRound;
//   }, [loading, currentRound, errorMsg]);

//   // Memoized user active bets
//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter((bet) => {
//       const isCurrentRound = bet.roundId === currentRound._id;
//       const isUserBet =
//         (bet.user && authUser._id && bet.user === authUser._id) ||
//         (bet.phone && authUser.phone && bet.phone === authUser.phone);
//       return isCurrentRound && isUserBet;
//     });
//   }, [betResults, currentRound, authUser]);

//   // Handle bet results with toast notifications
//   useEffect(() => {
//     const handleBetResult = (bet) => {
//       const betKey = `${bet._id}_${bet.result}`;
//       if (processedBetsRef.current.has(betKey)) return;
//       if (!authUser || !currentRound) return;

//       const isUserBet =
//         (bet.user && authUser._id && bet.user === authUser._id) ||
//         (bet.phone && authUser.phone && bet.phone === authUser.phone);
//       const isCurrentRound = bet.roundId === currentRound._id;

//       if (isUserBet && isCurrentRound && bet.result) {
//         processedBetsRef.current.add(betKey);
//         const toastConfig = {
//           position: "top-center",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//         };

//         if (bet.result === "win") {
//           const winAmount = Number(bet.winAmount || bet.amount).toFixed(2);
//           const betAmount = Number(bet.betAmount).toFixed(2);
//           toast.success(
//             `🎉 Round #${currentRound.roundNumber}: You bet $${betAmount} and won $${winAmount} on ${bet.side.toUpperCase()}!`,
//             {
//               ...toastConfig,
//               style: {
//                 background: "#4CAF50",
//                 color: "white",
//                 fontSize: "16px",
//                 fontWeight: "bold",
//               },
//             }
//           );
//         } else if (bet.result === "loss") {
//           const lostAmount = Number(bet.betAmount || bet.amount).toFixed(2);
//           toast.error(
//             `💫 Round #${currentRound.roundNumber}: You lost $${lostAmount} on ${bet.side.toUpperCase()}`,
//             {
//               ...toastConfig,
//               style: { fontSize: "16px" },
//             }
//           );
//         }
//       }
//     };

//     betResults.forEach(handleBetResult);
//   }, [betResults, authUser, currentRound]);

//   // Auto-refresh when no active round is found
//   useEffect(() => {
//     if (noActiveRoundError && !autoRefreshRef.current) {
//       autoRefreshRef.current = setInterval(async () => {
//         try {
//           await dispatch(fetchCurrentRound());
//         } catch (err) {
//           console.error("Auto-refresh failed:", err);
//         }
//       }, 10000); // Check every 10 seconds
//     }

//     return () => {
//       if (autoRefreshRef.current) {
//         clearInterval(autoRefreshRef.current);
//         autoRefreshRef.current = null;
//       }
//     };
//   }, [noActiveRoundError, dispatch]);

//   // Countdown timer for active rounds
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Display error messages
//   useEffect(() => {
//     if (errorMsg) {
//       if (errorMsg.includes("E11000") && errorMsg.includes("duplicate bet")) {
//         toast.error("Multiple simultaneous bets detected. Please try again!");
//       } else if (!errorMsg.toLowerCase().includes("no active round")) {
//         toast.error(errorMsg);
//       }
//     }
//   }, [errorMsg]);

//   // Display round outcome when it ends
//   useEffect(() => {
//     if (
//       currentRound &&
//       currentRound.outcome &&
//       displayedOutcomeForRound.current !== currentRound._id
//     ) {
//       displayedOutcomeForRound.current = currentRound._id;
//       const result = formatResultMessage(currentRound);
//       if (result) {
//         setBetResult(result);
//         setShowBetResult(true);
//         toast.info(result.message, {
//           position: "top-center",
//           autoClose: 3000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//         });
//       }
//     }
//   }, [currentRound]);

//   // Handlers
//   const handleManualRefresh = async () => {
//     try {
//       await dispatch(fetchCurrentRound());
//       toast.success("Game status refreshed");
//     } catch (err) {
//       toast.error("Failed to refresh game status");
//     }
//   };

//   const onBetSuccess = (betAmount, side) => {
//     toast.success(`✅ Bet placed: $${betAmount} on ${side}`, {
//       position: "bottom-right",
//       autoClose: 3000,
//     });
//   };

//   const onBetError = (error) => {
//     toast.error(`❌ ${error}`, {
//       position: "bottom-right",
//       autoClose: 4000,
//     });
//   };

//   // Filter bets for display
//   const currentRoundId = currentRound?._id;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) => bet.side === "heads" && bet.roundId === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) => bet.side === "tails" && bet.roundId === currentRoundId
//       )
//     : [];

//   // Authentication check
//   if (!authUser) {
//     return (
//       <div className="text-center p-6">
//         <p>Please log in to play the game.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <LoadingSpinner />}

//       {noActiveRoundError ? (
//         <NoActiveRound onRefresh={handleManualRefresh} isLoading={loading} />
//       ) : currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm
//               roundId={currentRound._id}
//               onBetSuccess={onBetSuccess}
//               onBetError={onBetError}
//             />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <CoinFlip round={currentRound} />
//           {showBetResult && betResult && (
//             <div className="bg-blue-100 p-4 rounded-lg mt-4">
//               <p className="text-lg font-semibold">{betResult.message}</p>
//             </div>
//           )}
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//           <button
//             onClick={handleManualRefresh}
//             className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//           >
//             Refresh Now
//           </button>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//       <div>
//         {activeTab === "activeBet" && (
//           <ActiveBet userActiveBets={userActiveBets} />
//         )}
//         {activeTab === "betHistory" && (
//           <div className="bg-green-100 rounded-lg p-4">
//             <UserBets />
//           </div>
//         )}
//         {activeTab === "topWins" && (
//           <div className="bg-purple-100 rounded-lg p-4">
//             <TopWinsBets />
//           </div>
//         )}
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// // Helper function to format result message
// export const formatResultMessage = (round) => {
//   if (!round || !round.outcome) return null;
//   const outcome = round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1);
//   return {
//     message: `Round ${round.roundNumber}: ${outcome} wins!`,
//     type: "info",
//   };
// };

// export const getErrorMessage = (err) => {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string" ? err.error : JSON.stringify(err.error);
//   return JSON.stringify(err);
// };

// // Main GameRoom Component
// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   // Component state
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const [betResult, setBetResult] = useState(null);
//   const [showBetResult, setShowBetResult] = useState(false);

//   // Refs
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const displayedOutcomeForRound = useRef(null);
//   const processedBetsRef = useRef(new Set());

//   useAblyGameRoom();

//   // Memoized values
//   const errorMsg = getErrorMessage(error);
//   const noActiveRoundError = useMemo(() => {
//     if (loading) return false;
//     return errorMsg.toLowerCase().includes("no active round") || !currentRound;
//   }, [loading, currentRound, errorMsg]);

//   // Memoized user active bets
//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter((bet) => {
//       const isCurrentRound =
//         bet.gameRound === currentRound._id || bet.roundId === currentRound._id;
//       const isUserBet =
//         (bet.phone && authUser.phone && bet.phone === authUser.phone) ||
//         (!bet.phone && authUser._id && bet.user === authUser._id);
//       return isCurrentRound && isUserBet;
//     });
//   }, [betResults, currentRound, authUser]);

//   // Handle bet results
//   useEffect(() => {
//     const handleBetResult = (bet) => {
//       const betKey = `${bet._id}_${bet.result}`;
      
//       if (processedBetsRef.current.has(betKey)) return;
//       if (!authUser || !currentRound) return;

//       const isUserBet = 
//         (bet.phone && authUser.phone && bet.phone === authUser.phone) ||
//         (!bet.phone && authUser._id && bet.user === authUser._id);

//       const isCurrentRound = 
//         bet.gameRound === currentRound._id || 
//         bet.roundId === currentRound._id;

//       if (isUserBet && isCurrentRound && bet.result) {
//         processedBetsRef.current.add(betKey);

//         const toastConfig = {
//           position: "top-center",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           progress: undefined,
//         };

//         if (bet.result === "win") {
//           const winAmount = Number(bet.winAmount || bet.amount).toFixed(2);
//           const betAmount = Number(bet.betAmount).toFixed(2);
          
//           toast.success(
//             `🎉 Round #${currentRound.roundNumber}: You bet $${betAmount} and won $${winAmount} on ${bet.side.toUpperCase()}!`,
//             {
//               ...toastConfig,
//               style: {
//                 background: "#4CAF50",
//                 color: "white",
//                 fontSize: "16px",
//                 fontWeight: "bold",
//               },
//             }
//           );
//         } else if (bet.result === "loss") {
//           const lostAmount = Number(bet.betAmount || bet.amount).toFixed(2);
          
//           toast.error(
//             `💫 Round #${currentRound.roundNumber}: You lost $${lostAmount} on ${bet.side.toUpperCase()}`,
//             {
//               ...toastConfig,
//               style: { fontSize: "16px" },
//             }
//           );
//         }
//       }
//     };

//     betResults.forEach(handleBetResult);
//   }, [betResults, authUser, currentRound]);
//   // Auto-refresh for no active round
//   useEffect(() => {
//     if (noActiveRoundError && !autoRefreshRef.current) {
//       autoRefreshRef.current = setInterval(async () => {
//         try {
//           await dispatch(fetchCurrentRound());
//         } catch (error) {
//           console.error("Auto-refresh failed:", error);
//         }
//       }, 30000);
//     }

//     return () => {
//       if (autoRefreshRef.current) {
//         clearInterval(autoRefreshRef.current);
//         autoRefreshRef.current = null;
//       }
//     };
//   }, [noActiveRoundError, dispatch]);

//   // Countdown timer
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Error handling
//   useEffect(() => {
//     if (errorMsg) {
//       if (errorMsg.includes("E11000")) {
//         toast.error("Multiple simultaneous bets detected. Please try again!");
//       } else if (!errorMsg.toLowerCase().includes("no active round")) {
//         toast.error(errorMsg);
//       }
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Toast outcome once the round ends (only once per round)
//   useEffect(() => {
//     if (
//       currentRound &&
//       currentRound.outcome &&
//       displayedOutcomeForRound.current !== currentRound._id
//     ) {
//       displayedOutcomeForRound.current = currentRound._id;

//       const result = formatResultMessage(currentRound);

//       if (result) {
//         setBetResult(result);
//         setShowBetResult(true);

//         // toast.info(result.message, {
//         //   position: "top-center",
//         //   autoClose: 3000,
//         //   hideProgressBar: false,
//         //   closeOnClick: true,
//         //   pauseOnHover: true,
//         //   draggable: true,
//         // });
//       }
//     }
//   }, [currentRound]);

//   // Handlers
//   const handleManualRefresh = async () => {
//     try {
//       await dispatch(fetchCurrentRound());
//       toast.success("Game status refreshed");
//     } catch (error) {
//       toast.error("Failed to refresh game status");
//     }
//   };

//   const onBetSuccess = (betAmount, side) => {
//     toast.success(`✅ Bet placed: $${betAmount} on ${side}`, {
//       position: "bottom-right",
//       autoClose: 3000,
//     });
//   };

//   const onBetError = (error) => {
//     toast.error(`❌ ${error}`, {
//       position: "bottom-right",
//       autoClose: 4000,
//     });
//   };

//   // Filter bets for display purposes
//   const currentRoundId = currentRound?._id;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound === currentRoundId || bet.roundId === currentRoundId)
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound === currentRoundId || bet.roundId === currentRoundId)
//       )
//     : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <LoadingSpinner />}

//       {noActiveRoundError ? (
//         <NoActiveRound onRefresh={handleManualRefresh} isLoading={loading} />
//       ) : currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm
//               roundId={currentRound._id}
//               onBetSuccess={onBetSuccess}
//               onBetError={onBetError}
//             />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//       <div>
//         {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//         {activeTab === "betHistory" && (
//           <div className="bg-green-100 rounded-lg p-4">
//             <UserBets />
//           </div>
//         )}
//         {activeTab === "topWins" && (
//           <div className="bg-purple-100 rounded-lg p-4">
//             <TopWinsBets />
//           </div>
//         )}
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// // src/components/GameRoom.js
// // // src/components/GameRoom.js
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import { FiClock } from "react-icons/fi";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// // Helper function to format result message
// export const formatResultMessage = (round, userBets, totalOriginalBet) => {
//   console.log("Formatting result message:", {
//     round,
//     userBets,
//     totalOriginalBet,
//     hasOutcome: !!round?.outcome,
//   });

//   if (!round || !round.outcome) return null;

//   // totalOriginalBet comes in as a number representing the sum of bet.betAmount values.
//   const outcome = round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1);

//   if (!userBets || userBets.length === 0) {
//     console.log("No user bets found");
//     return {
//       message: `Round ${round.roundNumber}: ${outcome} wins!`,
//       type: "info",
//     };
//   }

//   // winningBets: for winning bets, the backend publishes the win payout as `amount`
//   const winningBets = userBets.filter((bet) => bet.side === round.outcome);
//   const userWon = winningBets.length > 0;

  
//   const totalWinAmount = winningBets.reduce(
//     (sum, bet) => sum + (Number(bet.amount) || 0),
//     0
//   );

//   console.log("Result calculation:", {
//     userWon,
//     winningBets,
//     totalWinAmount,
//   });

//   if (userWon) {
//     return {
//       message: `🎉 Congratulations! You won  Outcome: ${outcome}!`,
//       type: "success",
//     };
//   } else {
//     return {
//       message: `💫 Better luck next time! You lost  ${outcome} wins!`,
//       type: "error",
//     };
//   }
// };

// export const getErrorMessage = (err) => {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string" ? err.error : JSON.stringify(err.error);
//   return JSON.stringify(err);
// };

// // Main GameRoom Component
// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   // Component state
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const [betResult, setBetResult] = useState(null);
//   const [showBetResult, setShowBetResult] = useState(false);

//   // Refs
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const displayedOutcomeForRound = useRef(null);

//   useAblyGameRoom();

//   // Memoized values
//   const errorMsg = getErrorMessage(error);
//   const noActiveRoundError = useMemo(() => {
//     if (loading) return false;
//     return errorMsg.toLowerCase().includes("no active round") || !currentRound;
//   }, [loading, currentRound, errorMsg]);

//   // Memoized user active bets
//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter((bet) => {
//       const isCurrentRound =
//         bet.gameRound === currentRound._id || bet.roundId === currentRound._id;
//       const isUserBet =
//         (bet.phone && authUser.phone && bet.phone === authUser.phone) ||
//         (!bet.phone && authUser._id && bet.user === authUser._id);

//       console.log("Bet filtering:", {
//         bet,
//         isCurrentRound,
//         isUserBet,
//         roundMatch: currentRound._id,
//       });

//       return isCurrentRound && isUserBet;
//     });
//   }, [betResults, currentRound, authUser]);

//   // Auto-refresh for no active round
//   useEffect(() => {
//     if (noActiveRoundError && !autoRefreshRef.current) {
//       autoRefreshRef.current = setInterval(async () => {
//         try {
//           await dispatch(fetchCurrentRound());
//         } catch (error) {
//           console.error("Auto-refresh failed:", error);
//         }
//       }, 30000);
//     }

//     return () => {
//       if (autoRefreshRef.current) {
//         clearInterval(autoRefreshRef.current);
//         autoRefreshRef.current = null;
//       }
//     };
//   }, [noActiveRoundError, dispatch]);

//   // Countdown timer
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Error handling
//   useEffect(() => {
//     if (errorMsg) {
//       if (errorMsg.includes("E11000")) {
//         toast.error("Multiple simultaneous bets detected. Please try again!");
//       } else if (!errorMsg.toLowerCase().includes("no active round")) {
//         toast.error(errorMsg);
//       }
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Toast outcome once the round ends (only once per round)
//   useEffect(() => {
//     if (
//       currentRound &&
//       currentRound.outcome &&
//       displayedOutcomeForRound.current !== currentRound._id
//     ) {
//       displayedOutcomeForRound.current = currentRound._id;
//       // Get all user bets for this round
//       const roundBets = betResults.filter((bet) => {
//         const isCurrentRound =
//           bet.gameRound === currentRound._id || bet.roundId === currentRound._id;
//         const isUserBet =
//           (bet.phone && authUser.phone && bet.phone === authUser.phone) ||
//           (!bet.phone && authUser._id && bet.user === authUser._id);
//         return isCurrentRound && isUserBet;
//       });

//       // Calculate total original bet amount using `bet.betAmount`
//       const totalOriginalBet = roundBets.reduce(
//         (sum, bet) => sum + (Number(bet.betAmount) || 0),
//         0
//       );

//       console.log("Bet calculation:", {
//         roundBets,
//         totalOriginalBet,
//       });

//       // Format and show result
//       const result = formatResultMessage(currentRound, roundBets, totalOriginalBet);

//       if (result) {
//         setBetResult(result);
//         setShowBetResult(true);

//         const toastConfig = {
//           position: "top-center",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           progress: undefined,
//         };

//         switch (result.type) {
//           case "success":
//             console.log("Success message:", result.message);
//             // toast.success(result.message, {
//             //   ...toastConfig,
//             //   style: {
//             //     background: "#4CAF50",
//             //     color: "white",
//             //     fontSize: "16px",
//             //     fontWeight: "bold",
//             //   },
//             // });
//             break;
//           case "error":
//             toast.error(result.message, {
//               ...toastConfig,
//               style: { fontSize: "16px" },
//             });
//             break;
//           default:
//             console.log("Info message:", result.message);
//             //toast.info(result.message, toastConfig);
//         }
//       }
//     }
//   }, [currentRound, betResults, authUser]);

//   // Handlers
//   const handleManualRefresh = async () => {
//     try {
//       await dispatch(fetchCurrentRound());
//       toast.success("Game status refreshed");
//     } catch (error) {
//       toast.error("Failed to refresh game status");
//     }
//   };

//   const onBetSuccess = (betAmount, side) => {
//     toast.success(`✅ Bet placed: $${betAmount} on ${side}`, {
//       position: "bottom-right",
//       autoClose: 3000,
//     });
//   };

//   const onBetError = (error) => {
//     toast.error(`❌ ${error}`, {
//       position: "bottom-right",
//       autoClose: 4000,
//     });
//   };

//   // Filter bets for display purposes
//   const currentRoundId = currentRound?._id;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound === currentRoundId || bet.roundId === currentRoundId)
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound === currentRoundId || bet.roundId === currentRoundId)
//       )
//     : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <LoadingSpinner />}

//       {noActiveRoundError ? (
//         <NoActiveRound onRefresh={handleManualRefresh} isLoading={loading} />
//       ) : currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm
//               roundId={currentRound._id}
//               onBetSuccess={onBetSuccess}
//               onBetError={onBetError}
//             />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {/* The outcome will be displayed via a toast; no onFlipComplete callback is used */}
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//       <div>
//         {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//         {activeTab === "betHistory" && (
//           <div className="bg-green-100 rounded-lg p-4">
//             <UserBets />
//           </div>
//         )}
//         {activeTab === "topWins" && (
//           <div className="bg-purple-100 rounded-lg p-4">
//             <TopWinsBets />
//           </div>
//         )}
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// import React, { useEffect, useState, useRef, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import { FiClock } from "react-icons/fi";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// // Helper function to format result message
// export const formatResultMessage = (round, userBets, betAmount) => {
//   console.log("Formatting result message:", {
//     round,
//     userBets,
//     betAmount,
//     hasOutcome: !!round?.outcome,
//   });

//   if (!round || !round.outcome) return null;

//   const totalBetAmount = Number(betAmount) || 0;
//   const outcome = round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1);

//   if (!userBets || userBets.length === 0) {
//     console.log("No user bets found");
//     return {
//       message: `Round ${round.roundNumber}: ${outcome} wins!`,
//       type: "info",
//     };
//   }

//   const winningBets = userBets.filter((bet) => bet.side === round.outcome);
//   const userWon = winningBets.length > 0;
//   const totalWinAmount = winningBets.reduce(
//     (sum, bet) => sum + (Number(bet.amount) || 0),
//     0
//   );

//   console.log("Result calculation:", {
//     userWon,
//     winningBets,
//     totalWinAmount,
//   });

//   if (userWon) {
//     return {
//       message: `🎉 Congratulations! You won $${totalWinAmount.toFixed(
//         2
//       )} with ${outcome}!`,
//       type: "success",
//     };
//   } else {
//     return {
//       message: `💫 Better luck next time! You lost $${totalBetAmount.toFixed(
//         2
//       )}. ${outcome} wins!`,
//       type: "error",
//     };
//   }
// };

// export const getErrorMessage = (err) => {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string" ? err.error : JSON.stringify(err.error);
//   return JSON.stringify(err);
// };

// // Main GameRoom Component
// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   // Component state
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const [betResult, setBetResult] = useState(null);
//   const [showBetResult, setShowBetResult] = useState(false);

//   // Refs
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const displayedOutcomeForRound = useRef(null);

//   useAblyGameRoom();

//   // Memoized values
//   const errorMsg = getErrorMessage(error);
//   const noActiveRoundError = useMemo(() => {
//     if (loading) return false;
//     return errorMsg.toLowerCase().includes("no active round") || !currentRound;
//   }, [loading, currentRound, errorMsg]);

//   // Memoized user active bets
//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter((bet) => {
//       const isCurrentRound =
//         bet.gameRound === currentRound._id || bet.roundId === currentRound._id;
//       const isUserBet =
//         (bet.phone && authUser.phone && bet.phone === authUser.phone) ||
//         (!bet.phone && authUser._id && bet.user === authUser._id);

//       console.log("Bet filtering:", {
//         bet,
//         isCurrentRound,
//         isUserBet,
//         roundMatch: currentRound._id,
//       });

//       return isCurrentRound && isUserBet;
//     });
//   }, [betResults, currentRound, authUser]);

//   // // Effects
//   // useEffect(() => {
//   //   if (currentRound && !currentRound.outcome) {
//   //     toast.info(`🎲 New Round #${currentRound.roundNumber} started!`, {
//   //       position: "top-right",
//   //       autoClose: 1000,
//   //     });
//   //     setBetResult(null);
//   //     setShowBetResult(false);
//   //   }
//   // }, [currentRound?.roundNumber]);

//   // useEffect(() => {
//   //   if (currentRound && timeLeft === 0 && !currentRound.outcome) {
//   //     toast.warning("⏰ Betting is now closed!", {
//   //       position: "top-center",
//   //       autoClose: 1000,
//   //     });
//   //   }
//   // }, [timeLeft, currentRound]);

//   // Auto-refresh for no active round
//   useEffect(() => {
//     if (noActiveRoundError && !autoRefreshRef.current) {
//       autoRefreshRef.current = setInterval(async () => {
//         try {
//           await dispatch(fetchCurrentRound());
//         } catch (error) {
//           console.error("Auto-refresh failed:", error);
//         }
//       }, 30000);
//     }

//     return () => {
//       if (autoRefreshRef.current) {
//         clearInterval(autoRefreshRef.current);
//         autoRefreshRef.current = null;
//       }
//     };
//   }, [noActiveRoundError, dispatch]);

//   // Countdown timer
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Error handling
//   useEffect(() => {
//     if (errorMsg) {
//       if (errorMsg.includes("E11000")) {
//         toast.error("Multiple simultaneous bets detected. Please try again!");
//       } else if (!errorMsg.toLowerCase().includes("no active round")) {
//         toast.error(errorMsg);
//       }
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Toast outcome once the round ends (only once per round)
//   useEffect(() => {
//     if (
//       currentRound &&
//       currentRound.outcome &&
//       displayedOutcomeForRound.current !== currentRound._id
//     ) {
//       displayedOutcomeForRound.current = currentRound._id;
//       // Get all user bets for this round
//       const roundBets = betResults.filter((bet) => {
//         const isCurrentRound =
//           bet.gameRound === currentRound._id || bet.roundId === currentRound._id;
//         const isUserBet =
//           (bet.phone && authUser.phone && bet.phone === authUser.phone) ||
//           (!bet.phone && authUser._id && bet.user === authUser._id);
//         return isCurrentRound && isUserBet;
//       });

//       // Calculate total bet amount
//       const totalBetAmount = roundBets.reduce(
//         (sum, bet) => sum + (Number(bet.amount) || 0),
//         0
//       );

//       console.log("Bet calculation:", {
//         roundBets,
//         totalBetAmount,
//       });

//       // Format and show result
//       const result = formatResultMessage(currentRound, roundBets, totalBetAmount);

//       if (result) {
//         setBetResult(result);
//         setShowBetResult(true);

//         const toastConfig = {
//           position: "top-center",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           progress: undefined,
//         };

//         switch (result.type) {
//           case "success":
//             toast.success(result.message, {
//               ...toastConfig,
//               style: {
//                 background: "#4CAF50",
//                 color: "white",
//                 fontSize: "16px",
//                 fontWeight: "bold",
//               },
//             });
//             break;
//           case "error":
//             toast.error(result.message, {
//               ...toastConfig,
//               style: { fontSize: "16px" },
//             });
//             break;
//           default:
//             toast.info(result.message, toastConfig);
//         }
//       }
//     }
//   }, [currentRound, betResults, authUser]);

//   // Handlers
//   const handleManualRefresh = async () => {
//     try {
//       await dispatch(fetchCurrentRound());
//       toast.success("Game status refreshed");
//     } catch (error) {
//       toast.error("Failed to refresh game status");
//     }
//   };

//   const onBetSuccess = (betAmount, side) => {
//     toast.success(`✅ Bet placed: $${betAmount} on ${side}`, {
//       position: "bottom-right",
//       autoClose: 3000,
//     });
//   };

//   const onBetError = (error) => {
//     toast.error(`❌ ${error}`, {
//       position: "bottom-right",
//       autoClose: 4000,
//     });
//   };

//   // Filter bets for display purposes
//   const currentRoundId = currentRound?._id;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound === currentRoundId || bet.roundId === currentRoundId)
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound === currentRoundId || bet.roundId === currentRoundId)
//       )
//     : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <LoadingSpinner />}

//       {noActiveRoundError ? (
//         <NoActiveRound onRefresh={handleManualRefresh} isLoading={loading} />
//       ) : currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm
//               roundId={currentRound._id}
//               onBetSuccess={onBetSuccess}
//               onBetError={onBetError}
//             />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {/* The outcome will be displayed via a toast; no onFlipComplete callback is used */}
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//       <div>
//         {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//         {activeTab === "betHistory" && (
//           <div className="bg-green-100 rounded-lg p-4">
//             <UserBets />
//           </div>
//         )}
//         {activeTab === "topWins" && (
//           <div className="bg-purple-100 rounded-lg p-4">
//             <TopWinsBets />
//           </div>
//         )}
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import { FiClock } from "react-icons/fi";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";

// // Helper function to format result message
// export const formatResultMessage = (round, userBets, betAmount) => {
//   console.log('Formatting result message:', {
//     round,
//     userBets,
//     betAmount,
//     hasOutcome: !!round?.outcome
//   });

//   if (!round || !round.outcome) return null;
  
//   const totalBetAmount = Number(betAmount) || 0;
//   const outcome = round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1);
  
//   if (!userBets || userBets.length === 0) {
//     console.log('No user bets found');
//     return {
//       message: `Round ${round.roundNumber}: ${outcome} wins!`,
//       type: 'info'
//     };
//   }

//   const winningBets = userBets.filter(bet => bet.side === round.outcome);
//   const userWon = winningBets.length > 0;
//   const totalWinAmount = winningBets.reduce((sum, bet) => sum + (Number(bet.potentialWin) || 0), 0);

//   console.log('Result calculation:', {
//     userWon,
//     winningBets,
//     totalWinAmount
//   });

//   if (userWon) {
//     return {
//       message: `🎉 Congratulations! You won $${totalWinAmount.toFixed(2)} with ${outcome}!`,
//       type: 'success'
//     };
//   } else {
//     return {
//       message: `💫 Better luck next time! You lost $${totalBetAmount.toFixed(2)}. ${outcome} wins!`,
//       type: 'error'
//     };
//   }
// };

// export const getErrorMessage = (err) => {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string" ? err.error : JSON.stringify(err.error);
//   return JSON.stringify(err);
// };

// // Main GameRoom Component
// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   // Component state
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const [flipComplete, setFlipComplete] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [betResult, setBetResult] = useState(null);
//   const [showBetResult, setShowBetResult] = useState(false);

//   // Refs
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);

//   useAblyGameRoom();

//   // Memoized values
//   const errorMsg = getErrorMessage(error);
//   const noActiveRoundError = useMemo(() => {
//     if (loading) return false;
//     return errorMsg.toLowerCase().includes("no active round") || !currentRound;
//   }, [loading, currentRound, errorMsg]);

//   // Memoized user active bets
//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
    
//     return betResults.filter((bet) => {
//       const isCurrentRound = bet.gameRound === currentRound._id || bet.roundId === currentRound._id;
//       const isUserBet = (bet.phone && authUser.phone && bet.phone === authUser.phone) || 
//                        (!bet.phone && authUser._id && bet.user === authUser._id);
      
//       console.log('Bet filtering:', {
//         bet,
//         isCurrentRound,
//         isUserBet,
//         roundMatch: currentRound._id
//       });
      
//       return isCurrentRound && isUserBet;
//     });
//   }, [betResults, currentRound, authUser]);

//   // Effects
//   useEffect(() => {
//     if (currentRound && !currentRound.outcome) {
//       toast.info(`🎲 New Round #${currentRound.roundNumber} started!`, {
//         position: "top-right",
//         autoClose: 3000
//       });
//       setBetResult(null);
//       setShowBetResult(false);
//     }
//   }, [currentRound?.roundNumber]);

//   useEffect(() => {
//     if (currentRound && timeLeft === 0 && !currentRound.outcome) {
//       toast.warning('⏰ Betting is now closed!', {
//         position: "top-center",
//         autoClose: 3000
//       });
//     }
//   }, [timeLeft, currentRound]);

//   // Auto-refresh for no active round
//   useEffect(() => {
//     if (noActiveRoundError && !autoRefreshRef.current) {
//       autoRefreshRef.current = setInterval(async () => {
//         try {
//           await dispatch(fetchCurrentRound());
//         } catch (error) {
//           console.error("Auto-refresh failed:", error);
//         }
//       }, 30000);
//     }

//     return () => {
//       if (autoRefreshRef.current) {
//         clearInterval(autoRefreshRef.current);
//         autoRefreshRef.current = null;
//       }
//     };
//   }, [noActiveRoundError, dispatch]);

//   // Reset flip status on new round
//   useEffect(() => {
//     if (currentRound) {
//       setFlipComplete(false);
//     }
//   }, [currentRound]);

//   // Countdown timer
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Error handling
//   useEffect(() => {
//     if (errorMsg) {
//       if (errorMsg.includes("E11000")) {
//         toast.error("Multiple simultaneous bets detected. Please try again!");
//       } else if (!errorMsg.toLowerCase().includes("no active round")) {
//         toast.error(errorMsg);
//       }
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Handlers
//   const handleManualRefresh = async () => {
//     setIsRefreshing(true);
//     try {
//       await dispatch(fetchCurrentRound());
//       toast.success("Game status refreshed");
//     } catch (error) {
//       toast.error("Failed to refresh game status");
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   const onBetSuccess = (betAmount, side) => {
//     toast.success(`✅ Bet placed: $${betAmount} on ${side}`, {
//       position: "bottom-right",
//       autoClose: 3000
//     });
//   };

//   const onBetError = (error) => {
//     toast.error(`❌ ${error}`, {
//       position: "bottom-right",
//       autoClose: 4000
//     });
//   };

//   // Filter bets
//   const currentRoundId = currentRound?._id;
//   const headBets = currentRoundId
//     ? betResults.filter(bet => 
//         bet.side === "heads" && 
//         (bet.gameRound === currentRoundId || bet.roundId === currentRoundId)
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(bet => 
//         bet.side === "tails" && 
//         (bet.gameRound === currentRoundId || bet.roundId === currentRoundId)
//       )
//     : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && !isRefreshing && <LoadingSpinner />}

//       {noActiveRoundError ? (
//         <NoActiveRound
//           onRefresh={handleManualRefresh}
//           isLoading={loading || isRefreshing}
//         />
//       ) : currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm 
//               roundId={currentRound._id} 
//               onBetSuccess={onBetSuccess}
//               onBetError={onBetError}
//             />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               setFlipComplete(true);
              
//               console.log('Round completed:', {
//                 currentRound,
//                 userActiveBets,
//                 authUser,
//                 betResults
//               });

//               // Get all user bets for this round
//               const roundBets = betResults.filter(bet => {
//                 const isCurrentRound = bet.gameRound === currentRound._id || 
//                                      bet.roundId === currentRound._id;
//                 const isUserBet = (bet.phone && authUser.phone && bet.phone === authUser.phone) || 
//                                  (!bet.phone && authUser._id && bet.user === authUser._id);
//                 return isCurrentRound && isUserBet;
//               });

//               // Calculate total bet amount
//               const totalBetAmount = roundBets.reduce(
//                 (sum, bet) => sum + (Number(bet.amount) || 0),
//                 0
//               );

//               console.log('Bet calculation:', {
//                 roundBets,
//                 totalBetAmount
//               });

//               // Format and show result
//               const result = formatResultMessage(
//                 currentRound,
//                 roundBets,
//                 totalBetAmount
//               );

//               if (result) {
//                 setBetResult(result);
//                 setShowBetResult(true);

//                 const toastConfig = {
//                   position: "top-center",
//                   autoClose: 5000,
//                   hideProgressBar: false,
//                   closeOnClick: true,
//                   pauseOnHover: true,
//                   draggable: true,
//                   progress: undefined
//                 };

//                 switch (result.type) {
//                   case 'success':
//                     toast.success(result.message, {
//                       ...toastConfig,
//                       style: {
//                         background: "#4CAF50",
//                         color: "white",
//                         fontSize: "16px",
//                         fontWeight: "bold"
//                       }
//                     });
//                     break;
//                   case 'error':
//                     toast.error(result.message, {
//                       ...toastConfig,
//                       style: {
//                         fontSize: "16px"
//                       }
//                     });
//                     break;
//                   default:
//                     toast.info(result.message, toastConfig);
//                 }
//               }
//             }}
//           />

//           {showBetResult && betResult && (
//             <div className={`mt-4 p-4 rounded-lg text-center ${
//               betResult.type === 'success' 
//                 ? 'bg-green-100 text-green-800'
//                 : betResult.type === 'error'
//                 ? 'bg-red-100 text-red-800'
//                 : 'bg-blue-100 text-blue-800'
//             }`}>
//               <p className="text-lg font-semibold">{betResult.message}</p>
//             </div>
//           )}

//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//       <div>
//         {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//         {activeTab === "betHistory" && (
//           <div className="bg-green-100 rounded-lg p-4">
//             <UserBets />
//           </div>
//         )}
//         {activeTab === "topWins" && (
//           <div className="bg-purple-100 rounded-lg p-4">
//             <TopWinsBets />
//           </div>
//         )}
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import { FiClock } from "react-icons/fi";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";      // Moved LoadingSpinner
// import GameRoomTabs from "./GameRoomTabs";          // Moved Tabbed Navigation




// export const formatResultMessage = (round, userBets, betAmount) => {
//   if (!round || !round.outcome) return null;
  
//   // Ensure betAmount is a number
//   const totalBetAmount = Number(betAmount) || 0;
  
//   const userWon = userBets.some(bet => bet.side === round.outcome);
//   const outcome = round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1);
  
//   // If user didn't place any bets
//   if (!userBets || userBets.length === 0) {
//     return {
//       message: `Round ${round.roundNumber}: ${outcome} wins!`,
//       type: 'info'
//     };
//   }

//   // Calculate total winning amount
//   const winningBets = userBets.filter(bet => bet.side === round.outcome);
//   const totalWinAmount = winningBets.reduce((sum, bet) => sum + (bet.potentialWin || 0), 0);

//   if (userWon) {
//     return {
//       message: `🎉 Congratulations! You won $${totalWinAmount.toFixed(2)} with ${outcome}!`,
//       type: 'success'
//     };
//   } else {
//     return {
//       message: `💫 Better luck next time! You lost $${totalBetAmount.toFixed(2)}. ${outcome} wins!`,
//       type: 'error'
//     };
//   }
// };

// export const getErrorMessage = (err) => {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// };


// // Main GameRoom Component
// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const [flipComplete, setFlipComplete] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);

//   useAblyGameRoom();

//   // Determine if there's no active round
//   const errorMsg = getErrorMessage(error);
//   const noActiveRoundError = useMemo(() => {
//     if (loading) return false;
//     return errorMsg.toLowerCase().includes("no active round") || !currentRound;
//   }, [loading, currentRound, errorMsg]);

//   // New round notification
//   useEffect(() => {
//     if (currentRound && !currentRound.outcome) {
//       toast.info(`🎲 New Round #${currentRound.roundNumber} started!`, {
//         position: "top-right",
//         autoClose: 3000
//       });
//     }
//   }, [currentRound?.roundNumber]);

//   // Betting closure notification
//   useEffect(() => {
//     if (currentRound && timeLeft === 0 && !currentRound.outcome) {
//       toast.warning('⏰ Betting is now closed!', {
//         position: "top-center",
//         autoClose: 3000
//       });
//     }
//   }, [timeLeft, currentRound]);

//   // Auto-refresh logic for no active round
//   useEffect(() => {
//     if (noActiveRoundError && !autoRefreshRef.current) {
//       autoRefreshRef.current = setInterval(async () => {
//         try {
//           await dispatch(fetchCurrentRound());
//         } catch (error) {
//           console.error("Auto-refresh failed:", error);
//         }
//       }, 30000);
//     }

//     return () => {
//       if (autoRefreshRef.current) {
//         clearInterval(autoRefreshRef.current);
//         autoRefreshRef.current = null;
//       }
//     };
//   }, [noActiveRoundError, dispatch]);

//   // Reset flip status on new round
//   useEffect(() => {
//     if (currentRound) {
//       setFlipComplete(false);
//     }
//   }, [currentRound]);

//   // Countdown timer logic
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Error handling
//   useEffect(() => {
//     if (errorMsg) {
//       if (errorMsg.includes("E11000")) {
//         toast.error("Multiple simultaneous bets detected. Please try again!");
//       } else if (!errorMsg.toLowerCase().includes("no active round")) {
//         toast.error(errorMsg);
//       }
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Handle manual refresh
//   const handleManualRefresh = async () => {
//     setIsRefreshing(true);
//     try {
//       await dispatch(fetchCurrentRound());
//       toast.success("Game status refreshed");
//     } catch (error) {
//       toast.error("Failed to refresh game status");
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   // Bet handlers
//   const onBetSuccess = (betAmount, side) => {
//     toast.success(`✅ Bet placed: $${betAmount} on ${side}`, {
//       position: "bottom-right",
//       autoClose: 3000
//     });
//   };

//   const onBetError = (error) => {
//     toast.error(`❌ ${error}`, {
//       position: "bottom-right",
//       autoClose: 4000
//     });
//   };

//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter the signed-in user's active bets
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && !isRefreshing && <LoadingSpinner />}

//       {noActiveRoundError ? (
//         <NoActiveRound
//           onRefresh={handleManualRefresh}
//           isLoading={loading || isRefreshing}
//         />
//       ) : currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm 
//               roundId={currentRound._id} 
//               onBetSuccess={onBetSuccess}
//               onBetError={onBetError}
//             />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//              <CoinFlip
//   round={currentRound}
//   onFlipComplete={() => {
//     setFlipComplete(true);
    
//     // Calculate total bet amount
//     const totalBetAmount = userActiveBets.reduce(
//       (sum, bet) => sum + (Number(bet.amount) || 0),
//       0
//     );

//     // Only show result if user had active bets
//     if (userActiveBets.length > 0) {
//       const result = formatResultMessage(
//         currentRound,
//         userActiveBets,
//         totalBetAmount
//       );
      
//       if (result) {
//         if (result.type === "success") {
//           toast.success(result.message, {
//             position: "top-center",
//             autoClose: 5000,
//             hideProgressBar: false,
//             closeOnClick: true,
//             pauseOnHover: true,
//             draggable: true,
//             progress: undefined,
//             style: {
//               background: "#4CAF50",
//               color: "white",
//               fontSize: "16px",
//               fontWeight: "bold"
//             }
//           });
//         } else if (result.type === "error") {
//           toast.error(result.message, {
//             position: "top-center",
//             autoClose: 4000,
//             hideProgressBar: false,
//             closeOnClick: true,
//             pauseOnHover: true,
//             draggable: true,
//             progress: undefined,
//             style: {
//               fontSize: "16px"
//             }
//           });
//         } else {
//           toast.info(result.message, {
//             position: "top-center",
//             autoClose: 4000
//           });
//         }
//       }
//     }
//   }}
// />
          
              





//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <GameRoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
//       <div>
//         {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//         {activeTab === "betHistory" && (
//           <div className="bg-green-100 rounded-lg p-4">
//             <UserBets />
//           </div>
//         )}
//         {activeTab === "topWins" && (
//           <div className="bg-purple-100 rounded-lg p-4">
//             <TopWinsBets />
//           </div>
//         )}
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import { FiRefreshCw, FiClock } from "react-icons/fi";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound"; // Imported from its own file

// // Helper function for formatting game result messages
// const formatResultMessage = (round, userBets, betAmount) => {
//   if (!round || !round.outcome) return null;
  
//   const userWon = userBets.some(bet => bet.side === round.outcome);
//   const outcome = round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1);
  
//   if (userBets.length === 0) {
//     return {
//       message: `Round ${round.roundNumber}: ${outcome} wins!`,
//       type: 'info'
//     };
//   }

//   const winningBet = userBets.find(bet => bet.side === round.outcome);
//   const winAmount = winningBet ? winningBet.potentialWin : 0;

//   if (userWon) {
//     return {
//       message: `🎉 Congratulations! You won $${winAmount.toFixed(2)} with ${outcome}!`,
//       type: 'success'
//     };
//   } else {
//     return {
//       message: `💫 Better luck next time! You lost $${betAmount.toFixed(2)}. ${outcome} wins!`,
//       type: 'info'
//     };
//   }
// };

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// // Loading Spinner Component
// const LoadingSpinner = () => (
//   <div className="flex justify-center items-center p-4">
//     <FiRefreshCw className="animate-spin h-8 w-8 text-blue-500" />
//   </div>
// );

// // Main GameRoom Component
// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const [flipComplete, setFlipComplete] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);

//   useAblyGameRoom();

//   // Helper to determine if there's no active round
//   const errorMsg = getErrorMessage(error);
//   const noActiveRoundError = useMemo(() => {
//     if (loading) return false;
//     return errorMsg.toLowerCase().includes("no active round") || !currentRound;
//   }, [loading, currentRound, errorMsg]);

//   // New round notification
//   useEffect(() => {
//     if (currentRound && !currentRound.outcome) {
//       toast.info(`🎲 New Round #${currentRound.roundNumber} started!`, {
//         position: "top-right",
//         autoClose: 3000
//       });
//     }
//   }, [currentRound?.roundNumber]);

//   // Betting closure notification
//   useEffect(() => {
//     if (currentRound && timeLeft === 0 && !currentRound.outcome) {
//       toast.warning('⏰ Betting is now closed!', {
//         position: "top-center",
//         autoClose: 3000
//       });
//     }
//   }, [timeLeft, currentRound]);

//   // Auto-refresh logic for no active round
//   useEffect(() => {
//     if (noActiveRoundError && !autoRefreshRef.current) {
//       autoRefreshRef.current = setInterval(async () => {
//         try {
//           await dispatch(fetchCurrentRound());
//         } catch (error) {
//           console.error("Auto-refresh failed:", error);
//         }
//       }, 30000);
//     }

//     return () => {
//       if (autoRefreshRef.current) {
//         clearInterval(autoRefreshRef.current);
//         autoRefreshRef.current = null;
//       }
//     };
//   }, [noActiveRoundError, dispatch]);

//   // Reset flip status on new round
//   useEffect(() => {
//     if (currentRound) {
//       setFlipComplete(false);
//     }
//   }, [currentRound]);

//   // Countdown timer logic
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Error handling
//   useEffect(() => {
//     if (errorMsg) {
//       if (errorMsg.includes("E11000")) {
//         toast.error("Multiple simultaneous bets detected. Please try again!");
//       } else if (!errorMsg.toLowerCase().includes("no active round")) {
//         toast.error(errorMsg);
//       }
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Handle manual refresh
//   const handleManualRefresh = async () => {
//     setIsRefreshing(true);
//     try {
//       await dispatch(fetchCurrentRound());
//       toast.success("Game status refreshed");
//     } catch (error) {
//       toast.error("Failed to refresh game status");
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   // Bet handlers
//   const onBetSuccess = (betAmount, side) => {
//     toast.success(`✅ Bet placed: $${betAmount} on ${side}`, {
//       position: "bottom-right",
//       autoClose: 3000
//     });
//   };

//   const onBetError = (error) => {
//     toast.error(`❌ ${error}`, {
//       position: "bottom-right",
//       autoClose: 4000
//     });
//   };

//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter the signed-in user's active bets
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;

//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && !isRefreshing && <LoadingSpinner />}

//       {noActiveRoundError ? (
//         <NoActiveRound
//           onRefresh={handleManualRefresh}
//           isLoading={loading || isRefreshing}
//         />
//       ) : currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm 
//               roundId={currentRound._id} 
//               onBetSuccess={onBetSuccess}
//               onBetError={onBetError}
//             />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               setFlipComplete(true);
//               const totalBetAmount = userActiveBets.reduce((sum, bet) => sum + bet.amount, 0);
//               const result = formatResultMessage(currentRound, userActiveBets, totalBetAmount);
              
//               if (result.type === 'success') {
//                 toast.success(result.message, {
//                   position: "top-center",
//                   autoClose: 5000,
//                   hideProgressBar: false,
//                   closeOnClick: true,
//                   pauseOnHover: true,
//                   draggable: true,
//                   progress: undefined,
//                   style: {
//                     background: '#4CAF50',
//                     color: 'white',
//                     fontSize: '16px',
//                     fontWeight: 'bold'
//                   }
//                 });
//               } else {
//                 toast.info(result.message, {
//                   position: "top-center",
//                   autoClose: 4000,
//                   hideProgressBar: false,
//                   closeOnClick: true,
//                   pauseOnHover: true,
//                   draggable: true,
//                   progress: undefined,
//                   style: {
//                     fontSize: '16px'
//                   }
//                 });
//               }
//             }}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import { FiRefreshCw, FiClock, FiAlertCircle } from 'react-icons/fi';
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function for formatting game result messages
// const formatResultMessage = (round, userBets, betAmount) => {
//   if (!round || !round.outcome) return null;
  
//   const userWon = userBets.some(bet => bet.side === round.outcome);
//   const outcome = round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1);
  
//   if (userBets.length === 0) {
//     return {
//       message: `Round ${round.roundNumber}: ${outcome} wins!`,
//       type: 'info'
//     };
//   }

//   const winningBet = userBets.find(bet => bet.side === round.outcome);
//   const winAmount = winningBet ? winningBet.potentialWin : 0;

//   if (userWon) {
//     return {
//       message: `🎉 Congratulations! You won $${winAmount.toFixed(2)} with ${outcome}!`,
//       type: 'success'
//     };
//   } else {
//     return {
//       message: `💫 Better luck next time! You lost $${betAmount.toFixed(2)}. ${outcome} wins!`,
//       type: 'info'
//     };
//   }
// };

// // NoActiveRound Component
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

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// // Loading Spinner Component
// const LoadingSpinner = () => (
//   <div className="flex justify-center items-center p-4">
//     <FiRefreshCw className="animate-spin h-8 w-8 text-blue-500" />
//   </div>
// );

// // Main GameRoom Component
// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const [flipComplete, setFlipComplete] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);

//   useAblyGameRoom();

//   // Helper to determine if there's no active round
//   const errorMsg = getErrorMessage(error);
//   const noActiveRoundError = useMemo(() => {
//     if (loading) return false;
//     return errorMsg.toLowerCase().includes("no active round") || !currentRound;
//   }, [loading, currentRound, errorMsg]);

//   // New round notification
//   useEffect(() => {
//     if (currentRound && !currentRound.outcome) {
//       toast.info(`🎲 New Round #${currentRound.roundNumber} started!`, {
//         position: "top-right",
//         autoClose: 3000
//       });
//     }
//   }, [currentRound?.roundNumber]);

//   // Betting closure notification
//   useEffect(() => {
//     if (currentRound && timeLeft === 0 && !currentRound.outcome) {
//       toast.warning('⏰ Betting is now closed!', {
//         position: "top-center",
//         autoClose: 3000
//       });
//     }
//   }, [timeLeft, currentRound]);

//   // Auto-refresh logic for no active round
//   useEffect(() => {
//     if (noActiveRoundError && !autoRefreshRef.current) {
//       autoRefreshRef.current = setInterval(async () => {
//         try {
//           await dispatch(fetchCurrentRound());
//         } catch (error) {
//           console.error("Auto-refresh failed:", error);
//         }
//       }, 30000);
//     }

//     return () => {
//       if (autoRefreshRef.current) {
//         clearInterval(autoRefreshRef.current);
//         autoRefreshRef.current = null;
//       }
//     };
//   }, [noActiveRoundError, dispatch]);

//   // Reset flip status on new round
//   useEffect(() => {
//     if (currentRound) {
//       setFlipComplete(false);
//     }
//   }, [currentRound]);

//   // Countdown timer logic
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Error handling
//   useEffect(() => {
//     if (errorMsg) {
//       if (errorMsg.includes("E11000")) {
//         toast.error("Multiple simultaneous bets detected. Please try again!");
//       } else if (!errorMsg.toLowerCase().includes("no active round")) {
//         toast.error(errorMsg);
//       }
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Handle manual refresh
//   const handleManualRefresh = async () => {
//     setIsRefreshing(true);
//     try {
//       await dispatch(fetchCurrentRound());
//       toast.success("Game status refreshed");
//     } catch (error) {
//       toast.error("Failed to refresh game status");
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   // Bet handlers
//   const onBetSuccess = (betAmount, side) => {
//     toast.success(`✅ Bet placed: $${betAmount} on ${side}`, {
//       position: "bottom-right",
//       autoClose: 3000
//     });
//   };

//   const onBetError = (error) => {
//     toast.error(`❌ ${error}`, {
//       position: "bottom-right",
//       autoClose: 4000
//     });
//   };


//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter the signed-in user's active bets
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;

//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && !isRefreshing && <LoadingSpinner />}

//       {noActiveRoundError ? (
//         <NoActiveRound
//           onRefresh={handleManualRefresh}
//           isLoading={loading || isRefreshing}
//         />
//       ) : currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm 
//               roundId={currentRound._id} 
//               onBetSuccess={onBetSuccess}
//               onBetError={onBetError}
//             />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               setFlipComplete(true);
//               const totalBetAmount = userActiveBets.reduce((sum, bet) => sum + bet.amount, 0);
//               const result = formatResultMessage(currentRound, userActiveBets, totalBetAmount);
              
//               if (result.type === 'success') {
//                 toast.success(result.message, {
//                   position: "top-center",
//                   autoClose: 5000,
//                   hideProgressBar: false,
//                   closeOnClick: true,
//                   pauseOnHover: true,
//                   draggable: true,
//                   progress: undefined,
//                   style: {
//                     background: '#4CAF50',
//                     color: 'white',
//                     fontSize: '16px',
//                     fontWeight: 'bold'
//                   }
//                 });
//               } else {
//                 toast.info(result.message, {
//                   position: "top-center",
//                   autoClose: 4000,
//                   hideProgressBar: false,
//                   closeOnClick: true,
//                   pauseOnHover: true,
//                   draggable: true,
//                   progress: undefined,
//                   style: {
//                     fontSize: '16px'
//                   }
//                 });
//               }
//             }}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import { FiRefreshCw, FiClock, FiAlertCircle } from 'react-icons/fi';
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // NoActiveRound Component
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

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// // Loading Spinner Component
// const LoadingSpinner = () => (
//   <div className="flex justify-center items-center p-4">
//     <FiRefreshCw className="animate-spin h-8 w-8 text-blue-500" />
//   </div>
// );


// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const [flipComplete, setFlipComplete] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);

//   useAblyGameRoom();

//   // Helper to determine if there's no active round
//   const errorMsg = getErrorMessage(error);
//   const noActiveRoundError = useMemo(() => {
//     if (loading) return false;
//     return errorMsg.toLowerCase().includes("no active round") || !currentRound;
//   }, [loading, currentRound, errorMsg]);

//   // Auto-refresh logic for no active round
//   useEffect(() => {
//     if (noActiveRoundError && !autoRefreshRef.current) {
//       autoRefreshRef.current = setInterval(async () => {
//         try {
//           await dispatch(fetchCurrentRound());
//         } catch (error) {
//           console.error("Auto-refresh failed:", error);
//         }
//       }, 30000); // Refresh every 30 seconds
//     }

//     return () => {
//       if (autoRefreshRef.current) {
//         clearInterval(autoRefreshRef.current);
//         autoRefreshRef.current = null;
//       }
//     };
//   }, [noActiveRoundError, dispatch]);

//   // Reset flip status on new round
//   useEffect(() => {
//     if (currentRound) {
//       setFlipComplete(false);
//     }
//   }, [currentRound]);

//   // Countdown timer logic
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Error handling
//   useEffect(() => {
//     if (errorMsg) {
//       if (errorMsg.includes("E11000")) {
//         toast.error("Multiple simultaneous bets detected. Please try again!");
//       } else if (!errorMsg.toLowerCase().includes("no active round")) {
//         toast.error(errorMsg);
//       }
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Handle manual refresh
//   const handleManualRefresh = async () => {
//     setIsRefreshing(true);
//     try {
//       await dispatch(fetchCurrentRound());
//       toast.success("Game status refreshed");
//     } catch (error) {
//       toast.error("Failed to refresh game status");
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter the signed-in user's active bets
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;

//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && !isRefreshing && <LoadingSpinner />}

//       {/* No Active Round */}
//       {noActiveRoundError ? (
//         <NoActiveRound
//           onRefresh={handleManualRefresh}
//           isLoading={loading || isRefreshing}
//         />
//       ) : currentRound && currentRound.outcome === null ? (
//         // Active round
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // Ended round
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               setFlipComplete(true);
//               toast.info(
//                 `Round ${currentRound.roundNumber} ended with outcome: ${currentRound.outcome}`
//               );
//             }}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Track the active tab for bet displays
//   const [activeTab, setActiveTab] = useState("activeBet");

//   // Track when the coin flip animation has completed
//   const [flipComplete, setFlipComplete] = useState(false);

//   // Local state to store the last result (updated after coin flip)
//   const [lastResult, setLastResult] = useState("N/A");

//   // Initialize realtime updates
//   useAblyGameRoom();

//   // Reset coin flip status whenever we get a new round
//   useEffect(() => {
//     if (currentRound) {
//       console.log("New round received; resetting flipComplete");
//       setFlipComplete(false);
//     }
//   }, [currentRound]);

//   /**
//    * Countdown Timer for Active Round:
//    * - Uses currentRound.endTime for the time-left display.
//    */
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       // If time is up, clear the interval
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime(); // set initial
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Extract and display errors from Redux state
//   const errorMsg = getErrorMessage(error);

//   useEffect(() => {
//     if (errorMsg) {
//       // Check if it's a concurrency / duplicate key error (common with many simultaneous bets)
//       if (errorMsg.includes("E11000")) {
//         toast.error("Multiple simultaneous bets encountered. Please try again!");
//       } else {
//         // Otherwise, just display the error normally
//         toast.error(errorMsg);
//       }

//       // Clear the error from Redux so we don't keep re-displaying it
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   /**
//    * Notify user about bet result after round ends
//    * - Relies on betResults updating in Redux
//    */
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     if (!userIdentifier) return;

//     const localStorageKey = `notifiedBets_${userIdentifier}`;
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;

//       // Compare phone if present, else compare user ID
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     let storedNotifiedBets = [];
//     try {
//       storedNotifiedBets =
//         JSON.parse(localStorage.getItem(localStorageKey)) || [];
//     } catch (err) {
//       console.error("Error parsing localStorage for notified bets:", err);
//     }

//     userBets.forEach((bet) => {
//       if (!bet.betId) return;
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter the signed-in user's active bets
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;

//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   // For "No Active Round" checks
//   const noActiveRoundError =
//     errorMsg.toLowerCase().includes("no active round") ||
//     (!loading && !currentRound);

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* If the server says there's no active round, or if currentRound is null */}
//       {noActiveRoundError ? (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700 mb-6">
//           <p className="text-xl font-semibold">No Active Round Available</p>
//           <p className="mt-2">
//             Betting is currently unavailable because there is no active round.
//             Please check back later or refresh the page.
//           </p>
//         </div>
//       ) : currentRound && currentRound.outcome === null ? (
//         // Active round
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {/* Only allow bets if current time < countdownEndTime */}
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // Ended round
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               console.log("Flip complete callback triggered");
//               setLastResult(currentRound.outcome);
//               setFlipComplete(true);
//               toast.info(
//                 `Round ${currentRound.roundNumber} ended with outcome: ${currentRound.outcome}`
//               );
//             }}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }




// // // // src/components/GameRoom.js
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Track the active tab for bet displays
//   const [activeTab, setActiveTab] = useState("activeBet");

//   // Track when the coin flip animation has completed
//   const [flipComplete, setFlipComplete] = useState(false);

//   // Local state to store the last result (updated after coin flip)
//   const [lastResult, setLastResult] = useState("N/A");

//   // Initialize realtime updates
//   useAblyGameRoom();

//   // Reset coin flip status whenever we get a new round
//   useEffect(() => {
//     if (currentRound) {
//       console.log("New round received; resetting flipComplete");
//       setFlipComplete(false);
//     }
//   }, [currentRound]);

//   /**
//    * Countdown Timer for Active Round:
//    * - Uses currentRound.endTime for the time-left display.
//    */
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       // If time is up, clear the interval
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime(); // set initial
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Convert Redux error into a string
//   const errorMsg = getErrorMessage(error);

//   // Display errors with proper messaging
//   useEffect(() => {
//     if (errorMsg) {
//       // Check if it's a duplicate bet error by matching known strings
//       if (
//         errorMsg.toLowerCase().includes("bet already exists") ||
//         errorMsg.toLowerCase().includes("duplicate")
//       ) {
//         toast.error("You've already placed a bet for this round. Please wait for the next round.");
//       } else if (errorMsg.includes("E11000")) {
//         // Check for concurrency / duplicate key error from MongoDB
//         toast.error("Multiple simultaneous bets encountered. Please try again!");
//       } else {
//         // Otherwise, just display the error normally
//         toast.error(errorMsg);
//       }

//       // Clear the error from Redux so we don't keep re-displaying it
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   /**
//    * Notify user about bet result after round ends
//    * - Relies on betResults updating in Redux
//    */
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     if (!userIdentifier) return;

//     const localStorageKey = `notifiedBets_${userIdentifier}`;
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;

//       // Compare phone if present, else compare user ID
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     let storedNotifiedBets = [];
//     try {
//       storedNotifiedBets =
//         JSON.parse(localStorage.getItem(localStorageKey)) || [];
//     } catch (err) {
//       console.error("Error parsing localStorage for notified bets:", err);
//     }

//     userBets.forEach((bet) => {
//       if (!bet.betId) return;
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter the signed-in user's active bets
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;

//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   // For "No Active Round" checks
//   const noActiveRoundError =
//     errorMsg.toLowerCase().includes("no active round") ||
//     (!loading && !currentRound);

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* If the server says there's no active round, or if currentRound is null */}
//       {noActiveRoundError ? (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700 mb-6">
//           <p className="text-xl font-semibold">No Active Round Available</p>
//           <p className="mt-2">
//             Betting is currently unavailable because there is no active round.
//             Please check back later or refresh the page.
//           </p>
//         </div>
//       ) : currentRound && currentRound.outcome === null ? (
//         // Active round
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {/* Only allow bets if current time < countdownEndTime */}
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // Ended round
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               console.log("Flip complete callback triggered");
//               setLastResult(currentRound.outcome);
//               setFlipComplete(true);
//               toast.info(
//                 `Round ${currentRound.roundNumber} ended with outcome: ${currentRound.outcome}`
//               );
//             }}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Redux state
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Track the active tab for bet displays
//   const [activeTab, setActiveTab] = useState("activeBet");

//   // Track when the coin flip animation has completed
//   const [flipComplete, setFlipComplete] = useState(false);

//   // Local state to store the last result (updated after coin flip)
//   const [lastResult, setLastResult] = useState("N/A");

//   // Initialize realtime updates
//   useAblyGameRoom();

//   // Reset coin flip status whenever we get a new round
//   useEffect(() => {
//     if (currentRound) {
//       console.log("New round received; resetting flipComplete");
//       setFlipComplete(false);
//     }
//   }, [currentRound]);

//   /**
//    * Countdown Timer for Active Round:
//    * - Uses currentRound.endTime for the time-left display.
//    */
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       // If time is up, clear the interval
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime(); // set initial
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Extract and display errors from Redux state
//   const errorMsg = getErrorMessage(error);

//   useEffect(() => {
//     if (errorMsg) {
//       // Check if it's a concurrency / duplicate key error (common with many simultaneous bets)
//       if (errorMsg.includes("E11000")) {
//         toast.error("Multiple simultaneous bets encountered. Please try again!");
//       } else {
//         // Otherwise, just display the error normally
//         toast.error(errorMsg);
//       }

//       // Clear the error from Redux so we don't keep re-displaying it
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   /**
//    * Notify user about bet result after round ends
//    * - Relies on betResults updating in Redux
//    */
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     if (!userIdentifier) return;

//     const localStorageKey = `notifiedBets_${userIdentifier}`;
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;

//       // Compare phone if present, else compare user ID
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     let storedNotifiedBets = [];
//     try {
//       storedNotifiedBets =
//         JSON.parse(localStorage.getItem(localStorageKey)) || [];
//     } catch (err) {
//       console.error("Error parsing localStorage for notified bets:", err);
//     }

//     userBets.forEach((bet) => {
//       if (!bet.betId) return;
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter the signed-in user's active bets
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;

//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   // For "No Active Round" checks
//   const noActiveRoundError =
//     errorMsg.toLowerCase().includes("no active round") ||
//     (!loading && !currentRound);

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* If the server says there's no active round, or if currentRound is null */}
//       {noActiveRoundError ? (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700 mb-6">
//           <p className="text-xl font-semibold">No Active Round Available</p>
//           <p className="mt-2">
//             Betting is currently unavailable because there is no active round.
//             Please check back later or refresh the page.
//           </p>
//         </div>
//       ) : currentRound && currentRound.outcome === null ? (
//         // Active round
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {/* Only allow bets if current time < countdownEndTime */}
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // Ended round
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               console.log("Flip complete callback triggered");
//               setLastResult(currentRound.outcome);
//               setFlipComplete(true);
//               toast.info(
//                 `Round ${currentRound.roundNumber} ended with outcome: ${currentRound.outcome}`
//               );
//             }}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string" ? err.error : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Track the active tab for bet displays
//   const [activeTab, setActiveTab] = useState("activeBet");

//   // Track when the coin flip animation has completed
//   const [flipComplete, setFlipComplete] = useState(false);

//   // Local state to store the last result (updated after coin flip)
//   const [lastResult, setLastResult] = useState("N/A");

//   // Initialize realtime updates (ensure your hook works as expected)
//   useAblyGameRoom();

//   // When a new round is received, reset the coin flip state
//   useEffect(() => {
//     if (currentRound) {
//       console.log("New round received; resetting flipComplete");
//       setFlipComplete(false);
//     }
//   }, [currentRound]);

//   /**
//    * Countdown Timer for Active Round:
//    * - Uses currentRound.endTime to display time left in the active round.
//    */
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Display any errors via toast and then clear them
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     if (!userIdentifier) return;

//     const localStorageKey = `notifiedBets_${userIdentifier}`;
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;

//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     let storedNotifiedBets = [];
//     try {
//       storedNotifiedBets =
//         JSON.parse(localStorage.getItem(localStorageKey)) || [];
//     } catch (err) {
//       console.error("Error parsing localStorage for notified bets:", err);
//     }

//     userBets.forEach((bet) => {
//       if (!bet.betId) return; // safety check
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter the signed-in user's active bets (only if round is active)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;

//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   // ---- RENDER LOGIC ----
//   // 1. If still loading, show a loading message
//   // 2. If we have an error that specifically says "No active round" or no currentRound, show "No Active Round Available"
//   // 3. Else, show the normal round logic (active or ended).

//   const noActiveRoundError =
//     errorMsg.toLowerCase().includes("no active round") ||
//     (!loading && !currentRound);

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Handle the "No active round" scenario from the server or if currentRound is null */}
//       {noActiveRoundError ? (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700 mb-6">
//           <p className="text-xl font-semibold">No Active Round Available</p>
//           <p className="mt-2">
//             Betting is currently unavailable because there is no active round.
//             Please check back later or refresh the page.
//           </p>
//         </div>
//       ) : currentRound && currentRound.outcome === null ? (
//         // Display an active round
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // Display ended round with coin flip and outcome
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               console.log("Flip complete callback triggered");
//               setLastResult(currentRound.outcome);
//               setFlipComplete(true);
//               toast.info(
//                 `Round ${currentRound.roundNumber} ended with outcome: ${currentRound.outcome}`
//               );
//             }}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : null}

//       {/* Jackpot Section: use safe default if jackpot is undefined */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot || 0).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && <ActiveBet userActiveBets={userActiveBets} />}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }


// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   // Track the active tab for bet displays
//   const [activeTab, setActiveTab] = useState("activeBet");
//   // Track when the coin flip animation has completed
//   const [flipComplete, setFlipComplete] = useState(false);
//   // Local state to store the last result (updated after coin flip)
//   const [lastResult, setLastResult] = useState("N/A");

//   // When a new round is received, reset the flip flag.
//   useEffect(() => {
//     console.log("New round received; resetting flipComplete");
//     setFlipComplete(false);
//   }, [currentRound]);

//   // Initialize realtime updates (ensure your hook works as expected)
//   useAblyGameRoom();

//   // Countdown Timer for Active Round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endTime = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Display any errors via toast and then clear them
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     let storedNotifiedBets = [];
//     try {
//       storedNotifiedBets =
//         JSON.parse(localStorage.getItem(localStorageKey)) || [];
//     } catch (err) {
//       console.error("Error parsing localStorage for notified bets:", err);
//     }

//     userBets.forEach((bet) => {
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter out the signed-in user's active bets (only during an active round)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone)
//             return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id)
//             return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Display active round */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             {/* <p className="text-lg">
//               <span className="font-medium">Last Result:</span> {lastResult}
//             </p> */}
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // Display ended round with coin flip and outcome after animation completes
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               console.log("Flip complete callback triggered");
//               // Update lastResult to match the outcome after the coin flip animation
//               setLastResult(currentRound.outcome);
//               setFlipComplete(true);
//               // Fire a toast notification to display the round outcome
//               toast.info(
//                 `Round ${currentRound.roundNumber} ended with outcome: ${currentRound.outcome}`
//               );
//             }}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         // Improved error message for when there is no active round for betting
//         <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700 mb-6">
//           <p className="text-xl font-semibold">No Active Round Available</p>
//           <p className="mt-2">
//             Betting is currently unavailable because there is no active round.
//             Please check back later or refresh the page.
//           </p>
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && (
//             <ActiveBet userActiveBets={userActiveBets} />
//           )}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }


// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   // Track the active tab for bet displays
//   const [activeTab, setActiveTab] = useState("activeBet");
//   // Track when the coin flip animation has completed
//   const [flipComplete, setFlipComplete] = useState(false);
//   // Local state to store the last result (updated after coin flip)
//   const [lastResult, setLastResult] = useState("N/A");

//   // When a new round is received, reset the flip flag.
//   useEffect(() => {
//     console.log("New round received; resetting flipComplete");
//     setFlipComplete(false);
//   }, [currentRound]);

//   // Initialize realtime updates (ensure your hook works as expected)
//   useAblyGameRoom();

//   // Countdown Timer for Active Round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endTime = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Display any errors via toast and then clear them
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     let storedNotifiedBets = [];
//     try {
//       storedNotifiedBets =
//         JSON.parse(localStorage.getItem(localStorageKey)) || [];
//     } catch (err) {
//       console.error("Error parsing localStorage for notified bets:", err);
//     }

//     userBets.forEach((bet) => {
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter out the signed-in user's active bets (only during an active round)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone)
//             return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id)
//             return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Display active round */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span> {lastResult}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // Display ended round with coin flip and outcome after animation completes
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               console.log("Flip complete callback triggered");
//               // Update lastResult to match the outcome after the coin flip animation
//               setLastResult(currentRound.outcome);
//               setFlipComplete(true);
//               // Fire a toast notification to display the round outcome
//               toast.info(
//                 `Round ${currentRound.roundNumber} ended with outcome: ${currentRound.outcome}`
//               );
//             }}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && (
//             <ActiveBet userActiveBets={userActiveBets} />
//           )}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }



// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   // Track the active tab for bet displays
//   const [activeTab, setActiveTab] = useState("activeBet");
//   // Track when the coin flip animation has completed
//   const [flipComplete, setFlipComplete] = useState(false);
//   // Local state to store the last result (updated after coin flip)
//   const [lastResult, setLastResult] = useState("N/A");

//   // When a new round is received, reset the flip flag.
//   useEffect(() => {
//     console.log("New round received; resetting flipComplete");
//     setFlipComplete(false);
//   }, [currentRound]);

//   // Initialize realtime updates (ensure your hook works as expected)
//   useAblyGameRoom();

//   // Countdown Timer for Active Round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endTime = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Display any errors via toast and then clear them
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     let storedNotifiedBets = [];
//     try {
//       storedNotifiedBets = JSON.parse(localStorage.getItem(localStorageKey)) || [];
//     } catch (err) {
//       console.error("Error parsing localStorage for notified bets:", err);
//     }

//     userBets.forEach((bet) => {
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter out the signed-in user's active bets (only during an active round)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone)
//             return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id)
//             return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Display active round */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span> {lastResult}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // Display ended round with coin flip and outcome after animation completes
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               console.log("Flip complete callback triggered");
//               // Update lastResult to match the outcome after the coin flip animation
//               setLastResult(currentRound.outcome);
//               setFlipComplete(true);
//             }}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && (
//             <ActiveBet userActiveBets={userActiveBets} />
//           )}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   // Track the active tab for bet displays
//   const [activeTab, setActiveTab] = useState("activeBet");
//   // Track when the coin flip animation has completed
//   const [flipComplete, setFlipComplete] = useState(false);

//   // Reset flipComplete whenever a new round is received
//   useEffect(() => {
//     console.log("New round received; resetting flipComplete");
//     setFlipComplete(false);
//   }, [currentRound]);

//   // Initialize realtime updates (ensure your hook works as expected)
//   useAblyGameRoom();

//   // Countdown Timer for Active Round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endTime = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Display any errors via toast and then clear them
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     let storedNotifiedBets = [];
//     try {
//       storedNotifiedBets = JSON.parse(localStorage.getItem(localStorageKey)) || [];
//     } catch (err) {
//       console.error("Error parsing localStorage for notified bets:", err);
//     }

//     userBets.forEach((bet) => {
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter out the signed-in user's active bets (only during an active round)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone)
//             return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id)
//             return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Display active round */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // Display ended round with coin flip and outcome after animation completes
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => {
//               console.log("Flip complete callback triggered");
//               setFlipComplete(true);
//             }}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Additional Components */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />
//       <RoundHistory />

//       {/* Tabbed Navigation */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && (
//             <ActiveBet userActiveBets={userActiveBets} />
//           )}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// // src/components/GameRoom.js
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // NEW: Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   // State to track the active tab
//   const [activeTab, setActiveTab] = useState("activeBet");
//   // State to track when coin flip animation has finished.
//   const [flipComplete, setFlipComplete] = useState(false);

//   // Reset flipComplete when a new round comes in
//   useEffect(() => {
//     setFlipComplete(false);
//   }, [currentRound]);

//   // Initialize realtime updates
//   useAblyGameRoom();

//   // Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Show error toast only once then clear it
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     let storedNotifiedBets = [];
//     try {
//       storedNotifiedBets = JSON.parse(localStorage.getItem(localStorageKey)) || [];
//     } catch (e) {
//       console.error("Error parsing notified bets from localStorage", e);
//     }

//     userBets.forEach((bet) => {
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round (heads/tails)
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter out the signed-in user's active bets (only during an active round)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone)
//             return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id)
//             return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {/* Only display outcome text after the coin flip animation is complete */}
//           {flipComplete && (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           )}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => setFlipComplete(true)}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Render the BetUpdates component */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />

//       {/* Render the Round History component */}
//       <RoundHistory />

//       {/* Tabbed Navigation for Bets */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && (
//             <ActiveBet userActiveBets={userActiveBets} />
//           )}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }


// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // NEW: Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   // State to track the active tab
//   const [activeTab, setActiveTab] = useState("activeBet");
//   // New state to track when coin flip animation has finished.
//   const [flipComplete, setFlipComplete] = useState(false);

//   // Reset flipComplete when a new round starts
//   useEffect(() => {
//     if (currentRound && !currentRound.outcome) {
//       setFlipComplete(false);
//     }
//   }, [currentRound]);

//   // Initialize realtime updates
//   useAblyGameRoom();

//   // Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Show error toast only once then clear it
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     const storedNotifiedBets = JSON.parse(
//       localStorage.getItem(localStorageKey) || "[]"
//     );

//     userBets.forEach((bet) => {
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round (heads/tails)
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter out the signed-in user's active bets (only during an active round)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone)
//             return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id)
//             return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           {/* Only display outcome text after coin flip animation is complete */}
//           {flipComplete ? (
//             <p className="text-lg mb-4">
//               <span className="font-medium">Outcome:</span>{" "}
//               {currentRound.outcome}
//             </p>
//           ) : null}
//           <CoinFlip
//             round={currentRound}
//             onFlipComplete={() => setFlipComplete(true)}
//           />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Render the BetUpdates component */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />

//       {/* Render the Round History component */}
//       <RoundHistory />

//       {/* Tabbed Navigation for Bets */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && (
//             <ActiveBet userActiveBets={userActiveBets} />
//           )}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// src/components/GameRoom.js
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // NEW: Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   // State to track the active tab
//   const [activeTab, setActiveTab] = useState("activeBet");

//   // Initialize realtime updates
//   useAblyGameRoom();

//   // Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Show error toast only once then clear it
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     const storedNotifiedBets = JSON.parse(
//       localStorage.getItem(localStorageKey) || "[]"
//     );

//     userBets.forEach((bet) => {
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round (heads/tails)
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter out the signed-in user's active bets (only during an active round)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone)
//             return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id)
//             return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span> {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Render the BetUpdates component */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />

//       {/* Render the Round History component */}
//       <RoundHistory />

//       {/* Tabbed Navigation for Bets */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && (
//             <ActiveBet userActiveBets={userActiveBets} />
//           )}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Container */}
//       <ToastContainerWrapper />
//     </div>
//   );}


// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Bet Updates Component
// import RoundHistory from "./RoundHistory"; // NEW: Round History Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   // State to track the active tab
//   const [activeTab, setActiveTab] = useState("activeBet");

//   // Initialize realtime updates
//   useAblyGameRoom();

//   // Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Show error toast only once then clear it
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     const storedNotifiedBets = JSON.parse(
//       localStorage.getItem(localStorageKey) || "[]"
//     );

//     userBets.forEach((bet) => {
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round (heads/tails)
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter out the signed-in user's active bets (only during an active round)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone)
//             return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id)
//             return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span> {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Render the BetUpdates component */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />

//       {/* Render the Round History component */}
//       <RoundHistory />

//       {/* Tabbed Navigation for Bets */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && (
//             <ActiveBet userActiveBets={userActiveBets} />
//           )}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }


// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Active Bet Component
// import BetUpdates from "./BetUpdates"; // Newly created BetUpdates Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, betResults = [], loading, error } =
//     useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   // State to track the active tab
//   const [activeTab, setActiveTab] = useState("activeBet");

//   // Initialize realtime updates
//   useAblyGameRoom();

//   // Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Show error toast only once then clear it
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     const storedNotifiedBets = JSON.parse(
//       localStorage.getItem(localStorageKey) || "[]"
//     );

//     userBets.forEach((bet) => {
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round (heads/tails)
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter out the signed-in user's active bets (only during an active round)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone)
//             return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id)
//             return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span> {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Render the BetUpdates component */}
//       <BetUpdates headBets={headBets} tailBets={tailBets} />

//       {/* Tabbed Navigation for Bets */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && (
//             <ActiveBet userActiveBets={userActiveBets} />
//           )}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// src/components/GameRoom.js

//##########################################   working    2  
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import ActiveBet from "./ActiveBet"; // Newly created Active Bet component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   // State to track the active tab
//   const [activeTab, setActiveTab] = useState("activeBet");

//   // Initialize realtime updates
//   useAblyGameRoom();

//   // Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Show error toast only once then clear it
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     // Filter bets that belong to the signed-in user for the current round.
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     const storedNotifiedBets = JSON.parse(
//       localStorage.getItem(localStorageKey) || "[]"
//     );

//     userBets.forEach((bet) => {
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round (heads/tails)
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter out the signed-in user's active bets (only during an active round)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone)
//             return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id)
//             return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && (
//         <p className="text-center text-gray-600">Loading...</p>
//       )}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span>{" "}
//             {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Tabbed Navigation for Bets */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && (
//             <ActiveBet userActiveBets={userActiveBets} />
//           )}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }


//###################################################################  working 1 
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Bet History Component
// import TopWinsBets from "./TopWinsBets"; // Top Wins Component
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string"
//       ? err.error
//       : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   // State to track the active tab
//   const [activeTab, setActiveTab] = useState("activeBet");

//   // Initialize realtime updates
//   useAblyGameRoom();

//   // Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Show error toast only once then clear it
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     // Filter bets that belong to the signed-in user for the current round.
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     const storedNotifiedBets = JSON.parse(
//       localStorage.getItem(localStorageKey) || "[]"
//     );

//     userBets.forEach((bet) => {
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // Filter bets by side for the current round (heads/tails)
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   // Filter out the signed-in user's active bets (only during an active round)
//   const userActiveBets =
//     authUser && currentRound && currentRound.outcome === null
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           if (bet.phone && authUser.phone)
//             return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id)
//             return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && (
//         <p className="text-center text-gray-600">Loading...</p>
//       )}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span>{" "}
//             {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Tabbed Navigation for Bets */}
//       <div className="mt-8">
//         <div className="flex justify-center mb-4 space-x-4">
//           <button
//             onClick={() => setActiveTab("activeBet")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "activeBet"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Active Bet
//           </button>
//           <button
//             onClick={() => setActiveTab("betHistory")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "betHistory"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Your Bet History
//           </button>
//           <button
//             onClick={() => setActiveTab("topWins")}
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "topWins"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//           >
//             Top 10 Wins
//           </button>
//         </div>
//         <div>
//           {activeTab === "activeBet" && (
//             <div className="bg-blue-100 rounded-lg p-4">
//               <h3 className="text-xl font-bold text-center">
//                 Your Active Bet
//               </h3>
//               {userActiveBets.length > 0 ? (
//                 userActiveBets.map((bet, idx) => (
//                   <div key={bet.betId || idx} className="text-center my-2">
//                     <p className="text-lg">
//                       <strong>Amount:</strong> Ksh {bet.betAmount}
//                     </p>
//                     <p className="text-lg">
//                       <strong>Side:</strong> {bet.side}
//                     </p>
//                     {bet.result ? (
//                       <p className="text-green-600 text-lg">
//                         <strong>Result:</strong>{" "}
//                         {bet.result === "win"
//                           ? `Won Ksh${bet.amount}`
//                           : `Lost Ksh${bet.amount}`}
//                       </p>
//                     ) : (
//                       <p className="text-gray-600 text-lg">Bet is active</p>
//                     )}
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-center text-gray-600">
//                   You have not placed any bet this round.
//                 </p>
//               )}
//             </div>
//           )}
//           {activeTab === "betHistory" && (
//             <div className="bg-green-100 rounded-lg p-4">
//               <UserBets />
//             </div>
//           )}
//           {activeTab === "topWins" && (
//             <div className="bg-purple-100 rounded-lg p-4">
//               <TopWinsBets />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }


// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Import the UserBets component
// import TopWinsBets from "./TopWinsBets"; // Import TopWinsBets
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Updated helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error)
//     return typeof err.error === "string" ? err.error : JSON.stringify(err.error);
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   // Get the logged-in user from the auth slice
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // 1. Initialize realtime updates (Ably, sockets, etc.)
//   useAblyGameRoom();

//   // 2. (Optional) Fetch round & jackpot data on component mount
//   // useEffect(() => {
//   //   dispatch(fetchCurrentRound());
//   //   dispatch(fetchJackpotPool());
//   // }, [dispatch]);

//   // 3. Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // 4. Show error toast ONLY once, then clear it in Redux
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // 5. Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     // Determine a unique key for the user to avoid duplicate notifications.
//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     // Filter bets that belong to the signed-in user for the current round.
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       // Check using phone or user ID
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     // Get the list of bet IDs we've already notified about.
//     const storedNotifiedBets = JSON.parse(
//       localStorage.getItem(localStorageKey) || "[]"
//     );

//     userBets.forEach((bet) => {
//       // Only notify if we haven't already notified for this bet.
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         // Mark this bet as notified.
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // 6. Filter bets by side (heads/tails) for the current round only.
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && (
//         <p className="text-center text-gray-600">Loading...</p>
//       )}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span>{" "}
//             {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Active Bet Section for the Signed-in User */}
//       {authUser && currentRound && currentRound.outcome === null && (
//         <div className="bg-blue-100 rounded-lg p-4 mb-6">
//           <h3 className="text-xl font-bold text-center">
//             Your Active Bet
//           </h3>
//           {betResults.filter((bet) => {
//             const betRound = bet.gameRound || bet.roundId;
//             if (betRound !== currentRound._id) return false;
//             if (bet.phone && authUser.phone)
//               return bet.phone === authUser.phone;
//             if (!bet.phone && authUser._id)
//               return bet.user === authUser._id;
//             return false;
//           }).length > 0 ? (
//             betResults
//               .filter((bet) => {
//                 const betRound = bet.gameRound || bet.roundId;
//                 if (betRound !== currentRound._id) return false;
//                 if (bet.phone && authUser.phone)
//                   return bet.phone === authUser.phone;
//                 if (!bet.phone && authUser._id)
//                   return bet.user === authUser._id;
//                 return false;
//               })
//               .map((bet, idx) => (
//                 <div key={bet.betId || idx} className="text-center my-2">
//                   <p className="text-lg">
//                     <strong>Amount:</strong> Ksh {bet.betAmount}
//                   </p>
//                   <p className="text-lg">
//                     <strong>Side:</strong> {bet.side}
//                   </p>
//                   {bet.result ? (
//                     <p className="text-green-600 text-lg">
//                       <strong>Result:</strong>{" "}
//                       {bet.result === "win"
//                         ? `Won Ksh${bet.amount}`
//                         : `Lost Ksh${bet.amount}`}
//                     </p>
//                   ) : (
//                     <p className="text-gray-600 text-lg">Bet is active</p>
//                   )}
//                 </div>
//               ))
//           ) : (
//             <p className="text-center text-gray-600">
//               You have not placed any bet this round.
//             </p>
//           )}
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* User Bet History Component */}
//       {authUser && <UserBets />}

//       {/* Top Wins Section */}
//       <TopWinsBets />

//       {/* Toast container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// // // Inside GameRoom.js
// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets"; // Import the UserBets component
// import TopWinsBets from "./TopWinsBets"; // Import TopWinsBets
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";


// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   // Get the logged-in user from the auth slice
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // 1. Initialize realtime updates (Ably, sockets, etc.)
//   useAblyGameRoom();

//   // 2. (Optional) Fetch round & jackpot data on component mount
//   // useEffect(() => {
//   //   dispatch(fetchCurrentRound());
//   //   dispatch(fetchJackpotPool());
//   // }, [dispatch]);

//   // 3. Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // 4. Show error toast ONLY once, then clear it in Redux
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // 5. Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     // Determine a unique key for the user to avoid duplicate notifications.
//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     // Filter bets that belong to the signed-in user for the current round.
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       // Check using phone or user ID
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     // Get the list of bet IDs we've already notified about.
//     const storedNotifiedBets = JSON.parse(
//       localStorage.getItem(localStorageKey) || "[]"
//     );

//     userBets.forEach((bet) => {
//       // Only notify if we haven't already notified for this bet.
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         // Mark this bet as notified.
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // 6. Filter bets by side (heads/tails) for the current round only.
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && (
//         <p className="text-center text-gray-600">Loading...</p>
//       )}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span>{" "}
//             {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Active Bet Section for the Signed-in User */}
//       {authUser && currentRound && currentRound.outcome === null && (
//         <div className="bg-blue-100 rounded-lg p-4 mb-6">
//           <h3 className="text-xl font-bold text-center">
//             Your Active Bet
//           </h3>
//           {betResults.filter((bet) => {
//             const betRound = bet.gameRound || bet.roundId;
//             if (betRound !== currentRound._id) return false;
//             if (bet.phone && authUser.phone)
//               return bet.phone === authUser.phone;
//             if (!bet.phone && authUser._id)
//               return bet.user === authUser._id;
//             return false;
//           }).length > 0 ? (
//             betResults
//               .filter((bet) => {
//                 const betRound = bet.gameRound || bet.roundId;
//                 if (betRound !== currentRound._id) return false;
//                 if (bet.phone && authUser.phone)
//                   return bet.phone === authUser.phone;
//                 if (!bet.phone && authUser._id)
//                   return bet.user === authUser._id;
//                 return false;
//               })
//               .map((bet, idx) => (
//                 <div key={bet.betId || idx} className="text-center my-2">
//                   <p className="text-lg">
//                     <strong>Amount:</strong> Ksh {bet.betAmount}
//                   </p>
//                   <p className="text-lg">
//                     <strong>Side:</strong> {bet.side}
//                   </p>
//                   {bet.result ? (
//                     <p className="text-green-600 text-lg">
//                       <strong>Result:</strong>{" "}
//                       {bet.result === "win"
//                         ? `Won Ksh${bet.amount}`
//                         : `Lost Ksh${bet.amount}`}
//                     </p>
//                   ) : (
//                     <p className="text-gray-600 text-lg">Bet is active</p>
//                   )}
//                 </div>
//               ))
//           ) : (
//             <p className="text-center text-gray-600">
//               You have not placed any bet this round.
//             </p>
//           )}
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* User Bet History Component */}
//       {authUser && <UserBets />}

//         {/* Top Wins Section */}
//         <TopWinsBets />

//       {/* Toast container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }


// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   // Get the logged-in user from the auth slice
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // 1. Initialize realtime updates (Ably, sockets, etc.)
//   useAblyGameRoom();

//   // 2. (Optional) Fetch round & jackpot data on component mount
//   // useEffect(() => {
//   //   dispatch(fetchCurrentRound());
//   //   dispatch(fetchJackpotPool());
//   // }, [dispatch]);

//   // 3. Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // 4. Show error toast ONLY once, then clear it in Redux
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // 5. Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     // Determine a unique key for the user to avoid duplicate notifications.
//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     // Filter bets that belong to the signed-in user for the current round.
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       // Check using phone or user ID
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     // Get the list of bet IDs we've already notified about.
//     const storedNotifiedBets = JSON.parse(
//       localStorage.getItem(localStorageKey) || "[]"
//     );

//     userBets.forEach((bet) => {
//       // Only notify if we haven't already notified for this bet.
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         // Mark this bet as notified.
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // 6. Filter bets by side (heads/tails) for the current round only.
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "heads" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];
//   const tailBets = currentRoundId
//     ? betResults.filter(
//         (bet) =>
//           bet.side === "tails" &&
//           (bet.gameRound || bet.roundId) === currentRoundId
//       )
//     : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span>{" "}
//             {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Active Bet Section for the Signed-in User */}
//       {authUser && currentRound && currentRound.outcome === null && (
//         <div className="bg-blue-100 rounded-lg p-4 mb-6">
//           <h3 className="text-xl font-bold text-center">Your Active Bet</h3>
//           {betResults.filter((bet) => {
//             const betRound = bet.gameRound || bet.roundId;
//             if (betRound !== currentRound._id) return false;
//             if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//             if (!bet.phone && authUser._id) return bet.user === authUser._id;
//             return false;
//           }).length > 0 ? (
//             betResults
//               .filter((bet) => {
//                 const betRound = bet.gameRound || bet.roundId;
//                 if (betRound !== currentRound._id) return false;
//                 if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//                 if (!bet.phone && authUser._id) return bet.user === authUser._id;
//                 return false;
//               })
//               .map((bet, idx) => (
//                 <div key={bet.betId || idx} className="text-center my-2">
//                   <p className="text-lg">
//                     <strong>Amount:</strong> Ksh {bet.betAmount}
//                   </p>
//                   <p className="text-lg">
//                     <strong>Side:</strong> {bet.side}
//                   </p>
//                   {bet.result ? (
//                     <p className="text-green-600 text-lg">
//                       <strong>Result:</strong>{" "}
//                       {bet.result === "win"
//                         ? `Won Ksh${bet.amount}`
//                         : `Lost Ksh${bet.amount}`}
//                     </p>
//                   ) : (
//                     <p className="text-gray-600 text-lg">Bet is active</p>
//                   )}
//                 </div>
//               ))
//           ) : (
//             <p className="text-center text-gray-600">
//               You have not placed any bet this round.
//             </p>
//           )}
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets (filtered for the current round) */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Toast container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// // Inside GameRoom.js

// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     // aggregatedBetResults, // We'll use betResults directly
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   // Get the logged-in user from the auth slice
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // 1. Initialize realtime updates (Ably, sockets, etc.)
//   useAblyGameRoom();

//   // 2. (Optional) Fetch round & jackpot data on component mount
//   // useEffect(() => {
//   //   dispatch(fetchCurrentRound());
//   //   dispatch(fetchJackpotPool());
//   // }, [dispatch]);

//   // 3. Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // 4. Show error toast ONLY once, then clear it in Redux
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // 5. Notify the signed-in user about their bet result after the round ends
//   useEffect(() => {
//     if (!authUser || !currentRound || currentRound.outcome === null) return;

//     // Determine a unique key for the user to avoid duplicate notifications.
//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     // Filter bets that belong to the signed-in user for the current round.
//     const userBets = betResults.filter((bet) => {
//       const betRound = bet.gameRound || bet.roundId;
//       if (betRound !== currentRound._id) return false;
//       // Check using phone or user ID
//       if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//       if (!bet.phone && authUser._id) return bet.user === authUser._id;
//       return false;
//     });

//     // Get the list of bet IDs we've already notified about.
//     const storedNotifiedBets = JSON.parse(
//       localStorage.getItem(localStorageKey) || "[]"
//     );

//     userBets.forEach((bet) => {
//       // Only notify if we haven't already notified for this bet.
//       if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
//         if (bet.result === "win") {
//           toast.success(`Congratulations! You won Ksh${bet.amount}!`);
//         } else if (bet.result === "loss" || bet.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
//           );
//         }
//         // Mark this bet as notified.
//         storedNotifiedBets.push(bet.betId);
//       }
//     });

//     localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
//   }, [betResults, currentRound, authUser]);

//   // 6. Filter bets by side (heads/tails) for the current round only.
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets =
//     currentRoundId &&
//     betResults.filter(
//       (bet) =>
//         bet.side === "heads" &&
//         (bet.gameRound || bet.roundId) === currentRoundId
//     );
//   const tailBets =
//     currentRoundId &&
//     betResults.filter(
//       (bet) =>
//         bet.side === "tails" &&
//         (bet.gameRound || bet.roundId) === currentRoundId
//     );

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span>{" "}
//             {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Active Bet Section for the Signed-in User */}
//       {authUser && currentRound && currentRound.outcome === null && (
//         <div className="bg-blue-100 rounded-lg p-4 mb-6">
//           <h3 className="text-xl font-bold text-center">Your Active Bet</h3>
//           {betResults.filter((bet) => {
//             const betRound = bet.gameRound || bet.roundId;
//             if (betRound !== currentRound._id) return false;
//             if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//             if (!bet.phone && authUser._id) return bet.user === authUser._id;
//             return false;
//           }).length > 0 ? (
//             betResults
//               .filter((bet) => {
//                 const betRound = bet.gameRound || bet.roundId;
//                 if (betRound !== currentRound._id) return false;
//                 if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//                 if (!bet.phone && authUser._id) return bet.user === authUser._id;
//                 return false;
//               })
//               .map((bet, idx) => (
//                 <div key={bet.betId || idx} className="text-center my-2">
//                   <p className="text-lg">
//                     <strong>Amount:</strong> Ksh {bet.betAmount}
//                   </p>
//                   <p className="text-lg">
//                     <strong>Side:</strong> {bet.side}
//                   </p>
//                   {bet.result ? (
//                     <p className="text-green-600 text-lg">
//                       <strong>Result:</strong>{" "}
//                       {bet.result === "win"
//                         ? `Won Ksh${bet.amount}`
//                         : `Lost Ksh${bet.amount}`}
//                     </p>
//                   ) : (
//                     <p className="text-gray-600 text-lg">Bet is active</p>
//                   )}
//                 </div>
//               ))
//           ) : (
//             <p className="text-center text-gray-600">
//               You have not placed any bet this round.
//             </p>
//           )}
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets (filtered for the current round) */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Toast container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }



// // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   // Get the logged-in user from the auth slice
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // 1. Initialize realtime updates (Ably, sockets, etc.)
//   useAblyGameRoom();

//   // 2. (Optional) Fetch round & jackpot data on component mount
//   // useEffect(() => {
//   //   dispatch(fetchCurrentRound());
//   //   dispatch(fetchJackpotPool());
//   // }, [dispatch]);

//   // 3. Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // 4. Show error toast ONLY once, then clear it in Redux
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // 5. Notify the user about win/loss results if not already done (only for this user)
//   useEffect(() => {
//     if (!authUser) return; // No logged-in user; skip notifications

//     // Use a user-specific key (using phone or id)
//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     aggregatedBetResults.forEach((result) => {
//       // Check if this result belongs to the current user
//       if (result.phone && result.phone !== authUser.phone) return;
//       if (!result.phone && result.user !== authUser._id) return;

//       const storedNotifiedBets = JSON.parse(
//         localStorage.getItem(localStorageKey) || "[]"
//       );
//       if (!storedNotifiedBets.includes(result.betId) && result.result) {
//         if (result.result === "win") {
//           toast.success(`Congratulations! You won Ksh${result.amount}!`);
//         } else if (result.result === "loss" || result.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${result.betAmount} lost Ksh${result.amount}.`
//           );
//         }
//         // Save the new bet ID to local storage to prevent duplicate notifications
//         localStorage.setItem(
//           localStorageKey,
//           JSON.stringify([...storedNotifiedBets, result.betId])
//         );
//       }
//     });
//   }, [aggregatedBetResults, authUser]);

//   // 6. Filter bets by side (heads/tails) for the current round only.
//   // We compare the bet's round property (either gameRound or roundId) to the current round _id.
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets =
//     currentRoundId &&
//     betResults.filter(
//       (bet) =>
//         bet.side === "heads" &&
//         (bet.gameRound || bet.roundId) === currentRoundId
//     );
//   const tailBets =
//     currentRoundId &&
//     betResults.filter(
//       (bet) =>
//         bet.side === "tails" &&
//         (bet.gameRound || bet.roundId) === currentRoundId
//     );

//   // 7. Determine the active bet(s) for the signed-in user for the current round
//   const userBets =
//     currentRoundId && authUser
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRoundId) return false;
//           // Compare using phone or user ID
//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span>{" "}
//             {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Active Bet Section for the Signed-in User */}
//       {authUser && currentRound && currentRound.outcome === null && (
//         <div className="bg-blue-100 rounded-lg p-4 mb-6">
//           <h3 className="text-xl font-bold text-center">Your Active Bet</h3>
//           {userBets.length > 0 ? (
//             userBets.map((bet, idx) => (
//               <div key={bet.betId || idx} className="text-center my-2">
//                 <p className="text-lg">
//                   <strong>Amount:</strong> Ksh {bet.betAmount}
//                 </p>
//                 <p className="text-lg">
//                   <strong>Side:</strong> {bet.side}
//                 </p>
//                 {bet.result ? (
//                   <p className="text-green-600 text-lg">
//                     <strong>Result:</strong>{" "}
//                     {bet.result === "win"
//                       ? `Won Ksh${bet.amount}`
//                       : `Lost Ksh${bet.amount}`}
//                   </p>
//                 ) : (
//                   <p className="text-gray-600 text-lg">Bet is active</p>
//                 )}
//               </div>
//             ))
//           ) : (
//             <p className="text-center text-gray-600">
//               You have not placed any bet this round.
//             </p>
//           )}
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets (filtered for the current round) */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Toast container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }






// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   // Get the logged-in user from the auth slice
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // 1. Initialize realtime updates (Ably, sockets, etc.)
//   useAblyGameRoom();

//   // 2. (Optional) Fetch round & jackpot data on component mount
//   // useEffect(() => {
//   //   dispatch(fetchCurrentRound());
//   //   dispatch(fetchJackpotPool());
//   // }, [dispatch]);

//   // 3. Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // 4. Show error toast ONLY once, then clear it in Redux
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // 5. Notify the user about win/loss results if not already done (only for this user)
//   useEffect(() => {
//     if (!authUser) return; // No logged-in user; skip notifications

//     // Use a user-specific key (using phone or id)
//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     aggregatedBetResults.forEach((result) => {
//       // Check if this result belongs to the current user
//       if (result.phone && result.phone !== authUser.phone) return;
//       if (!result.phone && result.user !== authUser._id) return;

//       const storedNotifiedBets = JSON.parse(
//         localStorage.getItem(localStorageKey) || "[]"
//       );
//       if (!storedNotifiedBets.includes(result.betId) && result.result) {
//         if (result.result === "win") {
//           toast.success(`Congratulations! You won Ksh${result.amount}!`);
//         } else if (result.result === "loss" || result.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${result.betAmount} lost Ksh${result.amount}.`
//           );
//         }
//         // Save the new bet ID to local storage
//         localStorage.setItem(
//           localStorageKey,
//           JSON.stringify([...storedNotifiedBets, result.betId])
//         );
//       }
//     });
//   }, [aggregatedBetResults, authUser]);

//   // 6. Filter bets by side (heads/tails) for the current round only.
//   // We compare the bet's round property (either gameRound or roundId) to the current round _id.
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets =
//     currentRoundId &&
//     betResults.filter(
//       (bet) =>
//         bet.side === "heads" &&
//         (bet.gameRound || bet.roundId) === currentRoundId
//     );
//   const tailBets =
//     currentRoundId &&
//     betResults.filter(
//       (bet) =>
//         bet.side === "tails" &&
//         (bet.gameRound || bet.roundId) === currentRoundId
//     );

//   // 7. Determine the active bet(s) for the signed-in user for the current round
//   const userBets =
//     currentRoundId && authUser
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRoundId) return false;
//           // Compare using phone or user ID
//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span>{" "}
//             {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Active Bet Section for the Signed-in User */}
//       {authUser && currentRound && currentRound.outcome === null && (
//         <div className="bg-blue-100 rounded-lg p-4 mb-6">
//           <h3 className="text-xl font-bold text-center">Your Active Bet</h3>
//           {userBets.length > 0 ? (
//             userBets.map((bet, idx) => (
//               <div key={bet.betId || idx} className="text-center my-2">
//                 <p className="text-lg">
//                   <strong>Amount:</strong> Ksh {bet.betAmount}
//                 </p>
//                 <p className="text-lg">
//                   <strong>Side:</strong> {bet.side}
//                 </p>
//                 {bet.result ? (
//                   <p className="text-green-600 text-lg">
//                     <strong>Result:</strong>{" "}
//                     {bet.result === "win"
//                       ? `Won Ksh${bet.amount}`
//                       : `Lost Ksh${bet.amount}`}
//                   </p>
//                 ) : (
//                   <p className="text-gray-600 text-lg">Bet is active</p>
//                 )}
//               </div>
//             ))
//           ) : (
//             <p className="text-center text-gray-600">
//               You have not placed any bet this round.
//             </p>
//           )}
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets (filtered for the current round) */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Toast container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }

// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   // Get the logged-in user from the auth slice
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // 1. Initialize realtime updates (Ably, sockets, etc.)
//   useAblyGameRoom();

//   // 2. (Optional) Fetch round & jackpot data on component mount
//   // useEffect(() => {
//   //   dispatch(fetchCurrentRound());
//   //   dispatch(fetchJackpotPool());
//   // }, [dispatch]);

//   // 3. Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // 4. Show error toast ONLY once, then clear it in Redux
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // 5. Notify the user about win/loss results if not already done (only for this user)
//   useEffect(() => {
//     if (!authUser) return; // No logged-in user; skip notifications

//     // Use a user-specific key (using phone or id)
//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     aggregatedBetResults.forEach((result) => {
//       // Check if this result belongs to the current user
//       if (result.phone && result.phone !== authUser.phone) return;
//       if (!result.phone && result.user !== authUser._id) return;

//       const storedNotifiedBets = JSON.parse(
//         localStorage.getItem(localStorageKey) || "[]"
//       );
//       if (!storedNotifiedBets.includes(result.betId) && result.result) {
//         if (result.result === "win") {
//           toast.success(`Congratulations! You won Ksh${result.amount}!`);
//         } else if (result.result === "loss" || result.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${result.betAmount} lost Ksh${result.amount}.`
//           );
//         }
//         // Save the new bet ID to local storage
//         localStorage.setItem(
//           localStorageKey,
//           JSON.stringify([...storedNotifiedBets, result.betId])
//         );
//       }
//     });
//   }, [aggregatedBetResults, authUser]);

//   // 6. Filter bets by side (heads/tails) for the current round only.
//   // We compare the bet's round property (either gameRound or roundId) to the current round _id.
//   const currentRoundId = currentRound ? currentRound._id : null;
//   const headBets =
//     currentRoundId &&
//     betResults.filter(
//       (bet) =>
//         bet.side === "heads" &&
//         (bet.gameRound || bet.roundId) === currentRoundId
//     );
//   const tailBets =
//     currentRoundId &&
//     betResults.filter(
//       (bet) =>
//         bet.side === "tails" &&
//         (bet.gameRound || bet.roundId) === currentRoundId
//     );

//   // 7. Determine the active bet(s) for the signed-in user for the current round
//   const userBets =
//     currentRoundId && authUser
//       ? betResults.filter((bet) => {
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRoundId) return false;
//           // Compare using phone or user ID
//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span>{" "}
//             {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Active Bet Section for the Signed-in User */}
//       {authUser && currentRound && currentRound.outcome === null && (
//         <div className="bg-blue-100 rounded-lg p-4 mb-6">
//           <h3 className="text-xl font-bold text-center">Your Active Bet</h3>
//           {userBets.length > 0 ? (
//             userBets.map((bet, idx) => (
//               <div key={bet.betId || idx} className="text-center my-2">
//                 <p className="text-lg">
//                   <strong>Amount:</strong> Ksh {bet.betAmount}
//                 </p>
//                 <p className="text-lg">
//                   <strong>Side:</strong> {bet.side}
//                 </p>
//                 {bet.result ? (
//                   <p className="text-green-600 text-lg">
//                     <strong>Result:</strong>{" "}
//                     {bet.result === "win"
//                       ? `Won Ksh${bet.amount}`
//                       : `Lost Ksh${bet.amount}`}
//                   </p>
//                 ) : (
//                   <p className="text-gray-600 text-lg">Bet is active</p>
//                 )}
//               </div>
//             ))
//           ) : (
//             <p className="text-center text-gray-600">
//               You have not placed any bet this round.
//             </p>
//           )}
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets (filtered for the current round) */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Aggregated Bet Results */}
//       {aggregatedBetResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Aggregated Results for All Bets
//           </h3>
//           <ul className="space-y-2">
//             {aggregatedBetResults.map((result, index) => (
//               <li
//                 key={result.betId || index}
//                 className="p-2 border rounded hover:bg-gray-50"
//               >
//                 <div className="flex justify-between">
//                   <span>
//                     <strong>Bet #{result.betNumber}:</strong>{" "}
//                     {result.phone
//                       ? `Phone: ${result.phone}`
//                       : `User: ${result.user || "N/A"}`}
//                   </span>
//                   <span className="text-sm text-gray-500">
//                     Side: {result.side}
//                   </span>
//                 </div>
//                 <p>
//                   <span className="font-medium">Amount:</span>{" "}
//                   {result.betAmount} |{" "}
//                   {result.result === "win"
//                     ? `Won: ${result.amount}`
//                     : `Lost: ${result.amount}`}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Participant Results */}
//       {participantResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Participants Results
//           </h3>
//           <ul className="space-y-4">
//             {participantResults.map((participant) => (
//               <li
//                 key={participant.user}
//                 className="p-4 border rounded hover:bg-gray-50"
//               >
//                 <p className="font-semibold">
//                   User: {participant.user}{" "}
//                   {participant.phone ? `| Phone: ${participant.phone}` : ""}
//                 </p>
//                 <p>
//                   <span className="font-medium">Total Bet:</span>{" "}
//                   {participant.totalBet} |{" "}
//                   <span className="font-medium">Total Won:</span>{" "}
//                   {participant.totalWon} |{" "}
//                   <span className="font-medium">Total Lost:</span>{" "}
//                   {participant.totalLost}
//                 </p>
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul className="mt-2 space-y-1 pl-4 border-l border-gray-300">
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId} className="text-sm">
//                         Bet #{idx + 1}: {bet.betAmount} on {bet.side} -{" "}
//                         {bet.result === "win"
//                           ? `Won: ${bet.amount}`
//                           : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Toast container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }





// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";


// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   // Get the logged-in user from the auth slice
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // 1. Initialize realtime updates (Ably, sockets, etc.)
//   useAblyGameRoom();

//   // 2. (Optional) Fetch round & jackpot data on component mount
//   // useEffect(() => {
//   //   dispatch(fetchCurrentRound());
//   //   dispatch(fetchJackpotPool());
//   // }, [dispatch]);

//   // 3. Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // 4. Show error toast ONLY once, then clear it in Redux
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // 5. Notify the user about win/loss results if not already done (only for this user)
//   useEffect(() => {
//     if (!authUser) return; // No logged-in user; skip notifications

//     // Use a user-specific key (using phone or id)
//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     aggregatedBetResults.forEach((result) => {
//       // Check if this result belongs to the current user
//       if (result.phone && result.phone !== authUser.phone) return;
//       if (!result.phone && result.user !== authUser._id) return;

//       const storedNotifiedBets = JSON.parse(
//         localStorage.getItem(localStorageKey) || "[]"
//       );
//       if (!storedNotifiedBets.includes(result.betId) && result.result) {
//         if (result.result === "win") {
//           toast.success(`Congratulations! You won Ksh${result.amount}!`);
//         } else if (result.result === "loss" || result.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${result.betAmount} lost Ksh${result.amount}.`
//           );
//         }
//         // Save the new bet ID to local storage
//         localStorage.setItem(
//           localStorageKey,
//           JSON.stringify([...storedNotifiedBets, result.betId])
//         );
//       }
//     });
//   }, [aggregatedBetResults, authUser]);

//   // 6. Filter bets by side (heads/tails)
//   const headBets = betResults.filter((bet) => bet.side === "heads");
//   const tailBets = betResults.filter((bet) => bet.side === "tails");

//   // 7. Determine the active bet(s) for the signed-in user for the current round
//   const userBets =
//     currentRound && authUser
//       ? betResults.filter((bet) => {
//           // Use either bet.gameRound or bet.roundId (backend publishes roundId)
//           const betRound = bet.gameRound || bet.roundId;
//           if (betRound !== currentRound._id) return false;
//           // Compare using phone or user ID
//           if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
//           if (!bet.phone && authUser._id) return bet.user === authUser._id;
//           return false;
//         })
//       : [];

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span>{" "}
//             {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Active Bet Section for the Signed-in User */}
//       {authUser && currentRound && currentRound.outcome === null && (
//         <div className="bg-blue-100 rounded-lg p-4 mb-6">
//           <h3 className="text-xl font-bold text-center">Your Active Bet</h3>
//           {userBets.length > 0 ? (
//             userBets.map((bet, idx) => (
//               <div key={bet.betId || idx} className="text-center my-2">
//                 <p className="text-lg">
//                   <strong>Amount:</strong> Ksh {bet.betAmount}
//                 </p>
//                 <p className="text-lg">
//                   <strong>Side:</strong> {bet.side}
//                 </p>
//                 {bet.result ? (
//                   <p className="text-green-600 text-lg">
//                     <strong>Result:</strong>{" "}
//                     {bet.result === "win"
//                       ? `Won Ksh${bet.amount}`
//                       : `Lost Ksh${bet.amount}`}
//                   </p>
//                 ) : (
//                   <p className="text-gray-600 text-lg">Bet is active</p>
//                 )}
//               </div>
//             ))
//           ) : (
//             <p className="text-center text-gray-600">
//               You have not placed any bet this round.
//             </p>
//           )}
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Aggregated Bet Results */}
//       {aggregatedBetResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Aggregated Results for All Bets
//           </h3>
//           <ul className="space-y-2">
//             {aggregatedBetResults.map((result, index) => (
//               <li
//                 key={result.betId || index}
//                 className="p-2 border rounded hover:bg-gray-50"
//               >
//                 <div className="flex justify-between">
//                   <span>
//                     <strong>Bet #{result.betNumber}:</strong>{" "}
//                     {result.phone
//                       ? `Phone: ${result.phone}`
//                       : `User: ${result.user || "N/A"}`}
//                   </span>
//                   <span className="text-sm text-gray-500">
//                     Side: {result.side}
//                   </span>
//                 </div>
//                 <p>
//                   <span className="font-medium">Amount:</span>{" "}
//                   {result.betAmount} |{" "}
//                   {result.result === "win"
//                     ? `Won: ${result.amount}`
//                     : `Lost: ${result.amount}`}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Participant Results */}
//       {participantResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Participants Results
//           </h3>
//           <ul className="space-y-4">
//             {participantResults.map((participant) => (
//               <li
//                 key={participant.user}
//                 className="p-4 border rounded hover:bg-gray-50"
//               >
//                 <p className="font-semibold">
//                   User: {participant.user}{" "}
//                   {participant.phone ? `| Phone: ${participant.phone}` : ""}
//                 </p>
//                 <p>
//                   <span className="font-medium">Total Bet:</span>{" "}
//                   {participant.totalBet} |{" "}
//                   <span className="font-medium">Total Won:</span>{" "}
//                   {participant.totalWon} |{" "}
//                   <span className="font-medium">Total Lost:</span>{" "}
//                   {participant.totalLost}
//                 </p>
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul className="mt-2 space-y-1 pl-4 border-l border-gray-300">
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId} className="text-sm">
//                         Bet #{idx + 1}: {bet.betAmount} on {bet.side} -{" "}
//                         {bet.result === "win"
//                           ? `Won: ${bet.amount}`
//                           : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Toast container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }



// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError,
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   // Get the logged-in user from the auth slice
//   const authUser = useSelector((state) => state.auth.user);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // 1. Initialize realtime updates (Ably, sockets, etc.)
//   useAblyGameRoom();

//   // 2. Fetch round & jackpot data on component mount
//   // useEffect(() => {
//   //   dispatch(fetchCurrentRound());
//   //   dispatch(fetchJackpotPool());
//   // }, [dispatch]);

//   // 3. Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // 4. Show error toast ONLY once, then clear it in Redux
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // 5. Notify the user about win/loss results if not already done (only for this user)
//   useEffect(() => {
//     if (!authUser) return; // No logged-in user; skip notifications

//     // Use a user-specific key (using phone or id)
//     const userIdentifier = authUser.phone || authUser._id;
//     const localStorageKey = `notifiedBets_${userIdentifier}`;

//     aggregatedBetResults.forEach((result) => {
//       // Check if this result belongs to the current user
//       // (Assumes that either the "phone" or "user" field is set in the result)
//       if (result.phone && result.phone !== authUser.phone) return;
//       if (!result.phone && result.user !== authUser._id) return;

//       const storedNotifiedBets = JSON.parse(
//         localStorage.getItem(localStorageKey) || "[]"
//       );
//       if (!storedNotifiedBets.includes(result.betId) && result.result) {
//         if (result.result === "win") {
//           toast.success(`Congratulations! You won Ksh${result.amount}!`);
//         } else if (result.result === "loss" || result.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${result.betAmount} lost Ksh${result.amount}.`
//           );
//         }
//         // Save the new bet ID to local storage
//         localStorage.setItem(
//           localStorageKey,
//           JSON.stringify([...storedNotifiedBets, result.betId])
//         );
//       }
//     });
//   }, [aggregatedBetResults, authUser]);

//   // 6. Filter bets by side (heads/tails)
//   const headBets = betResults.filter((bet) => bet.side === "heads");
//   const tailBets = betResults.filter((bet) => bet.side === "tails");

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">
//               Betting is closed.
//             </p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span>{" "}
//             {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Aggregated Bet Results */}
//       {aggregatedBetResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Aggregated Results for All Bets
//           </h3>
//           <ul className="space-y-2">
//             {aggregatedBetResults.map((result, index) => (
//               <li
//                 key={result.betId || index}
//                 className="p-2 border rounded hover:bg-gray-50"
//               >
//                 <div className="flex justify-between">
//                   <span>
//                     <strong>Bet #{result.betNumber}:</strong>{" "}
//                     {result.phone
//                       ? `Phone: ${result.phone}`
//                       : `User: ${result.user || "N/A"}`}
//                   </span>
//                   <span className="text-sm text-gray-500">
//                     Side: {result.side}
//                   </span>
//                 </div>
//                 <p>
//                   <span className="font-medium">Amount:</span>{" "}
//                   {result.betAmount} |{" "}
//                   {result.result === "win"
//                     ? `Won: ${result.amount}`
//                     : `Lost: ${result.amount}`}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Participant Results */}
//       {participantResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Participants Results
//           </h3>
//           <ul className="space-y-4">
//             {participantResults.map((participant) => (
//               <li
//                 key={participant.user}
//                 className="p-4 border rounded hover:bg-gray-50"
//               >
//                 <p className="font-semibold">
//                   User: {participant.user}{" "}
//                   {participant.phone ? `| Phone: ${participant.phone}` : ""}
//                 </p>
//                 <p>
//                   <span className="font-medium">Total Bet:</span>{" "}
//                   {participant.totalBet} |{" "}
//                   <span className="font-medium">Total Won:</span>{" "}
//                   {participant.totalWon} |{" "}
//                   <span className="font-medium">Total Lost:</span>{" "}
//                   {participant.totalLost}
//                 </p>
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul className="mt-2 space-y-1 pl-4 border-l border-gray-300">
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId} className="text-sm">
//                         Bet #{idx + 1}: {bet.betAmount} on {bet.side} -{" "}
//                         {bet.result === "win"
//                           ? `Won: ${bet.amount}`
//                           : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Toast container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }









// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   clearError // import clearError
// } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// // Helper function to convert error objects to strings
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Track which bets have been notified to avoid duplicate toasts
//   const notifiedBetsRef = useRef(new Set());

//   // 1. Initialize realtime updates (Ably, sockets, etc.)
//   useAblyGameRoom();

//   // 2. Fetch round & jackpot data on component mount
//   // useEffect(() => {
//   //   dispatch(fetchCurrentRound());
//   //   dispatch(fetchJackpotPool());
//   // }, [dispatch]);

//   // 3. Set up a local countdown timer for the active round
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // 4. Show error toast ONLY once, then clear it in Redux
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//       // Clear the error in Redux so it won’t show again on refresh
//       dispatch(clearError());
//     }
//   }, [errorMsg, dispatch]);

//   // 5. Notify the user about win/loss results if not already done
//   useEffect(() => {
//     aggregatedBetResults.forEach((result) => {
//       const storedNotifiedBets = JSON.parse(localStorage.getItem("notifiedBets") || "[]");
//       if (!storedNotifiedBets.includes(result.betId) && result.result) {
//         if (result.result === "win") {
//           toast.success(`Congratulations! You won Ksh${result.amount}!`);
//         } else if (result.result === "loss" || result.result === "lost") {
//           toast.error(`Sorry, your bet of Ksh${result.betAmount} lost Ksh${result.amount}.`);
//         }
//         // Save the new bet ID to local storage
//         localStorage.setItem("notifiedBets", JSON.stringify([...storedNotifiedBets, result.betId]));
//       }
//     });
//   }, [aggregatedBetResults]);


//   // 6. Filter bets by side (heads/tails)
//   const headBets = betResults.filter((bet) => bet.side === "heads");
//   const tailBets = betResults.filter((bet) => bet.side === "tails");

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Display */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span> {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Side-by-side Heads/Tails Bets */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.user
//                             ? `User: ${bet.user}`
//                             : bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Aggregated Bet Results */}
//       {aggregatedBetResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Aggregated Results for All Bets
//           </h3>
//           <ul className="space-y-2">
//             {aggregatedBetResults.map((result, index) => (
//               <li
//                 key={result.betId || index}
//                 className="p-2 border rounded hover:bg-gray-50"
//               >
//                 <div className="flex justify-between">
//                   <span>
//                     <strong>Bet #{result.betNumber}:</strong>{" "}
//                     {result.phone
//                       ? `Phone: ${result.phone}`
//                       : `User: ${result.user || "N/A"}`}
//                   </span>
//                   <span className="text-sm text-gray-500">
//                     Side: {result.side}
//                   </span>
//                 </div>
//                 <p>
//                   <span className="font-medium">Amount:</span>{" "}
//                   {result.betAmount} |{" "}
//                   {result.result === "win"
//                     ? `Won: ${result.amount}`
//                     : `Lost: ${result.amount}`}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Participant Results */}
//       {participantResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Participants Results
//           </h3>
//           <ul className="space-y-4">
//             {participantResults.map((participant) => (
//               <li
//                 key={participant.user}
//                 className="p-4 border rounded hover:bg-gray-50"
//               >
//                 <p className="font-semibold">
//                   User: {participant.user}{" "}
//                   {participant.phone ? `| Phone: ${participant.phone}` : ""}
//                 </p>
//                 <p>
//                   <span className="font-medium">Total Bet:</span>{" "}
//                   {participant.totalBet} |{" "}
//                   <span className="font-medium">Total Won:</span>{" "}
//                   {participant.totalWon} |{" "}
//                   <span className="font-medium">Total Lost:</span>{" "}
//                   {participant.totalLost}
//                 </p>
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul className="mt-2 space-y-1 pl-4 border-l border-gray-300">
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId} className="text-sm">
//                         Bet #{idx + 1}: {bet.betAmount} on {bet.side} -{" "}
//                         {bet.result === "win"
//                           ? `Won: ${bet.amount}`
//                           : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Toast container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }


// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchCurrentRound, fetchJackpotPool } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// /**
//  * Helper: Convert error objects to a string.
//  */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Destructure state with default empty arrays.
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Ref to keep track of bets we've already notified about.
//   const notifiedBetsRef = useRef(new Set());

//   // Initialize realtime updates.
//   useAblyGameRoom();

//   // Fetch initial round and jackpot data.
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());
//   }, [dispatch]);

//   // Set up a local countdown timer for the active round.
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Display error toast notifications when error changes.
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   // Notify the user when their bet result (win or loss) is available,
//   // including both the original bet amount and the amount won/lost.
//   useEffect(() => {
//     aggregatedBetResults.forEach((result) => {
//       // Check if the bet has a result and hasn't been notified already.
//       if (!notifiedBetsRef.current.has(result.betId) && result.result) {
//         if (result.result === "win") {
//           toast.success(
//             `Congratulations! You won Ksh${result.amount}!`
//           );
//         } else if (result.result === "loss" || result.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${result.betAmount} lost Ksh${result.amount}.`
//           );
//         }
//         notifiedBetsRef.current.add(result.betId);
//       }
//     });
//   }, [aggregatedBetResults]);

//   // Filter betResults for heads and tails.
//   const headBets = betResults.filter((bet) => bet.side === "heads");
//   const tailBets = betResults.filter((bet) => bet.side === "tails");

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Section */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               {/* Changed from "Total Pool" to "Last Result" */}
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span> {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Individual Bet Updates: Heads & Tails Side by Side */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         {/* <span className="text-sm text-gray-500">
//                           {bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : `User: ${bet.user || "N/A"}`}
//                         </span> */}
//                         <span className="text-sm text-gray-500">
//   {bet.user ? `User: ${bet.user}` : bet.phone ? `Phone: ${bet.phone}` : "N/A"}
// </span>

//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span> {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           {bet.phone
//                             ? `Phone: ${bet.phone}`
//                             : `User: ${bet.user || "N/A"}`}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span> {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Aggregated Bet Results */}
//       {aggregatedBetResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Aggregated Results for All Bets
//           </h3>
//           <ul className="space-y-2">
//             {aggregatedBetResults.map((result, index) => (
//               <li key={result.betId || index} className="p-2 border rounded hover:bg-gray-50">
//                 <div className="flex justify-between">
//                   <span>
//                     <strong>Bet #{result.betNumber}:</strong>{" "}
//                     {result.phone
//                       ? `Phone: ${result.phone}`
//                       : `User: ${result.user || "N/A"}`}
//                   </span>
//                   <span className="text-sm text-gray-500">Side: {result.side}</span>
//                 </div>
//                 <p>
//                   <span className="font-medium">Amount:</span> {result.betAmount} |{" "}
//                   {result.result === "win"
//                     ? `Won: ${result.amount}`
//                     : `Lost: ${result.amount}`}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Participants Results */}
//       {participantResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Participants Results
//           </h3>
//           <ul className="space-y-4">
//             {participantResults.map((participant) => (
//               <li key={participant.user} className="p-4 border rounded hover:bg-gray-50">
//                 <p className="font-semibold">
//                   User: {participant.user}{" "}
//                   {participant.phone ? `| Phone: ${participant.phone}` : ""}
//                 </p>
//                 <p>
//                   <span className="font-medium">Total Bet:</span> {participant.totalBet} |{" "}
//                   <span className="font-medium">Total Won:</span> {participant.totalWon} |{" "}
//                   <span className="font-medium">Total Lost:</span> {participant.totalLost}
//                 </p>
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul className="mt-2 space-y-1 pl-4 border-l border-gray-300">
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId} className="text-sm">
//                         Bet #{idx + 1}: {bet.betAmount} on {bet.side} -{" "}
//                         {bet.result === "win" ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Render the Toast Container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }






// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchCurrentRound, fetchJackpotPool } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// /**
//  * Helper: Convert error objects to a string.
//  */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Destructure state with default empty arrays.
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Ref to keep track of bets we've already notified about.
//   const notifiedBetsRef = useRef(new Set());

//   // Initialize realtime updates.
//   useAblyGameRoom();

//   // Fetch initial round and jackpot data.
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());
//   }, [dispatch]);

//   // Set up a local countdown timer for the active round.
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Display error toast notifications when error changes.
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   // Notify the user when their bet result (win or loss) is available,
//   // including both the original bet amount and the amount won/lost.
//   useEffect(() => {
//     aggregatedBetResults.forEach((result) => {
//       // Check if the bet has a result and hasn't been notified already.
//       if (!notifiedBetsRef.current.has(result.betId) && result.result) {
//         if (result.result === "win") {
//           toast.success(
//             `Congratulations! You won Ksh${result.amount}!`
//           );
//         } else if (result.result === "loss" || result.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${result.betAmount} lost Ksh${result.amount}.`
//           );
//         }
//         notifiedBetsRef.current.add(result.betId);
//       }
//     });
//   }, [aggregatedBetResults]);

//   // Filter betResults for heads and tails.
//   const headBets = betResults.filter((bet) => bet.side === "heads");
//   const tailBets = betResults.filter((bet) => bet.side === "tails");

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Section */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               {/* Changed from "Total Pool" to "Last Result" */}
//               <span className="font-medium">Last Result:</span>{" "}
//               {currentRound.lastResult || "N/A"}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span> {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">
//             Please wait for the next round to start...
//           </p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Individual Bet Updates: Heads & Tails Side by Side */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">
//             Bet Updates
//           </h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           Phone: {bet.phone || "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span> {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           Phone: {bet.phone || "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span>{" "}
//                         {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span> {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Aggregated Bet Results */}
//       {aggregatedBetResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Aggregated Results for All Bets
//           </h3>
//           <ul className="space-y-2">
//             {aggregatedBetResults.map((result, index) => (
//               <li key={result.betId || index} className="p-2 border rounded hover:bg-gray-50">
//                 <div className="flex justify-between">
//                   <span>
//                     <strong>Bet #{result.betNumber}:</strong> Phone: {result.phone || "N/A"}
//                   </span>
//                   <span className="text-sm text-gray-500">Side: {result.side}</span>
//                 </div>
//                 <p>
//                   <span className="font-medium">Amount:</span> {result.betAmount} |{" "}
//                   {result.result === "win"
//                     ? `Won: ${result.amount}`
//                     : `Lost: ${result.amount}`}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Participants Results */}
//       {participantResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Participants Results
//           </h3>
//           <ul className="space-y-4">
//             {participantResults.map((participant) => (
//               <li key={participant.user} className="p-4 border rounded hover:bg-gray-50">
//                 <p className="font-semibold">
//                   User: {participant.user}{" "}
//                   {participant.phone ? `| Phone: ${participant.phone}` : ""}
//                 </p>
//                 <p>
//                   <span className="font-medium">Total Bet:</span> {participant.totalBet} |{" "}
//                   <span className="font-medium">Total Won:</span> {participant.totalWon} |{" "}
//                   <span className="font-medium">Total Lost:</span> {participant.totalLost}
//                 </p>
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul className="mt-2 space-y-1 pl-4 border-l border-gray-300">
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId} className="text-sm">
//                         Bet #{idx + 1}: {bet.betAmount} on {bet.side} -{" "}
//                         {bet.result === "win" ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Render the Toast Container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }


// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchCurrentRound, fetchJackpotPool } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// /**
//  * Helper: Convert error objects to a string.
//  */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Destructure state with default empty arrays.
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Ref to keep track of bets we've already notified about.
//   const notifiedBetsRef = useRef(new Set());

//   // Initialize realtime updates.
//   useAblyGameRoom();

//   // Fetch initial round and jackpot data.
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());
//   }, [dispatch]);

//   // Set up a local countdown timer for the active round.
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Display error toast notifications when error changes.
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   // Notify the user when their bet result (win or loss) is available,
//   // including both the original bet amount and the amount won/lost.
//   useEffect(() => {
//     aggregatedBetResults.forEach((result) => {
//       // Check if the bet has a result and hasn't been notified already.
//       if (!notifiedBetsRef.current.has(result.betId) && result.result) {
//         if (result.result === "win") {
//           toast.success(
//             `Congratulations! Your bet of Ksh${result.betAmount} won Ksh${result.amount}!`
//           );
//         } else if (result.result === "loss" || result.result === "lost") {
//           toast.error(
//             `Sorry, your bet of Ksh${result.betAmount} lost Ksh${result.amount}.`
//           );
//         }
//         notifiedBetsRef.current.add(result.betId);
//       }
//     });
//   }, [aggregatedBetResults]);

//   // Filter betResults for heads and tails.
//   const headBets = betResults.filter((bet) => bet.side === "heads");
//   const tailBets = betResults.filter((bet) => bet.side === "tails");

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Section */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Total Pool:</span>{" "}
//               {currentRound.totalPool}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span> {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">Please wait for the next round to start...</p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">
//           Jackpot: {Number(jackpot).toFixed(2)}
//         </h3>
//       </div>

//       {/* Individual Bet Updates: Heads & Tails Side by Side */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">Bet Updates</h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Heads Bets
//               </h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           Phone: {bet.phone || "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span> {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span> {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">
//                 Tails Bets
//               </h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           Phone: {bet.phone || "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span> {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span> {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Aggregated Bet Results */}
//       {aggregatedBetResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Aggregated Results for All Bets
//           </h3>
//           <ul className="space-y-2">
//             {aggregatedBetResults.map((result, index) => (
//               <li key={result.betId || index} className="p-2 border rounded hover:bg-gray-50">
//                 <div className="flex justify-between">
//                   <span>
//                     <strong>Bet #{result.betNumber}:</strong> Phone: {result.phone || "N/A"}
//                   </span>
//                   <span className="text-sm text-gray-500">Side: {result.side}</span>
//                 </div>
//                 <p>
//                   <span className="font-medium">Amount:</span> {result.betAmount} |{" "}
//                   {result.result === "win"
//                     ? `Won: ${result.amount}`
//                     : `Lost: ${result.amount}`}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Participants Results */}
//       {participantResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">
//             Participants Results
//           </h3>
//           <ul className="space-y-4">
//             {participantResults.map((participant) => (
//               <li key={participant.user} className="p-4 border rounded hover:bg-gray-50">
//                 <p className="font-semibold">
//                   User: {participant.user} {participant.phone ? `| Phone: ${participant.phone}` : ""}
//                 </p>
//                 <p>
//                   <span className="font-medium">Total Bet:</span> {participant.totalBet} |{" "}
//                   <span className="font-medium">Total Won:</span> {participant.totalWon} |{" "}
//                   <span className="font-medium">Total Lost:</span> {participant.totalLost}
//                 </p>
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul className="mt-2 space-y-1 pl-4 border-l border-gray-300">
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId} className="text-sm">
//                         Bet #{idx + 1}: {bet.betAmount} on {bet.side} -{" "}
//                         {bet.result === "win" ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Render the Toast Container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }



// // // // // // // // src/components/GameRoom.js
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchCurrentRound, fetchJackpotPool } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import { toast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";

// /**
//  * Helper: Convert error objects to a string.
//  */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Destructure state with default empty arrays.
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Initialize realtime updates.
//   useAblyGameRoom();

//   // Fetch initial round and jackpot data.
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());
//   }, [dispatch]);

//   // Set up a local countdown timer for the active round.
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   // Convert error to a message string and display toast notifications.
//   const errorMsg = getErrorMessage(error);
//   useEffect(() => {
//     if (errorMsg) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   // Filter betResults for heads and tails.
//   const headBets = betResults.filter((bet) => bet.side === "heads");
//   const tailBets = betResults.filter((bet) => bet.side === "tails");

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Round Section */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Total Pool:</span> {currentRound.totalPool}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span> {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">Please wait for the next round to start...</p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">Jackpot: {Number(jackpot).toFixed(2)}</h3>
//       </div>

//       {/* Individual Bet Updates: Heads & Tails Side by Side */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">Bet Updates</h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">Heads Bets</h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li key={bet.betId || index} className="p-2 border rounded hover:bg-gray-50">
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           Phone: {bet.phone || "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span> {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span> {bet.result} |{" "}
//                           {bet.result === "win" ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">Tails Bets</h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li key={bet.betId || index} className="p-2 border rounded hover:bg-gray-50">
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           Phone: {bet.phone || "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span> {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span> {bet.result} |{" "}
//                           {bet.result === "win" ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Aggregated Bet Results */}
//       {aggregatedBetResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">Aggregated Results for All Bets</h3>
//           <ul className="space-y-2">
//             {aggregatedBetResults.map((result, index) => (
//               <li key={result.betId || index} className="p-2 border rounded hover:bg-gray-50">
//                 <div className="flex justify-between">
//                   <span>
//                     <strong>Bet #{result.betNumber}:</strong> Phone: {result.phone || "N/A"}
//                   </span>
//                   <span className="text-sm text-gray-500">Side: {result.side}</span>
//                 </div>
//                 <p>
//                   <span className="font-medium">Amount:</span> {result.betAmount} |{" "}
//                   {result.result === "win" ? `Won: ${result.amount}` : `Lost: ${result.amount}`}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Participants Results */}
//       {participantResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">Participants Results</h3>
//           <ul className="space-y-4">
//             {participantResults.map((participant) => (
//               <li key={participant.user} className="p-4 border rounded hover:bg-gray-50">
//                 <p className="font-semibold">
//                   User: {participant.user} {participant.phone ? `| Phone: ${participant.phone}` : ""}
//                 </p>
//                 <p>
//                   <span className="font-medium">Total Bet:</span> {participant.totalBet} |{" "}
//                   <span className="font-medium">Total Won:</span> {participant.totalWon} |{" "}
//                   <span className="font-medium">Total Lost:</span> {participant.totalLost}
//                 </p>
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul className="mt-2 space-y-1 pl-4 border-l border-gray-300">
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId} className="text-sm">
//                         Bet #{idx + 1}: {bet.betAmount} on {bet.side} -{" "}
//                         {bet.result === "win" ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Render the Toast Container */}
//       <ToastContainerWrapper />
//     </div>
//   );
// }


// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchCurrentRound, fetchJackpotPool } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";

// /**
//  * Helper: Convert error objects to a string.
//  */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Destructure state with default empty arrays.
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Initialize realtime updates.
//   useAblyGameRoom();

//   // Fetch initial round and jackpot data.
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());
//   }, [dispatch]);

//   // Set up a local countdown timer for the active round.
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   const errorMsg = getErrorMessage(error);

//   // Filter betResults for heads and tails
//   const headBets = betResults.filter((bet) => bet.side === "heads");
//   const tailBets = betResults.filter((bet) => bet.side === "tails");

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && (
//         <p className="text-center text-gray-600">Loading...</p>
//       )}

//       {/* Round Section */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Total Pool:</span> {currentRound.totalPool}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span> {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">Please wait for the next round to start...</p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">Jackpot: {Number(jackpot).toFixed(2)}</h3>
//       </div>

//       {/* Individual Bet Updates: Heads & Tails Side by Side */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">Bet Updates</h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">Heads Bets</h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           Phone: {bet.phone || "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span> {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">Tails Bets</h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           Phone: {bet.phone || "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span> {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Aggregated Bet Results */}
//       {aggregatedBetResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">Aggregated Results for All Bets</h3>
//           <ul className="space-y-2">
//             {aggregatedBetResults.map((result, index) => (
//               <li key={result.betId || index} className="p-2 border rounded hover:bg-gray-50">
//                 <div className="flex justify-between">
//                   <span>
//                     <strong>Bet #{result.betNumber}:</strong> Phone: {result.phone || "N/A"}
//                   </span>
//                   <span className="text-sm text-gray-500">Side: {result.side}</span>
//                 </div>
//                 <p>
//                   <span className="font-medium">Amount:</span> {result.betAmount} |{" "}
//                   {result.result === "win"
//                     ? `Won: ${result.amount}`
//                     : `Lost: ${result.amount}`}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Participant Results */}
//       {participantResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">Participants Results</h3>
//           <ul className="space-y-4">
//             {participantResults.map((participant) => (
//               <li key={participant.user} className="p-4 border rounded hover:bg-gray-50">
//                 <p className="font-semibold">
//                   User: {participant.user} {participant.phone ? `| Phone: ${participant.phone}` : ""}
//                 </p>
//                 <p>
//                   <span className="font-medium">Total Bet:</span> {participant.totalBet} |{" "}
//                   <span className="font-medium">Total Won:</span> {participant.totalWon} |{" "}
//                   <span className="font-medium">Total Lost:</span> {participant.totalLost}
//                 </p>
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul className="mt-2 space-y-1 pl-4 border-l border-gray-300">
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId} className="text-sm">
//                         Bet #{idx + 1}: {bet.betAmount} on {bet.side} -{" "}
//                         {bet.result === "win"
//                           ? `Won: ${bet.amount}`
//                           : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {errorMsg && (
//         <p className="text-center text-red-600 font-semibold mt-4">{errorMsg}</p>
//       )}
//     </div>
//   );
// }

// // src/components/GameRoom.jsx

// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchCurrentRound, fetchJackpotPool } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";

// /**
//  * Helper: Convert error objects to a string.
//  */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Destructure state with default empty arrays.
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Initialize realtime updates.
//   useAblyGameRoom();

//   // Fetch initial round and jackpot data.
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());
//   }, [dispatch]);

//   // Set up a local countdown timer for the active round.
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   const errorMsg = getErrorMessage(error);

//   // Filter betResults for heads and tails
//   const headBets = betResults.filter((bet) => bet.side === "heads");
//   const tailBets = betResults.filter((bet) => bet.side === "tails");

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && (
//         <p className="text-center text-gray-600">Loading...</p>
//       )}

//       {/* Round Section */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Total Pool:</span> {currentRound.totalPool}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span> {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">Please wait for the next round to start...</p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//         <h3 className="text-xl font-bold">Jackpot: {Number(jackpot).toFixed(2)}</h3>
//       </div>

//       {/* Individual Bet Updates: Heads & Tails Side by Side */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center">Bet Updates</h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">Heads Bets</h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                            Phone: {bet.phone || "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span> {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">Tails Bets</h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           User: {bet.user} | Phone: {bet.phone || "N/A"}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span> {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Aggregated Bet Results */}
//       {aggregatedBetResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">Aggregated Results for All Bets</h3>
//           <ul className="space-y-2">
//             {aggregatedBetResults.map((result, index) => (
//               <li key={result.betId || index} className="p-2 border rounded hover:bg-gray-50">
//                 <div className="flex justify-between">
//                   <span>
//                     <strong>Bet #{result.betNumber}:</strong> User: {result.user} | Phone: {result.phone || "N/A"}
//                   </span>
//                   <span className="text-sm text-gray-500">Side: {result.side}</span>
//                 </div>
//                 <p>
//                   <span className="font-medium">Amount:</span> {result.betAmount} |{" "}
//                   {result.result === "win"
//                     ? `Won: ${result.amount}`
//                     : `Lost: ${result.amount}`}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Participant Results */}
//       {participantResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">Participants Results</h3>
//           <ul className="space-y-4">
//             {participantResults.map((participant) => (
//               <li key={participant.user} className="p-4 border rounded hover:bg-gray-50">
//                 <p className="font-semibold">
//                   User: {participant.user} {participant.phone ? `| Phone: ${participant.phone}` : ""}
//                 </p>
//                 <p>
//                   <span className="font-medium">Total Bet:</span> {participant.totalBet} |{" "}
//                   <span className="font-medium">Total Won:</span> {participant.totalWon} |{" "}
//                   <span className="font-medium">Total Lost:</span> {participant.totalLost}
//                 </p>
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul className="mt-2 space-y-1 pl-4 border-l border-gray-300">
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId} className="text-sm">
//                         Bet #{idx + 1}: {bet.betAmount} on {bet.side} -{" "}
//                         {bet.result === "win"
//                           ? `Won: ${bet.amount}`
//                           : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {errorMsg && (
//         <p className="text-center text-red-600 font-semibold mt-4">{errorMsg}</p>
//       )}
//     </div>
//   );
// }

























// src/components/GameRoom.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchCurrentRound, fetchJackpotPool } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";

// /**
//  * Helper: Convert error objects to a string.
//  */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Destructure state with default empty arrays.
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Initialize realtime updates.
//   useAblyGameRoom();

//   // Fetch initial round and jackpot data.
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());
//   }, [dispatch]);

//   // Set up a local countdown timer for the active round.
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   const errorMsg = getErrorMessage(error);

//   // Filter betResults for heads and tails
//   const headBets = betResults.filter((bet) => bet.side === "heads");
//   const tailBets = betResults.filter((bet) => bet.side === "tails");

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-3xl font-extrabold text-center mb-6">
//         Coin Flip Betting Game
//       </h1>

//       {loading && (
//         <p className="text-center text-gray-600">Loading...</p>
//       )}

//       {/* Round Section */}
//       {currentRound && currentRound.outcome === null ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <div className="flex flex-col md:flex-row md:justify-between mb-4">
//             <p className="text-lg">
//               <span className="font-medium">Time Left:</span> {timeLeft}s
//             </p>
//             <p className="text-lg">
//               <span className="font-medium">Total Pool:</span> {currentRound.totalPool}
//             </p>
//           </div>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2 font-semibold">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div className="bg-white rounded-lg shadow p-6 mb-6">
//           <h2 className="text-2xl font-semibold mb-2">
//             Round #{currentRound.roundNumber} Ended!
//           </h2>
//           <p className="text-lg mb-4">
//             <span className="font-medium">Outcome:</span> {currentRound.outcome}
//           </p>
//           <CoinFlip round={currentRound} />
//           <p className="mt-4 text-gray-700">Please wait for the next round to start...</p>
//         </div>
//       ) : (
//         <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
//           No active round. Please wait...
//         </div>
//       )}

//       {/* Jackpot Section */}
//       <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
//   <h3 className="text-xl font-bold">Jackpot: {Number(jackpot).toFixed(2)}</h3>
//   </div>


//       {/* Individual Bet Updates: Heads & Tails Side by Side */}
//       {(headBets.length > 0 || tailBets.length > 0) && (
//         <div className="mb-6">
//           <h3 className="text-2xl font-semibold mb-4 text-center"> Bet Updates</h3>
//           <div className="flex flex-col md:flex-row md:space-x-6">
//             {/* Heads Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">Heads Bets</h4>
//               {headBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {headBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           User: {bet.user}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span> {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Heads bets yet.</p>
//               )}
//             </div>

//             {/* Tails Bets */}
//             <div className="bg-white rounded-lg shadow p-4 flex-1">
//               <h4 className="text-xl font-semibold mb-2 border-b pb-1">Tails Bets</h4>
//               {tailBets.length > 0 ? (
//                 <ul className="space-y-2">
//                   {tailBets.map((bet, index) => (
//                     <li
//                       key={bet.betId || index}
//                       className="p-2 border rounded hover:bg-gray-50"
//                     >
//                       <div className="flex justify-between">
//                         <span>
//                           <strong>Bet #{index + 1}</strong>
//                         </span>
//                         <span className="text-sm text-gray-500">
//                           User: {bet.user}
//                         </span>
//                       </div>
//                       <p>
//                         <span className="font-medium">Amount:</span> {bet.betAmount}
//                       </p>
//                       {bet.result ? (
//                         <p>
//                           <span className="font-medium">Result:</span>{" "}
//                           {bet.result} |{" "}
//                           {bet.result === "win"
//                             ? `Won: ${bet.amount}`
//                             : `Lost: ${bet.amount}`}
//                         </p>
//                       ) : (
//                         <p className="text-gray-600">Placed</p>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">No Tails bets yet.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Aggregated Bet Results */}
//       {aggregatedBetResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">Aggregated Results for All Bets</h3>
//           <ul className="space-y-2">
//             {aggregatedBetResults.map((result, index) => (
//               <li key={result.betId || index} className="p-2 border rounded hover:bg-gray-50">
//                 <div className="flex justify-between">
//                   <span>
//                     <strong>Bet #{result.betNumber}:</strong> User: {result.user}
//                   </span>
//                   <span className="text-sm text-gray-500">Side: {result.side}</span>
//                 </div>
//                 <p>
//                   <span className="font-medium">Amount:</span> {result.betAmount} |{" "}
//                   {result.result === "win"
//                     ? `Won: ${result.amount}`
//                     : `Lost: ${result.amount}`}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Participant Results */}
//       {participantResults.length > 0 && (
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <h3 className="text-2xl font-semibold mb-2 border-b pb-1">Participants Results</h3>
//           <ul className="space-y-4">
//             {participantResults.map((participant) => (
//               <li key={participant.user} className="p-4 border rounded hover:bg-gray-50">
//                 <p className="font-semibold">
//                   User: {participant.user}
//                 </p>
//                 <p>
//                   <span className="font-medium">Total Bet:</span> {participant.totalBet} |{" "}
//                   <span className="font-medium">Total Won:</span> {participant.totalWon} |{" "}
//                   <span className="font-medium">Total Lost:</span> {participant.totalLost}
//                 </p>
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul className="mt-2 space-y-1 pl-4 border-l border-gray-300">
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId} className="text-sm">
//                         Bet #{idx + 1}: {bet.betAmount} on {bet.side} -{" "}
//                         {bet.result === "win"
//                           ? `Won: ${bet.amount}`
//                           : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {errorMsg && (
//         <p className="text-center text-red-600 font-semibold mt-4">{errorMsg}</p>
//       )}
//     </div>
//   );
// }




// // src/components/GameRoom.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchCurrentRound, fetchJackpotPool } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";

// /**
//  * Helper: Convert error objects to a string.
//  */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Destructure state with default empty arrays.
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Initialize realtime updates.
//   useAblyGameRoom();

//   // Fetch initial round and jackpot data.
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());
//   }, [dispatch]);

//   // Set up a local countdown timer for the active round.
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   const errorMsg = getErrorMessage(error);

//   return (
//     <div className="p-6 bg-white rounded shadow">
//       <h1 className="text-2xl font-bold mb-4">Coin Flip Betting Game</h1>
      
//       {loading && <p className="text-center text-gray-600">Loading...</p>}
      
//       {currentRound && currentRound.outcome === null ? (
//         <div>
//           <h2 className="text-lg font-semibold">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <p>Time Left: {timeLeft}s</p>
//           <p>Total Pool: {currentRound.totalPool}</p>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div>
//           <h2>Round #{currentRound.roundNumber} ended!</h2>
//           <p>Outcome: {currentRound.outcome}</p>
//           <CoinFlip round={currentRound} />
//           <p>Please wait for the next round to start...</p>
//         </div>
//       ) : (
//         <div>No active round. Please wait...</div>
//       )}

//       <div className="mt-4">
//         <h3>Jackpot: {jackpot}</h3>
//       </div>

//       {betResults.length > 0 && (
//         <div className="mt-4">
//           <h3>Individual Bet Updates</h3>
//           <ul>
//             {betResults.map((bet, index) => (
//               <li key={bet.betId || index}>
//                 <strong>Bet #{index + 1}:</strong> User: {bet.user} | Amount: {bet.betAmount} | Side: {bet.side} | 
//                 {bet.result ? (
//                   <> Result: {bet.result} | {bet.result === "win" ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}</>
//                 ) : (
//                   <> Placed</>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {aggregatedBetResults.length > 0 && (
//         <div className="mt-4">
//           <h3>Aggregated Results for All Bets</h3>
//           <ul>
//             {aggregatedBetResults.map((result, index) => (
//               <li key={result.betId || index}>
//                 <strong>Bet #{result.betNumber}:</strong> User: {result.user} | Amount: {result.betAmount} | Side: {result.side} | 
//                 {result.result === "win" ? `Won: ${result.amount}` : `Lost: ${result.amount}`}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {participantResults.length > 0 && (
//         <div className="mt-4">
//           <h3>Participants Results</h3>
//           <ul>
//             {participantResults.map((participant) => (
//               <li key={participant.user}>
//                 <strong>User: {participant.user}</strong> | Total Bet: {participant.totalBet} | Total Won: {participant.totalWon} | Total Lost: {participant.totalLost}
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul>
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId}>
//                         Bet #{idx + 1}: Amount: {bet.betAmount} | Side: {bet.side} | {bet.result === "win" ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}
//     </div>
//   );
// }

// // src/components/GameRoom.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchCurrentRound, fetchJackpotPool } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";

// /**
//  * Helper: Convert error objects to a string.
//  */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Destructure state with default empty arrays to avoid errors.
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Initialize realtime updates.
//   useAblyGameRoom();

//   // Fetch initial data.
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());
//   }, [dispatch]);

//   // Set up a local countdown timer for the active round.
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   const errorMsg = getErrorMessage(error);

//   return (
//     <div className="p-6 bg-white rounded shadow">
//       <h1 className="text-2xl font-bold mb-4">Coin Flip Betting Game</h1>
      
//       {loading && <p className="text-center text-gray-600">Loading...</p>}
      
//       {currentRound && currentRound.outcome === null ? (
//         <div>
//           <h2 className="text-lg font-semibold">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <p>Time Left: {timeLeft}s</p>
//           <p>Total Pool: {currentRound.totalPool}</p>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div>
//           <h2>Round #{currentRound.roundNumber} ended!</h2>
//           <p>Outcome: {currentRound.outcome}</p>
//           <CoinFlip round={currentRound} />
//           <p>Please wait for the next round to start...</p>
//         </div>
//       ) : (
//         <div>No active round. Please wait...</div>
//       )}

//       <div className="mt-4">
//         <h3>Jackpot: {jackpot}</h3>
//       </div>

//       {betResults.length > 0 && (
//         <div className="mt-4">
//           <h3>Individual Bet Results</h3>
//           <ul>
//             {betResults.map((bet, index) => (
//               <li key={bet.betId || index}>
//                 <strong>Bet #{index + 1}:</strong> User: {bet.user} | Amount: {bet.betAmount} | Side: {bet.side} | Result: {bet.result} | {bet.result === 'win' ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {aggregatedBetResults.length > 0 && (
//         <div className="mt-4">
//           <h3>Aggregated Results for All Bets</h3>
//           <ul>
//             {aggregatedBetResults.map((result, index) => (
//               <li key={result.betId || index}>
//                 <strong>Bet #{result.betNumber}:</strong> User: {result.user} | Amount: {result.betAmount} | Side: {result.side} | Result: {result.result} | {result.result === 'win' ? `Won: ${result.amount}` : `Lost: ${result.amount}`}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {participantResults.length > 0 && (
//         <div className="mt-4">
//           <h3>Participants Results</h3>
//           <ul>
//             {participantResults.map((participant) => (
//               <li key={participant.user}>
//                 <strong>User: {participant.user}</strong> | Total Bet: {participant.totalBet} | Total Won: {participant.totalWon} | Total Lost: {participant.totalLost}
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul>
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId}>
//                         Bet #{idx + 1}: Amount: {bet.betAmount} | Side: {bet.side} | Result: {bet.result} | {bet.result === 'win' ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}
//     </div>
//   );
// }

// src/components/GameRoom.jsx

// src/components/GameRoom.jsx
// src/components/GameRoom.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchCurrentRound, fetchJackpotPool } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";

// /**
//  * Helper: Convert error objects to a string.
//  */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();

//   // Destructure with default empty arrays to prevent errors.
//   const {
//     currentRound,
//     jackpot,
//     betResults = [],
//     aggregatedBetResults = [],
//     participantResults = [],
//     loading,
//     error,
//   } = useSelector((state) => state.round);

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // Initialize realtime updates.
//   useAblyGameRoom();

//   // Fetch initial data.
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());
//   }, [dispatch]);

//   // Local countdown timer for the active round.
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }
//     const endMs = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   const errorMsg = getErrorMessage(error);

//   return (
//     <div className="p-6 bg-white rounded shadow">
//       <h1 className="text-2xl font-bold mb-4">Coin Flip Betting Game</h1>
      
//       {loading && <p className="text-center text-gray-600">Loading...</p>}
      
//       {currentRound && currentRound.outcome === null ? (
//         <div>
//           <h2 className="text-lg font-semibold">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <p>Time Left: {timeLeft}s</p>
//           <p>Total Pool: {currentRound.totalPool}</p>
//           <CoinFlip round={currentRound} />
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         <div>
//           <h2>Round #{currentRound.roundNumber} ended!</h2>
//           <p>Outcome: {currentRound.outcome}</p>
//           <CoinFlip round={currentRound} />
//           <p>Please wait for the next round to start...</p>
//         </div>
//       ) : (
//         <div>No active round. Please wait...</div>
//       )}

//       <div className="mt-4">
//         <h3>Jackpot: {jackpot}</h3>
//       </div>

//       {betResults.length > 0 && (
//         <div className="mt-4">
//           <h3>Individual Bet Results</h3>
//           <ul>
//             {betResults.map((bet, index) => (
//               <li key={bet.betId || index}>
//                 <strong>Bet #{index + 1}:</strong> User: {bet.user} | Amount: {bet.betAmount} | Side: {bet.side} | Result: {bet.result} | {bet.result === 'win' ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {aggregatedBetResults.length > 0 && (
//         <div className="mt-4">
//           <h3>Aggregated Results for All Bets</h3>
//           <ul>
//             {aggregatedBetResults.map((result, index) => (
//               <li key={result.betId || index}>
//                 <strong>Bet #{result.betNumber}:</strong> User: {result.user} | Amount: {result.betAmount} | Side: {result.side} | Result: {result.result} | {result.result === 'win' ? `Won: ${result.amount}` : `Lost: ${result.amount}`}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {participantResults.length > 0 && (
//         <div className="mt-4">
//           <h3>Participants Results</h3>
//           <ul>
//             {participantResults.map((participant) => (
//               <li key={participant.user}>
//                 <strong>User: {participant.user}</strong> | Total Bet: {participant.totalBet} | Total Won: {participant.totalWon} | Total Lost: {participant.totalLost}
//                 {participant.bets && participant.bets.length > 0 && (
//                   <ul>
//                     {participant.bets.map((bet, idx) => (
//                       <li key={bet.betId}>
//                         Bet #{idx + 1}: Amount: {bet.betAmount} | Side: {bet.side} | Result: {bet.result} | {bet.result === 'win' ? `Won: ${bet.amount}` : `Lost: ${bet.amount}`}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}
//     </div>
//   );
// }


// src/components/GameRoom.jsx
// src/components/GameRoom.jsx

// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
// } from "../features/roundSlice";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";

// /** Convert potential error objects to string. */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// /**
//  * UI Flow:
//  * 1) On mount, fetch current round & jackpot.
//  * 2) Poll every few seconds so we see if the round ended (outcome changed).
//  * 3) Show countdown until round.endTime if outcome=null.
//  * 4) When outcome changes from null => heads/tails/house, coin flip triggers.
//  */
// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, loading, error } = useSelector(
//     (state) => state.round
//   );

//   const [timeLeft, setTimeLeft] = useState(0);
//   const pollRef = useRef(null);
//   const timerRef = useRef(null);

//   useEffect(() => {
//     // 1) initial fetch
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());

//     // 2) Poll every 5s
//     pollRef.current = setInterval(() => {
//       dispatch(fetchCurrentRound());
//       dispatch(fetchJackpotPool());
//     }, 5000);

//     return () => {
//       if (pollRef.current) clearInterval(pollRef.current);
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [dispatch]);

//   // If there's an active round (outcome===null), set up a local countdown
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       // no active round => reset
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     // there's an active round => count down to endTime
//     const endMs = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   const errorMsg = getErrorMessage(error);

//   return (
//     <div className="p-6 bg-white rounded shadow">
//       <h1 className="text-2xl font-bold mb-4">Coin Flip Betting Game</h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* If there's an active round => outcome=null => show countdown & BetForm */}
//       {currentRound && currentRound.outcome === null ? (
//         <div>
//           <h2 className="text-lg font-semibold">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <p>Time Left: {timeLeft}s</p>
//           <p>Total Pool: {currentRound.totalPool}</p>

//           <CoinFlip round={currentRound} />

//           {/* If betting still open (now < countdownEndTime), show BetForm */}
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-600 mt-2">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // The round ended => outcome is heads/tails/house
//         <div>
//           <h2>Round #{currentRound.roundNumber} ended!</h2>
//           <p>Outcome: {currentRound.outcome}</p>
//           <CoinFlip round={currentRound} />
//           <p>Please wait for the next round to start...</p>
//         </div>
//       ) : (
//         // No active round at all
//         <div>No active round. Please wait...</div>
//       )}

//       {/* Show jackpot */}
//       <div className="mt-4">
//         <h3>Jackpot: {jackpot}</h3>
//       </div>

//       {/* Any errors */}
//       {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}
//     </div>
//   );
// }



// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
//   // placeBet   (if you need it, import as well)
// } from "../features/roundSlice";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";

// /** Convert potential error objects to string. */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// /**
//  * The main game UI:
//  *  - Polls the server for current round & jackpot every 5s
//  *  - Displays a countdown until round.endTime
//  *  - Shows a coin flip animation when the outcome changes
//  *  - Lets user place bets if now < countdownEndTime
//  */
// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, loading, error, lastBet } = useSelector(
//     (state) => state.round
//   );

//   // For local countdown
//   const [timeLeft, setTimeLeft] = useState(0);
//   const pollRef = useRef(null);
//   const timerRef = useRef(null);

//   // 1) On mount, fetch data & start polling
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());

//     // Example: poll every 5 seconds
//     pollRef.current = setInterval(() => {
//       dispatch(fetchCurrentRound());
//       dispatch(fetchJackpotPool());
//     }, 5000);

//     return () => {
//       if (pollRef.current) clearInterval(pollRef.current);
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [dispatch]);

//   // 2) If there's an active round, set up a local countdown
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       // No active round => clear local timer
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     // There's an active round => countdown to round.endTime
//     const endTimeMs = new Date(currentRound.endTime).getTime();

//     const updateTime = () => {
//       const nowMs = Date.now();
//       const remaining = Math.max(0, Math.floor((endTimeMs - nowMs) / 1000));
//       setTimeLeft(remaining);

//       // If time is up, we can clear the timer
//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     // Cleanup if currentRound changes
//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//   }, [currentRound]);

//   const errorMsg = getErrorMessage(error);

//   return (
//     <div className="p-6 bg-white rounded shadow">
//       <h1 className="text-2xl font-bold mb-4">Coin Flip Betting Game</h1>

//       {loading && <p className="text-center text-gray-600">Loading...</p>}

//       {/* Active round */}
//       {currentRound && currentRound.outcome === null ? (
//         <div>
//           <h2 className="text-lg font-semibold">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <p>Time Left: {timeLeft} sec</p>
//           <p>Total Pool: {currentRound.totalPool}</p>

//           {/* Coin flip animation component */}
//           <CoinFlip round={currentRound} />

//           {/* Only allow bets if now < countdownEndTime */}
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="text-red-500 mt-2">Betting is closed for this round.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // Round ended
//         <div>
//           <h2>Round #{currentRound.roundNumber} ended!</h2>
//           <p>Outcome: {currentRound.outcome}</p>
//           <p>Please wait for the next round to start automatically.</p>
//         </div>
//       ) : (
//         // No active round at all
//         <div>No active round. Please wait...</div>
//       )}

//       {/* Show jackpot */}
//       <div className="mt-4">
//         <h3>Jackpot: {jackpot}</h3>
//       </div>

//       {/* Optional display of the last bet placed */}
//       {lastBet && (
//         <div className="mt-4 p-2 bg-gray-100 rounded">
//           <h4 className="font-semibold">Last Bet Placed:</h4>
//           <p>Bet ID: {lastBet._id}</p>
//           <p>Amount: {lastBet.amount}</p>
//           <p>Side: {lastBet.side}</p>
//           <p>Result: {lastBet.result}</p>
//         </div>
//       )}

//       {/* Display error messages */}
//       {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}
//     </div>
//   );
// }

// // src/components/GameRoom.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCurrentRound,
//   fetchJackpotPool,
// } from "../features/roundSlice";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";

// /** Safely convert an error object to a string for display. */
// function getErrorMessage(err) {
//   if (!err) return "";
//   if (typeof err === "string") return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
  
//   // State from Redux
//   const { currentRound, jackpot, loading, error, lastBet } = useSelector(
//     (state) => state.round
//   );

//   // Local states for countdown, timers
//   const [timeLeft, setTimeLeft] = useState(0);
//   const pollRef = useRef(null);
//   const timerRef = useRef(null);

//   // On mount, fetch current round + jackpot, then poll periodically
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());

//     // Example: poll every 5s
//     pollRef.current = setInterval(() => {
//       dispatch(fetchCurrentRound());
//       dispatch(fetchJackpotPool());
//     }, 5000);

//     return () => {
//       // Cleanup poll and timers
//       if (pollRef.current) clearInterval(pollRef.current);
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [dispatch]);

//   // Setup a countdown timer if there's an active round (outcome=null)
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       // No active round => clear local countdown
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     // There's an active round => calculate how many seconds remain
//     const endTime = new Date(currentRound.endTime).getTime();

//     const updateCountdown = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);

//       if (remaining <= 0 && timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };

//     // Start updating the countdown
//     updateCountdown();
//     timerRef.current = setInterval(updateCountdown, 1000);

//     // Cleanup if currentRound changes or unmount
//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//   }, [currentRound]);

//   // Convert error to string
//   const errorMsg = getErrorMessage(error);

//   return (
//     <div className="p-6 bg-white rounded shadow">
//       <h1 className="text-2xl font-bold mb-4">Coin Flip Betting Game</h1>

//       {loading && <p className="text-center text-gray-500">Loading...</p>}

//       {/* If there's an active round (outcome=null), show it */}
//       {currentRound && currentRound.outcome === null ? (
//         <div>
//           <h2 className="text-lg">
//             Round #{currentRound.roundNumber} (Active)
//           </h2>
//           <p>Time Left: {timeLeft} sec</p>
//           <p>Total Pool: {currentRound.totalPool}</p>

//           {/* Optional coin-flip animation */}
//           <CoinFlip round={currentRound} />

//           {/* If we're still in the betting phase (now < countdownEndTime), allow bets */}
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p className="mt-2 text-red-600">Betting is closed.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // The round is finished
//         <div>
//           <h2>Round #{currentRound.roundNumber} ended!</h2>
//           <p>Outcome: {currentRound.outcome}</p>
//           <p>Waiting for the next round...</p>
//         </div>
//       ) : (
//         // No round at all
//         <div>
//           <p>No active round. Please wait for the next one to start.</p>
//         </div>
//       )}

//       {/* Show jackpot */}
//       <div className="mt-4">
//         <h3>Jackpot: {jackpot}</h3>
//       </div>

//       {/* Show last placed bet info */}
//       {lastBet && (
//         <div className="mt-4 p-2 bg-gray-100 rounded">
//           <h4 className="font-semibold">Last Bet Placed</h4>
//           <p>Bet ID: {lastBet._id}</p>
//           <p>Amount: {lastBet.amount}</p>
//           <p>Side: {lastBet.side}</p>
//           <p>Result: {lastBet.result}</p>
//         </div>
//       )}

//       {/* Display any errors */}
//       {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}
//     </div>
//   );
// }

// // src/components/GameRoom.js
// // src/components/GameRoom.jsx
// // src/components/GameRoom.jsx
// import React, { useEffect, useState, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchCurrentRound, fetchJackpotPool } from '../features/roundSlice';
// import BetForm from './BetForm';
// import CoinFlip from './CoinFlip';

// function getErrorMessage(err) {
//   if (!err) return '';
//   if (typeof err === 'string') return err;
//   if (err.message) return err.message;
//   if (err.error) return err.error;
//   return JSON.stringify(err);
// }

// export default function GameRoom() {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, loading, error } = useSelector(
//     (state) => state.round
//   );

//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);
//   const pollRef = useRef(null);

//   // 1. On mount, fetch current round & jackpot, then poll
//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());

//     pollRef.current = setInterval(() => {
//       dispatch(fetchCurrentRound());
//       dispatch(fetchJackpotPool());
//     }, 5000);

//     return () => {
//       if (pollRef.current) clearInterval(pollRef.current);
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [dispatch]);

//   // 2. If there's an active round, set up countdown
//   useEffect(() => {
//     if (!currentRound || currentRound.outcome !== null) {
//       setTimeLeft(0);
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//       return;
//     }

//     const endTime = new Date(currentRound.endTime).getTime();
//     const updateTime = () => {
//       const now = Date.now();
//       const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//       setTimeLeft(remaining);
//       if (remaining <= 0) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     updateTime();
//     timerRef.current = setInterval(updateTime, 1000);

//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [currentRound]);

//   const errMsg = getErrorMessage(error);

//   return (
//     <div className="p-6 bg-white rounded shadow">
//       <h1 className="text-2xl font-bold mb-4">Coin Flip Betting Game</h1>

//       {loading && <p>Loading...</p>}

//       {currentRound && currentRound.outcome === null ? (
//         // Active round
//         <div>
//           <h2 className="text-lg">Round #{currentRound.roundNumber}</h2>
//           <p>Time left: {timeLeft}s</p>
//           <p>Total Pool: {currentRound.totalPool}</p>

//           <CoinFlip round={currentRound} />

//           {/* Only place bets if now < countdownEndTime */}
//           {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
//             <BetForm roundId={currentRound._id} />
//           ) : (
//             <p>Betting is closed for this round.</p>
//           )}
//         </div>
//       ) : currentRound && currentRound.outcome ? (
//         // Round ended
//         <div>
//           <h3>Round #{currentRound.roundNumber} ended.</h3>
//           <p>Outcome: {currentRound.outcome}</p>
//           <p>Waiting for next round to start automatically...</p>
//         </div>
//       ) : (
//         // No round at all
//         <div>No active round at the moment. Please wait...</div>
//       )}

//       {/* Show jackpot */}
//       <div className="mt-4">
//         <p>Jackpot: {jackpot}</p>
//       </div>

//       {/* Show error if any */}
//       {errMsg && <p className="text-red-500 mt-2">{errMsg}</p>}
//     </div>
//   );
// }


// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchJackpotPool, startRound, endRound } from "../features/roundSlice";
// import CoinFlip from "./CoinFlip";
// import BetForm from "./BetForm";

// /**
//  * A helper function to safely convert an "error" (which can be a string or object)
//  * into a renderable string.
//  */
// const getErrorMessage = (err) => {
//   if (!err) return "";
//   // If it's already a string, just return it
//   if (typeof err === "string") return err;
//   // If it has a "message" field, return that
//   if (err.message) return err.message;
//   // If it has an "error" field, return that
//   if (err.error) return err.error;
//   // Otherwise, stringify the whole object
//   return JSON.stringify(err, null, 2);
// };

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, loading, error } = useSelector(
//     (state) => state.round
//   );

//   // Local state
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [isWaiting, setIsWaiting] = useState(false);

//   // Refs to manage component lifecycle
//   const isProcessingRef = useRef(false);
//   const timerRef = useRef(null);
//   const mountedRef = useRef(true);

//   /**
//    * Clears any active interval timers.
//    */
//   const cleanupTimers = () => {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
//   };

//   /**
//    * processRound logic:
//    * 1. Start a new round unless one is already active.
//    * 2. Wait for round duration, then end.
//    * 3. Update jackpot.
//    */
//   const processRound = async () => {
//     // Prevent multiple starts or unmounted usage
//     if (!mountedRef.current || isProcessingRef.current) return;
//     if (currentRound && currentRound.outcome === null) {
//       console.log("A round is already in progress. Skipping new start.");
//       return;
//     }

//     try {
//       isProcessingRef.current = true;
//       setIsWaiting(true);

//       // 1. Start a new round
//       const startResult = await dispatch(startRound()).unwrap();
//       if (!startResult?.round || !mountedRef.current) {
//         throw new Error("Failed to start round or component unmounted");
//       }
//       const round = startResult.round;
//       console.log(`Round ${round.roundNumber} started (ID: ${round._id}).`);

//       // 2. Fetch updated jackpot
//       await dispatch(fetchJackpotPool());

//       // 3. Setup timer to track how much time is left
//       const endTime = new Date(round.endTime).getTime();
//       const updateTimer = () => {
//         if (!mountedRef.current) return;
//         const now = Date.now();
//         const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//         setTimeLeft(remaining);

//         // When remaining hits 0, clear timer
//         if (remaining <= 0) {
//           cleanupTimers();
//         }
//       };

//       cleanupTimers();
//       updateTimer();
//       timerRef.current = setInterval(updateTimer, 1000);

//       // 4. Wait for the round to finish
//       const duration = endTime - Date.now();
//       await new Promise((resolve) =>
//         setTimeout(resolve, Math.max(0, duration))
//       );

//       if (!mountedRef.current) return;

//       // 5. End the round
//       console.log(`Ending round ${round._id}...`);
//       const endResult = await dispatch(endRound(round._id)).unwrap();
//       if (endResult?.round) {
//         console.log(
//           `Round ${round._id} ended with outcome: ${endResult.round.outcome}`
//         );
//       }

//       // 6. Fetch updated jackpot again
//       await dispatch(fetchJackpotPool());
//     } catch (err) {
//       console.error("Error in round processing:", err);
//     } finally {
//       if (mountedRef.current) {
//         cleanupTimers();
//         setIsWaiting(false);
//         isProcessingRef.current = false;
//       }
//     }
//   };

//   /**
//    * On mount:
//    * - Mark component as “mounted”
//    * - Attempt to start a round (if no round is active)
//    */
//   useEffect(() => {
//     mountedRef.current = true;
//     processRound();

//     return () => {
//       mountedRef.current = false;
//       cleanupTimers();
//       isProcessingRef.current = false;
//     };
//     // eslint-disable-next-line
//   }, []);

//   return (
//     <div className="bg-white p-6 rounded shadow">
//       <h1 className="text-3xl font-bold mb-4 text-center">
//         Real-time Betting Game
//       </h1>

//       {(isWaiting || loading) && (
//         <div className="text-center mb-4">
//           <p>Waiting for round to start/end...</p>
//         </div>
//       )}

//       {currentRound ? (
//         <div>
//           <h2 className="text-xl font-semibold mb-2">
//             Round #{currentRound.roundNumber}
//           </h2>
//           <p className="mb-2">
//             Betting closes in: <span className="font-bold">{timeLeft}</span> sec
//           </p>
//           <p className="mb-2">
//             Total Pool: <span className="font-bold">{currentRound.totalPool}</span>
//           </p>

//           {/* Optional coin flip animation */}
//           <CoinFlip round={currentRound} />

//           {/* Bet form for placing bets */}
//           <BetForm roundId={currentRound._id} />
//         </div>
//       ) : (
//         <div className="text-center">
//           <p>No active round at the moment. Please wait or refresh...</p>
//         </div>
//       )}

//       <div className="mt-4 text-center">
//         <h3 className="text-xl">Current Jackpot: {jackpot}</h3>
//       </div>

//       {/* Render error safely */}
//       {error && (
//         <div className="text-center text-red-600 mt-2">
//           {getErrorMessage(error)}
//         </div>
//       )}
//     </div>
//   );
// };

// export default GameRoom;
















// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchJackpotPool, startRound, endRound } from "../features/roundSlice";
// import CoinFlip from "./CoinFlip";
// import BetForm from "./BetForm";

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, loading, error } = useSelector(
//     (state) => state.round
//   );

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [isWaiting, setIsWaiting] = useState(false);
  
//   // Using refs to maintain state across re-renders
//   const activeRoundRef = useRef(null);
//   const isProcessingRef = useRef(false);
//   const timerRef = useRef(null);
//   const mountedRef = useRef(true);

//   const cleanupTimers = () => {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
//   };

//   const processRound = async () => {
//     // If already processing or component unmounted, don't start new round
//     if (isProcessingRef.current || !mountedRef.current) {
//       return;
//     }

//     try {
//       isProcessingRef.current = true;
//       setIsWaiting(true);

//       // 1. Start new round
//       const startResult = await dispatch(startRound()).unwrap();
//       if (!startResult?.round || !mountedRef.current) {
//         throw new Error("Failed to start round or component unmounted");
//       }

//       const round = startResult.round;
//       activeRoundRef.current = round._id;
//       console.log(`Round ${round.roundNumber} started with ID: ${round._id}`);

//       // Update jackpot
//       await dispatch(fetchJackpotPool());

//       // 2. Set up countdown timer
//       const endTime = new Date(round.endTime).getTime();
//       const updateTimer = () => {
//         if (!mountedRef.current) return;
        
//         const now = Date.now();
//         const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
//         setTimeLeft(remaining);

//         if (remaining <= 0) {
//           cleanupTimers();
//         }
//       };

//       cleanupTimers();
//       updateTimer();
//       timerRef.current = setInterval(updateTimer, 1000);

//       // 3. Wait for round duration
//       const duration = endTime - Date.now();
//       await new Promise(resolve => setTimeout(resolve, Math.max(0, duration)));

//       if (!mountedRef.current) return;

//       // 4. End round
//       console.log(`Ending round ${round._id}`);
//       const endResult = await dispatch(endRound(round._id)).unwrap();
      
//       if (endResult?.round) {
//         console.log(`Round ${round._id} ended with outcome: ${endResult.round.outcome}`);
//       }

//       // Update jackpot after round ends
//       await dispatch(fetchJackpotPool());

//       // 5. Wait before starting next round
//       await new Promise(resolve => setTimeout(resolve, 5000));

//     } catch (error) {
//       console.error('Error in round processing:', error);
//       // Wait before retrying on error
//       await new Promise(resolve => setTimeout(resolve, 5000));
//     } finally {
//       if (mountedRef.current) {
//         cleanupTimers();
//         setIsWaiting(false);
//         isProcessingRef.current = false;
//         activeRoundRef.current = null;
//         // Start next round only if component is still mounted
//         processRound();
//       }
//     }
//   };

//   useEffect(() => {
//     mountedRef.current = true;
    
//     // Start initial round
//     processRound();

//     return () => {
//       mountedRef.current = false;
//       cleanupTimers();
//       isProcessingRef.current = false;
//       activeRoundRef.current = null;
//     };
//   }, []);

//   return (
//     <div className="bg-white p-6 rounded shadow">
//       <h1 className="text-3xl font-bold mb-4 text-center">
//         Real-time Betting Game
//       </h1>

//       {(isWaiting || loading) && (
//         <div className="text-center mb-4">
//           <p>Waiting for round to start/end...</p>
//         </div>
//       )}

//       {currentRound ? (
//         <div>
//           <h2 className="text-xl font-semibold mb-2">
//             Round #{currentRound.roundNumber}
//           </h2>
//           <p className="mb-2">
//             Betting closes in: <span className="font-bold">{timeLeft}</span> sec
//           </p>
//           <p className="mb-2">
//             Total Pool:{" "}
//             <span className="font-bold">{currentRound.totalPool}</span>
//           </p>

//           <CoinFlip round={currentRound} />
//           <BetForm roundId={currentRound._id} />
//         </div>
//       ) : (
//         <div className="text-center">
//           <p>No active round at the moment. Please wait...</p>
//         </div>
//       )}

//       <div className="mt-4 text-center">
//         <h3 className="text-xl">Current Jackpot: {jackpot}</h3>
//       </div>

//       {error && <div className="text-center text-red-600 mt-2">{error}</div>}
//     </div>
//   );
// };

// export default GameRoom;
// src/components/GameRoom.js

// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchJackpotPool, startRound, endRound } from "../features/roundSlice";
// import CoinFlip from "./CoinFlip";
// import BetForm from "./BetForm";

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, loading, error } = useSelector(
//     (state) => state.round
//   );

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [isWaiting, setIsWaiting] = useState(false);

//   // Ref to ensure we only run one instance of the round sequence:
//   const runningRef = useRef(false);

//   // Refs to store timer IDs so we can clear them on unmount:
//   const timerIntervalRef = useRef(null);
//   const roundTimeoutRef = useRef(null);
//   const nextRoundTimeoutRef = useRef(null);

//   useEffect(() => {
//     let isMounted = true;

//     const runRoundsSequentially = async () => {
//       if (!isMounted) return;

//       try {
//         // 1) START ROUND
//         setIsWaiting(true);
//         const startResult = await dispatch(startRound()).unwrap();
//         setIsWaiting(false);

//         if (!startResult?.round) {
//           console.error("No round data from startRound. Retrying in 10s...");
//           roundTimeoutRef.current = setTimeout(runRoundsSequentially, 10000);
//           return;
//         }

//         const round = startResult.round;
//         console.info(`Round ${round.roundNumber} started.`);

//         // Update jackpot pool
//         dispatch(fetchJackpotPool());

//         // 2) COUNTDOWN
//         const endTime = new Date(round.endTime).getTime();
//         const now = Date.now();
//         const delay = Math.max(endTime - now, 0);

//         setTimeLeft(Math.floor(delay / 1000));

//         // Update timeLeft every second
//         timerIntervalRef.current = setInterval(() => {
//           const remaining = Math.max(
//             0,
//             Math.floor((endTime - Date.now()) / 1000)
//           );
//           setTimeLeft(remaining);
//           if (remaining <= 0) {
//             clearInterval(timerIntervalRef.current);
//           }
//         }, 1000);

//         // 3) END ROUND when countdown expires
//         roundTimeoutRef.current = setTimeout(async () => {
//           try {
//             setIsWaiting(true);
//             const endResult = await dispatch(endRound(round._id)).unwrap();
//             setIsWaiting(false);

//             if (endResult?.round) {
//               console.info(
//                 `Round ${endResult.round.roundNumber} ended. Outcome: ${endResult.round.outcome}`
//               );
//             } else {
//               console.error("No round data from endRound.");
//             }

//             // Update jackpot pool
//             dispatch(fetchJackpotPool());

//             // 4) Wait 5 seconds, then start the next round
//             nextRoundTimeoutRef.current = setTimeout(() => {
//               runRoundsSequentially();
//             }, 5000);
//           } catch (err) {
//             console.error("Error ending round:", err);
//             setIsWaiting(false);
//             nextRoundTimeoutRef.current = setTimeout(runRoundsSequentially, 10000);
//           }
//         }, delay);
//       } catch (err) {
//         console.error("Error starting new round:", err);
//         setIsWaiting(false);
//         roundTimeoutRef.current = setTimeout(runRoundsSequentially, 10000);
//       }
//     };

//     // Only start once when component mounts
//     if (!runningRef.current) {
//       runningRef.current = true;
//       runRoundsSequentially();
//     }

//     return () => {
//       isMounted = false;
//       clearInterval(timerIntervalRef.current);
//       clearTimeout(roundTimeoutRef.current);
//       clearTimeout(nextRoundTimeoutRef.current);
//     };
//     // IMPORTANT: remove `dispatch` from the dependency array so this runs only once.
//   }, []); // <-- empty array so the effect runs ONLY on mount

//   return (
//     <div className="bg-white p-6 rounded shadow">
//       <h1 className="text-3xl font-bold mb-4 text-center">
//         Real-time Betting Game
//       </h1>

//       {(isWaiting || loading) && (
//         <div className="text-center mb-4">
//           <p>Waiting for round to start/end...</p>
//         </div>
//       )}

//       {currentRound ? (
//         <div>
//           <h2 className="text-xl font-semibold mb-2">
//             Round #{currentRound.roundNumber}
//           </h2>
//           <p className="mb-2">
//             Betting closes in: <span className="font-bold">{timeLeft}</span> sec
//           </p>
//           <p className="mb-2">
//             Total Pool:{" "}
//             <span className="font-bold">{currentRound.totalPool}</span>
//           </p>

//           <CoinFlip round={currentRound} />
//           <BetForm roundId={currentRound._id} />
//         </div>
//       ) : (
//         <div className="text-center">
//           <p>No active round at the moment. Please wait...</p>
//         </div>
//       )}

//       <div className="mt-4 text-center">
//         <h3 className="text-xl">Current Jackpot: {jackpot}</h3>
//       </div>

//       {error && <div className="text-center text-red-600 mt-2">{error}</div>}
//     </div>
//   );
// };

// export default GameRoom;



// src/components/GameRoom.js
// src/components/GameRoom.js
// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchJackpotPool, startRound, endRound } from "../features/roundSlice";
// import CoinFlip from "./CoinFlip";
// import BetForm from "./BetForm"; // If you have a bet form

// const GameRoom = () => {
//   const dispatch = useDispatch();

//   const { currentRound, jackpot, loading, error } = useSelector(
//     (state) => state.round
//   );

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [isWaiting, setIsWaiting] = useState(false);

//   useEffect(() => {
//     // same logic as before
//     const runRoundsSequentially = async () => {
//       try {
//         // 1) START ROUND
//         setIsWaiting(true);
//         const startResult = await dispatch(startRound()).unwrap();
//         setIsWaiting(false);

//         if (!startResult?.round) {
//           console.error("No round data from startRound. Retrying in 10s...");
//           setTimeout(runRoundsSequentially, 10000);
//           return;
//         }

//         const round = startResult.round;
//         console.info(`Round ${round.roundNumber} started.`);

//         dispatch(fetchJackpotPool());

//         // 2) COUNTDOWN
//         const endTime = new Date(round.endTime).getTime();
//         const now = Date.now();
//         const delay = Math.max(endTime - now, 0);

//         setTimeLeft(Math.floor(delay / 1000));

//         const timerInterval = setInterval(() => {
//           const remaining = Math.max(
//             0,
//             Math.floor((endTime - Date.now()) / 1000)
//           );
//           setTimeLeft(remaining);
//           if (remaining <= 0) {
//             clearInterval(timerInterval);
//           }
//         }, 1000);

//         // 3) END ROUND
//         setTimeout(async () => {
//           try {
//             setIsWaiting(true);
//             const endResult = await dispatch(endRound(round._id)).unwrap();
//             setIsWaiting(false);

//             if (endResult?.round) {
//               console.info(
//                 `Round ${endResult.round.roundNumber} ended. Outcome: ${endResult.round.outcome}`
//               );
//             } else {
//               console.error("No round data from endRound.");
//             }

//             dispatch(fetchJackpotPool());

//             // 4) WAIT 5 SECONDS THEN START NEXT ROUND
//             setTimeout(() => {
//               runRoundsSequentially();
//             }, 5000);
//           } catch (err) {
//             console.error("Error ending round:", err);
//             setIsWaiting(false);
//             setTimeout(runRoundsSequentially, 10000);
//           }
//         }, delay);
//       } catch (err) {
//         console.error("Error starting new round:", err);
//         setIsWaiting(false);
//         setTimeout(runRoundsSequentially, 10000);
//       }
//     };

//     runRoundsSequentially();
//     // eslint-disable-next-line
//   }, [dispatch]);

//   return (
//     <div className="bg-white p-6 rounded shadow">
//       <h1 className="text-3xl font-bold mb-4 text-center">
//         Real-time Betting Game
//       </h1>

//       {(isWaiting || loading) && (
//         <div className="text-center mb-4">
//           <p>Waiting for round to start/end...</p>
//         </div>
//       )}

//       {currentRound ? (
//         <div>
//           <h2 className="text-xl font-semibold mb-2">
//             Round #{currentRound.roundNumber}
//           </h2>
//           <p className="mb-2">
//             Betting closes in: <span className="font-bold">{timeLeft}</span> sec
//           </p>
//           <p className="mb-2">
//             Total Pool:{" "}
//             <span className="font-bold">{currentRound.totalPool}</span>
//           </p>

//           {/* Memoized CoinFlip: won't re-render unless outcome changes */}
//           <CoinFlip round={currentRound} />

//           <BetForm roundId={currentRound._id} />
//         </div>
//       ) : (
//         <div className="text-center">
//           <p>No active round at the moment. Please wait...</p>
//         </div>
//       )}

//       <div className="mt-4 text-center">
//         <h3 className="text-xl">Current Jackpot: {jackpot}</h3>
//       </div>

//       {error && <div className="text-center text-red-600 mt-2">{error}</div>}
//     </div>
//   );
// };

// export default GameRoom;


// src/components/GameRoom.js
// src/components/GameRoom.js
// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchJackpotPool, startRound, endRound } from "../features/roundSlice";
// import CoinFlip from "./CoinFlip";
// import BetForm from "./BetForm"; // If you have a bet form

// const GameRoom = () => {
//   const dispatch = useDispatch();

//   // Redux states
//   const { currentRound, jackpot, loading, error } = useSelector(
//     (state) => state.round
//   );

//   // Local states
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [isWaiting, setIsWaiting] = useState(false);

//   useEffect(() => {
//     // Infinite round sequence:
//     // 1) startRound -> 2) wait countdown -> 3) endRound -> 4) wait 5s -> repeat

//     const runRoundsSequentially = async () => {
//       try {
//         // -- 1) START ROUND --
//         setIsWaiting(true);
//         const startResult = await dispatch(startRound()).unwrap();
//         setIsWaiting(false);

//         if (!startResult?.round) {
//           console.error("No round data from startRound. Retrying in 10s...");
//           setTimeout(runRoundsSequentially, 10000);
//           return;
//         }

//         const round = startResult.round;
//         console.info(`Round ${round.roundNumber} started.`);

//         // Optionally update jackpot
//         dispatch(fetchJackpotPool());

//         // -- 2) COUNTDOWN --
//         const endTime = new Date(round.endTime).getTime();
//         const now = Date.now();
//         const delay = Math.max(endTime - now, 0); // ms

//         // Initialize timeLeft in seconds
//         setTimeLeft(Math.floor(delay / 1000));

//         // Update timeLeft every second
//         const timerInterval = setInterval(() => {
//           const remaining = Math.max(
//             0,
//             Math.floor((endTime - Date.now()) / 1000)
//           );
//           setTimeLeft(remaining);
//           if (remaining <= 0) {
//             clearInterval(timerInterval);
//           }
//         }, 1000);

//         // -- 3) WHEN TIME EXPIRES, END ROUND --
//         setTimeout(async () => {
//           try {
//             setIsWaiting(true);
//             const endResult = await dispatch(endRound(round._id)).unwrap();
//             setIsWaiting(false);

//             if (endResult?.round) {
//               console.info(
//                 `Round ${endResult.round.roundNumber} ended. Outcome: ${endResult.round.outcome}`
//               );
//             } else {
//               console.error("No round data from endRound.");
//             }

//             // Update jackpot again if needed
//             dispatch(fetchJackpotPool());

//             // -- 4) WAIT 5 SECONDS BEFORE NEXT ROUND --
//             // This ensures the user sees the 5s coin-flip animation.
//             setTimeout(() => {
//               runRoundsSequentially();
//             }, 5000);
//           } catch (err) {
//             console.error("Error ending round:", err);
//             setIsWaiting(false);
//             setTimeout(runRoundsSequentially, 10000);
//           }
//         }, delay);
//       } catch (err) {
//         console.error("Error starting new round:", err);
//         setIsWaiting(false);
//         setTimeout(runRoundsSequentially, 10000);
//       }
//     };

//     // Start the infinite loop once on mount
//     runRoundsSequentially();
//     // No dependencies so it doesn't re-run automatically
//     // eslint-disable-next-line
//   }, [dispatch]);

//   return (
//     <div className="bg-white p-6 rounded shadow">
//       <h1 className="text-3xl font-bold mb-4 text-center">
//         Real-time Betting Game
//       </h1>

//       {(isWaiting || loading) && (
//         <div className="text-center mb-4">
//           <p>Waiting for round to start/end...</p>
//         </div>
//       )}

//       {currentRound ? (
//         <div>
//           <h2 className="text-xl font-semibold mb-2">
//             Round #{currentRound.roundNumber}
//           </h2>
//           <p className="mb-2">
//             Betting closes in: <span className="font-bold">{timeLeft}</span> sec
//           </p>
//           <p className="mb-2">
//             Total Pool:{" "}
//             <span className="font-bold">{currentRound.totalPool}</span>
//           </p>

//           {/* CoinFlip: 5s final animation once outcome is known */}
//           <CoinFlip round={currentRound} />

//           {/* Optional: bet form to place bets */}
//           <BetForm roundId={currentRound._id} />
//         </div>
//       ) : (
//         <div className="text-center">
//           <p>No active round at the moment. Please wait...</p>
//         </div>
//       )}

//       <div className="mt-4 text-center">
//         <h3 className="text-xl">Current Jackpot: {jackpot}</h3>
//       </div>

//       {error && <div className="text-center text-red-600 mt-2">{error}</div>}
//     </div>
//   );
// };

// export default GameRoom;




// src/components/GameRoom.js
// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// // Import the async thunks from your roundSlice:
// import { fetchJackpotPool, startRound, endRound } from "../features/roundSlice";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, loading, error } = useSelector(
//     (state) => state.round
//   );
//   // timeLeft is used for displaying the countdown (in seconds)
//   const [timeLeft, setTimeLeft] = useState(0);
//   // isWaiting indicates if we are waiting for a round to start/end
//   const [isWaiting, setIsWaiting] = useState(false);

//   useEffect(() => {
//     // This function chains rounds sequentially:
//     const runRoundsSequentially = async () => {
//       try {
//         // Indicate that we are waiting for a new round to start
//         setIsWaiting(true);
//         // Start a new round by dispatching the startRound thunk.
//         // The thunk returns a promise we can unwrap to get the round details.
//         const startResult = await dispatch(startRound()).unwrap();
//         setIsWaiting(false);
//         const round = startResult.round;
//         console.info(`Round ${round.roundNumber} started.`);
//         // (Optionally, you could also dispatch fetchJackpotPool here.)

//         // Calculate the delay until the round should end.
//         // (Assumes your round object contains an "endTime" property.)
//         const delay = Math.max(new Date(round.endTime).getTime() - Date.now(), 0);
//         setTimeLeft(Math.floor(delay / 1000));

//         // Start a countdown timer that updates every second.
//         const timerInterval = setInterval(() => {
//           const diff = Math.max(
//             0,
//             Math.floor((new Date(round.endTime).getTime() - Date.now()) / 1000)
//           );
//           setTimeLeft(diff);
//           if (diff <= 0) {
//             clearInterval(timerInterval);
//           }
//         }, 1000);

//         // When the delay is over, end the round.
//         setTimeout(async () => {
//           try {
//             setIsWaiting(true);
//             const endResult = await dispatch(endRound(round._id)).unwrap();
//             console.info(
//               `Round ${round.roundNumber} ended. Outcome: ${endResult.round.outcome}`
//             );
//             // (The round outcome is now part of currentRound in the store,
//             //  which will trigger the CoinFlip animation in the CoinFlip component.)
//           } catch (err) {
//             console.error("Error ending round:", err);
//           } finally {
//             setIsWaiting(false);
//             // Update the jackpot (if needed)
//             dispatch(fetchJackpotPool());
//             // Start the next round after this one ends.
//             runRoundsSequentially();
//           }
//         }, delay);
//       } catch (err) {
//         console.error("Error starting new round:", err);
//         // In case of an error starting a round, wait a bit and try again.
//         setTimeout(runRoundsSequentially, 10000);
//       }
//     };

//     // Start the sequential scheduling when the component mounts.
//     runRoundsSequentially();
//     // No dependency array items are necessary here because
//     // runRoundsSequentially calls itself after each round.
//   }, [dispatch]);

//   return (
//     <div className="bg-white p-6 rounded shadow">
//       <h1 className="text-3xl font-bold mb-4 text-center">
//         Real-time Betting Game
//       </h1>
//       {/* Show a loader if we are waiting (or if Redux is loading) */}
//       {isWaiting || loading ? (
//         <div className="text-center">
//           <p>Waiting for round to start/end...</p>
//           {/* You can replace this with your favorite spinner or loader component */}
//         </div>
//       ) : currentRound ? (
//         <div>
//           <h2 className="text-xl font-semibold mb-2">
//             Round #{currentRound.roundNumber}
//           </h2>
//           <p className="mb-2">
//             Betting closes in:{" "}
//             <span className="font-bold">{timeLeft} seconds</span>
//           </p>
//           <p className="mb-2">
//             Total Pool:{" "}
//             <span className="font-bold">{currentRound.totalPool}</span>
//           </p>
//           {/* The CoinFlip component will animate when a round outcome exists */}
//           <CoinFlip round={currentRound} />
//           {/* Allow users to place bets using the BetForm component */}
//           <BetForm roundId={currentRound._id} />
//         </div>
//       ) : (
//         <div className="text-center">
//           No active round at the moment. Please wait...
//         </div>
//       )}
//       <div className="mt-4 text-center">
//         <h3 className="text-xl">Current Jackpot: {jackpot}</h3>
//       </div>
//       {error && (
//         <div className="text-center text-red-600 mt-2">Error: {error}</div>
//       )}
//     </div>
//   );
// };

// export default GameRoom;

// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchCurrentRound, fetchJackpotPool } from '../features/roundSlice';
// import BetForm from './BetForm';
// import CoinFlip from './CoinFlip';

// const GameRoom = () => {
//   const dispatch = useDispatch();
//   const { currentRound, jackpot, loading, error } = useSelector((state) => state.round);
//   const [timeLeft, setTimeLeft] = useState(0);

//   useEffect(() => {
//     dispatch(fetchCurrentRound());
//     dispatch(fetchJackpotPool());
//     const interval = setInterval(() => {
//       dispatch(fetchCurrentRound());
//       dispatch(fetchJackpotPool());
//     }, 5000);
//     return () => clearInterval(interval);
//   }, [dispatch]);

//   useEffect(() => {
//     if (currentRound) {
//       const countdownEnd = new Date(currentRound.countdownEndTime).getTime();
//       const updateTimer = () => {
//         const now = Date.now();
//         const diff = Math.max(0, Math.floor((countdownEnd - now) / 1000));
//         setTimeLeft(diff);
//       };
//       updateTimer();
//       const timerInterval = setInterval(updateTimer, 1000);
//       return () => clearInterval(timerInterval);
//     }
//   }, [currentRound]);

//   if (loading) return <div className="text-center">Loading game data...</div>;
//   if (error) return <div className="text-center text-red-600">Error: {error}</div>;

//   return (
//     <div className="bg-white p-6 rounded shadow">
//       <h1 className="text-3xl font-bold mb-4 text-center">Real-time Betting Game</h1>
//       {currentRound ? (
//         <div>
//           <h2 className="text-xl font-semibold mb-2">Round #{currentRound.roundNumber}</h2>
//           <p className="mb-2">
//             Betting closes in: <span className="font-bold">{timeLeft} seconds</span>
//           </p>
//           <p className="mb-2">
//             Total Pool: <span className="font-bold">{currentRound.totalPool}</span>
//           </p>
//           <CoinFlip round={currentRound} />
//           <BetForm roundId={currentRound._id} />
//         </div>
//       ) : (
//         <div className="text-center">No active round at the moment. Please wait...</div>
//       )}
//       <div className="mt-4 text-center">
//         <h3 className="text-xl">Current Jackpot: {jackpot}</h3>
//       </div>
//     </div>
//   );
// };

// export default GameRoom;
