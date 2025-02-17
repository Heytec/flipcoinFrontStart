// // // // // // // // // // // src/components/GameRoom.js

// src/components/GameRoom.js
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCurrentRound,
  fetchJackpotPool,
  clearError,
} from "../features/roundSlice";
import useAblyGameRoom from "../hooks/useAblyGameRoom";
import BetForm from "./BetForm";
import CoinFlip from "./CoinFlip";
import UserBets from "./UserBets"; // Bet History Component
import TopWinsBets from "./TopWinsBets"; // Top Wins Component
import ActiveBet from "./ActiveBet"; // Active Bet Component
import BetUpdates from "./BetUpdates"; // Newly created BetUpdates Component
import { toast } from "react-toastify";
import ToastContainerWrapper from "./ToastContainerWrapper";

// Helper function to convert error objects to strings
function getErrorMessage(err) {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  if (err.error)
    return typeof err.error === "string"
      ? err.error
      : JSON.stringify(err.error);
  return JSON.stringify(err);
}

export default function GameRoom() {
  const dispatch = useDispatch();
  const { currentRound, jackpot, betResults = [], loading, error } =
    useSelector((state) => state.round);
  const authUser = useSelector((state) => state.auth.user);

  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  // State to track the active tab
  const [activeTab, setActiveTab] = useState("activeBet");

  // Initialize realtime updates
  useAblyGameRoom();

  // Set up a local countdown timer for the active round
  useEffect(() => {
    if (!currentRound || currentRound.outcome !== null) {
      setTimeLeft(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    const endMs = new Date(currentRound.endTime).getTime();
    const updateTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    updateTime();
    timerRef.current = setInterval(updateTime, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRound]);

  // Show error toast only once then clear it
  const errorMsg = getErrorMessage(error);
  useEffect(() => {
    if (errorMsg) {
      toast.error(errorMsg);
      dispatch(clearError());
    }
  }, [errorMsg, dispatch]);

  // Notify the signed-in user about their bet result after the round ends
  useEffect(() => {
    if (!authUser || !currentRound || currentRound.outcome === null) return;

    const userIdentifier = authUser.phone || authUser._id;
    const localStorageKey = `notifiedBets_${userIdentifier}`;

    const userBets = betResults.filter((bet) => {
      const betRound = bet.gameRound || bet.roundId;
      if (betRound !== currentRound._id) return false;
      if (bet.phone && authUser.phone) return bet.phone === authUser.phone;
      if (!bet.phone && authUser._id) return bet.user === authUser._id;
      return false;
    });

    const storedNotifiedBets = JSON.parse(
      localStorage.getItem(localStorageKey) || "[]"
    );

    userBets.forEach((bet) => {
      if (!storedNotifiedBets.includes(bet.betId) && bet.result) {
        if (bet.result === "win") {
          toast.success(`Congratulations! You won Ksh${bet.amount}!`);
        } else if (bet.result === "loss" || bet.result === "lost") {
          toast.error(
            `Sorry, your bet of Ksh${bet.betAmount} lost Ksh${bet.amount}.`
          );
        }
        storedNotifiedBets.push(bet.betId);
      }
    });

    localStorage.setItem(localStorageKey, JSON.stringify(storedNotifiedBets));
  }, [betResults, currentRound, authUser]);

  // Filter bets by side for the current round (heads/tails)
  const currentRoundId = currentRound ? currentRound._id : null;
  const headBets = currentRoundId
    ? betResults.filter(
        (bet) =>
          bet.side === "heads" &&
          (bet.gameRound || bet.roundId) === currentRoundId
      )
    : [];
  const tailBets = currentRoundId
    ? betResults.filter(
        (bet) =>
          bet.side === "tails" &&
          (bet.gameRound || bet.roundId) === currentRoundId
      )
    : [];

  // Filter out the signed-in user's active bets (only during an active round)
  const userActiveBets =
    authUser && currentRound && currentRound.outcome === null
      ? betResults.filter((bet) => {
          const betRound = bet.gameRound || bet.roundId;
          if (betRound !== currentRound._id) return false;
          if (bet.phone && authUser.phone)
            return bet.phone === authUser.phone;
          if (!bet.phone && authUser._id)
            return bet.user === authUser._id;
          return false;
        })
      : [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold text-center mb-6">
        Coin Flip Betting Game
      </h1>

      {loading && <p className="text-center text-gray-600">Loading...</p>}

      {/* Round Display */}
      {currentRound && currentRound.outcome === null ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            Round #{currentRound.roundNumber} (Active)
          </h2>
          <div className="flex flex-col md:flex-row md:justify-between mb-4">
            <p className="text-lg">
              <span className="font-medium">Time Left:</span> {timeLeft}s
            </p>
            <p className="text-lg">
              <span className="font-medium">Last Result:</span>{" "}
              {currentRound.lastResult || "N/A"}
            </p>
          </div>
          <CoinFlip round={currentRound} />
          {Date.now() < new Date(currentRound.countdownEndTime).getTime() ? (
            <BetForm roundId={currentRound._id} />
          ) : (
            <p className="text-red-600 mt-2 font-semibold">
              Betting is closed.
            </p>
          )}
        </div>
      ) : currentRound && currentRound.outcome ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            Round #{currentRound.roundNumber} Ended!
          </h2>
          <p className="text-lg mb-4">
            <span className="font-medium">Outcome:</span> {currentRound.outcome}
          </p>
          <CoinFlip round={currentRound} />
          <p className="mt-4 text-gray-700">
            Please wait for the next round to start...
          </p>
        </div>
      ) : (
        <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-700 mb-6">
          No active round. Please wait...
        </div>
      )}

      {/* Jackpot Section */}
      <div className="bg-yellow-100 rounded-lg p-4 mb-6 text-center">
        <h3 className="text-xl font-bold">
          Jackpot: {Number(jackpot).toFixed(2)}
        </h3>
      </div>

      {/* Render the BetUpdates component */}
      <BetUpdates headBets={headBets} tailBets={tailBets} />

      {/* Tabbed Navigation for Bets */}
      <div className="mt-8">
        <div className="flex justify-center mb-4 space-x-4">
          <button
            onClick={() => setActiveTab("activeBet")}
            className={`px-4 py-2 border-b-2 ${
              activeTab === "activeBet"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-500"
            }`}
          >
            Your Active Bet
          </button>
          <button
            onClick={() => setActiveTab("betHistory")}
            className={`px-4 py-2 border-b-2 ${
              activeTab === "betHistory"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-500"
            }`}
          >
            Your Bet History
          </button>
          <button
            onClick={() => setActiveTab("topWins")}
            className={`px-4 py-2 border-b-2 ${
              activeTab === "topWins"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-500"
            }`}
          >
            Top 10 Wins
          </button>
        </div>
        <div>
          {activeTab === "activeBet" && (
            <ActiveBet userActiveBets={userActiveBets} />
          )}
          {activeTab === "betHistory" && (
            <div className="bg-green-100 rounded-lg p-4">
              <UserBets />
            </div>
          )}
          {activeTab === "topWins" && (
            <div className="bg-purple-100 rounded-lg p-4">
              <TopWinsBets />
            </div>
          )}
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainerWrapper />
    </div>
  );
}

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
