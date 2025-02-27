// // // // App.js
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { performLogout, logout } from "./features/authSlice";
import useBalanceRealtime from "./hooks/useBalanceRealtime";
import axiosInstance from "./app/axiosInstance";
import { persistor } from "./app/store";

// Components
import GameRoom from "./components/GameRoom";
import Profile from "./components/Profile";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import DepositModal from "./components/DepositModal";
import WithdrawModal from "./components/WithdrawModal";

function Header({ onDepositOpen, onWithdrawOpen }) {
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(performLogout())
      .unwrap()
      .then(() => {
        dispatch(logout());
        persistor.purge().then(() => {
          localStorage.removeItem("persist:root");
          axiosInstance.defaults.headers.common["Authorization"] = "";
          navigate("/login");
        });
      })
      .catch((err) => console.error("Logout failed:", err));
  };

  return (
    <header className="bg-blue-700 text-white shadow-md">
      {/* Top Bar */}
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Left: Logo & User Actions */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="font-bold text-2xl tracking-tight">
            Game Room
          </Link>
          {accessToken && (
            <div className="flex items-center space-x-4">
              <button
                onClick={onDepositOpen}
                className="px-4 py-2 bg-green-500 rounded-md hover:bg-green-600 transition-colors duration-200 text-sm font-medium"
                aria-label="Open deposit modal"
              >
                Deposit
              </button>
              <div className="text-sm bg-blue-800 px-3 py-1 rounded-full">
                <p>
                  Balance: <span className="font-semibold">{user ? Number(user.balance).toFixed(2) : "0.00"}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Navigation */}
        <div className="flex items-center">
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-200 transition-colors duration-150">
              Game Room
            </Link>
            <Link to="/profile" className="hover:text-blue-200 transition-colors duration-150">
              Profile
            </Link>
            {accessToken ? (
              <>
                <button
                  onClick={onWithdrawOpen}
                  className="px-4 py-2 bg-red-500 rounded-md hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
                  aria-label="Open withdraw modal"
                >
                  Withdraw
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-500 rounded-md hover:bg-gray-600 transition-colors duration-200 text-sm font-medium"
                  aria-label="Logout"
                >
                  Logout
                </button>
                <div className="text-sm">
                  <p>{user?.username}</p>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200 transition-colors duration-150">
                  Login
                </Link>
                <Link to="/register" className="hover:text-blue-200 transition-colors duration-150">
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-blue-600 transition-colors duration-150"
            aria-label="Toggle mobile menu"
            aria-expanded={menuOpen}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="md:hidden bg-blue-700 px-4 py-2 animate-slide-in">
          <div className="flex flex-col space-y-3">
            <Link to="/" className="hover:text-blue-200 py-2" onClick={() => setMenuOpen(false)}>
              Game Room
            </Link>
            <Link to="/profile" className="hover:text-blue-200 py-2" onClick={() => setMenuOpen(false)}>
              Profile
            </Link>
            {accessToken ? (
              <>
                <button
                  onClick={() => {
                    onWithdrawOpen();
                    setMenuOpen(false);
                  }}
                  className="px-4 py-2 bg-red-500 rounded-md hover:bg-red-600 text-left transition-colors duration-200"
                >
                  Withdraw
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="px-4 py-2 bg-gray-500 rounded-md hover:bg-gray-600 text-left transition-colors duration-200"
                >
                  Logout
                </button>
                <p className="text-sm">{user?.username}</p>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200 py-2" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="hover:text-blue-200 py-2" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function App() {
  useBalanceRealtime();
  const [isDepositOpen, setDepositOpen] = useState(false);
  const [isWithdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header
          onDepositOpen={() => setDepositOpen(true)}
          onWithdrawOpen={() => setWithdrawOpen(true)}
        />
        <main className="container mx-auto p-6">
          <Routes>
            <Route path="/" element={<ProtectedRoute><GameRoom /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
        {isDepositOpen && <DepositModal onClose={() => setDepositOpen(false)} />}
        {isWithdrawOpen && <WithdrawModal onClose={() => setWithdrawOpen(false)} />}
      </div>
    </Router>
  );
}

export default App;

// Add this to your CSS or Tailwind config for the animation
const styles = `
  @keyframes slide-in {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;
// // App.js
// // App.js
// import React, { useState } from "react";
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

// import GameRoom from "./components/GameRoom";
// import Leaderboard from "./components/Leaderboard";
// import LiveChat from "./components/LiveChat";
// import UserBets from "./components/UserBets";
// import Profile from "./components/Profile";
// import Login from "./components/Login";
// import Register from "./components/Register";
// import ProtectedRoute from "./components/ProtectedRoute";
// import DepositModal from "./components/DepositModal"; // Modal for deposits
// import WithdrawModal from "./components/WithdrawModal"; // Modal for withdrawals
// import { persistor } from "./app/store";

// function Header({ onDepositOpen, onWithdrawOpen }) {
//   const dispatch = useDispatch();
//   const { user, accessToken } = useSelector((state) => state.auth);
//   const navigate = useNavigate();
//   const [menuOpen, setMenuOpen] = useState(false);

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

//   return (
//     <header className="bg-blue-600 text-white">
//       {/* Top Bar: Always visible */}
//       <div className="container mx-auto flex items-center justify-between p-4">
//         {/* Left side: Logo and (if logged in) Deposit & Balance */}
//         <div className="flex items-center">
//           <Link to="/" className="font-bold text-xl">
//             Game Room
//           </Link>
//           {accessToken && (
//             <div className="ml-4 flex items-center space-x-4">
//               <button
//                 onClick={onDepositOpen}
//                 className="px-2 py-1 border rounded hover:bg-blue-500"
//               >
//                 Deposit
//               </button>
//               <div className="text-sm">
              
//                 <p>Balance: {user ? Number(user.balance).toFixed(2) : "0.00"}</p>
//               </div>
//             </div>

//           )}
//         </div>

//         {/* Right side: Navigation links (desktop) & mobile hamburger */}
//         <div className="flex items-center">
//           {/* Desktop Navigation */}
//           <div className="hidden lg:flex space-x-4">
//             <Link to="/" className="text-white hover:text-blue-200">
//               Game Room
//             </Link>

//             <Link path="/my-bets" element={<UserBets />} />
//             {/* <Link to="/leaderboard" className="text-white hover:text-blue-200">
//               Leaderboard
//             </Link>
//             <Link to="/chat" className="text-white hover:text-blue-200">
//               Live Chat
//             </Link> */}
//             <Link to="/profile" className="text-white hover:text-blue-200">
//               Profile
//             </Link>
//             {accessToken ? (
//               <>
//                 <button
//                   onClick={onWithdrawOpen}
//                   className="px-2 py-1 border rounded hover:bg-blue-500"
//                 >
//                   Withdraw
//                 </button>
//                 <button
//                   onClick={handleLogout}
//                   className="px-2 py-1 border rounded hover:bg-blue-500"
//                 >
//                   Logout
//                 </button>
//                 <div className="text-sm">
//                   <p>Username: {user && user.username}</p>
//                 </div>
//               </>
//             ) : (
//               <>
//                 <Link to="/login" className="hover:underline">
//                   Login
//                 </Link>
//                 <Link to="/register" className="hover:underline">
//                   Register
//                 </Link>
//               </>
//             )}
//           </div>

//           {/* Mobile Hamburger */}
//           <div className="block lg:hidden">
//             <button
//               onClick={() => setMenuOpen(!menuOpen)}
//               className="flex items-center px-3 py-2 border rounded text-white border-white hover:text-blue-200 hover:border-blue-200"
//             >
//               <svg
//                 className="fill-current h-3 w-3"
//                 viewBox="0 0 20 20"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <title>Menu</title>
//                 <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Navigation Menu */}
//       {menuOpen && (
//         <div className="lg:hidden bg-blue-600">
//           <nav className="container mx-auto p-4 flex flex-col space-y-2">
//             <Link
//               to="/"
//               className="text-white hover:text-blue-200"
//               onClick={() => setMenuOpen(false)}
//             >
//               Game Room
//             </Link>
//             {/* <Link
//               to="/leaderboard"
//               className="text-white hover:text-blue-200"
//               onClick={() => setMenuOpen(false)}
//             >
//               Leaderboard
//             </Link>
//             <Link
//               to="/chat"
//               className="text-white hover:text-blue-200"
//               onClick={() => setMenuOpen(false)}
//             >
//               Live Chat
//             </Link>
//             */}
//             <Link
//               to="/profile"
//               className="text-white hover:text-blue-200"
//               onClick={() => setMenuOpen(false)}
//             >
//               Profile
//             </Link>
//             {accessToken ? (
//               <>
//                 <button
//                   onClick={() => {
//                     onWithdrawOpen();
//                     setMenuOpen(false);
//                   }}
//                   className="text-left px-2 py-1 border rounded hover:bg-blue-500"
//                 >
//                   Withdraw
//                 </button>
//                 <button
//                   onClick={() => {
//                     handleLogout();
//                     setMenuOpen(false);
//                   }}
//                   className="text-left px-2 py-1 border rounded hover:bg-blue-500"
//                 >
//                   Logout
//                 </button>
//                 <div className="text-sm">
//                   <p>Username: {user && user.username}</p>
//                 </div>
//               </>
//             ) : (
//               <>
//                 <Link
//                   to="/login"
//                   className="text-white hover:underline"
//                   onClick={() => setMenuOpen(false)}
//                 >
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="text-white hover:underline"
//                   onClick={() => setMenuOpen(false)}
//                 >
//                   Register
//                 </Link>
//               </>
//             )}
//           </nav>
//         </div>
//       )}
//     </header>
//   );
// }

// function App() {
//   // Start listening for realtime balance updates.
//   useBalanceRealtime();

//   // State to control the visibility of Deposit and Withdraw modals.
//   const [isDepositOpen, setDepositOpen] = useState(false);
//   const [isWithdrawOpen, setWithdrawOpen] = useState(false);

//   const handleDepositOpen = () => setDepositOpen(true);
//   const handleDepositClose = () => setDepositOpen(false);
//   const handleWithdrawOpen = () => setWithdrawOpen(true);
//   const handleWithdrawClose = () => setWithdrawOpen(false);

//   return (
//     <Router>
//       <div className="min-h-screen bg-gray-100">
//         {/* Header with modal handlers */}
//         <Header
//           onDepositOpen={handleDepositOpen}
//           onWithdrawOpen={handleWithdrawOpen}
//         />
//         <main className="container mx-auto p-4">
//           <Routes>
//             <Route
//               path="/"
//               element={
//                 <ProtectedRoute>
//                   <GameRoom />
//                 </ProtectedRoute>
//               }
//             />
//             {/* <Route
//               path="/leaderboard"
//               element={
//                 <ProtectedRoute>
//                   <Leaderboard />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/chat"
//               element={
//                 <ProtectedRoute>
//                   <LiveChat />
//                 </ProtectedRoute>
//               }
//             /> */}
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

//         {/* Render modals conditionally */}
//         {isDepositOpen && <DepositModal onClose={handleDepositClose} />}
//         {isWithdrawOpen && <WithdrawModal onClose={handleWithdrawClose} />}
//       </div>
//     </Router>
//   );
// }

// export default App;


// // App.js
// import React, { useState } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Link,
//   useNavigate,
// } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { performLogout ,logout} from "./features/authSlice"; // adjust the path as needed
// import useBalanceRealtime from './hooks/useBalanceRealtime';
// import axiosInstance from "./app/axiosInstance";


// import GameRoom from "./components/GameRoom";
// import Leaderboard from "./components/Leaderboard";
// import LiveChat from "./components/LiveChat";
// import Profile from "./components/Profile";
// import Login from "./components/Login";
// import Register from "./components/Register";
// import ProtectedRoute from "./components/ProtectedRoute";
// import DepositModal from "./components/DepositModal"; // Modal for deposits
// import WithdrawModal from "./components/WithdrawModal"; // Modal for withdrawals
// import { persistor } from "./app/store";

// // Header Component with navigation, deposit/withdraw buttons, and logout functionality.
// function Header({ onDepositOpen, onWithdrawOpen }) {
//   const dispatch = useDispatch();
//   const { user, loading, error } = useSelector((state) => state.auth);
//   const navigate = useNavigate();
//   const { accessToken } = useSelector((state) => state.auth);

//   const handleLogout = () => {
//     dispatch(performLogout())
//       .unwrap()
//       .then(() => {
//         // Clear the Redux slices
//         dispatch(logout());
//         // Clear persisted state
//         persistor.purge().then(() => {
//           localStorage.removeItem("persist:root"); // if your persistConfig.key === 'root'
//           // (Optional) Clear any Axios headers set during login
//           axiosInstance.defaults.headers.common["Authorization"] = "";
//           // Redirect
//           navigate("/login");
//         });
//       })
//       .catch((err) => console.error("Logout failed:", err));
//   };
  
  
  

//   // const handleLogout = () => {
//   //   dispatch(performLogout())
//   //     .unwrap()
//   //     .then(() => {
//   //       // Redirect to login page after successful logout.
//   //       navigate("/login");
//   //     })
//   //     .catch((error) => {
//   //       console.error("Logout failed:", error);
//   //     });
//   // };

  

//   return (
//     <header className="bg-blue-600 text-white p-4">
//       <nav className="container mx-auto flex space-x-4 items-center">
//         <Link to="/" className="hover:underline">
//           Game Room
//         </Link>
//         <Link to="/leaderboard" className="hover:underline">
//           Leaderboard
//         </Link>
//         <Link to="/chat" className="hover:underline">
//           Live Chat
//         </Link>
//         <Link to="/profile" className="hover:underline">
//           Profile
//         </Link>
//         {accessToken ? (
//           <>
//             {/* Deposit and Withdraw buttons visible only when signed in */}
//             <button
//               onClick={onDepositOpen}
//               className="hover:underline px-2 py-1 border rounded"
//             >
//               Deposit
//             </button>
//             <button
//               onClick={onWithdrawOpen}
//               className="hover:underline px-2 py-1 border rounded"
//             >
//               Withdraw
//             </button>
//             <button
//               onClick={handleLogout}
//               className="hover:underline px-2 py-1 border rounded"
//             >
//               Logout
//             </button>


//             {user ? (
//         <div className="mt-4">
//           <p className="mb-2">Username: {user.username}</p>
//           <p className="mb-2">Balance: {user.balance}</p>
//           {/* Additional profile customization can be added here */}
//         </div>
//       ) : (
//         <p>No user data available.</p>
//       )}




//           </>
//         ) : (
//           <>
//             <Link to="/login" className="hover:underline">
//               Login
//             </Link>
//             <Link to="/register" className="hover:underline">
//               Register
//             </Link>
//           </>
//         )}
//       </nav>
//     </header>
//   );
// }

// function App() {

   


//   // Call our custom hook to start listening for realtime balance updates.
//   useBalanceRealtime();
//   // State to control the visibility of Deposit and Withdraw modals.
//   const [isDepositOpen, setDepositOpen] = useState(false);
//   const [isWithdrawOpen, setWithdrawOpen] = useState(false);

//   const handleDepositOpen = () => setDepositOpen(true);
//   const handleDepositClose = () => setDepositOpen(false);

//   const handleWithdrawOpen = () => setWithdrawOpen(true);
//   const handleWithdrawClose = () => setWithdrawOpen(false);

//   return (
//     <Router>
//       <div className="min-h-screen bg-gray-100">
//         {/* Header now receives functions to open modals */}
//         <Header
//           onDepositOpen={handleDepositOpen}
//           onWithdrawOpen={handleWithdrawOpen}
//         />
//         <main className="container mx-auto p-4">
//           <Routes>
//             <Route
//               path="/"
//               element={
//                 <ProtectedRoute>
//                   <GameRoom />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/leaderboard"
//               element={
//                 <ProtectedRoute>
//                   <Leaderboard />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/chat"
//               element={
//                 <ProtectedRoute>
//                   <LiveChat />
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

//         {/* Render modals conditionally */}
//         {isDepositOpen && <DepositModal onClose={handleDepositClose} />}
//         {isWithdrawOpen && <WithdrawModal onClose={handleWithdrawClose} />}
//       </div>
//     </Router>
//   );
// }

// export default App;

// import React from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Link,
//   useNavigate,
// } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { performLogout } from "./features/authSlice"; // adjust the path as needed

// import GameRoom from "./components/GameRoom";
// import Leaderboard from "./components/Leaderboard";
// import LiveChat from "./components/LiveChat";
// import Profile from "./components/Profile";
// import Login from "./components/Login";
// import Register from "./components/Register";
// import ProtectedRoute from "./components/ProtectedRoute";

// // Header Component with navigation and logout functionality.
// function Header() {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { accessToken } = useSelector((state) => state.auth);

//   const handleLogout = () => {
//     dispatch(performLogout())
//       .unwrap()
//       .then(() => {
//         // Redirect to login page after successful logout.
//         navigate("/login");
//       })
//       .catch((error) => {
//         console.error("Logout failed:", error);
//       });
//   };

//   return (
//     <header className="bg-blue-600 text-white p-4">
//       <nav className="container mx-auto flex space-x-4">
//         <Link to="/" className="hover:underline">
//           Game Room
//         </Link>
//         <Link to="/leaderboard" className="hover:underline">
//           Leaderboard
//         </Link>
//         <Link to="/chat" className="hover:underline">
//           Live Chat
//         </Link>
//         <Link to="/profile" className="hover:underline">
//           Profile
//         </Link>
//         {accessToken ? (
//           // If the user is logged in, show the Logout button.
//           <button onClick={handleLogout} className="hover:underline">
//             Logout
//           </button>
//         ) : (
//           // Otherwise, show Login and Register links.
//           <>
//             <Link to="/login" className="hover:underline">
//               Login
//             </Link>
//             <Link to="/register" className="hover:underline">
//               Register
//             </Link>
//           </>
//         )}
//       </nav>
//     </header>
//   );
// }

// function App() {
//   return (
//     <Router>
//       <div className="min-h-screen bg-gray-100">
//         {/* The Header is placed above the main content */}
//         <Header />
//         <main className="container mx-auto p-4">
//           <Routes>
//             <Route
//               path="/"
//               element={
//                 <ProtectedRoute>
//                   <GameRoom />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/leaderboard"
//               element={
//                 <ProtectedRoute>
//                   <Leaderboard />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/chat"
//               element={
//                 <ProtectedRoute>
//                   <LiveChat />
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
//       </div>
//     </Router>
//   );
// }

// export default App;


// import React from "react";
// import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
// import GameRoom from "./components/GameRoom";
// import Leaderboard from "./components/Leaderboard";
// import LiveChat from "./components/LiveChat";
// import Profile from "./components/Profile";
// import Login from "./components/Login";
// import Register from "./components/Register";
// import ProtectedRoute from "./components/ProtectedRoute";

// function App() {
//   return (
//     <Router>
//       <div className="min-h-screen bg-gray-100">
//         <header className="bg-blue-600 text-white p-4">
//           <nav className="container mx-auto flex space-x-4">
//             <Link to="/" className="hover:underline">
//               Game Room
//             </Link>
//             <Link to="/leaderboard" className="hover:underline">
//               Leaderboard
//             </Link>
//             <Link to="/chat" className="hover:underline">
//               Live Chat
//             </Link>
//             <Link to="/profile" className="hover:underline">
//               Profile
//             </Link>
//           </nav>
//         </header>
//         <main className="container mx-auto p-4">
//           <Routes>
//             <Route
//               path="/"
//               element={
//                 <ProtectedRoute>
//                   <GameRoom />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/leaderboard"
//               element={
//                 <ProtectedRoute>
//                   <Leaderboard />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/chat"
//               element={
//                 <ProtectedRoute>
//                   <LiveChat />
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
//       </div>
//     </Router>
//   );
// }

// export default App;
