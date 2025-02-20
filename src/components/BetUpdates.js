// // // src/components/BetUpdates.js
import React, { useMemo } from "react";

// Utility to mask phone number
const maskPhoneNumber = (phone) => {
  if (!phone) return "N/A";
  const strPhone = String(phone);
  return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
};

const BetItem = React.memo(({ bet, index }) => {
  const displayIdentifier = useMemo(
    () => (bet.phone ? maskPhoneNumber(bet.phone) : "N/A"),
    [bet.phone]
  );

  return (
    <li className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-sm text-gray-800">Bet #{index + 1}</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {displayIdentifier}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <p className="text-gray-700">
          Amount: <span className="font-medium text-gray-900">${Number(bet.betAmount).toFixed(2)}</span>
        </p>
        <p className={`font-medium ${bet.result === "win" ? "text-green-600" : bet.result === "loss" ? "text-red-600" : "text-gray-500"}`}>
          {bet.result ? `${bet.result === "win" ? "Won" : "Lost"}: $${Number(bet.amount).toFixed(2)}` : "Pending"}
        </p>
      </div>
    </li>
  );
});

const BetSection = React.memo(({ title, bets }) => (
  <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-md p-5 flex-1">
    <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
      {title}
    </h4>
    {bets.length > 0 ? (
      <ul className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar">
        {bets.map((bet, index) => (
          <BetItem key={bet.betId || `${bet.side}-${index}`} bet={bet} index={index} />
        ))}
      </ul>
    ) : (
      <p className="text-gray-500 text-center py-4">No {title.toLowerCase()} yet</p>
    )}
  </div>
));

const BetUpdates = ({ headBets = [], tailBets = [] }) => {
  const noBets = headBets.length === 0 && tailBets.length === 0;

  return (
    <section className="my-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg shadow">
        Live Bet Updates
      </h3>
      {noBets ? (
        <p className="text-gray-500 text-center py-4">No updates</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BetSection title="Heads Bets" bets={headBets} />
          <BetSection title="Tails Bets" bets={tailBets} />
        </div>
      )}
    </section>
  );
};

export default React.memo(BetUpdates);

// import React, { useMemo } from "react";

// // Utility to mask phone number
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "N/A";
//   const strPhone = String(phone);
//   return `${strPhone.slice(0, 3)}-${strPhone.slice(3, 6)}-****`;
// };

// const BetItem = React.memo(({ bet, index }) => {
//   const displayIdentifier = useMemo(() => 
//     bet.phone ? maskPhoneNumber(bet.phone) : "N/A",
//     [bet.phone]
//   );

//   return (
//     <li className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
//       <div className="flex justify-between items-center mb-2">
//         <span className="font-semibold text-sm text-gray-800">
//           Bet #{index + 1}
//         </span>
//         <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//           {displayIdentifier}
//         </span>
//       </div>
//       <div className="grid grid-cols-2 gap-2 text-sm">
//         <p className="text-gray-700">
//           Amount: <span className="font-medium text-gray-900">${Number(bet.betAmount).toFixed(2)}</span>
//         </p>
//         <p className={`font-medium ${bet.result === "win" ? "text-green-600" : bet.result === "loss" ? "text-red-600" : "text-gray-500"}`}>
//           {bet.result 
//             ? `${bet.result === "win" ? "Won" : "Lost"}: $${Number(bet.amount).toFixed(2)}`
//             : "Pending"}
//         </p>
//       </div>
//     </li>
//   );
// });

// const BetSection = React.memo(({ title, bets }) => (
//   <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-md p-5 flex-1">
//     <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
//       {title}
//     </h4>
//     {bets.length > 0 ? (
//       <ul className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar">
//         {bets.map((bet, index) => (
//           <BetItem key={bet.betId || `${bet.side}-${index}`} bet={bet} index={index} />
//         ))}
//       </ul>
//     ) : (
//       <p className="text-gray-500 text-center py-4">No {title.toLowerCase()} yet</p>
//     )}
//   </div>
// ));

// const BetUpdates = ({ headBets = [], tailBets = [] }) => {
//   if (!headBets.length && !tailBets.length) return null;

//   return (
//     <section className="my-8">
//       <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg shadow">
//         Live Bet Updates
//       </h3>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <BetSection title="Heads Bets" bets={headBets} />
//         <BetSection title="Tails Bets" bets={tailBets} />
//       </div>
//     </section>
//   );
// };

// export default React.memo(BetUpdates);

// import React from "react";

// export default function BetUpdates({ headBets, tailBets }) {
//   // If there are no bets, return nothing
//   if (headBets.length === 0 && tailBets.length === 0) return null;

//   return (
//     <div className="mb-6">
//       <h3 className="text-2xl font-semibold mb-4 text-center">Bet Updates</h3>
//       <div className="flex flex-col md:flex-row md:space-x-6">
//         {/* Heads Bets */}
//         <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
//           <h4 className="text-xl font-semibold mb-2 border-b pb-1">Heads Bets</h4>
//           {headBets.length > 0 ? (
//             <ul className="space-y-2">
//               {headBets.map((bet, index) => (
//                 <li
//                   key={bet.betId || index}
//                   className="p-2 border rounded hover:bg-gray-50"
//                 >
//                   <div className="flex justify-between">
//                     <span>
//                       <strong>Bet #{index + 1}</strong>
//                     </span>
//                     <span className="text-sm text-gray-500">
//                       {bet.user
//                         ? `Phone: ${bet.phone}`
//                         : bet.user
//                         ? `User: ${bet.user}`
//                         : "N/A"}
//                     </span>
//                   </div>
//                   <p>
//                     <span className="font-medium">Amount:</span> {bet.betAmount}
//                   </p>
//                   {bet.result ? (
//                     <p>
//                       <span className="font-medium">Result:</span> {bet.result} |{" "}
//                       {bet.result === "win"
//                         ? `Won: ${bet.amount}`
//                         : `Lost: ${bet.amount}`}
//                     </p>
//                   ) : (
//                     <p className="text-gray-600">Placed</p>
//                   )}
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p className="text-gray-500">No Heads bets yet.</p>
//           )}
//         </div>

//         {/* Tails Bets */}
//         <div className="bg-white rounded-lg shadow p-4 flex-1">
//           <h4 className="text-xl font-semibold mb-2 border-b pb-1">Tails Bets</h4>
//           {tailBets.length > 0 ? (
//             <ul className="space-y-2">
//               {tailBets.map((bet, index) => (
//                 <li
//                   key={bet.betId || index}
//                   className="p-2 border rounded hover:bg-gray-50"
//                 >
//                   <div className="flex justify-between">
//                     <span>
//                       <strong>Bet #{index + 1}</strong>
//                     </span>
//                     <span className="text-sm text-gray-500">
//                       {bet.user
//                         ? `User: ${bet.user}`
//                         : bet.phone
//                         ? `Phone: ${bet.phone}`
//                         : "N/A"}
//                     </span>
//                   </div>
//                   <p>
//                     <span className="font-medium">Amount:</span> {bet.betAmount}
//                   </p>
//                   {bet.result ? (
//                     <p>
//                       <span className="font-medium">Result:</span> {bet.result} |{" "}
//                       {bet.result === "win"
//                         ? `Won: ${bet.amount}`
//                         : `Lost: ${bet.amount}`}
//                     </p>
//                   ) : (
//                     <p className="text-gray-600">Placed</p>
//                   )}
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p className="text-gray-500">No Tails bets yet.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
