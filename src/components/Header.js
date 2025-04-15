import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { performLogout, logout } from "../features/authSlice"; // Adjust the path if necessary.
import axiosInstance from "../app/axiosInstance";
import { persistor } from "../app/store";

function Header({ onDepositOpen, onWithdrawOpen }) {
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle header visibility on scroll.
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY && currentScrollY > 40) {
      setVisible(false);
    } else if (currentScrollY < lastScrollY) {
      setVisible(true);
    }
    setLastScrollY(currentScrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Handle logout and cleanup.
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

  // Smooth scroll to top and navigate if needed.
  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    if (window.location.pathname !== "/") {
      setTimeout(() => {
        navigate("/");
      }, 100);
    }
  };

  return (
    <header
      className={`bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white border-b-2 border-green-900 shadow-lg fixed top-0 left-0 right-0 z-50 rounded-b-xl transition-transform duration-300 ${
        visible ? "transform translate-y-0" : "transform -translate-y-full"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Left: Logo & Conditional User Actions */}
        <div className="flex items-center space-x-4">
          <a
            href="/"
            onClick={scrollToTop}
            className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 transition-all duration-300 flex items-center"
          >
            Game Room
          </a>
          {accessToken && (
            <div className="flex items-center space-x-3">
              <button
                onClick={onDepositOpen}
                className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-sm font-medium flex items-center shadow-md shadow-green-900/20 hover:shadow-lg hover:shadow-green-900/30"
                aria-label="Open deposit modal"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                Deposit
              </button>
              <div className="text-sm bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-purple-500/20 flex items-center shadow-inner shadow-purple-900/10 group hover:border-purple-500/40 transition-all duration-300">
                <svg
                  className="w-4 h-4 mr-1 text-green-400 group-hover:text-green-300 group-hover:rotate-12 transition-all duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 font-medium">
                  Ksh{user ? Number(user.balance).toFixed(2) : "0.00"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Navigation */}
        <div className="flex items-center">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <a
              href="/"
              onClick={scrollToTop}
              className="relative px-2 py-1 group"
            >
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              <span className="group-hover:text-blue-400 transition-colors duration-150">
                Games
              </span>
            </a>
            <Link to="/profile" className="relative px-2 py-1 group">
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              <span className="group-hover:text-blue-400 transition-colors duration-150">
                Profile
              </span>
            </Link>
            {accessToken ? (
              <>
                <button
                  onClick={onWithdrawOpen}
                  className="px-3 py-1.5 bg-gray-800/80 backdrop-blur-sm border border-red-500/20 text-red-400 rounded-md hover:bg-gray-700 hover:border-red-500/40 transition-all duration-300 text-sm font-medium flex items-center"
                  aria-label="Open withdraw modal"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    ></path>
                  </svg>
                  Withdraw
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-md hover:bg-gray-700 hover:border-gray-600 transition-all duration-300 text-sm font-medium flex items-center"
                  aria-label="Logout"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    ></path>
                  </svg>
                  Logout
                </button>
                <div className="text-sm bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-purple-500/20 flex items-center group hover:border-purple-500/40 transition-all duration-300">
                  <svg
                    className="w-4 h-4 mr-1 text-purple-400 group-hover:text-purple-300 transition-all duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                  <span className="group-hover:text-purple-300 transition-all duration-300">
                    {user?.username}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 bg-gray-800/80 backdrop-blur-sm border border-blue-500/20 rounded-md hover:bg-gray-700 hover:border-blue-500/40 transition-all duration-300 text-sm font-medium flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    ></path>
                  </svg>
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-blue-600 rounded-md hover:from-green-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium flex items-center shadow-md shadow-blue-900/20"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    ></path>
                  </svg>
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-md mx-1 hover:bg-gray-800/80 backdrop-blur-sm transition-all duration-150 group"
            aria-label="Toggle mobile menu"
            aria-expanded={menuOpen}
          >
            <svg
              className="h-6 w-6 group-hover:text-blue-400 transition-all duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  menuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16m-7 6h7"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="md:hidden bg-gray-800/95 backdrop-blur-sm border-t border-purple-500/20 px-4 py-4 animate-fade-in-down shadow-lg">
          <div className="flex flex-col space-y-3 py-2">
            <a
              href="/"
              onClick={(e) => {
                scrollToTop(e);
                setMenuOpen(false);
              }}
              className="flex items-center text-white hover:text-blue-400 py-2 px-3 hover:bg-gray-700/70 rounded-md transition-all duration-300"
            >
              <svg
                className="w-5 h-5 mr-2 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                ></path>
              </svg>
              Games
            </a>
            <Link
              to="/profile"
              className="flex items-center text-white hover:text-blue-400 py-2 px-3 hover:bg-gray-700/70 rounded-md transition-all duration-300"
              onClick={() => setMenuOpen(false)}
            >
              <svg
                className="w-5 h-5 mr-2 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              Profile
            </Link>

            {accessToken ? (
              <>
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-md p-3 mb-2 flex items-center justify-between border border-purple-500/20">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span className="text-sm">Balance:</span>
                  </div>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 font-medium">
                    ${user ? Number(user.balance).toFixed(2) : "0.00"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button
                    onClick={() => {
                      onDepositOpen();
                      setMenuOpen(false);
                    }}
                    className="flex items-center justify-center px-3 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-sm font-medium shadow-md shadow-green-900/20"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      ></path>
                    </svg>
                    Deposit
                  </button>

                  <button
                    onClick={() => {
                      onWithdrawOpen();
                      setMenuOpen(false);
                    }}
                    className="flex items-center justify-center px-3 py-3 bg-gray-800/80 backdrop-blur-sm border border-red-500/30 text-red-400 rounded-md hover:bg-gray-700 hover:border-red-500/50 transition-all duration-300 text-sm font-medium"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      ></path>
                    </svg>
                    Withdraw
                  </button>
                </div>

                <div className="flex items-center justify-between bg-gray-900/80 backdrop-blur-sm rounded-md p-3 mb-2 border border-purple-500/20">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      ></path>
                    </svg>
                    <span className="text-sm">User:</span>
                  </div>
                  <span className="text-purple-300">{user?.username}</span>
                </div>

                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center justify-center w-full px-3 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-md hover:bg-gray-700 hover:border-gray-600 transition-all duration-300 text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    ></path>
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center justify-center px-3 py-3 bg-gray-800/80 backdrop-blur-sm border border-blue-500/20 rounded-md hover:bg-gray-700 hover:border-blue-500/40 transition-all duration-300 text-sm font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    ></path>
                  </svg>
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center px-3 py-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-md hover:from-green-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-md shadow-blue-900/20"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    ></path>
                  </svg>
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

export default Header;


// import React, { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { performLogout, logout } from "../features/authSlice"; // Adjust the path if necessary.
// import axiosInstance from "../app/axiosInstance";
// import { persistor } from "../app/store";

// function Header({ onDepositOpen, onWithdrawOpen }) {
//   const dispatch = useDispatch();
//   const { user, accessToken } = useSelector((state) => state.auth);
//   const navigate = useNavigate();
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [visible, setVisible] = useState(true);
//   const [lastScrollY, setLastScrollY] = useState(0);

//   const handleScroll = () => {
//     const currentScrollY = window.scrollY;
    
//     // Hide header when scrolling down past 40px
//     if (currentScrollY > lastScrollY && currentScrollY > 40) {
//       setVisible(false);
//     } else if (currentScrollY < lastScrollY) {
//       // Show header when scrolling up
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
//             className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 transition-all duration-300 flex items-center"
//           >
//             Game Room
//           </a>
//           {accessToken && (
//             <div className="flex items-center space-x-3">
//               <button
//                 onClick={onDepositOpen}
//                 className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-sm font-medium flex items-center shadow-md shadow-green-900/20 hover:shadow-lg hover:shadow-green-900/30"
//                 aria-label="Open deposit modal"
//               >
//                 <svg
//                   className="w-4 h-4 mr-1"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                   xmlns="http://www.w3.org/2000/svg"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="2"
//                     d="M12 6v6m0 0v6m0-6h6m-6 0H6"
//                   ></path>
//                 </svg>
//                 Deposit
//               </button>
//               <div className="text-sm bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-purple-500/20 flex items-center shadow-inner shadow-purple-900/10 group hover:border-purple-500/40 transition-all duration-300">
//                 <svg
//                   className="w-4 h-4 mr-1 text-green-400 group-hover:text-green-300 group-hover:rotate-12 transition-all duration-300"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                   xmlns="http://www.w3.org/2000/svg"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="2"
//                     d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                   ></path>
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
//           {/* Desktop Navigation */}
//           <nav className="hidden md:flex items-center space-x-4">
//             <a
//               href="/"
//               onClick={scrollToTop}
//               className="relative px-2 py-1 group"
//             >
//               <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
//               <span className="group-hover:text-blue-400 transition-colors duration-150">
//                 Games
//               </span>
//             </a>
//             <Link
//               to="/profile"
//               className="relative px-2 py-1 group"
//             >
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
//                   aria-label="Open withdraw modal"
//                 >
//                   <svg
//                     className="w-4 h-4 mr-1"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                     ></path>
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//                     ></path>
//                   </svg>
//                   Withdraw
//                 </button>
//                 <button
//                   onClick={handleLogout}
//                   className="px-3 py-1.5 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-md hover:bg-gray-700 hover:border-gray-600 transition-all duration-300 text-sm font-medium flex items-center"
//                   aria-label="Logout"
//                 >
//                   <svg
//                     className="w-4 h-4 mr-1"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
//                     ></path>
//                   </svg>
//                   Logout
//                 </button>
//                 <div className="text-sm bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-purple-500/20 flex items-center group hover:border-purple-500/40 transition-all duration-300">
//                   <svg
//                     className="w-4 h-4 mr-1 text-purple-400 group-hover:text-purple-300 transition-all duration-300"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                     ></path>
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
//                   className="px-3 py-1.5 bg-gray-800/80 backdrop-blur-sm border border-blue-500/20 rounded-md hover:bg-gray-700 hover:border-blue-500/40 transition-all duration-300 text-sm font-medium flex items-center"
//                 >
//                   <svg
//                     className="w-4 h-4 mr-1"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
//                     ></path>
//                   </svg>
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-blue-600 rounded-md hover:from-green-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium flex items-center shadow-md shadow-blue-900/20 hover:shadow-lg hover:shadow-blue-900/30"
//                 >
//                   <svg
//                     className="w-4 h-4 mr-1"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
//                     ></path>
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
//             aria-expanded={menuOpen}
//           >
//             <svg
//               className="h-6 w-6 group-hover:text-blue-400 transition-all duration-300"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
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
//               className="flex items-center text-white hover:text-blue-400 py-2 px-3 hover:bg-gray-700/70 rounded-md transition-all duration-300"
//             >
//               <svg
//                 className="w-5 h-5 mr-2 text-green-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
//                 ></path>
//               </svg>
//               Games
//             </a>
//             <Link
//               to="/profile"
//               className="flex items-center text-white hover:text-blue-400 py-2 px-3 hover:bg-gray-700/70 rounded-md transition-all duration-300"
//               onClick={() => setMenuOpen(false)}
//             >
//               <svg
//                 className="w-5 h-5 mr-2 text-green-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                 ></path>
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
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                       ></path>
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
//                     className="flex items-center justify-center px-3 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-sm font-medium shadow-md shadow-green-900/20"
//                   >
//                     <svg
//                       className="w-4 h-4 mr-2"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M12 6v6m0 0v6m0-6h6m-6 0H6"
//                       ></path>
//                     </svg>
//                     Deposit
//                   </button>

//                   <button
//                     onClick={() => {
//                       onWithdrawOpen();
//                       setMenuOpen(false);
//                     }}
//                     className="flex items-center justify-center px-3 py-3 bg-gray-800/80 backdrop-blur-sm border border-red-500/30 text-red-400 rounded-md hover:bg-gray-700 hover:border-red-500/50 transition-all duration-300 text-sm font-medium"
//                   >
//                     <svg
//                       className="w-4 h-4 mr-2"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                       ></path>
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//                       ></path>
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
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                       ></path>
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
//                   className="flex items-center justify-center w-full px-3 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-md hover:bg-gray-700 hover:border-gray-600 transition-all duration-300 text-sm font-medium"
//                 >
//                   <svg
//                     className="w-4 h-4 mr-2"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
//                     ></path>
//                   </svg>
//                   Logout
//                 </button>
//               </>
//             ) : (
//               <>
//                 <Link
//                   to="/login"
//                   className="flex items-center justify-center px-3 py-3 bg-gray-800/80 backdrop-blur-sm border border-blue-500/20 rounded-md hover:bg-gray-700 hover:border-blue-500/40 transition-all duration-300 text-sm font-medium"
//                   onClick={() => setMenuOpen(false)}
//                 >
//                   <svg
//                     className="w-4 h-4 mr-2"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
//                     ></path>
//                   </svg>
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="flex items-center justify-center px-3 py-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-md hover:from-green-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-md shadow-blue-900/20"
//                   onClick={() => setMenuOpen(false)}
//                 >
//                   <svg
//                     className="w-4 h-4 mr-2"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
//                     ></path>
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

// export default Header;


// // src/components/Header.js
// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useSelector, useDispatch } from 'react-redux';
// import { performLogout } from '../features/authSlice';

// const Header = ({ onDepositOpen, onWithdrawOpen }) => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { accessToken, user } = useSelector((state) => state.auth);

//   const handleLogout = () => {
//     dispatch(performLogout())
//       .unwrap()
//       .then(() => {
//         navigate('/login');
//       })
//       .catch((error) => console.error('Logout failed:', error));
//   };

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
//             <span className="ml-4">
//               Balance: <strong>{user?.balance?.toFixed(2) || '0.00'}</strong>
//             </span>
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
// };

// export default Header;
