// src/components/Register.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendOTP, verifyOTP } from '../features/authSlice'; // Assuming authSlice exports these
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const showErrorToast = (err) => {
    const message = err?.message || 'Something went wrong. Please try again.';
    toast.error(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'colored',
    });
  };

  const showSuccessToast = (msg) => {
    toast.success(msg, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'colored',
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone.match(/^\d{10}$/)) {
      return toast.warn('Please enter a valid 10-digit phone number.', {
        position: 'top-right',
        autoClose: 3000,
        theme: 'colored',
      });
    }
    try {
      await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
      setOtpSent(true);
      showSuccessToast('Verification code sent successfully!');
    } catch (err) {
      console.error('Send OTP error:', err);
      // UPDATED: Only show toast for generic errors (without details array)
      if (!err?.details || !Array.isArray(err.details) || err.details.length === 0) {
         showErrorToast(err);
      }
      // Inline errors will be shown via renderErrors() using the error state from Redux
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!code.match(/^\d{6}$/)) {
      return toast.warn('Please enter a valid 6-digit verification code.', {
        position: 'top-right',
        autoClose: 3000,
        theme: 'colored',
      });
    }
    try {
      await dispatch(verifyOTP({ phone, code, mode: 'register' })).unwrap();
      showSuccessToast('Registration successful! Redirecting...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error('Verify OTP error:', err);
      // UPDATED: Only show toast for generic errors (without details array)
      if (!err?.details || !Array.isArray(err.details) || err.details.length === 0) {
         showErrorToast(err);
      }
      // Inline errors will be shown via renderErrors() using the error state from Redux
    }
  };

  const handleResendOTP = async () => {
    if (loading) return;
    const toastId = toast.loading('Sending new verification code...', {
      position: 'top-right',
    });
    try {
      await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
      toast.update(toastId, {
        render: 'New verification code sent!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        theme: 'colored',
      });
    } catch (err) {
      console.error('Resend OTP error:', err);
      toast.update(toastId, {
        render: err?.message || 'Failed to send new code',
        type: 'error',
        isLoading: false,
        autoClose: 4000,
        theme: 'colored',
      });
      // Note: The error state will still be set by the rejected thunk,
      // potentially showing inline errors too. This might be acceptable for resend.
    }
  };

  const renderErrors = () => {
    if (!error) return null;
    // Handles detailed validation errors from the API
    if (Array.isArray(error.details) && error.details.length > 0) {
      return (
        <ul className="mb-4 text-sm text-red-400">
          {error.details.map((e, idx) => (
            <li key={idx}>{e.msg || e.message}</li>
          ))}
        </ul>
      );
    }
    // Handles generic errors (if not shown as toast, or if you want both)
    // If you strictly want *only* toasts for generic errors, you could remove this part.
    // However, keeping it provides a fallback if toasts are missed.
    if (!Array.isArray(error.details) || error.details.length === 0) {
       return <div className="mb-4 text-sm text-red-400">{error.message}</div>;
    }
    return null; // Should not happen if error exists, but good practice
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-900 text-white p-8 rounded-xl shadow-lg border border-gray-800 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center">
          {otpSent ? 'Verify OTP' : 'Register'}
        </h2>

        {/* inline errors */}
        {renderErrors()}

        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
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
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00ff88] text-white"
                  required
                />
                {phone.length === 10 && (
                  <span className="absolute right-3 top-2.5 text-[#00ff88]">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-medium transition ${
                loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#00ff88] hover:bg-green-600'
              }`}
            >
              {loading ? 'Sending…' : 'SEND VERIFICATION CODE'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
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
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00ff88] text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-medium uppercase transition ${
                loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#00ff88] hover:bg-green-600'
              }`}
            >
              {loading ? 'Verifying…' : 'VERIFY & REGISTER'}
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full text-sm text-[#00ff88] hover:text-green-400 disabled:text-gray-500"
            >
              Resend verification code
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#00ff88] hover:text-green-400 font-medium"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

// // src/components/Register.js
// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { sendOTP, verifyOTP } from '../features/authSlice'; // Assuming authSlice exports these
// import { useNavigate, Link } from 'react-router-dom';
// import { toast } from 'react-toastify';

// const Register = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   // grab both loading + error from Redux state
//   const { loading, error } = useSelector((state) => state.auth);

//   const [phone, setPhone] = useState('');
//   const [code, setCode] = useState('');
//   const [otpSent, setOtpSent] = useState(false);

//   // REMOVED the local ERROR_MESSAGES constant

//   // Updated showErrorToast to use the message from the error object directly
//   const showErrorToast = (err) => {
//     const message = err?.message || 'Something went wrong. Please try again.';
//     toast.error(message, {
//       position: 'top-right',
//       autoClose: 4000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       theme: 'colored',
//     });
//   };

//   const showSuccessToast = (msg) => {
//     toast.success(msg, {
//       position: 'top-right',
//       autoClose: 3000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       theme: 'colored',
//     });
//   };

//   const handleSendOTP = async (e) => {
//     e.preventDefault();
//     if (!phone.match(/^\d{10}$/)) {
//       // Keep local validation messages if needed
//       return toast.warn('Please enter a valid 10-digit phone number.', {
//         position: 'top-right',
//         autoClose: 3000,
//         theme: 'colored',
//       });
//     }
//     try {
//       // The error caught here will be processed by authSlice's extractError
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
//       setOtpSent(true);
//       showSuccessToast('Verification code sent successfully!');
//     } catch (err) {
//       // err object here is the one returned by rejectWithValue in authSlice
//       console.error('Send OTP error:', err);
//       showErrorToast(err); // Pass the processed error object
//     }
//   };

//   const handleVerifyOTP = async (e) => {
//     e.preventDefault();
//     if (!code.match(/^\d{6}$/)) {
//       // Keep local validation messages if needed
//       return toast.warn('Please enter a valid 6-digit verification code.', {
//         position: 'top-right',
//         autoClose: 3000,
//         theme: 'colored',
//       });
//     }
//     try {
//       // The error caught here will be processed by authSlice's extractError
//       await dispatch(verifyOTP({ phone, code, mode: 'register' })).unwrap();
//       showSuccessToast('Registration successful! Redirecting...');
//       setTimeout(() => navigate('/'), 1000);
//     } catch (err) {
//       // err object here is the one returned by rejectWithValue in authSlice
//       console.error('Verify OTP error:', err);
//       showErrorToast(err); // Pass the processed error object
//     }
//   };

//   const handleResendOTP = async () => {
//     if (loading) return;
//     const toastId = toast.loading('Sending new verification code...', {
//       position: 'top-right',
//     });
//     try {
//       // The error caught here will be processed by authSlice's extractError
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
//       toast.update(toastId, {
//         render: 'New verification code sent!',
//         type: 'success',
//         isLoading: false,
//         autoClose: 3000,
//         theme: 'colored',
//       });
//     } catch (err) {
//       // err object here is the one returned by rejectWithValue in authSlice
//       console.error('Resend OTP error:', err);
//       // Updated toast.update to use the message from the processed error object
//       toast.update(toastId, {
//         render: err?.message || 'Failed to send new code',
//         type: 'error',
//         isLoading: false,
//         autoClose: 4000,
//         theme: 'colored',
//       });
//     }
//   };

//   // Inline error renderer (this part remains the same)
//   const renderErrors = () => {
//     if (!error) return null;
//     if (Array.isArray(error.details)) {
//       return (
//         <ul className="mb-4 text-sm text-red-400">
//           {error.details.map((e, idx) => (
//             <li key={idx}>{e.msg || e.message}</li>
//           ))}
//         </ul>
//       );
//     }
//     return <div className="mb-4 text-sm text-red-400">{error.message}</div>;
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
//       <div className="bg-gray-900 text-white p-8 rounded-xl shadow-lg border border-gray-800 w-full max-w-md">
//         <h2 className="text-3xl font-bold mb-6 text-center">
//           {otpSent ? 'Verify OTP' : 'Register'}
//         </h2>

//         {/* inline errors */}
//         {renderErrors()}

//         {!otpSent ? (
//           <form onSubmit={handleSendOTP} className="space-y-4">
//             <div>
//               <label
//                 htmlFor="phone"
//                 className="block text-sm font-medium text-gray-300 mb-1"
//               >
//                 Phone Number
//               </label>
//               <div className="relative">
//                 <input
//                   id="phone"
//                   type="tel"
//                   value={phone}
//                   onChange={(e) =>
//                     setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
//                   }
//                   placeholder="Enter your phone number"
//                   className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00ff88] text-white"
//                   required
//                 />
//                 {phone.length === 10 && (
//                   <span className="absolute right-3 top-2.5 text-[#00ff88]">
//                     <svg
//                       className="w-5 h-5"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M5 13l4 4L19 7"
//                       />
//                     </svg>
//                   </span>
//                 )}
//               </div>
//             </div>
//             <button
//               type="submit"
//               disabled={loading}
//               className={`w-full py-3 rounded-lg text-white font-medium transition ${
//                 loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#00ff88] hover:bg-green-600'
//               }`}
//             >
//               {loading ? 'Sending…' : 'SEND VERIFICATION CODE'}
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleVerifyOTP} className="space-y-4">
//             <div>
//               <label
//                 htmlFor="otp"
//                 className="block text-sm font-medium text-gray-300 mb-1"
//               >
//                 Verification Code
//               </label>
//               <input
//                 id="otp"
//                 type="text"
//                 value={code}
//                 onChange={(e) =>
//                   setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
//                 }
//                 placeholder="Enter 6-digit code"
//                 className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00ff88] text-white"
//                 required
//               />
//             </div>
//             <button
//               type="submit"
//               disabled={loading}
//               className={`w-full py-3 rounded-lg text-white font-medium uppercase transition ${
//                 loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#00ff88] hover:bg-green-600'
//               }`}
//             >
//               {loading ? 'Verifying…' : 'VERIFY & REGISTER'}
//             </button>
//             <button
//               type="button"
//               onClick={handleResendOTP}
//               disabled={loading}
//               className="w-full text-sm text-[#00ff88] hover:text-green-400 disabled:text-gray-500"
//             >
//               Resend verification code
//             </button>
//           </form>
//         )}

//         <p className="mt-6 text-center text-gray-400">
//           Already have an account?{' '}
//           <Link
//             to="/login"
//             className="text-[#00ff88] hover:text-green-400 font-medium"
//           >
//             Login here
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;




// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { sendOTP, verifyOTP } from '../features/authSlice';
// import { useNavigate, Link } from 'react-router-dom';
// import { toast } from 'react-toastify';

// const Register = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   // grab both loading + error from Redux
//   const { loading, error } = useSelector((state) => state.auth);

//   const [phone, setPhone] = useState('');
//   const [code, setCode] = useState('');
//   const [otpSent, setOtpSent] = useState(false);

//   const ERROR_MESSAGES = {
//     INVALID_PHONE: 'Please enter a valid phone number.',
//     USER_EXISTS: 'An account with this phone number already exists.',
//     OTP_INVALID: 'Invalid verification code. Please try again.',
//     OTP_EXPIRED: 'Verification code has expired. Please request a new one.',
//     RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
//     NETWORK_ERROR: 'Connection error. Please check your internet connection.',
//   };

//   const showErrorToast = (err) => {
//     const message =
//       ERROR_MESSAGES[err.code] ||
//       err.message ||
//       'Something went wrong. Please try again.';
//     toast.error(message, {
//       position: 'top-right',
//       autoClose: 4000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       theme: 'colored',
//     });
//   };

//   const showSuccessToast = (msg) => {
//     toast.success(msg, {
//       position: 'top-right',
//       autoClose: 3000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       theme: 'colored',
//     });
//   };

//   const handleSendOTP = async (e) => {
//     e.preventDefault();
//     if (!phone.match(/^\d{10}$/)) {
//       return toast.warn('Please enter a valid 10-digit phone number.', {
//         position: 'top-right',
//         autoClose: 3000,
//         theme: 'colored',
//       });
//     }
//     try {
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
//       setOtpSent(true);
//       showSuccessToast('Verification code sent successfully!');
//     } catch (err) {
//       console.error('Send OTP error:', err);
//       showErrorToast(err);
//     }
//   };

//   const handleVerifyOTP = async (e) => {
//     e.preventDefault();
//     if (!code.match(/^\d{6}$/)) {
//       return toast.warn('Please enter a valid 6-digit verification code.', {
//         position: 'top-right',
//         autoClose: 3000,
//         theme: 'colored',
//       });
//     }
//     try {
//       await dispatch(verifyOTP({ phone, code, mode: 'register' })).unwrap();
//       showSuccessToast('Registration successful! Redirecting...');
//       setTimeout(() => navigate('/'), 1000);
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//       showErrorToast(err);
//     }
//   };

//   const handleResendOTP = async () => {
//     if (loading) return;
//     const toastId = toast.loading('Sending new verification code...', {
//       position: 'top-right',
//     });
//     try {
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
//       toast.update(toastId, {
//         render: 'New verification code sent!',
//         type: 'success',
//         isLoading: false,
//         autoClose: 3000,
//         theme: 'colored',
//       });
//     } catch (err) {
//       console.error('Resend OTP error:', err);
//       toast.update(toastId, {
//         render: ERROR_MESSAGES[err.code] || err.message || 'Failed to send new code',
//         type: 'error',
//         isLoading: false,
//         autoClose: 4000,
//         theme: 'colored',
//       });
//     }
//   };

//   // Inline error renderer
//   const renderErrors = () => {
//     if (!error) return null;
//     if (Array.isArray(error.details)) {
//       return (
//         <ul className="mb-4 text-sm text-red-400">
//           {error.details.map((e, idx) => (
//             <li key={idx}>{e.msg || e.message}</li>
//           ))}
//         </ul>
//       );
//     }
//     return <div className="mb-4 text-sm text-red-400">{error.message}</div>;
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
//       <div className="bg-gray-900 text-white p-8 rounded-xl shadow-lg border border-gray-800 w-full max-w-md">
//         <h2 className="text-3xl font-bold mb-6 text-center">
//           {otpSent ? 'Verify OTP' : 'Register'}
//         </h2>

//         {/* inline errors */}
//         {renderErrors()}

//         {!otpSent ? (
//           <form onSubmit={handleSendOTP} className="space-y-4">
//             <div>
//               <label
//                 htmlFor="phone"
//                 className="block text-sm font-medium text-gray-300 mb-1"
//               >
//                 Phone Number
//               </label>
//               <div className="relative">
//                 <input
//                   id="phone"
//                   type="tel"
//                   value={phone}
//                   onChange={(e) =>
//                     setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
//                   }
//                   placeholder="Enter your phone number"
//                   className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00ff88] text-white"
//                   required
//                 />
//                 {phone.length === 10 && (
//                   <span className="absolute right-3 top-2.5 text-[#00ff88]">
//                     <svg
//                       className="w-5 h-5"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M5 13l4 4L19 7"
//                       />
//                     </svg>
//                   </span>
//                 )}
//               </div>
//             </div>
//             <button
//               type="submit"
//               disabled={loading}
//               className={`w-full py-3 rounded-lg text-white font-medium transition ${
//                 loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#00ff88] hover:bg-green-600'
//               }`}
//             >
//               {loading ? 'Sending…' : 'SEND VERIFICATION CODE'}
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleVerifyOTP} className="space-y-4">
//             <div>
//               <label
//                 htmlFor="otp"
//                 className="block text-sm font-medium text-gray-300 mb-1"
//               >
//                 Verification Code
//               </label>
//               <input
//                 id="otp"
//                 type="text"
//                 value={code}
//                 onChange={(e) =>
//                   setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
//                 }
//                 placeholder="Enter 6-digit code"
//                 className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00ff88] text-white"
//                 required
//               />
//             </div>
//             <button
//               type="submit"
//               disabled={loading}
//               className={`w-full py-3 rounded-lg text-white font-medium uppercase transition ${
//                 loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#00ff88] hover:bg-green-600'
//               }`}
//             >
//               {loading ? 'Verifying…' : 'VERIFY & REGISTER'}
//             </button>
//             <button
//               type="button"
//               onClick={handleResendOTP}
//               disabled={loading}
//               className="w-full text-sm text-[#00ff88] hover:text-green-400 disabled:text-gray-500"
//             >
//               Resend verification code
//             </button>
//           </form>
//         )}

//         <p className="mt-6 text-center text-gray-400">
//           Already have an account?{' '}
//           <Link
//             to="/login"
//             className="text-[#00ff88] hover:text-green-400 font-medium"
//           >
//             Login here
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;



// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { sendOTP, verifyOTP } from '../features/authSlice';
// import { useNavigate, Link } from 'react-router-dom';
// import { toast } from 'react-toastify';

// const Register = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading } = useSelector((state) => state.auth);
//   const [phone, setPhone] = useState('');
//   const [code, setCode] = useState('');
//   const [otpSent, setOtpSent] = useState(false);

//   // Error message mapping for user-friendly messages
//   const ERROR_MESSAGES = {
//     INVALID_PHONE: 'Please enter a valid phone number.',
//     USER_EXISTS: 'An account with this phone number already exists.',
//     OTP_INVALID: 'Invalid verification code. Please try again.',
//     OTP_EXPIRED: 'Verification code has expired. Please request a new one.',
//     RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
//     NETWORK_ERROR: 'Connection error. Please check your internet connection.',
//   };

//   const showErrorToast = (error) => {
//     const message =
//       ERROR_MESSAGES[error.code] ||
//       error.message ||
//       'Something went wrong. Please try again.';
//     toast.error(message, {
//       position: 'top-right',
//       autoClose: 4000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       theme: 'colored',
//     });
//   };

//   const showSuccessToast = (message) => {
//     toast.success(message, {
//       position: 'top-right',
//       autoClose: 3000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       theme: 'colored',
//     });
//   };

//   const handleSendOTP = async (e) => {
//     e.preventDefault();

//     // Basic phone validation
//     if (!phone.match(/^\d{10}$/)) {
//       toast.warn('Please enter a valid 10-digit phone number.', {
//         position: 'top-right',
//         autoClose: 3000,
//         theme: 'colored',
//       });
//       return;
//     }

//     try {
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
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
//         position: 'top-right',
//         autoClose: 3000,
//         theme: 'colored',
//       });
//       return;
//     }

//     try {
//       await dispatch(verifyOTP({ phone, code, mode: 'register' })).unwrap();
//       showSuccessToast('Registration successful! Redirecting...');
//       setTimeout(() => navigate('/'), 1000);
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//       showErrorToast(err);
//     }
//   };

//   const handleResendOTP = async () => {
//     if (loading) return;

//     const toastId = toast.loading('Sending new verification code...', {
//       position: 'top-right',
//     });

//     try {
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
//       toast.update(toastId, {
//         render: 'New verification code sent!',
//         type: 'success',
//         isLoading: false,
//         autoClose: 3000,
//         theme: 'colored',
//       });
//     } catch (err) {
//       console.error('Resend OTP error:', err);
//       toast.update(toastId, {
//         render:
//           ERROR_MESSAGES[err.code] ||
//           err.message ||
//           'Failed to send new code',
//         type: 'error',
//         isLoading: false,
//         autoClose: 4000,
//         theme: 'colored',
//       });
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
//       <div className="bg-gray-900 text-white p-8 rounded-xl shadow-lg border border-gray-800 w-full max-w-md">
//         <h2 className="text-3xl font-bold mb-6 text-center text-white">
//           {otpSent ? 'Verify OTP' : 'Register'}
//         </h2>

//         {!otpSent ? (
//           <form onSubmit={handleSendOTP} className="space-y-4">
//             <div>
//               <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
//                 Phone Number
//               </label>
//               <div className="relative">
//                 <input
//                   id="phone"
//                   type="tel"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
//                   placeholder="Enter your phone number"
//                   className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00ff88] focus:border-transparent text-white transition"
//                   required
//                 />
//                 {phone && phone.length === 10 && (
//                   <span className="absolute right-3 top-2.5 text-[#00ff88]">
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M5 13l4 4L19 7"
//                       />
//                     </svg>
//                   </span>
//                 )}
//               </div>
//             </div>
//             <button
//               type="submit"
//               disabled={loading}
//               className={`w-full py-3 px-4 rounded-lg text-white font-medium uppercase shadow-md transition duration-200 ${
//                 loading
//                   ? 'bg-gray-600 cursor-not-allowed'
//                   : 'bg-[#00ff88] hover:bg-green-600 shadow-[-3px_4px_9px_#00ff88af]'
//               }`}
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center">
//                   <svg
//                     className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                   Sending...
//                 </span>
//               ) : (
//                 'SEND VERIFICATION CODE'
//               )}
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleVerifyOTP} className="space-y-4">
//             <div>
//               <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-1">
//                 Verification Code
//               </label>
//               <input
//                 id="otp"
//                 type="text"
//                 value={code}
//                 onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                 placeholder="Enter 6-digit code"
//                 className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00ff88] focus:border-transparent text-white transition"
//                 required
//               />
//             </div>
//             <button
//               type="submit"
//               disabled={loading}
//               className={`w-full py-3 px-4 rounded-lg text-white font-medium uppercase shadow-md transition duration-200 ${
//                 loading
//                   ? 'bg-gray-600 cursor-not-allowed'
//                   : 'bg-[#00ff88] hover:bg-green-600 shadow-[-3px_4px_9px_#00ff88af]'
//               }`}
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center">
//                   <svg
//                     className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                   Verifying...
//                 </span>
//               ) : (
//                 'VERIFY & REGISTER'
//               )}
//             </button>
//             <button
//               type="button"
//               onClick={handleResendOTP}
//               disabled={loading}
//               className="w-full text-sm text-[#00ff88] hover:text-green-400 focus:outline-none disabled:text-gray-500 disabled:cursor-not-allowed"
//             >
//               Resend verification code
//             </button>
//           </form>
//         )}

//         <p className="mt-6 text-center text-gray-400">
//           Already have an account?{' '}
//           <Link to="/login" className="text-[#00ff88] hover:text-green-400 font-medium">
//             Login here
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;



/******************************************************************************************************************* */


// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { sendOTP, verifyOTP } from '../features/authSlice';
// import { useNavigate, Link } from 'react-router-dom';
// import { toast } from 'react-toastify';

// const Register = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading } = useSelector((state) => state.auth);
//   const [phone, setPhone] = useState('');
//   const [code, setCode] = useState('');
//   const [otpSent, setOtpSent] = useState(false);

//   // Error message mapping for user-friendly messages
//   const ERROR_MESSAGES = {
//     INVALID_PHONE: 'Please enter a valid phone number.',
//     USER_EXISTS: 'An account with this phone number already exists.',
//     OTP_INVALID: 'Invalid verification code. Please try again.',
//     OTP_EXPIRED: 'Verification code has expired. Please request a new one.',
//     RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
//     NETWORK_ERROR: 'Connection error. Please check your internet connection.',
//   };

//   const showErrorToast = (error) => {
//     const message =
//       ERROR_MESSAGES[error.code] ||
//       error.message ||
//       'Something went wrong. Please try again.';
//     toast.error(message, {
//       position: 'top-right',
//       autoClose: 4000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       theme: 'colored',
//     });
//   };

//   const showSuccessToast = (message) => {
//     toast.success(message, {
//       position: 'top-right',
//       autoClose: 3000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//       theme: 'colored',
//     });
//   };

//   const handleSendOTP = async (e) => {
//     e.preventDefault();

//     // Basic phone validation
//     if (!phone.match(/^\d{10}$/)) {
//       toast.warn('Please enter a valid 10-digit phone number.', {
//         position: 'top-right',
//         autoClose: 3000,
//         theme: 'colored',
//       });
//       return;
//     }

//     try {
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
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
//         position: 'top-right',
//         autoClose: 3000,
//         theme: 'colored',
//       });
//       return;
//     }

//     try {
//       await dispatch(verifyOTP({ phone, code, mode: 'register' })).unwrap();
//       showSuccessToast('Registration successful! Redirecting...');
//       setTimeout(() => navigate('/'), 1000);
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//       showErrorToast(err);
//     }
//   };

//   const handleResendOTP = async () => {
//     if (loading) return;

//     const toastId = toast.loading('Sending new verification code...', {
//       position: 'top-right',
//     });

//     try {
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
//       toast.update(toastId, {
//         render: 'New verification code sent!',
//         type: 'success',
//         isLoading: false,
//         autoClose: 3000,
//         theme: 'colored',
//       });
//     } catch (err) {
//       console.error('Resend OTP error:', err);
//       toast.update(toastId, {
//         render:
//           ERROR_MESSAGES[err.code] ||
//           err.message ||
//           'Failed to send new code',
//         type: 'error',
//         isLoading: false,
//         autoClose: 4000,
//         theme: 'colored',
//       });
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
//         <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
//           {otpSent ? 'Verify OTP' : 'Register'}
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
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M5 13l4 4L19 7"
//                       />
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
//                   <svg
//                     className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                   Sending...
//                 </span>
//               ) : (
//                 'Send Verification Code'
//               )}
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
//                   <svg
//                     className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                   Verifying...
//                 </span>
//               ) : (
//                 'Verify & Register'
//               )}
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
//           Already have an account?{' '}
//           <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
//             Login here
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;

/**************************************************************************************************************************************************/
// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { sendOTP, verifyOTP } from '../features/authSlice';
// import { useNavigate, Link } from 'react-router-dom';
// import { toast } from 'react-toastify';

// const Register = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading, error } = useSelector((state) => state.auth);
//   const [phone, setPhone] = useState('');
//   const [code, setCode] = useState('');
//   const [otpSent, setOtpSent] = useState(false);

//   // Error message mapping for user-friendly messages
//   const ERROR_MESSAGES = {
//     INVALID_PHONE: 'Please enter a valid phone number.',
//     USER_EXISTS: 'An account with this phone number already exists.',
//     OTP_INVALID: 'Invalid verification code. Please try again.',
//     OTP_EXPIRED: 'Verification code has expired. Please request a new one.',
//     RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
//     NETWORK_ERROR: 'Connection error. Please check your internet connection.',
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
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
//       setOtpSent(true);
//       toast.success('Verification code sent successfully!', {
//         position: "top-right",
//         autoClose: 3000,
//         theme: "colored",
//       });
//     } catch (err) {
//       console.error('Send OTP error:', err);
//       toast.error(ERROR_MESSAGES[err.code] || err.message || 'Failed to send verification code', {
//         position: "top-right",
//         autoClose: 4000,
//         theme: "colored",
//       });
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
//       await dispatch(verifyOTP({ phone, code, mode: 'register' })).unwrap();
//       toast.success('Registration successful! Redirecting...', {
//         position: "top-right",
//         autoClose: 2000,
//         theme: "colored",
//       });
//       setTimeout(() => navigate('/'), 1000);
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//       toast.error(ERROR_MESSAGES[err.code] || err.message || 'Verification failed', {
//         position: "top-right",
//         autoClose: 4000,
//         theme: "colored",
//       });
//     }
//   };

//   const handleResendOTP = async () => {
//     if (loading) return;

//     const toastId = toast.loading('Sending new verification code...', {
//       position: "top-right",
//     });

//     try {
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
//       toast.update(toastId, {
//         render: "New verification code sent!",
//         type: "success",
//         isLoading: false,
//         autoClose: 3000,
//         theme: "colored",
//       });
//     } catch (err) {
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
//           {otpSent ? 'Verify OTP' : 'Register'}
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
//               ) : 'Verify & Register'}
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
//           Already have an account?{' '}
//           <Link 
//             to="/login" 
//             className="text-blue-600 hover:text-blue-800 font-medium"
//           >
//             Login here
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;

// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { sendOTP, verifyOTP } from '../features/authSlice';
// import { useNavigate, Link } from 'react-router-dom';

// const Register = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading, error } = useSelector((state) => state.auth);
//   const [phone, setPhone] = useState('');
//   const [code, setCode] = useState('');
//   const [otpSent, setOtpSent] = useState(false);

//   const handleSendOTP = async (e) => {
//     e.preventDefault();
//     try {
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
//       setOtpSent(true);
//     } catch (err) {
//       console.error('Send OTP error:', err);
//     }
//   };

//   const handleVerifyOTP = async (e) => {
//     e.preventDefault();
//     try {
//       await dispatch(verifyOTP({ phone, code, mode: 'register' })).unwrap();
//       navigate('/');
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-6 rounded shadow w-full max-w-sm">
//         <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
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
//         {error && (
//           <p className="text-red-500 mt-2 text-center">
//             {error.message || 'An error occurred. Please try again.'}
//           </p>
//         )}
//         <p className="mt-4 text-center">
//           Already have an account?{' '}
//           <Link to="/login" className="text-blue-500">
//             Login
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;


// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { sendOTP, verifyOTP } from '../features/authSlice';
// import { useNavigate, Link } from 'react-router-dom';

// const Register = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading, error } = useSelector((state) => state.auth);
//   const [phone, setPhone] = useState('');
//   const [code, setCode] = useState('');
//   const [otpSent, setOtpSent] = useState(false);

//   const handleSendOTP = async (e) => {
//     e.preventDefault();
//     try {
//       await dispatch(sendOTP({ phone, mode: 'register' })).unwrap();
//       setOtpSent(true);
//     } catch (err) {
//       console.error('Send OTP error:', err);
//     }
//   };

//   const handleVerifyOTP = async (e) => {
//     e.preventDefault();
//     try {
//       await dispatch(verifyOTP({ phone, code, mode: 'register' })).unwrap();
//       navigate('/');
//     } catch (err) {
//       console.error('Verify OTP error:', err);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-6 rounded shadow w-full max-w-sm">
//         <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
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
//           Already have an account?{' '}
//           <Link to="/login" className="text-blue-500">
//             Login
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;
