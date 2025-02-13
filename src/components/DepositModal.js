// // src/components/DepositModal.jsx
// src/components/DepositModal.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initiateSTKPush } from "../features/transactionSlice";
import { v4 as uuidv4 } from "uuid";

const DepositModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get the user's phone from the auth slice.
  const user = useSelector((state) => state.auth.user);
  const phone = user?.phone; // e.g., "0723306796" (or the format returned from your auth)

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) {
      setError("Amount is required.");
      return;
    }
    setLoading(true);
    setError(null);

    // Generate a unique session ID for this deposit transaction.
    const sessionId = uuidv4();
    try {
      // Dispatch the thunk to initiate an STK push (deposit)
      console.log(phone)
      console.log(amount)
      console.log(sessionId)
      await dispatch(initiateSTKPush({ phone, amount, sessionId })).unwrap();
      
      alert("Deposit initiated successfully");
      onClose();
    } catch (err) {
      // Log detailed error info for debugging
      console.error("Error initiating deposit:", err);
      
      // Build a more detailed error message for display.
      const detailedError =
        (err.response && err.response.data && err.response.data.errorMessage) ||
        err.message ||
        JSON.stringify(err);
      setError(`Deposit failed: ${detailedError}`);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded p-6 w-80">
        <h2 className="text-xl font-bold mb-4">Deposit Funds</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            Amount:
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded p-2 mt-1"
              required
            />
          </label>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={loading}
            >
              {loading ? "Processing..." : "Deposit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;


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
