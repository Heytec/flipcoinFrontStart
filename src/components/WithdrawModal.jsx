// // src/components/WithdrawModal.jsx

// src/components/WithdrawModal.jsx
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
      console.log(phone)
      await dispatch(initiateB2C({ phone, amount, sessionId })).unwrap();

      alert("Withdrawal initiated successfully");
      onClose();
    } catch (err) {
      setError(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded p-6 w-80">
        <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
        {phone && (
          <p className="mb-4 text-sm text-gray-600">
            Your registered phone: <span className="font-semibold">{phone}</span>
          </p>
        )}
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
              {loading ? "Processing..." : "Withdraw"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawModal;




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
