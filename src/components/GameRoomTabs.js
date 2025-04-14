
// src/components/GameRoomTabs.js
import React from "react";

const GameRoomTabs = ({ activeTab, setActiveTab }) => (
  <div className="mt-8">
    <div className="flex justify-center mb-4 space-x-4">
      <button
        onClick={() => setActiveTab("activeBet")}
        className={`px-4 py-2 border-b-2 ${
          activeTab === "activeBet"
            ? "border-green-500 text-green-400 font-bold"
            : "border-transparent text-gray-400 hover:text-gray-300"
        }`}
      >
        Your Active Bet
      </button>
      <button
        onClick={() => setActiveTab("betHistory")}
        className={`px-4 py-2 border-b-2 ${
          activeTab === "betHistory"
            ? "border-green-500 text-green-400 font-bold"
            : "border-transparent text-gray-400 hover:text-gray-300"
        }`}
      >
        Your Bet History
      </button>
      <button
        onClick={() => setActiveTab("topWins")}
        className={`px-4 py-2 border-b-2 ${
          activeTab === "topWins"
            ? "border-green-500 text-green-400 font-bold"
            : "border-transparent text-gray-400 hover:text-gray-300"
        }`}
      >
        Top 10 Wins
      </button>
    </div>
  </div>
);

export default GameRoomTabs;

/************************************************************************************* */


// // src/components/GameRoomTabs.js
// import React from "react";

// const GameRoomTabs = ({ activeTab, setActiveTab }) => (
//   <div className="mt-8">
//     <div className="flex justify-center mb-4 space-x-4">
//       <button
//         onClick={() => setActiveTab("activeBet")}
//         className={`px-4 py-2 border-b-2 ${
//           activeTab === "activeBet"
//             ? "border-blue-500 text-blue-500"
//             : "border-transparent text-gray-500"
//         }`}
//       >
//         Your Active Bet
//       </button>
//       <button
//         onClick={() => setActiveTab("betHistory")}
//         className={`px-4 py-2 border-b-2 ${
//           activeTab === "betHistory"
//             ? "border-blue-500 text-blue-500"
//             : "border-transparent text-gray-500"
//         }`}
//       >
//         Your Bet History
//       </button>
//       <button
//         onClick={() => setActiveTab("topWins")}
//         className={`px-4 py-2 border-b-2 ${
//           activeTab === "topWins"
//             ? "border-blue-500 text-blue-500"
//             : "border-transparent text-gray-500"
//         }`}
//       >
//         Top 10 Wins
//       </button>
//     </div>
//   </div>
// );

// export default GameRoomTabs;
