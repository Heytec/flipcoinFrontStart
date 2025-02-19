import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendOTP, verifyOTP } from '../features/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Error message mapping for user-friendly messages
  const ERROR_MESSAGES = {
    INVALID_PHONE: 'Please enter a valid phone number.',
    USER_NOT_FOUND: 'No account found with this phone number. Please register first.',
    OTP_INVALID: 'Invalid verification code. Please try again.',
    OTP_EXPIRED: 'Verification code has expired. Please request a new one.',
    RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
    NETWORK_ERROR: 'Connection error. Please check your internet connection.',
  };

  const showErrorToast = (error) => {
    // Use mapped error message if available, otherwise default to error.message
    const message =
      ERROR_MESSAGES[error.code] ||
      error.message ||
      'Something went wrong. Please try again.';
    toast.error(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    // Basic phone validation
    if (!phone.match(/^\d{10}$/)) {
      toast.warn('Please enter a valid 10-digit phone number.', {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    try {
      await dispatch(sendOTP({ phone, mode: 'login' })).unwrap();
      setOtpSent(true);
      showSuccessToast('Verification code sent successfully!');
    } catch (err) {
      console.error('Send OTP error:', err);
      showErrorToast(err);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    // Basic OTP validation
    if (!code.match(/^\d{6}$/)) {
      toast.warn('Please enter a valid 6-digit verification code.', {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    try {
      await dispatch(verifyOTP({ phone, code, mode: 'login' })).unwrap();
      showSuccessToast('Login successful! Redirecting...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error('Verify OTP error:', err);
      showErrorToast(err);
    }
  };

  const handleResendOTP = async () => {
    if (loading) return;

    const toastId = toast.loading('Sending new verification code...', {
      position: "top-right",
    });

    try {
      await dispatch(sendOTP({ phone, mode: 'login' })).unwrap();
      toast.update(toastId, {
        render: "New verification code sent!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
        theme: "colored",
      });
    } catch (err) {
      console.error('Resend OTP error:', err);
      toast.update(toastId, {
        render:
          ERROR_MESSAGES[err.code] ||
          err.message ||
          "Failed to send new code",
        type: "error",
        isLoading: false,
        autoClose: 4000,
        theme: "colored",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          {otpSent ? 'Verify OTP' : 'Login'}
        </h2>

        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
                {phone && phone.length === 10 && (
                  <span className="absolute right-3 top-2.5 text-green-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium transition duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium transition duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : 'Verify & Login'}
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full text-sm text-blue-600 hover:text-blue-800 focus:outline-none disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Resend verification code
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Register here
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
// import { toast } from 'react-toastify';

// const Login = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading, error } = useSelector((state) => state.auth);
//   const [phone, setPhone] = useState('');
//   const [code, setCode] = useState('');
//   const [otpSent, setOtpSent] = useState(false);

//   // Error message mapping for user-friendly messages
//   const ERROR_MESSAGES = {
//     INVALID_PHONE: 'Please enter a valid phone number.',
//     USER_NOT_FOUND: 'No account found with this phone number. Please register first.',
//     OTP_INVALID: 'Invalid verification code. Please try again.',
//     OTP_EXPIRED: 'Verification code has expired. Please request a new one.',
//     RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
//     NETWORK_ERROR: 'Connection error. Please check your internet connection.',
//   };

//   const showErrorToast = (error) => {
//     const message = ERROR_MESSAGES[error.code] || error.message || 'Something went wrong. Please try again.';
//     toast.error(message, {
//       position: "top-right",
//       autoClose: 4000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       progress: undefined,
//       theme: "colored",
//     });
//   };

//   const showSuccessToast = (message) => {
//     toast.success(message, {
//       position: "top-right",
//       autoClose: 3000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       progress: undefined,
//       theme: "colored",
//     });
//   };

//   const handleSendOTP = async (e) => {
//     e.preventDefault();
    
//     // Basic phone validation
//     if (!phone.match(/^\d{10}$/)) {
//       toast.warn('Please enter a valid 10-digit phone number.', {
//         position: "top-right",
//         autoClose: 3000,
//         theme: "colored",
//       });
//       return;
//     }

//     try {
//       await dispatch(sendOTP({ phone, mode: 'login' })).unwrap();
//       setOtpSent(true);
//       showSuccessToast('Verification code sent successfully!');
//     } catch (err) {
//       console.error('Send OTP error:', err);
//       showErrorToast(err);
//     }
//   };

//   const handleVerifyOTP = async (e) => {
//     e.preventDefault();
    
//     // Basic OTP validation
//     if (!code.match(/^\d{6}$/)) {
//       toast.warn('Please enter a valid 6-digit verification code.', {
//         position: "top-right",
//         autoClose: 3000,
//         theme: "colored",
//       });
//       return;
//     }

//     try {
//       await dispatch(verifyOTP({ phone, code, mode: 'login' })).unwrap();
//       showSuccessToast('Login successful! Redirecting...');
//       setTimeout(() => navigate('/'), 1000);
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//       showErrorToast(err);
//     }
//   };

//   const handleResendOTP = async () => {
//     if (loading) return;

//     const toastId = toast.loading('Sending new verification code...', {
//       position: "top-right",
//     });

//     try {
//       await dispatch(sendOTP({ phone, mode: 'login' })).unwrap();
//       toast.update(toastId, {
//         render: "New verification code sent!",
//         type: "success",
//         isLoading: false,
//         autoClose: 3000,
//         theme: "colored",
//       });
//     } catch (err) {
//       console.error('Resend OTP error:', err);
//       toast.update(toastId, {
//         render: ERROR_MESSAGES[err.code] || err.message || "Failed to send new code",
//         type: "error",
//         isLoading: false,
//         autoClose: 4000,
//         theme: "colored",
//       });
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
//         <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
//           {otpSent ? 'Verify OTP' : 'Login'}
//         </h2>

//         {!otpSent ? (
//           <form onSubmit={handleSendOTP} className="space-y-4">
//             <div>
//               <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
//                 Phone Number
//               </label>
//               <div className="relative">
//                 <input
//                   id="phone"
//                   type="tel"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
//                   placeholder="Enter your phone number"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
//                   required
//                 />
//                 {phone && phone.length === 10 && (
//                   <span className="absolute right-3 top-2.5 text-green-500">
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//                     </svg>
//                   </span>
//                 )}
//               </div>
//             </div>
//             <button
//               type="submit"
//               disabled={loading}
//               className={`w-full py-2 px-4 rounded-md text-white font-medium transition duration-200 ${
//                 loading 
//                   ? 'bg-gray-400 cursor-not-allowed' 
//                   : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
//               }`}
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center">
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Sending...
//                 </span>
//               ) : 'Send Verification Code'}
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleVerifyOTP} className="space-y-4">
//             <div>
//               <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
//                 Verification Code
//               </label>
//               <input
//                 id="otp"
//                 type="text"
//                 value={code}
//                 onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                 placeholder="Enter 6-digit code"
//                 className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
//                 required
//               />
//             </div>
//             <button
//               type="submit"
//               disabled={loading}
//               className={`w-full py-2 px-4 rounded-md text-white font-medium transition duration-200 ${
//                 loading 
//                   ? 'bg-gray-400 cursor-not-allowed' 
//                   : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
//               }`}
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center">
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Verifying...
//                 </span>
//               ) : 'Verify & Login'}
//             </button>
//             <button
//               type="button"
//               onClick={handleResendOTP}
//               disabled={loading}
//               className="w-full text-sm text-blue-600 hover:text-blue-800 focus:outline-none disabled:text-gray-400 disabled:cursor-not-allowed"
//             >
//               Resend verification code
//             </button>
//           </form>
//         )}

//         <p className="mt-6 text-center text-gray-600">
//           Don't have an account?{' '}
//           <Link 
//             to="/register" 
//             className="text-blue-600 hover:text-blue-800 font-medium"
//           >
//             Register here
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Login;

// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { sendOTP, verifyOTP } from '../features/authSlice';
// import { useNavigate, Link } from 'react-router-dom';

// const Login = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading } = useSelector((state) => state.auth);
//   const [phone, setPhone] = useState('');
//   const [code, setCode] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [localError, setLocalError] = useState(null);

//   const formatErrorMessage = (err) => {
//     if (!err) return null;
//     if (err.response && err.response.data) {
//       const data = err.response.data;
//       if (data.error && data.error.message) {
//         return data.error.message;
//       }
//       if (data.message) {
//         return data.message;
//       }
//     }
//     if (err.message) return err.message;
//     return 'An unexpected error occurred. Please try again.';
//   };

//   const handleSendOTP = async (e) => {
//     e.preventDefault();
//     setLocalError(null); // Clear previous errors
//     try {
//       await dispatch(sendOTP({ phone, mode: 'login' })).unwrap();
//       setOtpSent(true);
//     } catch (err) {
//       console.error('Send OTP error:', err);
//       setLocalError(formatErrorMessage(err));
//     }
//   };

//   const handleVerifyOTP = async (e) => {
//     e.preventDefault();
//     setLocalError(null);
//     try {
//       await dispatch(verifyOTP({ phone, code, mode: 'login' })).unwrap();
//       navigate('/');
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//       setLocalError(formatErrorMessage(err));
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-6 rounded shadow w-full max-w-sm">
//         <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

//         {localError && (
//           <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
//             <strong>Error:</strong> {localError}
//           </div>
//         )}

//         {!otpSent ? (
//           <form onSubmit={handleSendOTP}>
//             <input
//               type="tel"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               placeholder="Phone Number"
//               className="border p-2 w-full mb-4 rounded focus:ring focus:ring-blue-300"
//               required
//             />
//             <button
//               type="submit"
//               className={`p-2 rounded w-full transition ${
//                 loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600 text-white'
//               }`}
//               disabled={loading}
//             >
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
//               className="border p-2 w-full mb-4 rounded focus:ring focus:ring-green-300"
//               required
//             />
//             <button
//               type="submit"
//               className={`p-2 rounded w-full transition ${
//                 loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600 text-white'
//               }`}
//               disabled={loading}
//             >
//               {loading ? 'Verifying...' : 'Verify OTP'}
//             </button>
//           </form>
//         )}

//         <p className="mt-4 text-center">
//           Don't have an account?{' '}
//           <Link to="/register" className="text-blue-500 hover:underline">
//             Register
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Login;



// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { sendOTP, verifyOTP } from '../features/authSlice';
// import { useNavigate, Link } from 'react-router-dom';

// const Login = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading } = useSelector((state) => state.auth);
//   const [phone, setPhone] = useState('');
//   const [code, setCode] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [localError, setLocalError] = useState(null);

//   // Helper function to extract and format error messages
//   const formatErrorMessage = (err) => {
//     if (!err) return null;
//     // If the error comes with a response from the backend, use its message
//     if (err.response && err.response.data && err.response.data.message) {
//       return err.response.data.message;
//     }
//     // Otherwise, fall back to the error's own message
//     if (err.message) return err.message;
//     return 'An unexpected error occurred. Please try again.';
//   };

//   const handleSendOTP = async (e) => {
//     e.preventDefault();
//     setLocalError(null); // Clear any previous errors
//     try {
//       await dispatch(sendOTP({ phone, mode: 'login' })).unwrap();
//       setOtpSent(true);
//     } catch (err) {
//       console.error('Send OTP error:', err);
//       setLocalError(formatErrorMessage(err));
//     }
//   };

//   const handleVerifyOTP = async (e) => {
//     e.preventDefault();
//     setLocalError(null); // Clear any previous errors
//     try {
//       await dispatch(verifyOTP({ phone, code, mode: 'login' })).unwrap();
//       navigate('/');
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//       setLocalError(formatErrorMessage(err));
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-6 rounded shadow w-full max-w-sm">
//         <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

//         {localError && (
//           <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
//             <strong>Error:</strong> {localError}
//           </div>
//         )}

//         {!otpSent ? (
//           <form onSubmit={handleSendOTP}>
//             <input
//               type="tel"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//               placeholder="Phone Number"
//               className="border p-2 w-full mb-4 rounded focus:ring focus:ring-blue-300"
//               required
//             />
//             <button
//               type="submit"
//               className={`p-2 rounded w-full transition ${
//                 loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600 text-white'
//               }`}
//               disabled={loading}
//             >
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
//               className="border p-2 w-full mb-4 rounded focus:ring focus:ring-green-300"
//               required
//             />
//             <button
//               type="submit"
//               className={`p-2 rounded w-full transition ${
//                 loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600 text-white'
//               }`}
//               disabled={loading}
//             >
//               {loading ? 'Verifying...' : 'Verify OTP'}
//             </button>
//           </form>
//         )}

//         <p className="mt-4 text-center">
//           Don't have an account?{' '}
//           <Link to="/register" className="text-blue-500 hover:underline">
//             Register
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Login;



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
