/*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************  */


import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

// Confetti particle component
const Confetti = ({ color, index }) => {
  const size = Math.random() * 8 + 4;
  const xStart = Math.random() * 100; // Random starting position across the width
  const fallDuration = 2 + Math.random() * 1; // Random fall duration
  const swayAmount = 50 + Math.random() * 50; // Random sway amount
  const delay = Math.random() * 0.5; // Random start delay

  return (
    <motion.div
      className="absolute top-0 rounded-md"
      style={{
        width: size,
        height: size * (Math.random() * 2 + 1), // Varied height
        backgroundColor: color,
        left: `${xStart}%`,
        zIndex: -1,
      }}
      initial={{ y: -20, rotate: 0, opacity: 1 }}
      animate={{
        y: ["0%", "150%"],
        x: [
          `${-swayAmount / 2}px`,
          `${swayAmount / 2}px`,
          `${-swayAmount / 4}px`,
        ],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: fallDuration,
        ease: "easeIn",
        delay: delay,
        times: [0, 0.8, 1],
        x: {
          duration: fallDuration,
          ease: [0.64, 0.57, 0.67, 1],
          times: [0, 0.5, 1],
        },
      }}
    />
  );
};

function Jackpot() {
  const { jackpot } = useSelector((state) => state.round);
  const [prevJackpot, setPrevJackpot] = useState(jackpot || 0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef(null);

  // Enhanced confetti colors - brighter gold and orange theme
  const confettiColors = [
    "#FFD700", // Gold
    "#FF8C00", // Bright Orange
    "#00FF88", // Bright Green
    "#FF1493", // Deep Pink
    "#FFC0CB", // Pink
    "#FFFF00", // Yellow
  ];

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Adjust this threshold based on when you want the transition to happen
      setIsScrolled(scrollPosition > 100);
    };

    window.addEventListener("scroll", handleScroll);
    // Initialize on mount
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Detect jackpot changes
  useEffect(() => {
    if (jackpot && jackpot > prevJackpot) {
      // Generate new confetti elements
      const newConfetti = Array.from({ length: 80 }).map((_, i) => ({
        id: `confetti-${Date.now()}-${i}`,
        color:
          confettiColors[Math.floor(Math.random() * confettiColors.length)],
      }));

      setConfetti(newConfetti);
      setShowAnimation(true);

      // Hide confetti after 3.5 seconds
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 3500);

      return () => clearTimeout(timer);
    }
    setPrevJackpot(jackpot || 0);
  }, [jackpot, prevJackpot]);

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 ${
        isScrolled
          ? "fixed top-0 left-0 right-0 rounded-b-xl z-30 "
          : "absolute top-[207px] left-5 right-6 sm:left-16 sm:right-16 md:top-12 md:right-max z-10"
      }`}>
      <motion.div
        className={`bg-gradient-to-br ${
          showAnimation
            ? "z-50 from-yellow-400 via-yellow-600 to-orange-500"
            : "from-[#1ec275] to-[#11d67a]"
        } ${
          isScrolled ? "rounded-none" : "rounded-xl"
        } p-1 md:p-6 shadow-lg transition-all duration-200 overflow-hidden`}
        animate={{
          scale: showAnimation ? [1, 1.1, 1.05] : 1,
          height: showAnimation ? ["auto", "auto", "auto"] : "auto",
          boxShadow: showAnimation
            ? "0px 0px 20px rgba(255, 215, 0, 0.8)"
            : "0px 0px 0px rgba(255, 215, 0, 0)",
        }}
        transition={{
          duration: 0.8,
          ease: [0.64, 0.57, 0.67, 1],
        }}
        whileHover={{ scale: isScrolled ? 1 : 1.05 }}>
        <div className="text-center flex items-center justify-between relative">
          <h3
            className={`text-sm md:text-lg font-semibold text-white uppercase tracking-wide ${
              showAnimation ? "font-extrabold" : "font-semibold"
            }`}>
            Jackpot
          </h3>

          <motion.p
            className={`text-sm md:text-3xl font-bold text-white drop-shadow-md mx-2 md:mx-0 ${
              showAnimation ? "md:text-5xl" : "md:text-3xl"
            }`}
            animate={{
              scale: showAnimation ? [1, 1.5, 1.3] : 1,
              textShadow: showAnimation
                ? [
                    "0px 0px 0px rgba(255,255,255,0)",
                    "0px 0px 15px rgba(255,255,255,0.9)",
                    "0px 0px 8px rgba(255,255,255,0.6)",
                  ]
                : "0px 0px 0px rgba(255,255,255,0)",
              color: showAnimation
                ? ["#FFFFFF", "#FFFF00", "#FFFFFF"]
                : "#FFFFFF",
            }}
            transition={{
              duration: 1.2,
              ease: [0.64, 0.57, 0.67, 1],
            }}>
            ${Number(jackpot || 0).toFixed(2)}
          </motion.p>

          <div className="md:flex md:justify-center md:gap-2">
            <motion.span
              className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white"
              animate={{
                backgroundColor: showAnimation
                  ? [
                      "rgba(255,255,255,0.2)",
                      "rgba(255,255,255,0.4)",
                      "rgba(255,255,255,0.2)",
                    ]
                  : "rgba(255,255,255,0.2)",
              }}
              transition={{
                duration: 1,
                ease: "easeInOut",
              }}>
              Total Pool
            </motion.span>
          </div>

          {/* Confetti container */}
          <AnimatePresence>
            {showAnimation && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {confetti.map((particle, index) => (
                  <Confetti
                    key={particle.id}
                    color={particle.color}
                    index={index}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default Jackpot;

/*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************  */


// import React, { useState, useEffect, useRef } from "react";
// import { useSelector } from "react-redux";
// import { motion, AnimatePresence } from "framer-motion";

// // Confetti particle component
// const Confetti = ({ color, index }) => {
//   const size = Math.random() * 8 + 4;
//   const xStart = Math.random() * 100; // Random starting position across the width
//   const fallDuration = 2 + Math.random() * 1; // Random fall duration
//   const swayAmount = 50 + Math.random() * 50; // Random sway amount
//   const delay = Math.random() * 0.5; // Random start delay

//   return (
//     <motion.div
//       className="absolute top-0 rounded-md"
//       style={{
//         width: size,
//         height: size * (Math.random() * 2 + 1), // Varied height
//         backgroundColor: color,
//         left: `${xStart}%`,
//         zIndex: -1,
//       }}
//       initial={{ y: -20, rotate: 0, opacity: 1 }}
//       animate={{
//         y: ["0%", "150%"],
//         x: [
//           `${-swayAmount / 2}px`,
//           `${swayAmount / 2}px`,
//           `${-swayAmount / 4}px`,
//         ],
//         rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
//         opacity: [1, 1, 0],
//       }}
//       transition={{
//         duration: fallDuration,
//         ease: "easeIn",
//         delay: delay,
//         times: [0, 0.8, 1],
//         x: {
//           duration: fallDuration,
//           ease: [0.64, 0.57, 0.67, 1],
//           times: [0, 0.5, 1],
//         },
//       }}
//     />
//   );
// };

// function Jackpot() {
//   const { jackpot } = useSelector((state) => state.round);
//   const [prevJackpot, setPrevJackpot] = useState(jackpot || 0);
//   const [showAnimation, setShowAnimation] = useState(false);
//   const [confetti, setConfetti] = useState([]);
//   const containerRef = useRef(null);

//   // Enhanced confetti colors - brighter gold and orange theme
//   const confettiColors = [
//     "#FFD700", // Gold
//     "#FF8C00", // Bright Orange
//     "#00FF88", // Bright Green
//     "#FF1493", // Deep Pink
//     "#FFC0CB", // Pink
//     "#FFFF00", // Yellow
//   ];

//   // Detect jackpot changes
//   useEffect(() => {
//     if (jackpot && jackpot > prevJackpot) {
//       // Generate new confetti elements
//       const newConfetti = Array.from({ length: 80 }).map((_, i) => ({
//         id: `confetti-${Date.now()}-${i}`,
//         color:
//           confettiColors[Math.floor(Math.random() * confettiColors.length)],
//       }));

//       setConfetti(newConfetti);
//       setShowAnimation(true);

//       // Hide confetti after 3.5 seconds
//       const timer = setTimeout(() => {
//         setShowAnimation(false);
//       }, 3500);

//       return () => clearTimeout(timer);
//     }
//     setPrevJackpot(jackpot || 0);
//   }, [jackpot, prevJackpot]);

//   return (
//     <div
//       ref={containerRef}
//       className="absolute top-[207px] left-5 right-6 sm:left-16 sm:right-16 md:top-12 md:right-max grid grid-cols-1 gap-2 mb-6 overflow-hidden z-10">
//       <motion.div
//         className={`bg-gradient-to-br ${
//           showAnimation
//             ? "from-yellow-400 via-yellow-600 to-orange-500"
//             : "from-[#1ec275] to-[#11d67a]"
//         } rounded-xl p-1 md:p-6 shadow-lg transition-all duration-200 overflow-hidden`}
//         animate={{
//           scale: showAnimation ? [1, 1.1, 1.05] : 1,
//           height: showAnimation ? ["auto", "auto", "auto"] : "auto",
//           boxShadow: showAnimation
//             ? "0px 0px 20px rgba(255, 215, 0, 0.8)"
//             : "0px 0px 0px rgba(255, 215, 0, 0)",
//         }}
//         transition={{
//           duration: 0.8,
//           ease: [0.64, 0.57, 0.67, 1],
//         }}
//         whileHover={{ scale: 1.05 }}>
//         <div className="text-center flex items-center justify-between relative">
//           <h3
//             className={`text-sm md:text-lg font-semibold text-white uppercase tracking-wide ${
//               showAnimation ? "font-extrabold" : "font-semibold"
//             }`}>
//             Jackpot
//           </h3>

//           <motion.p
//             className={`text-sm md:text-3xl font-bold text-white drop-shadow-md mx-2 md:mx-0 ${
//               showAnimation ? "md:text-5xl" : "md:text-3xl"
//             }`}
//             animate={{
//               scale: showAnimation ? [1, 1.5, 1.3] : 1,
//               textShadow: showAnimation
//                 ? [
//                     "0px 0px 0px rgba(255,255,255,0)",
//                     "0px 0px 15px rgba(255,255,255,0.9)",
//                     "0px 0px 8px rgba(255,255,255,0.6)",
//                   ]
//                 : "0px 0px 0px rgba(255,255,255,0)",
//               color: showAnimation
//                 ? ["#FFFFFF", "#FFFF00", "#FFFFFF"]
//                 : "#FFFFFF",
//             }}
//             transition={{
//               duration: 1.2,
//               ease: [0.64, 0.57, 0.67, 1],
//             }}>
//             ${Number(jackpot || 0).toFixed(2)}
//           </motion.p>

//           <div className="md:flex md:justify-center md:gap-2">
//             <motion.span
//               className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white"
//               animate={{
//                 backgroundColor: showAnimation
//                   ? [
//                       "rgba(255,255,255,0.2)",
//                       "rgba(255,255,255,0.4)",
//                       "rgba(255,255,255,0.2)",
//                     ]
//                   : "rgba(255,255,255,0.2)",
//               }}
//               transition={{
//                 duration: 1,
//                 ease: "easeInOut",
//               }}>
//               Total Pool
//             </motion.span>
//           </div>

//           {/* Confetti container */}
//           <AnimatePresence>
//             {showAnimation && (
//               <div className="absolute inset-0 overflow-hidden pointer-events-none">
//                 {confetti.map((particle, index) => (
//                   <Confetti
//                     key={particle.id}
//                     color={particle.color}
//                     index={index}
//                   />
//                 ))}
//               </div>
//             )}
//           </AnimatePresence>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// export default Jackpot;

/*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************  */

// import React, { useState, useEffect, useRef } from "react";
// import { useSelector } from "react-redux";
// import { motion, AnimatePresence } from "framer-motion";

// // Confetti particle component
// const Confetti = ({ color, index }) => {
//   const size = Math.random() * 8 + 4;
//   const xStart = Math.random() * 100; // Random starting position across the width
//   const fallDuration = 2 + Math.random() * 1; // Random fall duration
//   const swayAmount = 50 + Math.random() * 50; // Random sway amount
//   const delay = Math.random() * 0.5; // Random start delay

//   return (
//     <motion.div
//       className="absolute top-0 rounded-md"
//       style={{
//         width: size,
//         height: size * (Math.random() * 2 + 1), // Varied height
//         backgroundColor: color,
//         left: `${xStart}%`,
//         zIndex: -1,
//       }}
//       initial={{ y: -20, rotate: 0, opacity: 1 }}
//       animate={{
//         y: ["0%", "150%"],
//         x: [
//           `${-swayAmount / 2}px`,
//           `${swayAmount / 2}px`,
//           `${-swayAmount / 4}px`,
//         ],
//         rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
//         opacity: [1, 1, 0],
//       }}
//       transition={{
//         duration: fallDuration,
//         ease: "easeIn",
//         delay: delay,
//         times: [0, 0.8, 1],
//         x: {
//           duration: fallDuration,
//           ease: [0.64, 0.57, 0.67, 1],
//           times: [0, 0.5, 1],
//         },
//       }}
//     />
//   );
// };

// function Jackpot() {
//   const { jackpot } = useSelector((state) => state.round);
//   const [prevJackpot, setPrevJackpot] = useState(jackpot || 0);
//   const [showAnimation, setShowAnimation] = useState(false);
//   const [confetti, setConfetti] = useState([]);
//   const containerRef = useRef(null);

//   // Confetti colors - gold and orange theme
//   const confettiColors = [
//     "#FFD700",
//     "#FFA500",
//     "#00ff88",
//     "#F1Cc",
//     "#FFC0CB",
//   ];

//   // Detect jackpot changes
//   useEffect(() => {
//     if (jackpot && jackpot > prevJackpot) {
//       // Generate new confetti elements
//       const newConfetti = Array.from({ length: 50 }).map((_, i) => ({
//         id: `confetti-${Date.now()}-${i}`,
//         color:
//           confettiColors[Math.floor(Math.random() * confettiColors.length)],
//       }));

//       setConfetti(newConfetti);
//       setShowAnimation(true);

//       // Hide confetti after 3 seconds
//       const timer = setTimeout(() => {
//         setShowAnimation(false);
//       }, 3000);

//       return () => clearTimeout(timer);
//     }
//     setPrevJackpot(jackpot || 0);
//   }, [jackpot, prevJackpot]);

//   return (
//     <div
//       ref={containerRef}
//       className="absolute top-20 left-0 right-0 md:top-12 md:right-max grid grid-cols-1 gap-2 mb-6 overflow-hidden">
//       <motion.div
//         className="bg-gradient-to-r from-yellow-400/50 via-yellow-500/50 to-orange-500/50 rounded-xl p-1 md:p-6 shadow-lg transition-transform duration-200 max-h-10 md:max-h-none overflow-hidden"
//         animate={{
//           scale: showAnimation ? [1, 1.1, 1.05] : 1,
//         }}
//         transition={{
//           duration: 0.8,
//           ease: [0.64, 0.57, 0.67, 1],
//         }}
//         whileHover={{ scale: 1.05 }}>
//         <div className="text-center flex  items-center justify-between relative">
//           <h3 className="text-sm md:text-lg font-semibold text-white uppercase tracking-wide">
//             Jackpot
//           </h3>

//           <motion.p
//             className="text-sm md:text-3xl font-bold text-white drop-shadow-md mx-2 md:mx-0"
//             animate={{
//               scale: showAnimation ? [1, 1.25, 1.15] : 1,
//               textShadow: showAnimation
//                 ? [
//                     "0px 0px 0px rgba(255,255,255,0)",
//                     "0px 0px 8px rgba(255,255,255,0.6)",
//                     "0px 0px 4px rgba(255,255,255,0.3)",
//                   ]
//                 : "0px 0px 0px rgba(255,255,255,0)",
//             }}
//             transition={{
//               duration: 0.8,
//               ease: [0.64, 0.57, 0.67, 1],
//             }}>
//             ${Number(jackpot || 0).toFixed(2)}
//           </motion.p>

//           <div className="md:flex md:justify-center md:gap-2">
//             <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white">
//               Total Pool
//             </span>
//           </div>

//           {/* Confetti container */}
//           <AnimatePresence>
//             {showAnimation && (
//               <div className="absolute inset-0 overflow-hidden pointer-events-none">
//                 {confetti.map((particle, index) => (
//                   <Confetti
//                     key={particle.id}
//                     color={particle.color}
//                     index={index}
//                   />
//                 ))}
//               </div>
//             )}
//           </AnimatePresence>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// export default Jackpot;

/******************************************************************************************************************************** */

// import { useSelector } from "react-redux";

// function Jackpot() {
//   const { jackpot } = useSelector((state) => state.round);
//   return (
//     <div className="absolute top-0 left-0 right-0  md:top-12 md:right-max grid grid-cols-1 gap-2 mb-6">
//       <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-xl p-1 md:p-6 shadow-lg hover:scale-105 transition-transform duration-200 max-h-10 md:max-h-none overflow-hidden">
//         <div className="text-center flex items-center justify-between md:block">
//           <h3 className="text-sm md:text-lg font-semibold text-white uppercase tracking-wide">
//             Jackpot
//           </h3>
//           <p className="text-sm md:text-3xl font-bold text-white drop-shadow-md mx-2 md:mx-0">
//             ${Number(jackpot || 0).toFixed(2)}
//           </p>
//           <div className="md:flex md:justify-center md:gap-2 ">
//             <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white">
//               Total Pool
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Jackpot;
