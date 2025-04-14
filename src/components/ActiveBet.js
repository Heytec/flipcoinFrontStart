

import React from "react";

const ActiveBet = ({ userActiveBets }) => {
  return (
    <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6">
      <h3 className="text-2xl font-semibold text-center mb-4">Your Active Bet</h3>
      
      {userActiveBets.length > 0 ? (
        userActiveBets.map((bet, idx) => (
          <div 
            key={bet.betId || idx} 
            className="bg-gray-800 rounded-lg p-4 my-3 border border-gray-700"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400">Bet Amount</span>
              <span className="text-lg font-bold text-white">Ksh {bet.betAmount}</span>
            </div>
            
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400">Side</span>
              <span 
                className={`px-4 py-1 rounded-full font-medium ${
                  bet.side.toLowerCase() === 'heads' 
                    ? 'bg-[#1b3a3d8a] text-[#00ff88]' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {bet.side}
              </span>
            </div>
            
            {bet.result ? (
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-700">
                <span className="text-gray-400">Result</span>
                {bet.result === "win" ? (
                  <span className="text-[#00ff88] font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Won Ksh {bet.amount}
                  </span>
                ) : (
                  <span className="text-red-400 font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Lost Ksh {bet.amount}
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-center">
                <div className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Bet is active
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400">
            You have not placed any bet this round.
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveBet;










/************************************************************************************ */








// // src/components/ActiveBet.js
// import React from "react";

// const ActiveBet = ({ userActiveBets }) => {
//   return (
//     <div className="bg-blue-100 rounded-lg p-4">
//       <h3 className="text-xl font-bold text-center">Your Active Bet</h3>
//       {userActiveBets.length > 0 ? (
//         userActiveBets.map((bet, idx) => (
//           <div key={bet.betId || idx} className="text-center my-2">
//             <p className="text-lg">
//               <strong>Amount:</strong> Ksh {bet.betAmount}
//             </p>
//             <p className="text-lg">
//               <strong>Side:</strong> {bet.side}
//             </p>
//             {bet.result ? (
//               <p className="text-green-600 text-lg">
//                 <strong>Result:</strong>{" "}
//                 {bet.result === "win"
//                   ? `Won Ksh${bet.amount}`
//                   : `Lost Ksh${bet.amount}`}
//               </p>
//             ) : (
//               <p className="text-gray-600 text-lg">Bet is active</p>
//             )}
//           </div>
//         ))
//       ) : (
//         <p className="text-center text-gray-600">
//           You have not placed any bet this round.
//         </p>
//       )}
//     </div>
//   );
// };

// export default ActiveBet;
