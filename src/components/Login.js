import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendOTP, verifyOTP } from '../features/authSlice';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Helper function to extract and format error messages
  const formatErrorMessage = (err) => {
    if (!err) return null;
    // If the error comes with a response from the backend, use its message
    if (err.response && err.response.data && err.response.data.message) {
      return err.response.data.message;
    }
    // Otherwise, fall back to the error's own message
    if (err.message) return err.message;
    return 'An unexpected error occurred. Please try again.';
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLocalError(null); // Clear any previous errors
    try {
      await dispatch(sendOTP({ phone, mode: 'login' })).unwrap();
      setOtpSent(true);
    } catch (err) {
      console.error('Send OTP error:', err);
      setLocalError(formatErrorMessage(err));
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLocalError(null); // Clear any previous errors
    try {
      await dispatch(verifyOTP({ phone, code, mode: 'login' })).unwrap();
      navigate('/');
    } catch (err) {
      console.error('Verify OTP error:', err);
      setLocalError(formatErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

        {localError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
            <strong>Error:</strong> {localError}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOTP}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="border p-2 w-full mb-4 rounded focus:ring focus:ring-blue-300"
              required
            />
            <button
              type="submit"
              className={`p-2 rounded w-full transition ${
                loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter OTP"
              className="border p-2 w-full mb-4 rounded focus:ring focus:ring-green-300"
              required
            />
            <button
              type="submit"
              className={`p-2 rounded w-full transition ${
                loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}

        <p className="mt-4 text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;



// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { sendOTP, verifyOTP } from '../features/authSlice';
// import { useNavigate, Link } from 'react-router-dom';

// const Login = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading, error } = useSelector((state) => state.auth);
//   const [phone, setPhone] = useState('');
//   const [code, setCode] = useState('');
//   const [otpSent, setOtpSent] = useState(false);

//   const handleSendOTP = async (e) => {
//     e.preventDefault();
//     try {
//       await dispatch(sendOTP({ phone, mode: 'login' })).unwrap();
//       setOtpSent(true);
//     } catch (err) {
//       console.error('Send OTP error:', err);
//     }
//   };

//   const handleVerifyOTP = async (e) => {
//     e.preventDefault();
//     try {
//       await dispatch(verifyOTP({ phone, code, mode: 'login' })).unwrap();
//       navigate('/');
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-6 rounded shadow w-full max-w-sm">
//         <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
//         {!otpSent ? (
//           <form onSubmit={handleSendOTP}>
//             <input
//               type="tel"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               placeholder="Phone Number"
//               className="border p-2 w-full mb-4"
//               required
//             />
//             <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
//               {loading ? 'Sending OTP...' : 'Send OTP'}
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleVerifyOTP}>
//             <input
//               type="text"
//               value={code}
//               onChange={(e) => setCode(e.target.value)}
//               placeholder="Enter OTP"
//               className="border p-2 w-full mb-4"
//               required
//             />
//             <button type="submit" className="bg-green-500 text-white p-2 rounded w-full">
//               {loading ? 'Verifying...' : 'Verify OTP'}
//             </button>
//           </form>
//         )}
//         {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
//         <p className="mt-4 text-center">
//           Don't have an account?{' '}
//           <Link to="/register" className="text-blue-500">
//             Register
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Login;
