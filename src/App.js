// src/App.js
import React, { useState, useEffect, Suspense, lazy } from "react"; // Import Suspense and lazy
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";

// Hooks
import useBalanceRealtime from "./hooks/useBalanceRealtime";

// Redux Actions/Thunks
import { fetchJackpotPool } from "./features/roundSlice";

// Components (Core Layout & Eagerly Loaded)
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import ToastContainerWrapper from "./components/ToastContainerWrapper";
import LoadingSpinner from "./components/LoadingSpinner"; // Assuming you have a loading component

// Lazy-loaded Route Components
const GameRoom = lazy(() => import("./components/GameRoom"));
const Profile = lazy(() => import("./components/Profile"));
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));

// Lazy-loaded Modal Components (Optional, but can be good if they are large)
const DepositModal = lazy(() => import("./components/DepositModal"));
const WithdrawModal = lazy(() => import("./components/WithdrawModal"));

// Optional: Import custom toast styles if moved to a separate file
// import './ToastStyles.css';

function App() {
  const dispatch = useDispatch();
  // Custom hook likely sets up listeners or fetches real-time balance updates
  useBalanceRealtime();

  // State for controlling modal visibility
  const [isDepositOpen, setDepositOpen] = useState(false);
  const [isWithdrawOpen, setWithdrawOpen] = useState(false);

  // Fetch initial application data on component mount
  useEffect(() => {
    // Fetch the current jackpot amount. Error handling should be managed within the thunk/slice.
    dispatch(fetchJackpotPool());

    // Consider fetching other essential initial data here if needed.
    // Example: dispatch(fetchUserProfile());
  }, [dispatch]); // dispatch is stable, effect runs once on mount

  const openDepositModal = () => setDepositOpen(true);
  const closeDepositModal = () => setDepositOpen(false);
  const openWithdrawModal = () => setWithdrawOpen(true);
  const closeWithdrawModal = () => setWithdrawOpen(false);

  return (
    <Router>
      {/* Global Toast Container */}
      <ToastContainerWrapper />

      <div className="min-h-screen bg-[#091622] text-gray-100"> {/* Added default text color */}
        <Header
          onDepositOpen={openDepositModal}
          onWithdrawOpen={openWithdrawModal}
        />

        <main className="container md:max-w-full mx-auto p-1 mt-10 md:mt-0 md:p-6">
          {/* Suspense handles the loading state for lazy-loaded components */}
          <Suspense fallback={<LoadingSpinner />}> {/* Replace LoadingSpinner with your actual loading indicator */}
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<GameRoom />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              {/* Add other routes as needed */}
            </Routes>
          </Suspense>
        </main>

        {/* Conditionally render modals using Suspense */}
        <Suspense fallback={null}> {/* Modals likely don't need a heavy spinner */}
          {isDepositOpen && <DepositModal onClose={closeDepositModal} />}
          {isWithdrawOpen && <WithdrawModal onClose={closeWithdrawModal} />}
        </Suspense>
      </div>
    </Router>
  );
}

export default App;




// import React, { useState } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import useBalanceRealtime from "./hooks/useBalanceRealtime";

// // Import components
// import Header from "./components/Header";
// import GameRoom from "./components/GameRoom";
// import Profile from "./components/Profile";
// import Login from "./components/Login";
// import Register from "./components/Register";
// import ProtectedRoute from "./components/ProtectedRoute";
// import DepositModal from "./components/DepositModal";
// import WithdrawModal from "./components/WithdrawModal";
// import ToastContainerWrapper from "./components/ToastContainerWrapper"; // Import the wrapper

// // Optional: Import custom toast styles if moved to a separate file
// // import './ToastStyles.css';

// function App() {
//   useBalanceRealtime();
//   const [isDepositOpen, setDepositOpen] = useState(false);
//   const [isWithdrawOpen, setWithdrawOpen] = useState(false);

//   return (
//     <Router>
//       {/* Render ToastContainerWrapper once here */}
//       <ToastContainerWrapper />
//       <div className="min-h-screen bg-[#091622]">
//         <Header
//           onDepositOpen={() => setDepositOpen(true)}
//           onWithdrawOpen={() => setWithdrawOpen(true)}
//         />
//         <main className="container md:max-w-full mx-auto p-1 mt-10 md:mt-0 md:p-6">
//           <Routes>
//             {/* Public GameRoom route */}
//             <Route path="/" element={<GameRoom />} />
//             <Route
//               path="/profile"
//               element={
//                 <ProtectedRoute>
//                   <Profile />
//                 </ProtectedRoute>
//               }
//             />
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
//           </Routes>
//         </main>
//         {isDepositOpen && (
//           <DepositModal onClose={() => setDepositOpen(false)} />
//         )}
//         {isWithdrawOpen && (
//           <WithdrawModal onClose={() => setWithdrawOpen(false)} />
//         )}
//       </div>
//     </Router>
//   );
// }

// export default App;










// import React, { useState } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import useBalanceRealtime from "./hooks/useBalanceRealtime";

// // Import components
// import Header from "./components/Header";
// import GameRoom from "./components/GameRoom";
// import Profile from "./components/Profile";
// import Login from "./components/Login";
// import Register from "./components/Register";
// import ProtectedRoute from "./components/ProtectedRoute";
// import DepositModal from "./components/DepositModal";
// import WithdrawModal from "./components/WithdrawModal";

// function App() {
//   useBalanceRealtime();
//   const [isDepositOpen, setDepositOpen] = useState(false);
//   const [isWithdrawOpen, setWithdrawOpen] = useState(false);

//   return (
//     <Router>
//       <div className="min-h-screen bg-[#091622]">
//         <Header
//           onDepositOpen={() => setDepositOpen(true)}
//           onWithdrawOpen={() => setWithdrawOpen(true)}
//         />
//         <main className="container md:max-w-full mx-auto p-1 mt-10 md:mt-0 md:p-6">
//           <Routes>
//             {/* Public GameRoom route */}
//             <Route path="/" element={<GameRoom />} />
//             <Route
//               path="/profile"
//               element={
//                 <ProtectedRoute>
//                   <Profile />
//                 </ProtectedRoute>
//               }
//             />
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
//           </Routes>
//         </main>
//         {isDepositOpen && (
//           <DepositModal onClose={() => setDepositOpen(false)} />
//         )}
//         {isWithdrawOpen && (
//           <WithdrawModal onClose={() => setWithdrawOpen(false)} />
//         )}
//       </div>
//     </Router>
//   );
// }

// export default App;
























// import React, { useState } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import useBalanceRealtime from "./hooks/useBalanceRealtime";

// // Import components
// import Header from "./components/Header";
// import GameRoom from "./components/GameRoom";
// import Profile from "./components/Profile";
// import Login from "./components/Login";
// import Register from "./components/Register";
// import ProtectedRoute from "./components/ProtectedRoute";
// import DepositModal from "./components/DepositModal";
// import WithdrawModal from "./components/WithdrawModal";

// function App() {
//   useBalanceRealtime();
//   const [isDepositOpen, setDepositOpen] = useState(false);
//   const [isWithdrawOpen, setWithdrawOpen] = useState(false);

//   return (
//     <Router>
//       <div className="min-h-screen bg-[#091622]">
//         <Header
//           onDepositOpen={() => setDepositOpen(true)}
//           onWithdrawOpen={() => setWithdrawOpen(true)}
//         />
//         <main className="container md:max-w-full mx-auto p-1 mt-10 md:mt-0 md:p-6">
//           <Routes>
//             <Route path="/test" element={<GameRoom />} />
//             <Route
//               path="/"
//               element={
//                 <ProtectedRoute>
//                   <GameRoom />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/profile"
//               element={
//                 <ProtectedRoute>
//                   <Profile />
//                 </ProtectedRoute>
//               }
//             />
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
//           </Routes>
//         </main>
//         {isDepositOpen && (
//           <DepositModal onClose={() => setDepositOpen(false)} />
//         )}
//         {isWithdrawOpen && (
//           <WithdrawModal onClose={() => setWithdrawOpen(false)} />
//         )}
//       </div>
//     </Router>
//   );
// }

// export default App;

// import React, {useEffect, useState } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Link,
//   useNavigate,
// } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { performLogout, logout } from "./features/authSlice";
// import useBalanceRealtime from "./hooks/useBalanceRealtime";
// import axiosInstance from "./app/axiosInstance";
// import { persistor } from "./app/store";

// // Components
// import GameRoom from "./components/GameRoom";
// import Profile from "./components/Profile";
// import Login from "./components/Login";
// import Register from "./components/Register";
// import ProtectedRoute from "./components/ProtectedRoute";
// import DepositModal from "./components/DepositModal";
// import WithdrawModal from "./components/WithdrawModal";

// function Header({ onDepositOpen, onWithdrawOpen }) {
//   const dispatch = useDispatch();
//   const { user, accessToken } = useSelector((state) => state.auth);
//   const navigate = useNavigate();
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [visible, setVisible] = useState(true);
//   const [lastScrollY, setLastScrollY] = useState(0);

//   const handleScroll = () => {
//     const currentScrollY = window.scrollY;
    
//     // If scrolling down and past a threshold (e.g., 100px), hide the header
//     if (currentScrollY > lastScrollY && currentScrollY > 40) {
//       setVisible(false);
//     } 
//     // If scrolling up, show the header
//     else if (currentScrollY < lastScrollY ) {
//       setVisible(true);
//     }
    
//     setLastScrollY(currentScrollY);
//   };

//   useEffect(() => {
//     window.addEventListener('scroll', handleScroll, { passive: true });
    
//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//     };
//   }, [lastScrollY]);

//   const handleLogout = () => {
//     dispatch(performLogout())
//       .unwrap()
//       .then(() => {
//         dispatch(logout());
//         persistor.purge().then(() => {
//           localStorage.removeItem("persist:root");
//           axiosInstance.defaults.headers.common["Authorization"] = "";
//           navigate("/login");
//         });
//       })
//       .catch((err) => console.error("Logout failed:", err));
//   };

//   // Smooth scroll to top function
//   const scrollToTop = (e) => {
//     e.preventDefault();
//     window.scrollTo({
//       top: 0,
//       behavior: 'smooth'
//     });
//     if (window.location.pathname !== '/') {
//       // After scroll animation starts, navigate to home
//       setTimeout(() => {
//         navigate('/');
//       }, 100);
//     }
//   };

//   return (
//     <header 
//       className={`bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white border-b-2 border-green-900 shadow-lg fixed top-0 left-0 right-0 z-50 rounded-b-xl transition-transform duration-300 ${
//         visible ? 'transform translate-y-0' : 'transform -translate-y-full'
//       }`}
//     >
//       {/* Top Bar */}
//       <div className="container mx-auto flex items-center justify-between px-4 py-3">
//         {/* Left: Logo & User Actions */}
//         <div className="flex items-center space-x-4">
//           <a
//             href="/"
//             onClick={scrollToTop}
//             className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 transition-all duration-300 flex items-center">
//             Game Room
//           </a>
//           {accessToken && (
//             <div className="flex items-center space-x-3">
//               <button
//                 onClick={onDepositOpen}
//                 className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-sm font-medium flex items-center shadow-md shadow-green-900/20 hover:shadow-lg hover:shadow-green-900/30"
//                 aria-label="Open deposit modal">
//                 <svg
//                   className="w-4 h-4 mr-1"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                   xmlns="http://www.w3.org/2000/svg">
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="2"
//                     d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
//                 </svg>
//                 Deposit
//               </button>
//               <div className="text-sm bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-purple-500/20 flex items-center shadow-inner shadow-purple-900/10 group hover:border-purple-500/40 transition-all duration-300">
//                 <svg
//                   className="w-4 h-4 mr-1 text-green-400 group-hover:text-green-300 group-hover:rotate-12 transition-all duration-300"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                   xmlns="http://www.w3.org/2000/svg">
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="2"
//                     d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
//                 </svg>
//                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 font-medium">
//                   Ksh{user ? Number(user.balance).toFixed(2) : "0.00"}
//                 </span>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Right: Navigation */}
//         <div className="flex items-center">
//           {/* Desktop Nav */}
//           <nav className="hidden md:flex items-center space-x-4">
//             <a
//               href="/"
//               onClick={scrollToTop}
//               className="relative px-2 py-1 group">
//               <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
//               <span className="group-hover:text-blue-400 transition-colors duration-150">
//                 Games
//               </span>
//             </a>
//             <Link
//               to="/profile"
//               className="relative px-2 py-1 group">
//               <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
//               <span className="group-hover:text-blue-400 transition-colors duration-150">
//                 Profile
//               </span>
//             </Link>
//             {accessToken ? (
//               <>
//                 <button
//                   onClick={onWithdrawOpen}
//                   className="px-3 py-1.5 bg-gray-800/80 backdrop-blur-sm border border-red-500/20 text-red-400 rounded-md hover:bg-gray-700 hover:border-red-500/40 transition-all duration-300 text-sm font-medium flex items-center"
//                   aria-label="Open withdraw modal">
//                   <svg
//                     className="w-4 h-4 mr-1"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
//                   </svg>
//                   Withdraw
//                 </button>
//                 <button
//                   onClick={handleLogout}
//                   className="px-3 py-1.5 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-md hover:bg-gray-700 hover:border-gray-600 transition-all duration-300 text-sm font-medium flex items-center"
//                   aria-label="Logout">
//                   <svg
//                     className="w-4 h-4 mr-1"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
//                   </svg>
//                   Logout
//                 </button>
//                 <div className="text-sm bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-purple-500/20 flex items-center group hover:border-purple-500/40 transition-all duration-300">
//                   <svg
//                     className="w-4 h-4 mr-1 text-purple-400 group-hover:text-purple-300 transition-all duration-300"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
//                   </svg>
//                   <span className="group-hover:text-purple-300 transition-all duration-300">
//                     {user?.username}
//                   </span>
//                 </div>
//               </>
//             ) : (
//               <>
//                 <Link
//                   to="/login"
//                   className="px-3 py-1.5 bg-gray-800/80 backdrop-blur-sm border border-blue-500/20 rounded-md hover:bg-gray-700 hover:border-blue-500/40 transition-all duration-300 text-sm font-medium flex items-center">
//                   <svg
//                     className="w-4 h-4 mr-1"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
//                   </svg>
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-blue-600 rounded-md hover:from-green-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium flex items-center shadow-md shadow-blue-900/20 hover:shadow-lg hover:shadow-blue-900/30">
//                   <svg
//                     className="w-4 h-4 mr-1"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
//                   </svg>
//                   Register
//                 </Link>
//               </>
//             )}
//           </nav>

//           {/* Mobile Hamburger */}
//           <button
//             onClick={() => setMenuOpen(!menuOpen)}
//             className="md:hidden p-2 rounded-md mx-1 hover:bg-gray-800/80 backdrop-blur-sm transition-all duration-150 group"
//             aria-label="Toggle mobile menu"
//             aria-expanded={menuOpen}>
//             <svg
//               className="h-6 w-6 group-hover:text-blue-400 transition-all duration-300"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24">
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
//               />
//             </svg>
//           </button>
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       {menuOpen && (
//         <nav className="md:hidden bg-gray-800/95 backdrop-blur-sm border-t border-purple-500/20 px-4 py-4 animate-fade-in-down shadow-lg">
//           <div className="flex flex-col space-y-3 py-2">
//             <a
//               href="/"
//               onClick={(e) => {
//                 scrollToTop(e);
//                 setMenuOpen(false);
//               }}
//               className="flex items-center text-white hover:text-blue-400 py-2 px-3 hover:bg-gray-700/70 rounded-md transition-all duration-300">
//               <svg
//                 className="w-5 h-5 mr-2 text-green-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//                 xmlns="http://www.w3.org/2000/svg">
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
//               </svg>
//               Games
//             </a>
//             <Link
//               to="/profile"
//               className="flex items-center text-white hover:text-blue-400 py-2 px-3 hover:bg-gray-700/70 rounded-md transition-all duration-300"
//               onClick={() => setMenuOpen(false)}>
//               <svg
//                 className="w-5 h-5 mr-2 text-green-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//                 xmlns="http://www.w3.org/2000/svg">
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
//               </svg>
//               Profile
//             </Link>

//             {accessToken ? (
//               <>
//                 <div className="bg-gray-900/80 backdrop-blur-sm rounded-md p-3 mb-2 flex items-center justify-between border border-purple-500/20">
//                   <div className="flex items-center">
//                     <svg
//                       className="w-5 h-5 mr-2 text-green-400"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg">
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
//                     </svg>
//                     <span className="text-sm">Balance:</span>
//                   </div>
//                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 font-medium">
//                     ${user ? Number(user.balance).toFixed(2) : "0.00"}
//                   </span>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3 mb-2">
//                   <button
//                     onClick={() => {
//                       onDepositOpen();
//                       setMenuOpen(false);
//                     }}
//                     className="flex items-center justify-center px-3 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-sm font-medium shadow-md shadow-green-900/20">
//                     <svg
//                       className="w-4 h-4 mr-2"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg">
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
//                     </svg>
//                     Deposit
//                   </button>

//                   <button
//                     onClick={() => {
//                       onWithdrawOpen();
//                       setMenuOpen(false);
//                     }}
//                     className="flex items-center justify-center px-3 py-3 bg-gray-800/80 backdrop-blur-sm border border-red-500/30 text-red-400 rounded-md hover:bg-gray-700 hover:border-red-500/50 transition-all duration-300 text-sm font-medium">
//                     <svg
//                       className="w-4 h-4 mr-2"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg">
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
//                     </svg>
//                     Withdraw
//                   </button>
//                 </div>

//                 <div className="flex items-center justify-between bg-gray-900/80 backdrop-blur-sm rounded-md p-3 mb-2 border border-purple-500/20">
//                   <div className="flex items-center">
//                     <svg
//                       className="w-5 h-5 mr-2 text-purple-400"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg">
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
//                     </svg>
//                     <span className="text-sm">User:</span>
//                   </div>
//                   <span className="text-purple-300">{user?.username}</span>
//                 </div>

//                 <button
//                   onClick={() => {
//                     handleLogout();
//                     setMenuOpen(false);
//                   }}
//                   className="flex items-center justify-center w-full px-3 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-md hover:bg-gray-700 hover:border-gray-600 transition-all duration-300 text-sm font-medium">
//                   <svg
//                     className="w-4 h-4 mr-2"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
//                   </svg>
//                   Logout
//                 </button>
//               </>
//             ) : (
//               <>
//                 <Link
//                   to="/login"
//                   className="flex items-center justify-center px-3 py-3 bg-gray-800/80 backdrop-blur-sm border border-blue-500/20 rounded-md hover:bg-gray-700 hover:border-blue-500/40 transition-all duration-300 text-sm font-medium"
//                   onClick={() => setMenuOpen(false)}>
//                   <svg
//                     className="w-4 h-4 mr-2"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
//                   </svg>
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="flex items-center justify-center px-3 py-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-md hover:from-green-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-md shadow-blue-900/20"
//                   onClick={() => setMenuOpen(false)}>
//                   <svg
//                     className="w-4 h-4 mr-2"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
//                   </svg>
//                   Register
//                 </Link>
//               </>
//             )}
//           </div>
//         </nav>
//       )}
//     </header>
//   );
// }


// function App() {
//   useBalanceRealtime();
//   const [isDepositOpen, setDepositOpen] = useState(false);
//   const [isWithdrawOpen, setWithdrawOpen] = useState(false);

//   return (
//     <Router>
//       <div className="min-h-screen bg-[#091622]">
//         <Header
//           onDepositOpen={() => setDepositOpen(true)}
//           onWithdrawOpen={() => setWithdrawOpen(true)}
//         />
//         <main className="container md:max-w-full mx-auto p-1 mt-10 md:mt-0 md:p-6">
//           <Routes>
//             <Route path="/test" element={
//                   <GameRoom />

//             }/>
//             <Route
//               path="/"
//               element={
//                 <ProtectedRoute>
//                   <GameRoom />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/profile"
//               element={
//                 <ProtectedRoute>
//                   <Profile />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/login"
//               element={<Login />}
//             />
//             <Route
//               path="/register"
//               element={<Register />}
//             />
//           </Routes>
//         </main>
//         {isDepositOpen && (
//           <DepositModal onClose={() => setDepositOpen(false)} />
//         )}
//         {isWithdrawOpen && (
//           <WithdrawModal onClose={() => setWithdrawOpen(false)} />
//         )}
//       </div>
//     </Router>
//   );
// }

// export default App;

// // Add this to your CSS or Tailwind config for the animation
// const styles = `
//   @keyframes slide-in {
//     from { transform: translateY(-100%); opacity: 0; }
//     to { transform: translateY(0); opacity: 1; }
//   }
//   .animate-slide-in {
//     animation: slide-in 0.3s ease-out;
//   }
// `;

