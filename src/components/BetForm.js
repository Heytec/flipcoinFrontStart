// // // // // src/components/BetForm.js

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { placeBet } from '../features/roundSlice';
import { toast } from 'react-toastify';

export default function BetForm({ roundId }) {
  const dispatch = useDispatch();
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState('heads');
  const suggestedAmounts = [10, 20, 50, 100,200,500];

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!roundId) {
      toast.error('No active round to bet on!');
      return;
    }
    try {
      await dispatch(placeBet({ amount, side })).unwrap();
      toast.success('Your bet has been placed successfully!');
      setAmount('');
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error(`Error placing bet: ${error}`);
    }
  };

  const handleSuggestionClick = (value) => {
    setAmount(value);
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
      {/* Centered Form Header */}
      <h2 className="text-xl font-bold mb-4 text-center">Place Your Bet</h2>

      <form onSubmit={onSubmit}>
        {/* Bet Amount Input with Suggestions */}
        <div className="mb-4">
          <label htmlFor="amount" className="block text-gray-700 mb-1 text-center">
            Bet Amount:
          </label>
          <input
            id="amount"
            type="number"
            min="1"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {suggestedAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleSuggestionClick(value)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 focus:outline-none"
              >
                Ksh{value}
              </button>
            ))}
          </div>
        </div>

        {/* Side Selection */}
        <div className="mb-4">
          <span className="block text-gray-700 mb-1 text-center">Choose Side:</span>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setSide('heads')}
              className={`flex-1 border rounded p-2 text-center focus:outline-none transition-colors ${
                side === 'heads'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Heads
            </button>
            <button
              type="button"
              onClick={() => setSide('tails')}
              className={`flex-1 border rounded p-2 text-center focus:outline-none transition-colors ${
                side === 'tails'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tails
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
          >
            Place Bet
          </button>
        </div>
      </form>
    </div>
  );
}

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
