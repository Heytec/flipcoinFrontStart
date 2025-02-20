// // // // // // // src/components/BetForm.js
// // src/components/BetForm.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { placeBet, clearError } from '../features/roundSlice';
import { toast } from 'react-toastify';
import { ERROR_TYPES } from '../constants/errorTypes';

const BetForm = ({ roundId }) => {
  const dispatch = useDispatch();
  const { loading, error, errorDetails } = useSelector(state => state.round);
  
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState('heads');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const suggestedAmounts = useMemo(() => [10, 20, 50, 100, 200, 500], []);

  // Error message handler
  const getErrorMessage = useCallback((errorDetails) => {
    if (!errorDetails) return 'An unexpected error occurred';
    switch (errorDetails.type) {
      case ERROR_TYPES.INSUFFICIENT_BALANCE:
        return `Insufficient balance (${errorDetails.details.deficit} needed)`;
      case ERROR_TYPES.BETTING_CLOSED:
        return 'Betting is closed';
      case ERROR_TYPES.DUPLICATE_BET:
        return `Existing bet: ${errorDetails.details.existingBet.amount} on ${errorDetails.details.existingBet.side}`;
      case ERROR_TYPES.INVALID_BET_DATA:
        return errorDetails.message || 'Invalid bet';
      case ERROR_TYPES.NO_ACTIVE_ROUND:
        return 'No active round';
      default:
        return errorDetails.message || 'Bet placement failed';
    }
  }, []);

  // Form submission handler
  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!roundId) {
      toast.error('No active round!');
      return;
    }
    if (isSubmitting || !amount) return;

    setIsSubmitting(true);
    try {
      const result = await dispatch(placeBet({ 
        roundId, 
        amount: parseFloat(amount), 
        side 
      })).unwrap();
      
      toast.success(`Bet placed: ${result.bet.amount} on ${result.bet.side}`, {
        position: 'bottom-right'
      });
      setAmount('');
    } catch (err) {
      toast.error(getErrorMessage(err), { position: 'top-center' });
    } finally {
      setIsSubmitting(false);
    }
  }, [roundId, amount, side, isSubmitting, dispatch, getErrorMessage]);

  // Amount input handler
  const handleAmountChange = useCallback((e) => {
    const value = e.target.value;
    if (value === '' || (/^\d*\.?\d*$/.test(value) && !isNaN(parseFloat(value)))) {
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
    <div className="mt-6 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-5 text-center">
        Place Your Bet
      </h2>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Amount Section */}
        <div>
          <label 
            htmlFor="amount" 
            className="block text-sm font-medium text-gray-700 mb-2 text-center"
          >
            Bet Amount (Ksh)
          </label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="Enter amount"
            value={amount}
            onChange={handleAmountChange}
            required
            disabled={isSubmitting || loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-colors duration-200"
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {suggestedAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleSuggestionClick(value)}
                disabled={isSubmitting || loading}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-200 disabled:text-gray-500 transition-colors duration-200 text-sm"
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Side Selection */}
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2 text-center">
            Choose Your Side
          </span>
          <div className="grid grid-cols-2 gap-4">
            {['heads', 'tails'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSideSelect(option)}
                disabled={isSubmitting || loading}
                className={`py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  side === option
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || loading || !amount}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isSubmitting || loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            'Place Bet'
          )}
        </button>
      </form>
    </div>
  );
};

export default React.memo(BetForm);

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
