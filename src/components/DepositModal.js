import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initiateSTKPush } from "../features/transactionSlice";
import { v4 as uuidv4 } from "uuid";

const DepositModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);

  // Get the user's phone from the auth slice
  const user = useSelector((state) => state.auth.user);
  const phone = user?.phone; // e.g., "0723306796"

  useEffect(() => {
    // Function to handle clicks outside the modal
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) {
      setError("Amount is required.");
      return;
    }
    setLoading(true);
    setError(null);

    // Generate a unique session ID for this deposit transaction
    const sessionId = uuidv4();
    try {
      // Dispatch the thunk to initiate an STK push (deposit)
      await dispatch(initiateSTKPush({ phone, amount, sessionId })).unwrap();
      
      // Show success message
      onClose();
      // Use a more subtle notification instead of alert
      const notificationEvent = new CustomEvent('notification', {
        detail: { message: 'Deposit initiated successfully', type: 'success' }
      });
      document.dispatchEvent(notificationEvent);
    } catch (err) {
      // Log detailed error info for debugging
      console.error("Error initiating deposit:", err);
      
      // Build a more detailed error message for display
      const detailedError =
        (err.response && err.response.data && err.response.data.errorMessage) ||
        err.message ||
        JSON.stringify(err);
      setError(`Deposit failed: ${detailedError}`);
    }
    setLoading(false);
  };

  const handlePresetAmount = (preset) => {
    setAmount(preset);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6 border border-gray-800 transform transition-all"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Deposit Funds</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-900 text-white px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-1">
              Amount (Ksh):
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="flex space-x-2 mb-4">
            {[10, 20, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetAmount(preset)}
                className={`flex-1 py-2 rounded-md  ${
                  amount === preset.toString()
                    ? "bg-gray-700 "
                    : "bg-[#1b3a3d8a] text-[#00ff88] px-4 py-2 rounded-lg focus:ring-none shadow-[2px_-1px_2px_#ffff] focus:ring-[#00ff88] focus:outline-none focus:shadow-[3px_-2px_3px_#00ff88] disabled:bg-gray-700 disabled:text-gray-500 transition-colors duration-200 hover:bg-gray-700"
                } transition-colors`}
              >
                {preset}
              </button>
              
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing
                </span>
              ) : (
                "DEPOSIT"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;



/*************************************************************************************************************** */
// // // src/components/DepositModal.jsx
// // src/components/DepositModal.jsx
// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { initiateSTKPush } from "../features/transactionSlice";
// import { v4 as uuidv4 } from "uuid";

// const DepositModal = ({ onClose }) => {
//   const dispatch = useDispatch();
//   const [amount, setAmount] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Get the user's phone from the auth slice.
//   const user = useSelector((state) => state.auth.user);
//   const phone = user?.phone; // e.g., "0723306796" (or the format returned from your auth)

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!amount) {
//       setError("Amount is required.");
//       return;
//     }
//     setLoading(true);
//     setError(null);

//     // Generate a unique session ID for this deposit transaction.
//     const sessionId = uuidv4();
//     try {
//       // Dispatch the thunk to initiate an STK push (deposit)
//       console.log(phone)
//       console.log(amount)
//       console.log(sessionId)
//       await dispatch(initiateSTKPush({ phone, amount, sessionId })).unwrap();
      
//       alert("Deposit initiated successfully");
//       onClose();
//     } catch (err) {
//       // Log detailed error info for debugging
//       console.error("Error initiating deposit:", err);
      
//       // Build a more detailed error message for display.
//       const detailedError =
//         (err.response && err.response.data && err.response.data.errorMessage) ||
//         err.message ||
//         JSON.stringify(err);
//       setError(`Deposit failed: ${detailedError}`);
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
//   <div className="bg-gray-900 rounded-lg p-6 w-80 border border-gray-800">
//     <h2 className="text-xl font-bold mb-4 text-white">Deposit Funds</h2>
//     {error && <p className="text-red-500 mb-2">{error}</p>}
//     <form onSubmit={handleSubmit}>
//       <label className="block mb-2 text-gray-300">
//         Amount (Ksh):
//         <input
//           type="number"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           className="w-full bg-gray-800 border border-gray-700 rounded p-2 mt-1 text-white"
//           placeholder="Enter amount"
//           required
//         />
//       </label>
//       <div className="flex justify-between space-x-2 mt-6">
//         <button
//           type="button"
//           onClick={onClose}
//           className="px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-700"
//         >
//           Cancel
//         </button>
//         <button
//           type="submit"
//           className="px-4 py-2 bg-green-500 text-white rounded-md"
//           disabled={loading}
//         >
//           {loading ? "Processing..." : "DEPOSIT"}
//         </button>
//       </div>
//       <div className="flex justify-between mt-4">
//         <button className="w-1/4 py-2 bg-gray-800 text-white rounded-md">10</button>
//         <button className="w-1/4 py-2 bg-gray-800 text-white rounded-md">20</button>
//         <button className="w-1/4 py-2 bg-gray-800 text-white rounded-md">100</button>
//       </div>
//     </form>
//   </div>
// </div>
//     // <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//     //   <div className="bg-white rounded p-6 w-80">
//     //     <h2 className="text-xl font-bold mb-4">Deposit Funds</h2>
//     //     {error && <p className="text-red-500 mb-2">{error}</p>}
//     //     <form onSubmit={handleSubmit}>
//     //       <label className="block mb-2">
//     //         Amount:
//     //         <input
//     //           type="number"
//     //           value={amount}
//     //           onChange={(e) => setAmount(e.target.value)}
//     //           className="w-full border rounded p-2 mt-1"
//     //           required
//     //         />
//     //       </label>
//     //       <div className="flex justify-end space-x-2 mt-4">
//     //         <button
//     //           type="button"
//     //           onClick={onClose}
//     //           className="px-4 py-2 bg-gray-300 rounded"
//     //         >
//     //           Cancel
//     //         </button>
//     //         <button
//     //           type="submit"
//     //           className="px-4 py-2 bg-blue-600 text-white rounded"
//     //           disabled={loading}
//     //         >
//     //           {loading ? "Processing..." : "Deposit"}
//     //         </button>
//     //       </div>
//     //     </form>
//     //   </div>
//     // </div>
//   );
// };

// export default DepositModal;
/******************************************************************************************************************************************************** */

// src/components/DepositModal.jsx
// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { initiateSTKPush } from "../features/transactionSlice";
// import { v4 as uuidv4 } from "uuid";

// const DepositModal = ({ onClose }) => {
//   const dispatch = useDispatch();
//   const [amount, setAmount] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Get the user's phone from the auth slice.
//   const user = useSelector((state) => state.auth.user);
//   const phone = user?.phone; // This will be "0723306796" (or whatever was returned)

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!amount) return;
//     setLoading(true);
//     setError(null);

//     // Generate a unique session ID for this deposit transaction.
//     const sessionId = uuidv4();
//     try {
//       // Dispatch the thunk to initiate an STK push (deposit)
//       await dispatch(initiateSTKPush({ phone, amount, sessionId })).unwrap();
//       alert("Deposit initiated successfully");
//       onClose();
//     } catch (err) {
//       setError(err);
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//       <div className="bg-white rounded p-6 w-80">
//         <h2 className="text-xl font-bold mb-4">Deposit Funds</h2>
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
//               {loading ? "Processing..." : "Deposit"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default DepositModal;













// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { initiateSTKPush } from "../features/transactionSlice";
// import { v4 as uuidv4 } from "uuid";

// const DepositModal = ({ onClose }) => {
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

//     // Generate a unique session ID for this deposit transaction.
//     const sessionId = uuidv4();
//     try {
//       // Dispatch the thunk to initiate an STK push (deposit)
//       await dispatch(initiateSTKPush({ phone, amount, sessionId })).unwrap();
//       alert("Deposit initiated successfully");
//       onClose();
//     } catch (err) {
//       setError(err);
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//       <div className="bg-white rounded p-6 w-80">
//         <h2 className="text-xl font-bold mb-4">Deposit Funds</h2>
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
//               {loading ? "Processing..." : "Deposit"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default DepositModal;
