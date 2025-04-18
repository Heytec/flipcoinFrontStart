import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
import {
  ENABLE_BOTS,
  BOT_RESULTS_DISPLAY_TIME,
  createInitialBots,
  updateBotBetResults,
  generateBotBet,
  isRoundActive,
  filterBotsForRound,
  MAX_BOTS_PER_ROUND,
  BOT_BET_INTERVAL,
} from "../services/botService";
import Jackpot from "./Jackpot";

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Toast wrapper
const toast = {
  success: (message, options) => {
    if (message) originalToast.success(message, options);
  },
  error: (message, options) => {
    if (message) originalToast.error(message, options);
  },
  info: (message, options) => {
    if (message) originalToast.info(message, options);
  },
  dismiss: () => originalToast.dismiss(),
};

export const formatResultMessage = (round) => {
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
  if (!err) return "";
  return (
    err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || ""
  );
};

const GameRoom = () => {
  const dispatch = useDispatch();
  const {
    currentRound,
    jackpot,
    betResults = [],
    loading,
    error,
  } = useSelector((state) => state.round);
  const authUser = useSelector((state) => state.auth.user);

  const [timeLeft, setTimeLeft] = useState(0);
  const [activeTab, setActiveTab] = useState("activeBet");
  const [botBets, setBotBets] = useState([]); // State for bot bets
  const [processingRound, setProcessingRound] = useState(false); // State to track round processing
  const [showRoundNotification, setShowRoundNotification] = useState(false); // State for round notification
  const timerRef = useRef(null);
  const autoRefreshRef = useRef(null);
  const botIntervalRef = useRef(null);
  const botClearTimeoutRef = useRef(null);
  const roundNotificationTimeoutRef = useRef(null);
  const processedBetsRef = useRef(new Set());
  const lastRoundIdRef = useRef(null); // Track the last round ID
  const lastRoundNumberRef = useRef(null); // Track the last round number
  const roundChangeDetectedRef = useRef(false); // Track round changes

  useAblyGameRoom();
  useBalanceRealtime();

  const errorMsg = useMemo(() => getErrorMessage(error), [error]);
  const noActiveRoundError = useMemo(() => {
    return (
      !loading &&
      (errorMsg.toLowerCase().includes("no active round") || !currentRound)
    );
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

  const currentBets = useMemo(() => {
    // console.log("Calculating currentBets:", { botBets, betResults, currentRoundId: currentRound?._id });
    const realBets = {
      head: betResults.filter(
        (bet) => bet.side === "heads" && bet.roundId === currentRound?._id
      ),
      tail: betResults.filter(
        (bet) => bet.side === "tails" && bet.roundId === currentRound?._id
      ),
    };
    const botHeadBets = botBets.filter(
      (bet) => bet.side === "heads" && bet.roundId === currentRound?._id
    );
    const botTailBets = botBets.filter(
      (bet) => bet.side === "tails" && bet.roundId === currentRound?._id
    );
    const result = {
      head: [...realBets.head, ...botHeadBets],
      tail: [...realBets.tail, ...botTailBets],
    };

    // console.log("currentBets result:", result);
    return result;
  }, [betResults, botBets, currentRound]);

  const handleBetResult = useCallback(
    (bet) => {
      const betKey = `${bet.betId || bet._id}_${bet.result}`;
      if (
        !authUser ||
        !currentRound ||
        !bet.result ||
        processedBetsRef.current.has(betKey)
      ) {
        return;
      }

      // const isUserBet =
      //   bet.user === authUser._id || bet.phone === authUser.phone;
      // if (!isUserBet || bet.gameRound !== currentRound._id) return;

      // processedBetsRef.current.add(betKey);
      // const amount =
      //   bet.result === "win"
      //     ? bet.winAmount || bet.betAmount
      //     : bet.lossAmount || bet.betAmount;
      // const message =
      //   bet.result === "win"
      //     ? `🎉 Round #${currentRound.roundNumber}: You won Ksh${Number(
      //         amount
      //       ).toFixed(2)}!`
      //     : `💫 Round #${currentRound.roundNumber}: You lost Ksh${Number(
      //         amount
      //       ).toFixed(2)}`;

      // if (message) {
      //   toast[bet.result === "win" ? "success" : "error"](message, {
      //     position: "top-center",
      //     autoClose: 5000,
      //     hideProgressBar: false,
      //     closeOnClick: true,
      //     pauseOnHover: true,
      //     draggable: true,
      //     className: `toast-${bet.result}`,
      //     toastId: betKey,
      //   });
      // }
      const isUserBet =
        bet.user === authUser._id || bet.phone === authUser.phone;
      if (!isUserBet || bet.gameRound !== currentRound._id) return;

      processedBetsRef.current.add(betKey);
      const amount =
        bet.result === "win"
          ? bet.winAmount || bet.betAmount
          : bet.lossAmount || bet.betAmount;

      // Format currency with commas for better readability
      const formattedAmount = Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      // Create themed message with icon and styled content
      const isWin = bet.result === "win";
      const messageIcon = isWin ? "🎉" : "💫";
      const message = `
  <div class="flex items-center gap-2">
    <span class="text-xl">${messageIcon}</span>
    <div>
      <span class="font-bold">Round #${currentRound.roundNumber}</span>: You ${
        isWin ? "won" : "lost"
      } 
      <span class="${
        isWin ? "text-[#00ff88] font-bold" : "text-red-400 font-bold"
      }">
        Ksh${formattedAmount}
      </span>
    </div>
  </div>
`;

      if (message) {
        toast[isWin ? "success" : "error"](
          <div dangerouslySetInnerHTML={{ __html: message }} />,
          {
            position: "top-center",
            autoClose: 2500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: `toast-${bet.result} rounded-lg shadow-lg border-l-4 ${
              isWin ? "border-[#00ff88]" : "border-red-500"
            }`,
            toastId: betKey,
            icon: false, // Disable default icon as we're using custom
          }
        );
      }

      // if (message) {
      //   toast[isWin ? "success" : "error"](
      //     <div dangerouslySetInnerHTML={{ __html: message }} />,
      //     {
      //       position: "top-center",
      //       autoClose: 5000,
      //       hideProgressBar: false,
      //       closeOnClick: true,
      //       pauseOnHover: true,
      //       draggable: true,
      //       className: `toast-${bet.result} rounded-lg shadow-lg border-l-4 ${
      //         isWin ? "border-[#00ff88]" : "border-red-500"
      //       }`,
      //       toastId: betKey,
      //       icon: false, // Disable default icon as we're using custom
      //       style: { top: '100px' }, // Add custom style for top position
      //     }
      //   );
      // }
    },
    [authUser, currentRound]
  );

  const handleRefresh = useCallback(
    debounce(async () => {
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

  // Detect round changes and trigger notification
  useEffect(() => {
    if (!currentRound) return;

    // Check if this is a new round
    if (
      (lastRoundIdRef.current && lastRoundIdRef.current !== currentRound._id) ||
      (lastRoundNumberRef.current &&
        lastRoundNumberRef.current !== currentRound.roundNumber)
    ) {
      // console.log(
      //   "New round detected:",
      //   currentRound._id,
      //   "Previous:",
      //   lastRoundIdRef.current
      // );
      roundChangeDetectedRef.current = true;

      // Show round notification
      setShowRoundNotification(true);

      // Clear previous timeout if exists
      if (roundNotificationTimeoutRef.current) {
        clearTimeout(roundNotificationTimeoutRef.current);
      }

      // Hide notification after 3 seconds
      roundNotificationTimeoutRef.current = setTimeout(() => {
        setShowRoundNotification(false);
      }, 3000);

      // Clear any existing bot clearing timeout
      if (botClearTimeoutRef.current) {
        clearTimeout(botClearTimeoutRef.current);
        botClearTimeoutRef.current = null;
      }

      // Reset processing state for new round
      setProcessingRound(false);

      // Clear bots from previous round immediately when new round starts
      setBotBets((prevBots) => filterBotsForRound(prevBots, currentRound._id));
    }

    // Update the last round ID and number references
    lastRoundIdRef.current = currentRound._id;
    lastRoundNumberRef.current = currentRound.roundNumber;
  }, [currentRound]);

  // Handle round outcome changes
  useEffect(() => {
    if (!currentRound) return;

    // If we have a new round outcome that isn't null or "processing"
    if (currentRound.outcome && currentRound.outcome !== "processing") {
      // console.log("Round outcome detected:", currentRound.outcome);

      // Update bot bet results
      setBotBets((prev) =>
        updateBotBetResults(
          filterBotsForRound(prev, currentRound._id),
          currentRound.outcome
        )
      );

      // Mark the round as processing
      setProcessingRound(true);

      // Clear any existing timeout
      if (botClearTimeoutRef.current) {
        clearTimeout(botClearTimeoutRef.current);
      }

      // Set a new timeout to clear the bots after the display time
      botClearTimeoutRef.current = setTimeout(() => {
        // console.log("Scheduled bot clearing triggered after outcome display");
        // Only clear if we're still on the same round
        setBotBets((prev) => {
          // If we already have a new round, don't clear
          if (lastRoundIdRef.current !== currentRound._id) {
            // console.log("Round has changed, not clearing bot bets");
            return prev;
          }
          // console.log("Clearing bot bets for completed round");
          return filterBotsForRound(prev, null); // Filter out bets from the current round
        });

        // Reset processing state
        setProcessingRound(false);
      }, BOT_RESULTS_DISPLAY_TIME);
    }

    return () => {
      if (botClearTimeoutRef.current) {
        clearTimeout(botClearTimeoutRef.current);
      }
    };
  }, [currentRound]);

  // Bot simulation logic for adding bets
  useEffect(() => {
    if (!ENABLE_BOTS || !currentRound) {
      // console.log("Bots disabled or no current round");
      return;
    }

    // Only manage bot betting if the round is active and we're not in processing state
    if (isRoundActive(currentRound) && !processingRound) {
      // console.log("Bot simulation effect for active round:", currentRound._id);

      // Initialize bots for a new round
      if (
        roundChangeDetectedRef.current ||
        !botBets.some((bet) => bet.roundId === currentRound._id)
      ) {
        // console.log("Initializing bots for new round:", currentRound._id);

        // Reset the round change flag
        roundChangeDetectedRef.current = false;

        const initialBets = createInitialBots(currentRound._id);

        setBotBets((prev) => {
          // Filter out bets from previous rounds and add new ones
          const filteredPrev = filterBotsForRound(prev, currentRound._id);
          return [...filteredPrev, ...initialBets];
        });

        // Start interval for adding new bots during active round
        if (botIntervalRef.current) {
          clearInterval(botIntervalRef.current);
        }

        botIntervalRef.current = setInterval(() => {
          if (isRoundActive(currentRound)) {
            // console.log("Adding new bot bet if below max");
            setBotBets((prev) => {
              const currentRoundBets = filterBotsForRound(
                prev,
                currentRound._id
              );
              if (currentRoundBets.length < MAX_BOTS_PER_ROUND) {
                const newBet = generateBotBet(currentRound._id);
                // console.log("Adding new bot bet:", newBet);
                return [...prev, newBet];
              }
              // console.log("Max bots reached, no new bet added");
              return prev;
            });
          } else {
            // Stop adding bots if round is no longer active
            if (botIntervalRef.current) {
              clearInterval(botIntervalRef.current);
            }
          }
        }, BOT_BET_INTERVAL);
      }
    } else {
      // Stop the interval if round is no longer active
      if (botIntervalRef.current) {
        clearInterval(botIntervalRef.current);
        botIntervalRef.current = null;
      }
    }

    return () => {
      if (botIntervalRef.current) {
        clearInterval(botIntervalRef.current);
      }
    };
  }, [currentRound, processingRound, botBets]);

  // Process bet results
  useEffect(() => {
    if (!betResults.length || !authUser || !currentRound) return;
    betResults.forEach((bet) => {
      if (bet.result) handleBetResult(bet);
    });
  }, [betResults, handleBetResult, authUser, currentRound]);

  // Timer management
  useEffect(() => {
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
      const remaining = Math.max(
        0,
        Math.floor((targetTime - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timerRef.current);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentRound]);

  // Auto refresh when no active round
  useEffect(() => {
    if (noActiveRoundError) {
      autoRefreshRef.current = setInterval(
        () => dispatch(fetchCurrentRound()),
        10000
      );
      return () => clearInterval(autoRefreshRef.current);
    }
  }, [noActiveRoundError, dispatch]);

  // Error handling
  useEffect(() => {
    if (
      errorMsg &&
      !errorMsg.toLowerCase().includes("no active round") &&
      errorMsg !== "null"
    ) {
      toast.error(errorMsg);
    }
  }, [errorMsg]);

  // Clean up all intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
      if (botClearTimeoutRef.current) clearTimeout(botClearTimeoutRef.current);
      if (roundNotificationTimeoutRef.current)
        clearTimeout(roundNotificationTimeoutRef.current);
    };
  }, []);

  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0c1c31]">
        <div className="bg-[#0c103d] p-6 rounded-lg shadow-lg border-1 border-gray-400">
          <p className="text-lg text-[#00ff88]">Please log in to play</p>
        </div>
      </div>
    );
  }

  const toastStyles = `
  .toast-success {
  background: linear-gradient(to right, #0d1526, #111c35);
  color: #00ff88;
  font-weight: 500;
  border-left: 4px solid #00ff88;
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.2);
}

.toast-error {
  background: linear-gradient(to right, #0d1526, #111c35);
  color: #ff5555;
  font-weight: 500;
  border-left: 4px solid #ff5555;
  box-shadow: 0 4px 12px rgba(255, 85, 85, 0.2);
}

.toast-info {
  background: linear-gradient(to right, #0d1526, #111c35);
  color: #00d5ff;
  font-weight: 500;
  border-left: 4px solid #00d5ff;
  box-shadow: 0 4px 12px rgba(0, 213, 255, 0.2);
}

.Toastify__progress-bar--success {
  background: linear-gradient(to right, #00ff88, #00d5ff);
}

.Toastify__progress-bar--error {
  background: linear-gradient(to right, #ff5555, #ff8855);
}

.Toastify__progress-bar--info {
  background: linear-gradient(to right, #00d5ff, #00a0ff);
}

.Toastify__toast {
  border-radius: 0.5rem;
  padding: 1rem;
}

.Toastify__toast-icon {
  color: currentColor;
}

.round-notification-enter {
  opacity: 0;
  transform: translateY(-20px);
}
.round-notification-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms, transform 300ms;
}
.round-notification-exit {
  opacity: 1;
}
.round-notification-exit-active {
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 300ms, transform 300ms;
}
    .Toastify__toast-container--top-center {
    top: 50px ;
  }
    
  `;
  // .toast-success {
  //   background-color: #10B981;
  //   color: white;
  //   font-weight: 500;
  // }
  // .toast-error {
  //   background-color: #EF4444;
  //   color: white;
  //   font-weight: 500;
  // }
  // .round-notification-enter {
  //   opacity: 0;
  //   transform: translateY(-20px);
  // }
  // .round-notification-enter-active {
  //   opacity: 1;
  //   transform: translateY(0);
  //   transition: opacity 300ms, transform 300ms;
  // }
  // .round-notification-exit {
  //   opacity: 1;
  // }
  // .round-notification-exit-active {
  //   opacity: 0;
  //   transform: translateY(-20px);
  //   transition: opacity 300ms, transform 300ms;
  // }

  return (
    //mx-auto px-4 py-12 max-w-7xl

    <div className="container md:max-w-full ">
      <style>{toastStyles}</style>
      {loading && <LoadingSpinner />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:mt-24 mt-[133px] ">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {noActiveRoundError ? (
            <NoActiveRound
              onRefresh={handleRefresh}
              isLoading={loading}
            />
          ) : (
            <div className="space-y-4">
              <Jackpot />

              {/* Game Header with Red Accent */}
              <div className="bg-gradient-to-r from-[#0d1526] to-[#111c35] rounded-xl p-2 shadow-[-6px_0px_8px_#0]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  {/* Round notification with animation */}
                  <div
                    className={`bg-gradient-to-r from-[#0d1526] to-[#09101f] py-4 md:py-0 flex items-center transition-all w-full rounded-lg duration-300 ${
                      showRoundNotification
                        ? "opacity-100 z-20 "
                        : "opacity-0 md:opacity-100"
                    }`}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mr-2">
                      <span className="text-white font-bold">#</span>
                    </div>
                    <h2 className="text-2xl  font-bold text-[#00ff88]">
                      Round # {currentRound?.roundNumber || "N/A"}
                    </h2>
                  </div>

                  {currentRound?.outcome === null && (
                    <div className="md:static absolute top-72 flex flex-none items-center bg-gray-800 rounded-full px-5 py-2 border border-gray-700 ">
                      <svg
                        className="w-5 h-5 mr-2 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div className="relative ">
                        <span className="text-xl font-medium text-white">
                          {timeLeft}{" "}
                          <span className="text-sm text-green-400"> s</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="  md:grid grid-cols-2 gap-8 ">
                  <div className="order-1 md:order-2 flex justify-center items-center rounded-lg p-4 mb-6 md:mb-0 ">
                    <CoinFlip
                      round={currentRound}
                      timeLeft={timeLeft}
                    />
                  </div>

                  <div className="order-2 md:order-1">
                    {currentRound?.outcome === null &&
                      (Date.now() <
                      new Date(currentRound.countdownEndTime).getTime() ? (
                        canBet ? (
                          <div className="bg-[#0a121e] rounded-lg  border-t-2 border-[#00ff88]">
                            <BetForm
                              roundId={currentRound._id}
                              onBetSuccess={(amount, side) => {
                                const msg = `Bet Ksh${amount} on ${side}!`;
                                if (msg) toast.success(msg);
                              }}
                              onBetError={(err) => {
                                if (err) toast.error(err);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="z-10 absolute top-0 left-0 right-0 bottom-0  bg-[#55555577] rounded-lg "></div>
                            <div className="bg-[#0a121e] rounded-lg p-5 absolute top-32 left-10 right-10 z-10 border-t-2  border-yellow-500">
                              <div className="flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-yellow-500 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                                <p className="text-yellow-500 font-medium">
                                  You already placed a bet for this round.
                                </p>
                              </div>
                            </div>
                            <div className="">
                              <div className="bg-[#0a121e] rounded-lg  border-t-2 border-[#939494]">
                                <BetForm
                                  roundId={currentRound._id}
                                  onBetSuccess={(amount, side) => {
                                    const msg = `Bet Ksh${amount} on ${side}!`;
                                    if (msg) toast.success(msg);
                                  }}
                                  onBetError={(err) => {
                                    if (err) toast.error(err);
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          // <div className="bg-[#0a121e] rounded-lg p-5 border-t-2 border-yellow-500">
                          //   <div className="flex items-center">
                          //     <svg
                          //       className="w-6 h-6 text-yellow-500 mr-2"
                          //       fill="none"
                          //       stroke="currentColor"
                          //       viewBox="0 0 24 24"
                          //       xmlns="http://www.w3.org/2000/svg">
                          //       <path
                          //         strokeLinecap="round"
                          //         strokeLinejoin="round"
                          //         strokeWidth="2"
                          //         d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                          //     </svg>
                          //     <p className="text-yellow-500 font-medium">
                          //       You already placed a bet for this round.
                          //     </p>
                          //   </div>
                          // </div>
                        )
                      ) : (
                        <div className="relative bg-transparent">
                          <div className="z-10 absolute top-0 left-0 right-0 bottom-0 bg-[#55555577] rounded-lg  "></div>
                          <div className="bg-[#0a121e] rounded-xl p-5 shadow-[2px_-2px_3px_#939494]  z-10 absolute top-32 left-5 right-5">
                            <div className="flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-red-500 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <p className="text-red-500 font-medium ">
                                Betting Closed
                              </p>
                            </div>
                          </div>
                          <div className="">
                            <div className="bg-[#0a121e] rounded-lg  border-t-2 border-[#939494]">
                              <BetForm
                                disabled={true}
                                roundId={currentRound._id}
                                onBetSuccess={(amount, side) => {
                                  const msg = `Bet Ksh${amount} on ${side}!`;
                                  if (msg) toast.success(msg);
                                }}
                                onBetError={(err) => {
                                  if (err) toast.error(err);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        // <div className="bg-[#0a121e] rounded-lg p-5 shadow-[4px_-4px_3px_#00ff88] ">
                        //   <div className="flex items-center justify-center">
                        //     <svg
                        //       className="w-6 h-6 text-red-500 mr-2"
                        //       fill="none"
                        //       stroke="currentColor"
                        //       viewBox="0 0 24 24"
                        //       xmlns="http://www.w3.org/2000/svg">
                        //       <path
                        //         strokeLinecap="round"
                        //         strokeLinejoin="round"
                        //         strokeWidth="2"
                        //         d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        //     </svg>
                        //     <p className="text-red-500 font-medium ">
                        //       Betting Closed
                        //     </p>
                        //   </div>
                        // </div>
                      ))}
                  </div>
                </div>
              </div>
              <div className="mx-2 sm:mx-0">
                <RoundHistory />
              </div>

              <div className="bg-[#09101f] rounded-xl shadow-md overflow-hidden">
                <div className="flex border-b border-gray-800">
                  <button
                    onClick={() => setActiveTab("activeBet")}
                    className={`flex-1 py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                      activeTab === "activeBet"
                        ? "text-white border-b-2 border-[#00ffd5] bg-[#0d1526]"
                        : "text-gray-400 hover:text-gray-200"
                    }`}>
                    Active Bets
                  </button>
                  <button
                    onClick={() => setActiveTab("betHistory")}
                    className={`flex-1 py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                      activeTab === "betHistory"
                        ? "text-white border-b-2 border-[#00ffd5] bg-[#0d1526]"
                        : "text-gray-400 hover:text-gray-200"
                    }`}>
                    Bet History
                  </button>
                  <button
                    onClick={() => setActiveTab("topWins")}
                    className={`flex-1 py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                      activeTab === "topWins"
                        ? "text-white border-b-2 border-[#00ffd5] bg-[#0d1526]"
                        : "text-gray-400 hover:text-gray-200"
                    }`}>
                    Top Wins
                  </button>
                </div>

                <div className="p-2">
                  {activeTab === "activeBet" && (
                    <ActiveBet userActiveBets={userActiveBets} />
                  )}
                  {activeTab === "betHistory" && <UserBets />}
                  {activeTab === "topWins" && <TopWinsBets />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="lg:static md:mx-0  absolute top-[89px]  left-0 right-0  md:pt-6 bg-[#09101f] rounded-xl flex md:block lg:bg-transparent   z-10 md:z-0 border-t mx-2 sm:mx-16 justify-center items-center lg:border-t-0 border-gray-800 lg:space-y-6 shadow-3xl ">
          <div className="bg-gradient-to-r from-[#0d1526]  to-[#09101f] rounded-xl md:hidden lg:block  min-w-full md:min-w-40    shadow-[2px_0px_0px_#00ff88] ">
            <BetUpdates
              currentRound={currentRound}
              headBets={currentBets.head}
              tailBets={currentBets.tail}
            />
          </div>
        </div>
      </div>

      <ToastContainerWrapper />
    </div>
  );
};

export default GameRoom;

/****************************************************************************************************************************************************************************************** */

// import React, {
//   useEffect,
//   useState,
//   useRef,
//   useMemo,
//   useCallback,
// } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { clearError, fetchCurrentRound } from "../features/roundSlice";
// import useAblyGameRoom from "../hooks/useAblyGameRoom";
// import useBalanceRealtime from "../hooks/useBalanceRealtime";
// import BetForm from "./BetForm";
// import CoinFlip from "./CoinFlip";
// import UserBets from "./UserBets";
// import TopWinsBets from "./TopWinsBets";
// import ActiveBet from "./ActiveBet";
// import BetUpdates from "./BetUpdates";
// import RoundHistory from "./RoundHistory";
// import { toast as originalToast } from "react-toastify";
// import ToastContainerWrapper from "./ToastContainerWrapper";
// import NoActiveRound from "./NoActiveRound";
// import LoadingSpinner from "./LoadingSpinner";
// import GameRoomTabs from "./GameRoomTabs";
// import {
//   ENABLE_BOTS,
//   BOT_RESULTS_DISPLAY_TIME,
//   createInitialBots,
//   updateBotBetResults,
//   generateBotBet,
//   isRoundActive,
//   filterBotsForRound,
//   MAX_BOTS_PER_ROUND,
//   BOT_BET_INTERVAL,
// } from "../services/botService";
// import Jackpot from "./Jackpot";

// // Debounce utility
// function debounce(func, wait) {
//   let timeout;
//   return (...args) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// }

// // Toast wrapper
// const toast = {
//   success: (message, options) => {
//     if (message) originalToast.success(message, options);
//   },
//   error: (message, options) => {
//     if (message) originalToast.error(message, options);
//   },
//   info: (message, options) => {
//     if (message) originalToast.info(message, options);
//   },
//   dismiss: () => originalToast.dismiss(),
// };

// export const formatResultMessage = (round) => {
//   if (!round?.outcome) {
//     return { message: "Round outcome not available", type: "info" };
//   }
//   return {
//     message: `Round ${round.roundNumber}: ${
//       round.outcome.charAt(0).toUpperCase() + round.outcome.slice(1)
//     } wins!`,
//     type: "info",
//   };
// };

// export const getErrorMessage = (err) => {
//   if (!err) return "";
//   return (
//     err?.message || (typeof err === "string" ? err : JSON.stringify(err)) || ""
//   );
// };

// const GameRoom = () => {
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
//   const [activeTab, setActiveTab] = useState("activeBet");
//   const [botBets, setBotBets] = useState([]); // State for bot bets
//   const [processingRound, setProcessingRound] = useState(false); // State to track round processing
//   const timerRef = useRef(null);
//   const autoRefreshRef = useRef(null);
//   const botIntervalRef = useRef(null);
//   const botClearTimeoutRef = useRef(null);
//   const processedBetsRef = useRef(new Set());
//   const lastRoundIdRef = useRef(null); // Track the last round ID
//   const roundChangeDetectedRef = useRef(false); // Track round changes

//   useAblyGameRoom();
//   useBalanceRealtime();

//   const errorMsg = useMemo(() => getErrorMessage(error), [error]);
//   const noActiveRoundError = useMemo(() => {
//     return (
//       !loading &&
//       (errorMsg.toLowerCase().includes("no active round") || !currentRound)
//     );
//   }, [loading, currentRound, errorMsg]);

//   const userActiveBets = useMemo(() => {
//     if (!authUser || !currentRound) return [];
//     return betResults.filter(
//       (bet) =>
//         bet.roundId === currentRound._id &&
//         (bet.user === authUser._id || bet.phone === authUser.phone)
//     );
//   }, [betResults, currentRound, authUser]);

//   const canBet = useMemo(() => {
//     if (!authUser || !currentRound) return false;
//     return !betResults.some(
//       (bet) =>
//         bet.roundId === currentRound._id &&
//         (bet.user === authUser._id || bet.phone === authUser.phone) &&
//         !bet.result
//     );
//   }, [betResults, authUser, currentRound]);

//   const currentBets = useMemo(() => {
// console.log("Calculating currentBets:", { botBets, betResults, currentRoundId: currentRound?._id });
//     const realBets = {
//       head: betResults.filter(
//         (bet) => bet.side === "heads" && bet.roundId === currentRound?._id
//       ),
//       tail: betResults.filter(
//         (bet) => bet.side === "tails" && bet.roundId === currentRound?._id
//       ),
//     };
//     const botHeadBets = botBets.filter(
//       (bet) => bet.side === "heads" && bet.roundId === currentRound?._id
//     );
//     const botTailBets = botBets.filter(
//       (bet) => bet.side === "tails" && bet.roundId === currentRound?._id
//     );
//     const result = {
//       head: [...realBets.head, ...botHeadBets],
//       tail: [...realBets.tail, ...botTailBets],
//     };

//     // console.log("currentBets result:", result);
//     return result;
//   }, [betResults, botBets, currentRound]);

//   const handleBetResult = useCallback(
//     (bet) => {
//       const betKey = `${bet.betId || bet._id}_${bet.result}`;
//       if (
//         !authUser ||
//         !currentRound ||
//         !bet.result ||
//         processedBetsRef.current.has(betKey)
//       ) {
//         return;
//       }

//       const isUserBet =
//         bet.user === authUser._id || bet.phone === authUser.phone;
//       if (!isUserBet || bet.gameRound !== currentRound._id) return;

//       processedBetsRef.current.add(betKey);
//       const amount =
//         bet.result === "win"
//           ? bet.winAmount || bet.betAmount
//           : bet.lossAmount || bet.betAmount;
//       const message =
//         bet.result === "win"
//           ? `🎉 Round #${currentRound.roundNumber}: You won Ksh${Number(
//               amount
//             ).toFixed(2)}!`
//           : `💫 Round #${currentRound.roundNumber}: You lost Ksh${Number(
//               amount
//             ).toFixed(2)}`;

//       if (message) {
//         toast[bet.result === "win" ? "success" : "error"](message, {
//           position: "top-center",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           className: `toast-Ksh{bet.result}`,
//           toastId: betKey,
//         });
//       }
//     },
//     [authUser, currentRound]
//   );

//   const handleRefresh = useCallback(
//     debounce(async () => {
//       toast.dismiss();
//       try {
//         await dispatch(fetchCurrentRound()).unwrap();
//         toast.success("Game refreshed");
//       } catch (err) {
//         toast.error("Refresh failed");
//       }
//     }, 500),
//     [dispatch]
//   );

//   // Detect round changes
//   useEffect(() => {
//     if (!currentRound) return;

//     // Check if this is a new round
//     if (lastRoundIdRef.current && lastRoundIdRef.current !== currentRound._id) {
//       console.log(
//         "New round detected:",
//         currentRound._id,
//         "Previous:",
//         lastRoundIdRef.current
//       );
//       roundChangeDetectedRef.current = true;

//       // Clear any existing bot clearing timeout
//       if (botClearTimeoutRef.current) {
//         clearTimeout(botClearTimeoutRef.current);
//         botClearTimeoutRef.current = null;
//       }

//       // Reset processing state for new round
//       setProcessingRound(false);

//       // Clear bots from previous round immediately when new round starts
//       setBotBets((prevBots) => filterBotsForRound(prevBots, currentRound._id));
//     }

//     // Update the last round ID reference
//     lastRoundIdRef.current = currentRound._id;
//   }, [currentRound]);

//   // Handle round outcome changes
//   useEffect(() => {
//     if (!currentRound) return;

//     // If we have a new round outcome that isn't null or "processing"
//     if (currentRound.outcome && currentRound.outcome !== "processing") {
//       console.log("Round outcome detected:", currentRound.outcome);

//       // Update bot bet results
//       setBotBets((prev) =>
//         updateBotBetResults(
//           filterBotsForRound(prev, currentRound._id),
//           currentRound.outcome
//         )
//       );

//       // Mark the round as processing
//       setProcessingRound(true);

//       // Clear any existing timeout
//       if (botClearTimeoutRef.current) {
//         clearTimeout(botClearTimeoutRef.current);
//       }

//       // Set a new timeout to clear the bots after the display time
//       botClearTimeoutRef.current = setTimeout(() => {
//         console.log("Scheduled bot clearing triggered after outcome display");
//         // Only clear if we're still on the same round
//         setBotBets((prev) => {
//           // If we already have a new round, don't clear
//           if (lastRoundIdRef.current !== currentRound._id) {
//             console.log("Round has changed, not clearing bot bets");
//             return prev;
//           }
//           console.log("Clearing bot bets for completed round");
//           return filterBotsForRound(prev, null); // Filter out bets from the current round
//         });

//         // Reset processing state
//         setProcessingRound(false);
//       }, BOT_RESULTS_DISPLAY_TIME);
//     }

//     return () => {
//       if (botClearTimeoutRef.current) {
//         clearTimeout(botClearTimeoutRef.current);
//       }
//     };
//   }, [currentRound]);

//   // Bot simulation logic for adding bets
//   useEffect(() => {
//     if (!ENABLE_BOTS || !currentRound) {
//       console.log("Bots disabled or no current round");
//       return;
//     }

//     // Only manage bot betting if the round is active and we're not in processing state
//     if (isRoundActive(currentRound) && !processingRound) {
//       console.log("Bot simulation effect for active round:", currentRound._id);

//       // Initialize bots for a new round
//       if (
//         roundChangeDetectedRef.current ||
//         !botBets.some((bet) => bet.roundId === currentRound._id)
//       ) {
//         console.log("Initializing bots for new round:", currentRound._id);

//         // Reset the round change flag
//         roundChangeDetectedRef.current = false;

//         const initialBets = createInitialBots(currentRound._id);

//         setBotBets((prev) => {
//           // Filter out bets from previous rounds and add new ones
//           const filteredPrev = filterBotsForRound(prev, currentRound._id);
//           return [...filteredPrev, ...initialBets];
//         });

//         // Start interval for adding new bots during active round
//         if (botIntervalRef.current) {
//           clearInterval(botIntervalRef.current);
//         }

//         botIntervalRef.current = setInterval(() => {
//           if (isRoundActive(currentRound)) {
//             console.log("Adding new bot bet if below max");
//             setBotBets((prev) => {
//               const currentRoundBets = filterBotsForRound(
//                 prev,
//                 currentRound._id
//               );
//               if (currentRoundBets.length < MAX_BOTS_PER_ROUND) {
//                 const newBet = generateBotBet(currentRound._id);
//                 console.log("Adding new bot bet:", newBet);
//                 return [...prev, newBet];
//               }
//               console.log("Max bots reached, no new bet added");
//               return prev;
//             });
//           } else {
//             // Stop adding bots if round is no longer active
//             if (botIntervalRef.current) {
//               clearInterval(botIntervalRef.current);
//             }
//           }
//         }, BOT_BET_INTERVAL);
//       }
//     } else {
//       // Stop the interval if round is no longer active
//       if (botIntervalRef.current) {
//         clearInterval(botIntervalRef.current);
//         botIntervalRef.current = null;
//       }
//     }

//     return () => {
//       if (botIntervalRef.current) {
//         clearInterval(botIntervalRef.current);
//       }
//     };
//   }, [currentRound, processingRound, botBets]);

//   // Process bet results
//   useEffect(() => {
//     if (!betResults.length || !authUser || !currentRound) return;
//     betResults.forEach((bet) => {
//       if (bet.result) handleBetResult(bet);
//     });
//   }, [betResults, handleBetResult, authUser, currentRound]);

//   // Timer management
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
//       const remaining = Math.max(
//         0,
//         Math.floor((targetTime - Date.now()) / 1000)
//       );
//       setTimeLeft(remaining);
//       if (remaining <= 0) clearInterval(timerRef.current);
//     }, 1000);

//     return () => clearInterval(timerRef.current);
//   }, [currentRound]);

//   // Auto refresh when no active round
//   useEffect(() => {
//     if (noActiveRoundError) {
//       autoRefreshRef.current = setInterval(
//         () => dispatch(fetchCurrentRound()),
//         10000
//       );
//       return () => clearInterval(autoRefreshRef.current);
//     }
//   }, [noActiveRoundError, dispatch]);

//   // Error handling
//   useEffect(() => {
//     if (
//       errorMsg &&
//       !errorMsg.toLowerCase().includes("no active round") &&
//       errorMsg !== "null"
//     ) {
//       toast.error(errorMsg);
//     }
//   }, [errorMsg]);

//   // Clear all intervals on unmount
//   useEffect(() => {
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//       if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
//       if (botIntervalRef.current) clearInterval(botIntervalRef.current);
//       if (botClearTimeoutRef.current) clearTimeout(botClearTimeoutRef.current);
//     };
//   }, []);

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
//     //mx-auto px-4 py-12 max-w-7xl
//     <div className="container md:max-w-full ">
//       <style>{toastStyles}</style>

//       {loading && <LoadingSpinner />}

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4   md:mt-24 mt-28 ">
//         {/* Main Content Area */}
//         <div className="lg:col-span-2 space-y-8">
//           {noActiveRoundError ? (
//             <NoActiveRound
//               onRefresh={handleRefresh}
//               isLoading={loading}
//             />
//           ) : (
//             <div className="space-y-6">
//               <Jackpot />

//               {/* Game Header with Red Accent
//           //shadow-[0_0_1px_#ff4433]
//            */}
//               <div className="bg-gradient-to-r from-[#0d1526] to-[#09101f] rounded-xl shadow-lg p-2   border-l-4 m-1 border-red-500">
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
//                   <div className=" bg-gradient-to-r from-[#0d1526] to-[#09101f] py-4 md:py-0 flex items-center">
//                     <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mr-2 ">
//                       <span className="text-white font-bold">#</span>
//                     </div>
//                     <h2 className="text-2xl font-bold text-[#00ff88]">
//                       Round # {currentRound?.roundNumber || "N/A"}
//                     </h2>
//                   </div>

//                   {currentRound?.outcome === null && (
//                     <div className="md:static absolute top-72 flex flex-none items-center bg-gray-800 rounded-full px-5 py-2 border border-gray-700 ">
//                       <svg
//                         className="w-5 h-5 mr-2 text-red-400"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                         xmlns="http://www.w3.org/2000/svg">
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth="2"
//                           d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
//                       </svg>
//                       <div className="relative ">
//                         <span className="text-xl font-medium text-white">
//                           {timeLeft}{" "}
//                           <span className="text-sm text-red-400"> s</span>
//                         </span>
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <div className="md:grid grid-cols-2 gap-8">
//                   <div className="order-1 md:order-2 flex justify-center items-center bg-[#0a121e] rounded-lg p-4 mb-6 md:mb-0">
//                     <CoinFlip round={currentRound} />
//                   </div>

//                   <div className="order-2 md:order-1">
//                     {currentRound?.outcome === null &&
//                       (Date.now() <
//                       new Date(currentRound.countdownEndTime).getTime() ? (
//                         canBet ? (
//                           <div className="bg-[#0a121e] rounded-lg  border-t-2 border-[#00ff88]">
//                             <BetForm
//                               roundId={currentRound._id}
//                               onBetSuccess={(amount, side) => {
//                                 const msg = `Bet Ksh${amount} on ${side}!`;
//                                 if (msg) toast.success(msg);
//                               }}
//                               onBetError={(err) => {
//                                 if (err) toast.error(err);
//                               }}
//                             />
//                           </div>
//                         ) : (
//                           <div className="bg-[#0a121e] rounded-lg p-5 border-t-2 border-yellow-500">
//                             <div className="flex items-center">
//                               <svg
//                                 className="w-6 h-6 text-yellow-500 mr-2"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                                 xmlns="http://www.w3.org/2000/svg">
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth="2"
//                                   d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
//                               </svg>
//                               <p className="text-yellow-500 font-medium">
//                                 You already placed a bet for this round.
//                               </p>
//                             </div>
//                           </div>
//                         )
//                       ) : (
//                         <div className="bg-[#0a121e] rounded-lg p-5 border-t-2 border-red-500">
//                           <div className="flex items-center">
//                             <svg
//                               className="w-6 h-6 text-red-500 mr-2"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                               xmlns="http://www.w3.org/2000/svg">
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth="2"
//                                 d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
//                             </svg>
//                             <p className="text-red-500 font-medium">
//                               Betting Closed
//                             </p>
//                           </div>
//                         </div>
//                       ))}
//                   </div>
//                 </div>
//               </div>

//               <RoundHistory />

//               {/* Tabs with Red Accent */}
//               <div className="bg-[#09101f] rounded-xl shadow-md overflow-hidden">
//                 <div className="flex border-b border-gray-800">
//                   <button
//                     onClick={() => setActiveTab("activeBet")}
//                     className={`flex-1 py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 ${
//                       activeTab === "activeBet"
//                         ? "text-white border-b-2 border-red-500 bg-[#0d1526]"
//                         : "text-gray-400 hover:text-gray-200"
//                     }`}>
//                     Active Bets
//                   </button>
//                   <button
//                     onClick={() => setActiveTab("betHistory")}
//                     className={`flex-1 py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 ${
//                       activeTab === "betHistory"
//                         ? "text-white border-b-2 border-red-500 bg-[#0d1526]"
//                         : "text-gray-400 hover:text-gray-200"
//                     }`}>
//                     Bet History
//                   </button>
//                   <button
//                     onClick={() => setActiveTab("topWins")}
//                     className={`flex-1 py-4 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 ${
//                       activeTab === "topWins"
//                         ? "text-white border-b-2 border-red-500 bg-[#0d1526]"
//                         : "text-gray-400 hover:text-gray-200"
//                     }`}>
//                     Top Wins
//                   </button>
//                 </div>

//                 <div className="p-2">
//                   {activeTab === "activeBet" && (
//                     <ActiveBet userActiveBets={userActiveBets} />
//                   )}
//                   {activeTab === "betHistory" && <UserBets />}
//                   {activeTab === "topWins" && <TopWinsBets />}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Side Panel */}
//         <div className="lg:static absolute top-[132px]  left-0 right-0 md:pt-6 bg-[#09101f] rounded-xl flex md:block lg:bg-transparent   z-10 md:z-0 border-t justify-center items-center lg:border-t-0 border-gray-800 lg:space-y-6">
//           <div className="bg-gradient-to-r from-[#0d1526]  to-[#09101f] rounded-xl absolute shadow-lg  border-r-4 border-red-500 ">
//             <BetUpdates
//               headBets={currentBets.head}
//               tailBets={currentBets.tail}
//             />
//           </div>
//         </div>
//       </div>

//       <ToastContainerWrapper />
//     </div>
//     //     <div className="container mx-auto px-4 py-20 max-w-7xl ">
//     //       <style>{toastStyles}</style>
//     //       {/* <div className="flex justify-between items-center mb-8">
//     //         <h1 className="text-3xl font-bold text-gray-100">Coin Flip Game</h1>
//     //         <button
//     //           onClick={handleRefresh}
//     //           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
//     //         >
//     //           Refresh
//     //         </button>
//     //       </div> */}

//     //       {loading && <LoadingSpinner />}

//     //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6  mt-20">
//     //         <div className="lg:col-span-2 space-y-6">
//     //           {noActiveRoundError ? (
//     //             <NoActiveRound
//     //               onRefresh={handleRefresh}
//     //               isLoading={loading}
//     //             />
//     //           ) : (
//     //             <div className="space-y-6 ">
//     //               <div className="relative md:static bg-[#09101f] rounded-xl shadow-md p-6">
//     //                 <Jackpot />
//     //                 <div className="flex justify-between items-center mb-4">
//     //   <h2 className="text-xl font-semibold text-[#00ff88]">
//     //     Round #{currentRound?.roundNumber || "N/A"}
//     //   </h2>
//     //   {currentRound?.outcome === null && (
//     //     <div className="flex items-center bg-gray-800 rounded-full px-4 py-2 mt-4 border border-gray-700">
//     //       <svg className="w-5 h-5 mr-2 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//     //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
//     //       </svg>
//     //       <div className="relative">
//     //         <span className="text-lg font-medium text-white">
//     //           {timeLeft}
//     //           <span className="text-sm text-gray-300"> s</span>
//     //         </span>

//     //       </div>
//     //     </div>
//     //   )}
//     // </div>
//     //                 <div className="md:grid grid-cols-2 ">
//     //                   <div className="order-1 md:order-2 flex justify-center">
//     //                     <CoinFlip round={currentRound} />
//     //                   </div>
//     //                   <div className="order-2 md:order-1 ">
//     //                     {currentRound?.outcome === null &&
//     //                       (Date.now() <
//     //                       new Date(currentRound.countdownEndTime).getTime() ? (
//     //                         canBet ? (
//     //                           <BetForm
//     //                             roundId={currentRound._id}
//     //                             onBetSuccess={(amount, side) => {
//     //                               const msg = `Bet $${amount} on ${side}!`;
//     //                               if (msg) toast.success(msg);
//     //                             }}
//     //                             onBetError={(err) => {
//     //                               if (err) toast.error(err);
//     //                             }}
//     //                           />
//     //                         ) : (
//     //                           <p className="text-yellow-600 font-medium mt-4">
//     //                             You already placed a bet for this round.
//     //                           </p>
//     //                         )
//     //                       ) : (

//     //                          <p className="text-red-500 font-medium mt-4">Betting Closed</p>
//     //                       ))}
//     //                   </div>
//     //                 </div>
//     //                 <div className="md:col-span-2"></div>
//     //               </div>
//     //               <RoundHistory />

//     //               <GameRoomTabs
//     //                 activeTab={activeTab}
//     //                 setActiveTab={setActiveTab}
//     //               />
//     //               <div className=" rounded-xl shadow-md p-6">
//     //                 {activeTab === "activeBet" && (
//     //                   <ActiveBet userActiveBets={userActiveBets} />
//     //                 )}
//     //                 {activeTab === "betHistory" && <UserBets />}
//     //                 {activeTab === "topWins" && <TopWinsBets />}
//     //               </div>
//     //             </div>
//     //           )}
//     //         </div>

//     //         <div className="absolute top-[75px]  left-0 right-0 md:static  space-y-6  px-1 md:p-3">
//     //           <BetUpdates
//     //             headBets={currentBets.head}
//     //             tailBets={currentBets.tail}
//     //           />
//     //         </div>
//     //       </div>

//     //       <ToastContainerWrapper />
//     //     </div>
//   );
// };

// export default React.memo(GameRoom);

/***************************************************************************************************************************************************plain green  initial design ************************************************************************************************************************************************************************************************************************************************************************************************ */

// <div className="container mx-auto px-4 py-20 max-w-7xl ">
// <style>{toastStyles}</style>
// {/* <div className="flex justify-between items-center mb-8">
//   <h1 className="text-3xl font-bold text-gray-100">Coin Flip Game</h1>
//   <button
//     onClick={handleRefresh}
//     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
//   >
//     Refresh
//   </button>
// </div> */}

// {loading && <LoadingSpinner />}

// <div className="grid grid-cols-1 lg:grid-cols-3 gap-6  mt-20">
//   <div className="lg:col-span-2 space-y-6">
//     {noActiveRoundError ? (
//       <NoActiveRound
//         onRefresh={handleRefresh}
//         isLoading={loading}
//       />
//     ) : (
//       <div className="space-y-6 ">
//         <div className="relative md:static bg-[#09101f] rounded-xl shadow-md p-6">
//           <Jackpot />
//           <div className="flex justify-between items-center mb-4">
// <h2 className="text-xl font-semibold text-[#00ff88]">
// Round #{currentRound?.roundNumber || "N/A"}
// </h2>
// {currentRound?.outcome === null && (
// <div className="flex items-center bg-gray-800 rounded-full px-4 py-2 mt-4 border border-gray-700">
// <svg className="w-5 h-5 mr-2 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
// </svg>
// <div className="relative">
//   <span className="text-lg font-medium text-white">
//     {timeLeft}
//     <span className="text-sm text-gray-300"> s</span>
//   </span>

// </div>
// </div>
// )}
// </div>
//           <div className="md:grid grid-cols-2 ">
//             <div className="order-1 md:order-2 flex justify-center">
//               <CoinFlip round={currentRound} />
//             </div>
//             <div className="order-2 md:order-1 ">
//               {currentRound?.outcome === null &&
//                 (Date.now() <
//                 new Date(currentRound.countdownEndTime).getTime() ? (
//                   canBet ? (
//                     <BetForm
//                       roundId={currentRound._id}
//                       onBetSuccess={(amount, side) => {
//                         const msg = `Bet $${amount} on ${side}!`;
//                         if (msg) toast.success(msg);
//                       }}
//                       onBetError={(err) => {
//                         if (err) toast.error(err);
//                       }}
//                     />
//                   ) : (
//                     <p className="text-yellow-600 font-medium mt-4">
//                       You already placed a bet for this round.
//                     </p>
//                   )
//                 ) : (

//                    <p className="text-red-500 font-medium mt-4">Betting Closed</p>
//                 ))}
//             </div>
//           </div>
//           <div className="md:col-span-2"></div>
//         </div>
//         <RoundHistory />

//         <GameRoomTabs
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//         />
//         <div className=" rounded-xl shadow-md p-6">
//           {activeTab === "activeBet" && (
//             <ActiveBet userActiveBets={userActiveBets} />
//           )}
//           {activeTab === "betHistory" && <UserBets />}
//           {activeTab === "topWins" && <TopWinsBets />}
//         </div>
//       </div>
//     )}
//   </div>

//   <div className="absolute top-[75px]  left-0 right-0 md:static  space-y-6  px-1 md:p-3">
//     <BetUpdates
//       headBets={currentBets.head}
//       tailBets={currentBets.tail}
//     />
//   </div>
// </div>

// <ToastContainerWrapper />
// </div>

// /********************************************************************************************************************************************************updated green ui***below**************************************************************************************************************************************************************************************************************************************************************************************** */
// <div className="container md:max-w-full">
//   <style>{toastStyles}</style>

//   {loading && <LoadingSpinner />}

//   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:mt-24 mt-28">
//     {/* Main Content Area */}
//     <div className="lg:col-span-2 space-y-8">
//       {noActiveRoundError ? (
//         <NoActiveRound
//           onRefresh={handleRefresh}
//           isLoading={loading}
//         />
//       ) : (
//         <div className="space-y-6">
//           <Jackpot />

//           {/* Game Header with Updated Theme */}
//           <div className="relative md:static bg-[#09101f] rounded-xl shadow-md p-6">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
//               {/* Round notification */}
//               <div className="bg-[#09101f] py-4 md:py-0 flex items-center transition-all duration-300">
//                 <h2 className="text-xl font-semibold text-[#00ff88]">
//                   Round #{currentRound?.roundNumber || "N/A"}
//                 </h2>
//               </div>

//               {currentRound?.outcome === null && (
//                 <div className="md:static flex items-center bg-gray-800 rounded-full px-4 py-2 border border-gray-700">
//                   <svg
//                     className="w-5 h-5 mr-2 text-[#00ff88]"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
//                   </svg>
//                   <div className="relative">
//                     <span className="text-lg font-medium text-white">
//                       {timeLeft}
//                       <span className="text-sm text-gray-300"> s</span>
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="md:grid grid-cols-2 gap-8">
//               <div className="order-1 md:order-2 flex justify-center">
//                 <CoinFlip round={currentRound} />
//               </div>

//               <div className="order-2 md:order-1">
//                 {currentRound?.outcome === null &&
//                   (Date.now() <
//                   new Date(currentRound.countdownEndTime).getTime() ? (
//                     canBet ? (
//                       <BetForm
//                         roundId={currentRound._id}
//                         onBetSuccess={(amount, side) => {
//                           const msg = `Bet Ksh${amount} on ${side}!`;
//                           if (msg) toast.success(msg);
//                         }}
//                         onBetError={(err) => {
//                           if (err) toast.error(err);
//                         }}
//                       />
//                     ) : (
//                       <p className="text-yellow-600 font-medium mt-4">
//                         You already placed a bet for this round.
//                       </p>
//                     )
//                   ) : (
//                     <p className="text-red-500 font-medium mt-4">
//                       Betting Closed
//                     </p>
//                   ))}
//               </div>
//             </div>
//           </div>

//           <RoundHistory />

//           {/* Tabs with Updated Theme */}
//           <GameRoomTabs
//             activeTab={activeTab}
//             setActiveTab={setActiveTab}
//           />
//           <div className="bg-[#09101f] rounded-xl shadow-md p-6">
//             {activeTab === "activeBet" && (
//               <ActiveBet userActiveBets={userActiveBets} />
//             )}
//             {activeTab === "betHistory" && <UserBets />}
//             {activeTab === "topWins" && <TopWinsBets />}
//           </div>
//         </div>
//       )}
//     </div>

//     {/* Side Panel */}
//     <div className="lg:static absolute top-[132px] left-0 right-0 md:pt-6 space-y-6 px-1 md:p-3">
//       <BetUpdates
//         headBets={currentBets.head}
//         tailBets={currentBets.tail}
//       />
//     </div>
//   </div>

//   <ToastContainerWrapper />
// </div>

// /*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************** */
