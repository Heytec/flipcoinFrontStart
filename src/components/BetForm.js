// // // // // // // src/components/BetForm.js
// // src/components/BetForm.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { placeBet, clearError } from "../features/roundSlice";
import { toast } from "react-toastify";
import { ERROR_TYPES } from "../constants/errorTypes";

const BetForm = ({ roundId }) => {
  const dispatch = useDispatch();
  const { loading, error, errorDetails } = useSelector((state) => state.round);

  const [amount, setAmount] = useState("");
  const [side, setSide] = useState("heads");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestedAmounts = useMemo(() => [10, 20, 50, 100], []);

  // Error message handler
  const getErrorMessage = useCallback((errorDetails) => {
    if (!errorDetails) return "An unexpected error occurred";
    switch (errorDetails.type) {
      case ERROR_TYPES.INSUFFICIENT_BALANCE:
        return `Insufficient balance (${errorDetails.details.deficit} needed)`;
      case ERROR_TYPES.BETTING_CLOSED:
        return "Betting is closed";
      case ERROR_TYPES.DUPLICATE_BET:
        return `Existing bet: ${errorDetails.details.existingBet.amount} on ${errorDetails.details.existingBet.side}`;
      case ERROR_TYPES.INVALID_BET_DATA:
        return errorDetails.message || "Invalid bet";
      case ERROR_TYPES.NO_ACTIVE_ROUND:
        return "No active round";
      default:
        return errorDetails.message || "Bet placement failed";
    }
  }, []);

  // Form submission handler
  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!roundId) {
        toast.error("No active round!");
        return;
      }
      if (isSubmitting || !amount) return;

      setIsSubmitting(true);
      try {
        const result = await dispatch(
          placeBet({
            roundId,
            amount: parseFloat(amount),
            side,
          })
        ).unwrap();

        toast.success(
          `Bet placed: ${result.bet.amount} on ${result.bet.side}`,
          {
            position: "bottom-right",
          }
        );
        setAmount("");
      } catch (err) {
        toast.error(getErrorMessage(err), { position: "top-center" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [roundId, amount, side, isSubmitting, dispatch, getErrorMessage]
  );

  // Amount input handler
  const handleAmountChange = useCallback((e) => {
    const value = e.target.value;
    if (
      value === "" ||
      (/^\d*\.?\d*$/.test(value) && !isNaN(parseFloat(value)))
    ) {
      setAmount(value);
    }
  }, []);

  // Suggestion click handler
  const handleSuggestionClick = useCallback((value) => {
    setAmount(value.toString());
  }, []);

  // Side selection handler
  const handleSideSelect = useCallback((selectedSide) => {
    setSide(selectedSide);
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  return (
    <div className="bg-gradient-to-b from-gray-900 to-[#091219] text-white px-1 md:px-6 py-3 rounded-xl shadow-lg border border-gray-800">
      <div className="flex items-center justify-center mb-1 ">
        <div className="w-1 h-8 bg-red-500 rounded-full mr-3"></div>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00ff88] to-white">
          Place Your Bet
        </h2>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4">
        {/* Bet Amount Section */}
        <div>
          {/* <label
            htmlFor="amount"
            className="text-sm font-medium text-gray-300 mb-3 text-center flex items-center justify-center">
            <svg
              className="w-4 h-4 mr-2 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                clipRule="evenodd"></path>
            </svg>
            Bet Amount (Ksh)
          </label> */}

          <div className="flex flex-col space-y-4">
            <div className="flex justify-center">
              <div className="relative w-full max-w-[250px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">Ksh</span>
                </div>
                <input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={handleAmountChange}
                  required
                  disabled={isSubmitting || loading}
                  className="w-full pl-12 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-center text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-transparent disabled:bg-gray-700"
                />
              </div>
            </div>

            <div className="flex justify-center gap-2">
              {[20, 50, 100].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleSuggestionClick(value)}
                  disabled={isSubmitting || loading}
                  className="bg-gradient-to-r from-[#255a5f] to-[#0d1d1e] text-[#00ffbf] px-4 py-2 rounded-lg hover:from-[#1b3a3d] hover:to-[#0d1d1e] hover:shadow-md hover:shadow-[#00ff885d] focus:ring-1 focus:ring-[#00ff88] focus:outline-none disabled:opacity-50 transition-all duration-200">
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Side Selection */}
        <div>
          <span className=" text-sm font-medium text-gray-300 mb-1 text-center flex items-center justify-center">
            <svg
              className="w-4 h-4 mr-2 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"></path>
            </svg>
            Choose Your Side
          </span>
          <div className="relative flex overflow-hidden">
            {["heads", "tails"].map((option, index) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSideSelect(option)}
                disabled={isSubmitting || loading}
                className={`relative flex-1 py-4 font-medium text-sm transition-all duration-300
              ${index === 0 ? "mr-1 rounded-l-xl" : "ml-1 rounded-r-xl"}
              ${
                side === option
                  ? option === "heads"
                    ? "bg-gradient-to-r from-[#00ff88] to-[#0adbdf] text-white shadow-lg border border-[#00ff88]"
                    : "bg-gradient-to-r from-[#fd4545] to-[#d41a1a] text-white shadow-lg border border-red-500"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }
              disabled:opacity-50 overflow-hidden`}>
                <div className="flex items-center justify-center w-full">
                  {option === "heads" ? (
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                        clipRule="evenodd"></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"></path>
                    </svg>
                  )}
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div >
          <button
            type="submit"
            disabled={isSubmitting || loading || !amount || !side}
            className={`w-full py-3 rounded-lg font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 uppercase ${
              !amount || !side
                ? "bg-gray-600 text-gray-400"
                : side === "heads"
                ? "bg-gradient-to-r from-[#00ff88] to-[#29babd] text-white hover:shadow-lg hover:shadow-[#00ff8833] focus:ring-[#00ff88]"
                : "bg-gradient-to-r from-[#ff3a3a] to-[#ff5757] text-white hover:shadow-lg hover:shadow-[#ff3a3a33] focus:ring-red-500"
            }`}>
            {isSubmitting || loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24">
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
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                PLACE YOUR BET
              </>
            )}
          </button>
        </div>

        {/* Additional help text */}
        <div className="text-xs text-center text-gray-400">
          Min bet: 10 Ksh | Max bet: 10,000 Ksh
        </div>
      </form>
    </div>
  );
};

export default React.memo(BetForm);

/********************************************************************************************** */
//     <div className="bg-gray-900 text-white px-4 py-6 rounded-xl shadow-lg">
//       <h2 className="text-2xl font-semibold mb-4 text-center">
//         Place Your Bet
//       </h2>

//       <form
//         onSubmit={onSubmit}
//         className="space-y-6">
//         {/* Bet Amount Section */}
//         <div>
//           <label
//             htmlFor="amount"
//             className="block text-sm font-medium text-gray-300 mb-2 text-center">
//             Bet Amount (Ksh)
//           </label>

//           <div className="flex flex-col space-y-3">
//             <div className="flex justify-center">
//               <input
//                 id="amount"
//                 type="text"
//                 inputMode="decimal"
//                 placeholder="Enter amount"
//                 value={amount}
//                 onChange={handleAmountChange}
//                 required
//                 disabled={isSubmitting || loading}
//                 className="w-full max-w-[250px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-center focus:ring-2 focus:ring-[#00ff88] focus:border-transparent disabled:bg-gray-700 transition-colors duration-200 text-white"
//               />
//             </div>

//             <div className="flex justify-center gap-2">
//               {[10, 20, 100].map((value) => (
//                 <button
//                   key={value}
//                   type="button"
//                   onClick={() => handleSuggestionClick(value)}
//                   disabled={isSubmitting || loading}
//                   className="bg-[#1b3a3d8a] text-[#00ff88] px-4 py-2 rounded-lg hover:bg-gray-700 focus:ring-1 focus:ring-[#00ff88] focus:outline-none disabled:bg-gray-700 disabled:text-gray-500 transition-colors duration-200">
//                   {value}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Side Selection */}
//         <div>
//   <span className="block text-sm font-medium text-gray-300 mb-3 text-center">
//     Choose Your Side
//   </span>
//   <div className="relative flex overflow-hidden">
//     {["heads", "tails"].map((option, index) => (
//       <button
//         key={option}
//         type="button"
//         onClick={() => handleSideSelect(option)}
//         disabled={isSubmitting || loading}
//         className={`flex-1 py-4 px-6 font-medium text-sm transition-all duration-200
//           transform skew-x-12
//           ${index === 0 ? 'mr-2 rounded-l-full' : 'rounded-r-full'}
//           ${
//             side === option
//               ? 'bg-gradient-to-br from-[#00ff88be] to-[#29babd63] text-white shadow-[0_0_0px_#ffff] border-[1px] border-[#00ff88]'
//               : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
//           }
//           disabled:opacity-50`}
//       >
//         <div className="transform -skew-x-12">
//           {option.charAt(0).toUpperCase() + option.slice(1)}
//         </div>
//       </button>
//     ))}
//   </div>
// </div>

//         {/* Submit Button */}
//         <button
//           type="submit"
//           disabled={isSubmitting || loading || !amount}
//           className="w-full py-3 bg-[#00ff88] text-white rounded-lg font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:ring-offset-2 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 uppercase shadow-[-3px_4px_9px_#00ff88af]">
//           {isSubmitting || loading ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5"
//                 viewBox="0 0 24 24">
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                   fill="none"
//                 />
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
//                 />
//               </svg>
//               <span>Processing...</span>
//             </>
//           ) : (
//             "PLACE YOUR BET"
//           )}
//         </button>
//       </form>
//     </div>
/************************************************************************************************************************************** */
// <div className=" px-6 mt-2 rounded-xl shadow-lg border border-gray-100">
//   <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
//     Place Your Bet
//   </h2>

//   <form
//     onSubmit={onSubmit}
//     className="space-y-6">
//     {/* Amount Section */}
//     <label
//       htmlFor="amount"
//       className="block text-sm font-medium text-gray-700 mb-0 text-center">
//       Bet Amount (Ksh)
//     </label>
//     <div className="grid grid-cols-2 gap-3 md:gap:0 items-center justify-center">
//       <div className="flex justify-center">
//         <input
//           id="amount"
//           type="text"
//           inputMode="decimal"
//           placeholder="Enter amount"
//           value={amount}
//           onChange={handleAmountChange}
//           required
//           disabled={isSubmitting || loading}
//           className="w-full max-w-[200px] md:max-w-none px-4 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-colors duration-200"
//         />
//       </div>
//       <div className="mt-3 grid grid-cols-2 gap-2">
//         {suggestedAmounts.map((value) => (
//           <button
//             key={value}
//             type="button"
//             onClick={() => handleSuggestionClick(value)}
//             disabled={isSubmitting || loading}
//             className="bg-blue-100 text-[#00ff88] p-1 rounded-lg hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-200 disabled:text-gray-500 transition-colors duration-200 text-sm">
//             {value}
//           </button>
//         ))}
//       </div>
//     </div>

//     {/* Side Selection */}
//     <div>
//       <span className="block text-sm font-medium text-gray-700 mb-2 text-center">
//         Choose Your Side
//       </span>
//       <div className="grid grid-cols-2 gap-1">
//         {["heads", "tails"].map((option, index) => (
//           <button
//             key={option}
//             type="button"
//             onClick={() => handleSideSelect(option)}
//             disabled={isSubmitting || loading}
//             className={`relative py-4 px-6 font-medium text-sm text-white transition-all duration-200  ${
//               side === option
//                 ? "bg-gradient-to-r from-green-500 to-green-600 shadow-md"
//                 : "bg-gray-300 text-gray-800 hover:bg-gray-400"
//             } disabled:opacity-50 ${
//               index === 0
//                 ? "skew-x-[14deg] origin-left rounded-l-lg"
//                 : "skew-x-[14deg] origin-right rounded-r-lg"
//             }`}>
//             {option.charAt(0).toUpperCase() + option.slice(1)}
//           </button>
//         ))}
//       </div>
//     </div>

//     {/* Submit Button */}
//     <button
//       type="submit"
//       disabled={isSubmitting || loading || !amount}
//       className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2">
//       {isSubmitting || loading ? (
//         <>
//           <svg
//             className="animate-spin h-5 w-5"
//             viewBox="0 0 24 24">
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
//           <span>Processing...</span>
//         </>
//       ) : (
//         "Place Bet"
//       )}
//     </button>
//   </form>
// </div>

/*************************************************************************************div *************************** */

// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { placeBet, clearError } from '../features/roundSlice';
// import { toast } from 'react-toastify';
// import { ERROR_TYPES } from '../constants/errorTypes';

// export default function BetForm({ roundId }) {
//   const dispatch = useDispatch();
//   const [amount, setAmount] = useState('');
//   const [side, setSide] = useState('heads');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const { loading, error, errorDetails } = useSelector(state => state.round);
//   const suggestedAmounts = [10, 20, 50, 100, 200, 500];

//   useEffect(() => {
//     // Clear any existing errors when component mounts or unmounts
//     return () => dispatch(clearError());
//   }, [dispatch]);

//   const getErrorMessage = (errorDetails) => {
//     if (!errorDetails) return 'An unexpected error occurred';

//     switch (errorDetails.type) {
//       case ERROR_TYPES.INSUFFICIENT_BALANCE:
//         return `Insufficient balance. You need ${errorDetails.details.deficit} more coins.`;
//       case ERROR_TYPES.BETTING_CLOSED:
//         return 'Betting is closed for this round.';
//       case ERROR_TYPES.DUPLICATE_BET:
//         return `You already placed a bet of ${errorDetails.details.existingBet.amount} on ${errorDetails.details.existingBet.side} for this round.`;
//       case ERROR_TYPES.INVALID_BET_DATA:
//         return errorDetails.message || 'Invalid bet data provided.';
//       case ERROR_TYPES.NO_ACTIVE_ROUND:
//         return 'No active round available for betting.';
//       default:
//         return errorDetails.message || 'An error occurred while placing your bet.';
//     }
//   };

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     if (!roundId) {
//       toast.error('No active round to bet on!');
//       return;
//     }

//     if (isSubmitting) return;
//     setIsSubmitting(true);

//     try {
//       const result = await dispatch(placeBet({
//         roundId,
//         amount: parseFloat(amount),
//         side
//       })).unwrap();

//       toast.success('Your bet has been placed successfully!');
//       setAmount('');

//       // Optional: Show additional success details
//       if (result.bet) {
//         toast.info(`Placed ${result.bet.amount} on ${result.bet.side}`);
//       }
//     } catch (error) {
//       const errorMessage = getErrorMessage(error);
//       toast.error(errorMessage, {
//         autoClose: 5000,
//         position: 'top-center'
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSuggestionClick = (value) => {
//     setAmount(value.toString());
//   };

//   const handleAmountChange = (e) => {
//     const value = e.target.value;
//     if (value === '' || (/^\d*\.?\d*$/.test(value) && !isNaN(parseFloat(value)))) {
//       setAmount(value);
//     }
//   };

//   return (
//     <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
//       <h2 className="text-xl font-bold mb-4 text-center">Place Your Bet</h2>

//       <form onSubmit={onSubmit}>
//         <div className="mb-4">
//           <label htmlFor="amount" className="block text-gray-700 mb-1 text-center">
//             Bet Amount:
//           </label>
//           <input
//             id="amount"
//             type="text"
//             inputMode="decimal"
//             placeholder="Enter amount"
//             value={amount}
//             onChange={handleAmountChange}
//             required
//             disabled={isSubmitting}
//             className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
//           />
//           <div className="mt-2 flex flex-wrap justify-center gap-2">
//             {suggestedAmounts.map((value) => (
//               <button
//                 key={value}
//                 type="button"
//                 onClick={() => handleSuggestionClick(value)}
//                 disabled={isSubmitting}
//                 className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 focus:outline-none disabled:bg-blue-300"
//               >
//                 Ksh{value}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="mb-4">
//           <span className="block text-gray-700 mb-1 text-center">Choose Side:</span>
//           <div className="flex space-x-4">
//             {['heads', 'tails'].map((option) => (
//               <button
//                 key={option}
//                 type="button"
//                 onClick={() => setSide(option)}
//                 disabled={isSubmitting}
//                 className={`flex-1 border rounded p-2 text-center focus:outline-none transition-colors ${
//                   side === option
//                     ? 'bg-green-500 text-white'
//                     : 'bg-white text-gray-700 hover:bg-gray-100'
//                 } disabled:opacity-50`}
//               >
//                 {option.charAt(0).toUpperCase() + option.slice(1)}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="flex justify-center">
//           <button
//             type="submit"
//             disabled={isSubmitting || loading}
//             className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none disabled:bg-green-400 disabled:cursor-not-allowed flex items-center space-x-2"
//           >
//             {isSubmitting || loading ? (
//               <>
//                 <span className="animate-spin">↻</span>
//                 <span>Placing Bet...</span>
//               </>
//             ) : (
//               'Place Bet'
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// import React, { useState } from 'react';
// import { useDispatch } from 'react-redux';
// import { placeBet } from '../features/roundSlice';
// import { toast } from 'react-toastify';

// export default function BetForm({ roundId }) {
//   const dispatch = useDispatch();
//   const [amount, setAmount] = useState('');
//   const [side, setSide] = useState('heads');
//   const suggestedAmounts = [10, 20, 50, 100, 200, 500];

//   const getErrorMessage = (err) => {
//     if (!err) return '';
//     if (typeof err === 'string') return err;
//     if (err.message) return err.message;
//     if (err.error)
//       return typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
//     return JSON.stringify(err);
//   };

//   const onSubmit = async (e) => {
//     e.preventDefault();

//     if (!roundId) {
//       toast.error('No active round to bet on!');
//       return;
//     }

//     try {
//       // Include roundId in the payload
//       await dispatch(placeBet({ roundId, amount, side })).unwrap();
//       toast.success('Your bet has been placed successfully!');
//       setAmount('');
//     } catch (error) {
//       console.error('Error placing bet:', error);
//       const errorMessage = getErrorMessage(error);
//       toast.error(`Error placing bet: ${errorMessage}`);
//     }
//   };

//   const handleSuggestionClick = (value) => {
//     setAmount(value);
//   };

//   return (
//     <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
//       {/* Centered Form Header */}
//       <h2 className="text-xl font-bold mb-4 text-center">Place Your Bet</h2>

//       <form onSubmit={onSubmit}>
//         {/* Bet Amount Input with Suggestions */}
//         <div className="mb-4">
//           <label htmlFor="amount" className="block text-gray-700 mb-1 text-center">
//             Bet Amount:
//           </label>
//           <input
//             id="amount"
//             type="number"
//             min="1"
//             placeholder="Enter amount"
//             value={amount}
//             onChange={(e) => setAmount(e.target.value)}
//             required
//             className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <div className="mt-2 flex flex-wrap justify-center gap-2">
//             {suggestedAmounts.map((value) => (
//               <button
//                 key={value}
//                 type="button"
//                 onClick={() => handleSuggestionClick(value)}
//                 className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 focus:outline-none"
//               >
//                 Ksh{value}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Side Selection */}
//         <div className="mb-4">
//           <span className="block text-gray-700 mb-1 text-center">Choose Side:</span>
//           <div className="flex space-x-4">
//             <button
//               type="button"
//               onClick={() => setSide('heads')}
//               className={`flex-1 border rounded p-2 text-center focus:outline-none transition-colors ${
//                 side === 'heads'
//                   ? 'bg-green-500 text-white'
//                   : 'bg-white text-gray-700 hover:bg-gray-100'
//               }`}
//             >
//               Heads
//             </button>
//             <button
//               type="button"
//               onClick={() => setSide('tails')}
//               className={`flex-1 border rounded p-2 text-center focus:outline-none transition-colors ${
//                 side === 'tails'
//                   ? 'bg-green-500 text-white'
//                   : 'bg-white text-gray-700 hover:bg-gray-100'
//               }`}
//             >
//               Tails
//             </button>
//           </div>
//         </div>

//         {/* Submit Button */}
//         <div className="flex justify-center">
//           <button
//             type="submit"
//             className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
//           >
//             Place Bet
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// import React, { useState } from 'react';
// import { useDispatch } from 'react-redux';
// import { placeBet } from '../features/roundSlice';
// import { toast } from 'react-toastify';

// export default function BetForm({ roundId }) {
//   const dispatch = useDispatch();
//   const [amount, setAmount] = useState('');
//   const [side, setSide] = useState('heads');
//   const suggestedAmounts = [10, 20, 50, 100,200,500];

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     if (!roundId) {
//       toast.error('No active round to bet on!');
//       return;
//     }
//     try {
//       await dispatch(placeBet({ amount, side })).unwrap();
//       toast.success('Your bet has been placed successfully!');
//       setAmount('');
//     } catch (error) {
//       console.error('Error placing bet:', error);
//       toast.error(`Error placing bet: ${error}`);
//     }
//   };

//   const handleSuggestionClick = (value) => {
//     setAmount(value);
//   };

//   return (
//     <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
//       {/* Centered Form Header */}
//       <h2 className="text-xl font-bold mb-4 text-center">Place Your Bet</h2>

//       <form onSubmit={onSubmit}>
//         {/* Bet Amount Input with Suggestions */}
//         <div className="mb-4">
//           <label htmlFor="amount" className="block text-gray-700 mb-1 text-center">
//             Bet Amount:
//           </label>
//           <input
//             id="amount"
//             type="number"
//             min="1"
//             placeholder="Enter amount"
//             value={amount}
//             onChange={(e) => setAmount(e.target.value)}
//             required
//             className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <div className="mt-2 flex flex-wrap justify-center gap-2">
//             {suggestedAmounts.map((value) => (
//               <button
//                 key={value}
//                 type="button"
//                 onClick={() => handleSuggestionClick(value)}
//                 className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 focus:outline-none"
//               >
//                 Ksh{value}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Side Selection */}
//         <div className="mb-4">
//           <span className="block text-gray-700 mb-1 text-center">Choose Side:</span>
//           <div className="flex space-x-4">
//             <button
//               type="button"
//               onClick={() => setSide('heads')}
//               className={`flex-1 border rounded p-2 text-center focus:outline-none transition-colors ${
//                 side === 'heads'
//                   ? 'bg-green-500 text-white'
//                   : 'bg-white text-gray-700 hover:bg-gray-100'
//               }`}
//             >
//               Heads
//             </button>
//             <button
//               type="button"
//               onClick={() => setSide('tails')}
//               className={`flex-1 border rounded p-2 text-center focus:outline-none transition-colors ${
//                 side === 'tails'
//                   ? 'bg-green-500 text-white'
//                   : 'bg-white text-gray-700 hover:bg-gray-100'
//               }`}
//             >
//               Tails
//             </button>
//           </div>
//         </div>

//         {/* Submit Button */}
//         <div className="flex justify-center">
//           <button
//             type="submit"
//             className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
//           >
//             Place Bet
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// import React, { useState } from 'react';
// import { useDispatch } from 'react-redux';
// import { placeBet } from '../features/roundSlice';
// import { toast } from 'react-toastify';

// export default function BetForm({ roundId }) {
//   const dispatch = useDispatch();
//   const [amount, setAmount] = useState('');
//   const [side, setSide] = useState('heads');
//   const suggestedAmounts = [10, 20, 50, 100];

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     if (!roundId) {
//       toast.error('No active round to bet on!');
//       return;
//     }
//     try {
//       await dispatch(placeBet({ amount, side })).unwrap();
//       toast.success('Your bet has been placed successfully!');
//       setAmount('');
//     } catch (error) {
//       console.error('Error placing bet:', error);
//       toast.error(`Error placing bet: ${error}`);
//     }
//   };

//   const handleSuggestionClick = (value) => {
//     setAmount(value);
//   };

//   return (
//     <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
//       {/* Form Header */}
//       <h2 className="text-xl font-bold mb-4 text-center">Place Your Bet</h2>
//       <form onSubmit={onSubmit}>
//         {/* Bet Amount Input with Suggestions */}
//         <div className="mb-4">
//           <label htmlFor="amount" className="block text-gray-700 mb-1">
//             Bet Amount:
//           </label>
//           <input
//             id="amount"
//             type="number"
//             min="1"
//             placeholder="Enter amount"
//             value={amount}
//             onChange={(e) => setAmount(e.target.value)}
//             required
//             className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <div className="mt-2 flex space-x-2">
//             {suggestedAmounts.map((value) => (
//               <button
//                 key={value}
//                 type="button"
//                 onClick={() => handleSuggestionClick(value)}
//                 className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 focus:outline-none"
//               >
//                 Ksh{value}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Side Selection */}
//         <div className="mb-4">
//           <span className="block text-gray-700 mb-1">Choose Side:</span>
//           <div className="flex space-x-4">
//             <button
//               type="button"
//               onClick={() => setSide('heads')}
//               className={`flex-1 border rounded p-2 text-center focus:outline-none transition-colors ${
//                 side === 'heads'
//                   ? 'bg-green-500 text-white'
//                   : 'bg-white text-gray-700 hover:bg-gray-100'
//               }`}
//             >
//               Heads
//             </button>
//             <button
//               type="button"
//               onClick={() => setSide('tails')}
//               className={`flex-1 border rounded p-2 text-center focus:outline-none transition-colors ${
//                 side === 'tails'
//                   ? 'bg-green-500 text-white'
//                   : 'bg-white text-gray-700 hover:bg-gray-100'
//               }`}
//             >
//               Tails
//             </button>
//           </div>
//         </div>

//         {/* Submit Button */}
//         <div className="flex justify-end">
//           <button
//             type="submit"
//             className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
//           >
//             Place Bet
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// // src/components/BetForm.jsx
// // src/components/BetForm.jsx
// import React, { useState } from 'react';
// import { useDispatch } from 'react-redux';
// import { placeBet } from '../features/roundSlice';

// export default function BetForm({ roundId }) {
//   const dispatch = useDispatch();
//   const [amount, setAmount] = useState('');
//   const [side, setSide] = useState('heads');
//   const suggestedAmounts = [10, 20, 50, 100];

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     if (!roundId) {
//       alert('No active round to bet on!');
//       return;
//     }
//     try {
//       await dispatch(placeBet({ amount, side })).unwrap();
//       setAmount('');
//     } catch (error) {
//       console.error('Error placing bet:', error);
//     }
//   };

//   const handleSuggestionClick = (value) => {
//     setAmount(value);
//   };

//   return (
//     <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
//       {/* Form Header */}
//       <h2 className="text-xl font-bold mb-4 text-center">Place Your Bet</h2>
//       <form onSubmit={onSubmit}>
//         {/* Bet Amount Input with Suggestions */}
//         <div className="mb-4">
//           <label htmlFor="amount" className="block text-gray-700 mb-1">
//             Bet Amount:
//           </label>
//           <input
//             id="amount"
//             type="number"
//             min="1"
//             placeholder="Enter amount"
//             value={amount}
//             onChange={(e) => setAmount(e.target.value)}
//             required
//             className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <div className="mt-2 flex space-x-2">
//             {suggestedAmounts.map((value) => (
//               <button
//                 key={value}
//                 type="button"
//                 onClick={() => handleSuggestionClick(value)}
//                 className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 focus:outline-none"
//               >
//                 ${value}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Side Selection */}
//         <div className="mb-4">
//           <span className="block text-gray-700 mb-1">Choose Side:</span>
//           <div className="flex space-x-4">
//             <button
//               type="button"
//               onClick={() => setSide('heads')}
//               className={`flex-1 border rounded p-2 text-center focus:outline-none transition-colors ${
//                 side === 'heads'
//                   ? 'bg-green-500 text-white'
//                   : 'bg-white text-gray-700 hover:bg-gray-100'
//               }`}
//             >
//               Heads
//             </button>
//             <button
//               type="button"
//               onClick={() => setSide('tails')}
//               className={`flex-1 border rounded p-2 text-center focus:outline-none transition-colors ${
//                 side === 'tails'
//                   ? 'bg-green-500 text-white'
//                   : 'bg-white text-gray-700 hover:bg-gray-100'
//               }`}
//             >
//               Tails
//             </button>
//           </div>
//         </div>

//         {/* Submit Button */}
//         <div className="flex justify-end">
//           <button
//             type="submit"
//             className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
//           >
//             Place Bet
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// // src/components/BetForm.jsx
// import React, { useState } from 'react';
// import { useDispatch } from 'react-redux';
// import { placeBet } from '../features/roundSlice';

// export default function BetForm({ roundId }) {
//   const dispatch = useDispatch();
//   const [amount, setAmount] = useState('');
//   const [side, setSide] = useState('heads');

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     if (!roundId) {
//       alert('No active round to bet on!');
//       return;
//     }
//     try {
//       await dispatch(placeBet({ amount, side })).unwrap();
//       setAmount('');
//     } catch (error) {
//       console.error('Error placing bet:', error);
//     }
//   };

//   return (
//     <form onSubmit={onSubmit} className="mt-4">
//       <div>
//         <label>Amount: </label>
//         <input
//           type="number"
//           min="1"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           required
//           className="border p-1"
//         />
//       </div>
//       <div className="mt-2">
//         <label>Side: </label>
//         <select value={side} onChange={(e) => setSide(e.target.value)}>
//           <option value="heads">Heads</option>
//           <option value="tails">Tails</option>
//         </select>
//       </div>
//       <button type="submit" className="mt-3 px-4 py-2 bg-green-600 text-white rounded">
//         Place Bet
//       </button>
//     </form>
//   );
// }

// import React, { useState } from 'react';
// import { placeBet } from '../api/api';
// import { useDispatch } from 'react-redux';
// import { updateBalance } from '../features/authSlice';

// const BetForm = ({ roundId }) => {
//   const [amount, setAmount] = useState('');
//   const [side, setSide] = useState('heads');
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);
//   const dispatch = useDispatch();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage('');
//     setLoading(true);
//     try {
//       const betData = { amount: parseFloat(amount), side, roundId };
//       const token = localStorage.getItem('accessToken') || '';
//       const result = await placeBet(betData, token);
//       setMessage('Bet placed successfully!',result);
//       //dispatch(updateBalance(result.user.balance));
//       setAmount('');
//     } catch (error) {
//       console.error('Error placing bet:', error);
//       setMessage('Error placing bet. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="mt-6">
//       <h3 className="text-xl font-bold mb-2">Place Your Bet</h3>
//       <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
//         <input
//           type="number"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           placeholder="Bet Amount"
//           className="border p-2 rounded"
//           min="1"
//           step="0.01"
//           required
//         />
//         <div>
//           <label className="mr-4">
//             <input
//               type="radio"
//               value="heads"
//               checked={side === 'heads'}
//               onChange={() => setSide('heads')}
//             />
//             Heads
//           </label>
//           <label className="mr-4">
//             <input
//               type="radio"
//               value="tails"
//               checked={side === 'tails'}
//               onChange={() => setSide('tails')}
//             />
//             Tails
//           </label>
//         </div>
//         <button
//           type="submit"
//           className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
//           disabled={loading}
//         >
//           {loading ? 'Placing Bet...' : 'Place Bet'}
//         </button>
//       </form>
//       {message && <p className="mt-2 text-center">{message}</p>}
//     </div>
//   );
// };

// export default BetForm;
