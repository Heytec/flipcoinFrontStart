
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initiateB2C } from "../features/transactionSlice";
import { v4 as uuidv4 } from "uuid";

const WithdrawModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Retrieve the user's phone from the auth slice.
  const user = useSelector((state) => state.auth.user);
  const phone = user?.phone;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;
    setLoading(true);
    setError(null);

    // Generate a unique session ID for this withdrawal transaction.
    const sessionId = uuidv4();
    try {
      // Dispatch the thunk to initiate a B2C withdrawal transaction.
      console.log(phone);
      await dispatch(initiateB2C({ phone, amount, sessionId })).unwrap();

      alert("Withdrawal initiated successfully");
      onClose();
    } catch (err) {
      setError(err);
    }
    setLoading(false);
  };

  const handleSuggestionClick = (value) => {
    setAmount(value.toString());
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-gray-900 text-white px-4 py-6 rounded-xl shadow-lg w-80">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Withdraw Funds
        </h2>
        
        {phone && (
          <p className="mb-4 text-sm text-gray-300 text-center">
            Your registered phone: <span className="font-semibold">{phone}</span>
          </p>
        )}
        
        {error && <p className="text-red-500 mb-2 text-center">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-300 mb-2 text-center">
              Withdraw Amount (Ksh)
            </label>

            <div className="flex flex-col space-y-3">
              <div className="flex justify-center">
                <input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full max-w-[250px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-center focus:ring-2 focus:ring-[#00ff88] focus:border-transparent disabled:bg-gray-700 transition-colors duration-200 text-white"
                />
              </div>

              <div className="flex justify-center gap-2">
                {[10, 20, 100].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleSuggestionClick(value)}
                    disabled={loading}
                    className="bg-[#1b3a3d8a] text-[#00ff88] px-4 py-2 rounded-lg hover:bg-gray-700 focus:ring-1 focus:ring-[#00ff88] focus:outline-none disabled:bg-gray-700 disabled:text-gray-500 transition-colors duration-200">
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 bg-gray-800 text-gray-300 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-all duration-200"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading || !amount}
              className="w-1/2 py-3 bg-[#00ff88] text-white rounded-lg font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:ring-offset-2 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-[-3px_4px_9px_#00ff88af]"
            >
              {loading ? (
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
                "WITHDRAW"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawModal;



/******************************************************************************************************************** */




// // src/components/WithdrawModal.jsx

// src/components/WithdrawModal.jsx
// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { initiateB2C } from "../features/transactionSlice";
// import { v4 as uuidv4 } from "uuid";

// const WithdrawModal = ({ onClose }) => {
//   const dispatch = useDispatch();
//   const [amount, setAmount] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Retrieve the user's phone from the auth slice.
//   const user = useSelector((state) => state.auth.user);
//   const phone = user?.phone;

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!amount) return;
//     setLoading(true);
//     setError(null);

//     // Generate a unique session ID for this withdrawal transaction.
//     const sessionId = uuidv4();
//     try {
//       // Dispatch the thunk to initiate a B2C withdrawal transaction.
//       console.log(phone)
//       await dispatch(initiateB2C({ phone, amount, sessionId })).unwrap();

//       alert("Withdrawal initiated successfully");
//       onClose();
//     } catch (err) {
//       setError(err);
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//       <div className="bg-white rounded p-6 w-80">
//         <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
//         {phone && (
//           <p className="mb-4 text-sm text-gray-600">
//             Your registered phone: <span className="font-semibold">{phone}</span>
//           </p>
//         )}
//         {error && <p className="text-red-500 mb-2">{error}</p>}
//         <form onSubmit={handleSubmit}>
//           <label className="block mb-2">
//             Amount:
//             <input
//               type="number"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               className="w-full border rounded p-2 mt-1"
//               required
//             />
//           </label>
//           <div className="flex justify-end space-x-2 mt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 bg-gray-300 rounded"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded"
//               disabled={loading}
//             >
//               {loading ? "Processing..." : "Withdraw"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default WithdrawModal;


/********************************************************************************************************************************************* */

// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { initiateB2C } from "../features/transactionSlice";
// import { v4 as uuidv4 } from "uuid";

// const WithdrawModal = ({ onClose }) => {
//   const dispatch = useDispatch();
//   const [amount, setAmount] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Get the user's phone from the auth slice.
//   const user = useSelector((state) => state.auth.user);
//   const phone = user?.phone;

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!amount) return;
//     setLoading(true);
//     setError(null);

//     // Generate a unique session ID for this withdrawal transaction.
//     const sessionId = uuidv4();
//     try {
//       // Dispatch the thunk to initiate a B2C withdrawal transaction.
//       await dispatch(initiateB2C({ phone, amount, sessionId })).unwrap();
//       alert("Withdrawal initiated successfully");
//       onClose();
//     } catch (err) {
//       setError(err);
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//       <div className="bg-white rounded p-6 w-80">
//         <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
//         {error && <p className="text-red-500 mb-2">{error}</p>}
//         <form onSubmit={handleSubmit}>
//           <label className="block mb-2">
//             Amount:
//             <input
//               type="number"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               className="w-full border rounded p-2 mt-1"
//               required
//             />
//           </label>
//           <div className="flex justify-end space-x-2 mt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 bg-gray-300 rounded"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded"
//               disabled={loading}
//             >
//               {loading ? "Processing..." : "Withdraw"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default WithdrawModal;
