import React, { useState, useEffect, useRef } from "react";
// *** Import useSelector and necessary selectors ***
import { useSelector } from "react-redux";
import { selectPoints, selectIsAuthenticated } from "../features/authSlice"; // Adjust path if needed
import { motion, AnimatePresence } from "framer-motion";

// Confetti component remains the same...
const Confetti = ({ color, index, totalParticles }) => {
  const staggerStep = 5 / totalParticles;
  const staggeredDelay = Math.min(index * staggerStep, 4);
  const size = Math.random() * 6 + 3;
  const xStart = Math.random() * 100;
  const fallDuration = 3 + Math.random() * 2;
  const swayAmount = 20 + Math.random() * 20;
  const isRectangle = Math.random() > 0.3;
  const rotation = Math.random() * 360;
  const clockwise = Math.random() > 0.5 ? 1 : -1;

  return (
    <motion.div
      className={`absolute top-0 ${isRectangle ? 'rounded-sm' : 'rounded-full'}`}
      style={{ /* ... styles ... */
        width: size, height: isRectangle ? size * (Math.random() + 1) : size, backgroundColor: color, left: `${xStart}%`, zIndex: -1,
      }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ /* ... animation props ... */
        y: ["0%", "150%"],
        x: [ `-${swayAmount}px`, `-${swayAmount / 2}px`, "0px", `${swayAmount / 2}px`, `${swayAmount}px`, `${swayAmount / 2}px`, "0px", `-${swayAmount / 2}px`, `-${swayAmount}px`, ],
        rotate: [rotation, rotation + clockwise * 720],
        opacity: [0, 1, 1, 0.8, 0.6, 0],
      }}
      transition={{ /* ... transition props ... */
        duration: fallDuration, delay: staggeredDelay, ease: "easeInOut", times: [0, 0.15, 0.3, 0.5, 0.7, 1],
        x: { duration: fallDuration, ease: "easeInOut", times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1], },
        rotate: { duration: fallDuration, ease: "easeInOut", },
        opacity: { duration: fallDuration, ease: "easeInOut", },
      }}
    />
  );
};


function Jackpot() {
  // Select jackpot from round state
  const { jackpot } = useSelector((state) => state.round);
  // *** Select user points and authentication status from auth state ***
  const userPoints = useSelector(selectPoints);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [prevJackpot, setPrevJackpot] = useState(jackpot || 0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef(null);
  const confettiTimerRef = useRef(null);

  const confettiColors = [ "#FFD700", "#FF8C00", "#00FF88", "#FFFF00", "#FF3366", "#66CCFF", ];

  // Scroll handler (remains the same)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          setIsScrolled(scrollPosition > 100);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Generate confetti batch (remains the same)
  const generateConfettiBatch = (batchIndex = 0, maxBatches = 5) => {
     if (batchIndex >= maxBatches) return;
    const isMobile = window.innerWidth < 768;
    const particlesPerBatch = isMobile ? 15 : 25;
    const totalParticles = particlesPerBatch * maxBatches;
    const newConfetti = Array.from({ length: particlesPerBatch }).map((_, i) => ({
      id: `confetti-${Date.now()}-${batchIndex}-${i}`,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      index: batchIndex * particlesPerBatch + i,
      totalParticles: totalParticles,
    }));
    setConfetti(prev => [...prev, ...newConfetti]);
    if (batchIndex < maxBatches - 1) {
      confettiTimerRef.current = setTimeout(() => {
        generateConfettiBatch(batchIndex + 1, maxBatches);
      }, 1000);
    }
  };

  // Jackpot change detection (remains the same)
  useEffect(() => {
    if (jackpot && jackpot > prevJackpot) {
      setConfetti([]);
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
      setShowAnimation(true);
      generateConfettiBatch(0, 5);
      const timer = setTimeout(() => { setShowAnimation(false); setConfetti([]); }, 5000);
      return () => { clearTimeout(timer); if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current); };
    }
    setPrevJackpot(jackpot || 0);
  }, [jackpot, prevJackpot]);

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-500 ${
        isScrolled
          ? "fixed top-0 left-0 right-0 rounded-b-xl z-30"
          : "absolute top-[207px] left-5 right-6 sm:left-16 sm:right-16 md:top-[68px] md:right-max z-10" // Adjust positioning as needed
      } ${showAnimation ? "z-[9999]" : ""}`}
    >
      <motion.div
        className={`bg-gradient-to-br ${ /* ... gradient classes ... */
          showAnimation ? "z-50 from-yellow-400 via-yellow-600 to-orange-500" : "from-[#1ec275] to-[#11d67a]"
        } ${ /* ... rounding classes ... */
          isScrolled ? "rounded-b-xl" : "rounded-xl"
        } p-1 md:p-0 shadow-lg overflow-hidden`}
        layout
        layoutId="jackpot-container"
        animate={{ /* ... animation props ... */
          scale: showAnimation ? [1, 1.03, 1.02, 1.01, 1] : 1,
          boxShadow: showAnimation ? "0px 0px 12px rgba(255, 215, 0, 0.6)" : "0px 0px 0px rgba(255, 215, 0, 0)",
        }}
        transition={{ /* ... transition props ... */
          layout: { duration: 0.3, ease: "easeOut" },
          scale: { duration: 5, ease: "easeOut", times: [0, 0.1, 0.3, 0.7, 1] },
          boxShadow: { duration: 5, ease: "easeOut" },
        }}
        whileHover={{ scale: isScrolled ? 1 : 1.02 }}
      >
        {/* --- Main Content Area --- */}
        <div className="text-center flex items-center justify-between relative h-[50px] md:h-[60px] px-3"> {/* Added padding */}

          {/* Jackpot Title */}
          <h3
            className={`text-sm md:text-lg font-semibold text-white uppercase tracking-wide ${
              showAnimation ? "font-bold" : "font-semibold"
            }`}>
            Jackpot
          </h3>

          {/* Jackpot Amount */}
          <motion.p
            className="text-lg md:text-3xl font-bold text-white drop-shadow-md mx-2" // Adjusted size slightly
            animate={{ /* ... animation props ... */
              scale: showAnimation ? [1, 1.15, 1.1, 1.05, 1.02] : 1,
              textShadow: showAnimation ? ["0px 0px 0px rgba(255,255,255,0)", "0px 0px 12px rgba(255,255,255,0.8)", "0px 0px 8px rgba(255,255,255,0.6)", "0px 0px 5px rgba(255,255,255,0.4)", "0px 0px 3px rgba(255,255,255,0.2)"] : "0px 0px 0px rgba(255,255,255,0)",
              color: showAnimation ? ["#FFFFFF", "#FFFF00", "#FFFFAA", "#FFFFDD", "#FFFFFF"] : "#FFFFFF",
            }}
            transition={{ duration: 5, ease: "easeOut", times: [0, 0.1, 0.3, 0.7, 1], }}>
            Ksh {Number(jackpot || 0).toFixed(2)}
          </motion.p>

          {/* --- User Points Display (Conditional) --- */}
          {isAuthenticated && ( // Only show if user is logged in
            <div className="flex items-center justify-center"> {/* Centering container */}
              <motion.span
                className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs sm:text-sm text-white font-medium" // Adjusted font weight
                animate={{ /* ... animation props ... */
                  backgroundColor: showAnimation ? ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.3)", "rgba(255,255,255,0.2)"] : "rgba(255,255,255,0.2)",
                }}
                transition={{ duration: 5, ease: "easeOut", times: [0, 0.2, 0.7, 1], }}>
                {/* Display user points */}
                {typeof userPoints === 'number' ? `${userPoints} Points` : 'Points'} {/* Handle null/undefined points */}
              </motion.span>
            </div>
          )}
          {/* If not authenticated, this section will not render */}


          {/* Confetti Animation Overlay */}
          <AnimatePresence>
            {showAnimation && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {confetti.map((particle) => (
                  <Confetti
                    key={particle.id}
                    color={particle.color}
                    index={particle.index}
                    totalParticles={particle.totalParticles}
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

// /*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************  */

// import React, { useState, useEffect, useRef } from "react";
// import { useSelector } from "react-redux";
// import { motion, AnimatePresence } from "framer-motion";

// // Enhanced Confetti particle component for continuous animation
// // const Confetti = ({ color, index, totalParticles }) => {
// //   // Calculate staggered delays across the full animation duration
// //   const staggerStep = 5 / totalParticles; // Spread across 5 seconds
// //   const staggeredDelay = Math.min(index * staggerStep, 4); // Cap at 4s to ensure visibility
  
// //   const size = Math.random() * 6 + 3;
// //   const xStart = Math.random() * 100;
// //   // Varied fall speed for more natural look
// //   const fallDuration = 2 + Math.random() * 1.5;
// //   const swayAmount = 30 + Math.random() * 30;
  
// //   // Create different confetti shapes
// //   const isRectangle = Math.random() > 0.3;
// //   const rotation = Math.random() * 360;

// //   return (
// //     <motion.div
// //       className={`absolute top-0 ${isRectangle ? 'rounded-sm' : 'rounded-full'}`}
// //       style={{
// //         width: size,
// //         height: isRectangle ? size * (Math.random() + 1) : size,
// //         backgroundColor: color,
// //         left: `${xStart}%`,
// //         zIndex: -1,
// //         transform: `rotate(${rotation}deg)`,
// //       }}
// //       initial={{ y: -20, opacity: 0 }}
// //       animate={{
// //         y: ["0%", "150%"],
// //         x: [`${-swayAmount / 2}px`, "0px", `${swayAmount / 2}px`, "0px", `${-swayAmount / 4}px`],
// //         rotate: [rotation, rotation + (360 * (Math.random() > 0.5 ? 1 : -1))],
// //         opacity: [0, 1, 1, 0.7, 0],
// //       }}
// //       transition={{
// //         duration: fallDuration,
// //         ease: "easeInOut",
// //         delay: staggeredDelay,
// //         times: [0, 0.1, 0.5, 0.8, 1],
// //         x: {
// //           duration: fallDuration,
// //           ease: "easeInOut",
// //           times: [0, 0.25, 0.5, 0.75, 1],
// //         },
// //         opacity: {
// //           duration: fallDuration,
// //           ease: "easeInOut",
// //           times: [0, 0.1, 0.5, 0.8, 1],
// //         }
// //       }}
// //     />
// //   );
// // };

// const Confetti = ({ color, index, totalParticles }) => {
//   const staggerStep = 5 / totalParticles;
//   const staggeredDelay = Math.min(index * staggerStep, 4);

//   const size = Math.random() * 6 + 3;
//   const xStart = Math.random() * 100;
//   const fallDuration = 3 + Math.random() * 2; // slightly longer for fluid fall
//   const swayAmount = 20 + Math.random() * 20;
//   const isRectangle = Math.random() > 0.3;
//   const rotation = Math.random() * 360;
//   const clockwise = Math.random() > 0.5 ? 1 : -1;

//   return (
//     <motion.div
//       className={`absolute top-0 ${isRectangle ? 'rounded-sm' : 'rounded-full'}`}
//       style={{
//         width: size,
//         height: isRectangle ? size * (Math.random() + 1) : size,
//         backgroundColor: color,
//         left: `${xStart}%`,
//         zIndex: -1,
//       }}
//       initial={{ y: -20, opacity: 0 }}
//       animate={{
//         y: ["0%", "150%"],
//         x: [
//           `-${swayAmount}px`,
//           `-${swayAmount / 2}px`,
//           "0px",
//           `${swayAmount / 2}px`,
//           `${swayAmount}px`,
//           `${swayAmount / 2}px`,
//           "0px",
//           `-${swayAmount / 2}px`,
//           `-${swayAmount}px`,
//         ],
//         rotate: [rotation, rotation + clockwise * 720],
//         opacity: [0, 1, 1, 0.8, 0.6, 0],
//       }}
//       transition={{
//         duration: fallDuration,
//         delay: staggeredDelay,
//         ease: "easeInOut",
//         times: [0, 0.15, 0.3, 0.5, 0.7, 1],
//         x: {
//           duration: fallDuration,
//           ease: "easeInOut",
//           times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
//         },
//         rotate: {
//           duration: fallDuration,
//           ease: "easeInOut",
//         },
//         opacity: {
//           duration: fallDuration,
//           ease: "easeInOut",
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
//   const [isScrolled, setIsScrolled] = useState(false);
//   const containerRef = useRef(null);
//   const confettiTimerRef = useRef(null);

//   // Enhanced confetti colors with better contrast
//   const confettiColors = [
//     "#FFD700", // Gold
//     "#FF8C00", // Bright Orange
//     "#00FF88", // Bright Green
//     "#FFFF00 ", // Yellow
//     "#FF3366  ", // Pink
//     "#66CCFF ", // Light Blue
//   ];

//   // Throttled scroll handler for better performance
//   useEffect(() => {
//     let ticking = false;
    
//     const handleScroll = () => {
//       if (!ticking) {
//         window.requestAnimationFrame(() => {
//           const scrollPosition = window.scrollY;
//           setIsScrolled(scrollPosition > 100);
//           ticking = false;
//         });
//         ticking = true;
//       }
//     };

//     window.addEventListener("scroll", handleScroll);
//     // Initialize on mount
//     handleScroll();

//     return () => {
//       window.removeEventListener("scroll", handleScroll);
//     };
//   }, []);

//   // Generate continuous waves of confetti for smoother animation
//   const generateConfettiBatch = (batchIndex = 0, maxBatches = 5) => {
//     if (batchIndex >= maxBatches) return;
    
//     const isMobile = window.innerWidth < 768;
//     const particlesPerBatch = isMobile ? 15 : 25;
//     const totalParticles = particlesPerBatch * maxBatches;
    
//     const newConfetti = Array.from({ length: particlesPerBatch }).map((_, i) => ({
//       id: `confetti-${Date.now()}-${batchIndex}-${i}`,
//       color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
//       index: batchIndex * particlesPerBatch + i,
//       totalParticles: totalParticles,
//     }));

//     setConfetti(prev => [...prev, ...newConfetti]);
    
//     // Schedule next batch (staggered release)
//     if (batchIndex < maxBatches - 1) {
//       confettiTimerRef.current = setTimeout(() => {
//         generateConfettiBatch(batchIndex + 1, maxBatches);
//       }, 1000); // Release a new batch every 1 second
//     }
//   };

//   // Optimized jackpot change detection with continuous confetti animation
//   useEffect(() => {
//     if (jackpot && jackpot > prevJackpot) {
//       // Clear any existing confetti and timers
//       setConfetti([]);
//       if (confettiTimerRef.current) {
//         clearTimeout(confettiTimerRef.current);
//       }
      
//       setShowAnimation(true);
      
//       // Start generating confetti in batches for continuous effect
//       generateConfettiBatch(0, 5); // 5 batches over 5 seconds
      
//       // Extended animation to 5 seconds as requested
//       const timer = setTimeout(() => {
//         setShowAnimation(false);
//         setConfetti([]);
//       }, 5000);

//       return () => {
//         clearTimeout(timer);
//         if (confettiTimerRef.current) {
//           clearTimeout(confettiTimerRef.current);
//         }
//       };
//     }
//     setPrevJackpot(jackpot || 0);
//   }, [jackpot, prevJackpot]);

//   return (
//     <div
//       ref={containerRef}
//       className={`transition-all duration-500 ${
//         isScrolled
//           ? "fixed top-0 left-0 right-0 rounded-b-xl z-30"
//           : "absolute top-[207px] left-5 right-6 sm:left-16 sm:right-16 md:top-12 md:right-max z-10"
//       } ${showAnimation ? "z-[9999]" : ""}`}
//     >
//       <motion.div
//         className={`bg-gradient-to-br ${
//           showAnimation
//             ? "z-50 from-yellow-400 via-yellow-600 to-orange-500"
//             : "from-[#1ec275] to-[#11d67a]"
//         } ${
//           isScrolled ? "rounded-b-xl" : "rounded-xl"
//         } p-1 md:p-0 shadow-lg overflow-hidden`}
//         layout
//         layoutId="jackpot-container"
//         animate={{
//           scale: showAnimation ? [1, 1.03, 1.02, 1.01, 1] : 1,
//           boxShadow: showAnimation
//             ? "0px 0px 12px rgba(255, 215, 0, 0.6)"
//             : "0px 0px 0px rgba(255, 215, 0, 0)",
//         }}
//         transition={{
//           layout: { duration: 0.3, ease: "easeOut" },
//           scale: { duration: 5, ease: "easeOut", times: [0, 0.1, 0.3, 0.7, 1] },
//           boxShadow: { duration: 5, ease: "easeOut" },
//         }}
//         whileHover={{ scale: isScrolled ? 1 : 1.02 }}
//       >
//         <div className="text-center flex items-center justify-between relative h-[50px] md:h-[60px]">
//           <h3
//             className={`text-sm md:text-lg font-semibold text-white uppercase tracking-wide ml-3 ${
//               showAnimation ? "font-bold" : "font-semibold"
//             }`}>
//             Jackpot
//           </h3>

//           <motion.p
//             className="text-sm md:text-3xl font-bold text-white drop-shadow-md mx-2 md:mx-0"
//             animate={{
//               scale: showAnimation ? [1, 1.15, 1.1, 1.05, 1.02] : 1,
//               textShadow: showAnimation
//                 ? ["0px 0px 0px rgba(255,255,255,0)", 
//                    "0px 0px 12px rgba(255,255,255,0.8)", 
//                    "0px 0px 8px rgba(255,255,255,0.6)",
//                    "0px 0px 5px rgba(255,255,255,0.4)",
//                    "0px 0px 3px rgba(255,255,255,0.2)"]
//                 : "0px 0px 0px rgba(255,255,255,0)",
//               color: showAnimation
//                 ? ["#FFFFFF", "#FFFF00", "#FFFFAA", "#FFFFDD", "#FFFFFF"]
//                 : "#FFFFFF",
//             }}
//             transition={{
//               duration: 5,
//               ease: "easeOut",
//               times: [0, 0.1, 0.3, 0.7, 1],
//             }}>
//             Ksh {Number(jackpot || 0).toFixed(2)}
//           </motion.p>

//           <div className="md:flex md:justify-center md:gap-2 mr-3">
//             <motion.span
//               className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white"
//               animate={{
//                 backgroundColor: showAnimation
//                   ? ["rgba(255,255,255,0.2)", 
//                      "rgba(255,255,255,0.4)", 
//                      "rgba(255,255,255,0.3)",
//                      "rgba(255,255,255,0.2)"]
//                   : "rgba(255,255,255,0.2)",
//               }}
//               transition={{
//                 duration: 5,
//                 ease: "easeOut",
//                 times: [0, 0.2, 0.7, 1],
//               }}>
//               Total Pool
//             </motion.span>
//           </div>

//           {/* Enhanced confetti container with continual waves of particles */}
//           <AnimatePresence>
//             {showAnimation && (
//               <div className="absolute inset-0 overflow-hidden pointer-events-none">
//                 {confetti.map((particle) => (
//                   <Confetti
//                     key={particle.id}
//                     color={particle.color}
//                     index={particle.index}
//                     totalParticles={particle.totalParticles}
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

// // Optimized Confetti particle component with extended duration
// const Confetti = ({ color }) => {
//   const size = Math.random() * 6 + 3;
//   const xStart = Math.random() * 100;
//   const fallDuration = 3 + Math.random() * 2; // Longer duration for 5-second total effect
//   const swayAmount = 30 + Math.random() * 30;
//   const delay = Math.random() * 1; // Greater delay spread for longer overall animation

//   return (
//     <motion.div
//       className="absolute top-0 rounded-md"
//       style={{
//         width: size,
//         height: size * (Math.random() + 1),
//         backgroundColor: color,
//         left: `${xStart}%`,
//         zIndex: -1,
//       }}
//       initial={{ y: -10, rotate: 0, opacity: 1 }}
//       animate={{
//         y: ["0%", "150%"],
//         x: [`${-swayAmount / 2}px`, `${swayAmount / 2}px`],
//         rotate: [0, 180 * (Math.random() > 0.5 ? 1 : -1)],
//         opacity: [1, 0],
//       }}
//       transition={{
//         duration: fallDuration,
//         ease: "linear",
//         delay: delay,
//         times: [0, 1],
//         x: {
//           duration: fallDuration,
//           ease: "easeInOut",
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
//   const [isScrolled, setIsScrolled] = useState(false);
//   const containerRef = useRef(null);

//   // Reduced number of colors for better performance
//   const confettiColors = [
//     "#FFD700", // Gold
//     "#FF8C00", // Bright Orange
//     "#00FF88", // Bright Green
//     "#FF1493", // Deep Pink
//     "#FFC0CB" , // Pink // Bright Green
//     "#FFFF00", // Yellow
//   ];

//   // Throttled scroll handler for better performance
//   useEffect(() => {
//     let ticking = false;

//     const handleScroll = () => {
//       if (!ticking) {
//         window.requestAnimationFrame(() => {
//           const scrollPosition = window.scrollY;
//           setIsScrolled(scrollPosition > 100);
//           ticking = false;
//         });
//         ticking = true;
//       }
//     };

//     window.addEventListener("scroll", handleScroll);
//     // Initialize on mount
//     handleScroll();

//     return () => {
//       window.removeEventListener("scroll", handleScroll);
//     };
//   }, []);

//   // Optimized jackpot change detection with 5-second animation
//   useEffect(() => {
//     if (jackpot && jackpot > prevJackpot) {
//       // Reduced number of confetti particles for mobile
//       const particleCount = window.innerWidth < 768 ? 40 : 60;

//       // Generate new confetti elements
//       const newConfetti = Array.from({ length: particleCount }).map((_, i) => ({
//         id: `confetti-${Date.now()}-${i}`,
//         color:
//           confettiColors[Math.floor(Math.random() * confettiColors.length)],
//       }));

//       setConfetti(newConfetti);
//       setShowAnimation(true);

//       // Extended animation to 5 seconds as requested
//       const timer = setTimeout(() => {
//         setShowAnimation(false);
//       }, 5000);

//       return () => clearTimeout(timer);
//     }
//     setPrevJackpot(jackpot || 0);
//   }, [jackpot, prevJackpot]);

//   return (
//     <div
//       ref={containerRef}
//       className={`transition-all duration-500 ${
//         isScrolled
//           ? "fixed top-0 left-0 right-0 rounded-b-xl z-30"
//           : "absolute top-[207px] left-5 right-6 sm:left-16 sm:right-16 md:top-12 md:right-max z-10"
//       } ${showAnimation ? "z-[9999]" : ""}`}>
//       <motion.div
//         className={`bg-gradient-to-br ${
//           showAnimation
//             ? "z-50 from-yellow-400 via-yellow-600 to-orange-500"
//             : "from-[#1ec275] to-[#11d67a]"
//         } ${
//           isScrolled ? "rounded-b-lg" : "rounded-xl"
//         } p-1 md:p-0 shadow-lg overflow-hidden`}
//         layout
//         layoutId="jackpot-container"
//         animate={{
//           scale: showAnimation ? [1, 1.03, 1.02, 1.01, 1] : 1,
//           boxShadow: showAnimation
//             ? "0px 0px 12px rgba(255, 215, 0, 0.6)"
//             : "0px 0px 0px rgba(255, 215, 0, 0)",
//         }}
//         transition={{
//           layout: { duration: 0.3, ease: "easeOut" },
//           scale: { duration: 5, ease: "easeOut", times: [0, 0.1, 0.3, 0.7, 1] },
//           boxShadow: { duration: 5, ease: "easeOut" },
//         }}
//         whileHover={{ scale: isScrolled ? 1 : 1.02 }}>
//         <div className="text-center flex items-center justify-between relative h-[50px] md:h-[60px]">
//           <h3
//             className={`text-sm md:text-lg font-semibold text-white uppercase tracking-wide ml-3 ${
//               showAnimation ? "font-bold" : "font-semibold"
//             }`}>
//             Jackpot
//           </h3>

//           <motion.p
//             className="text-sm md:text-3xl font-bold text-white drop-shadow-md mx-2 md:mx-0"
//             animate={{
//               scale: showAnimation ? [1, 1.15, 1.1, 1.05, 1.02] : 1,
//               textShadow: showAnimation
//                 ? [
//                     "0px 0px 0px rgba(255,255,255,0)",
//                     "0px 0px 12px rgba(255,255,255,0.8)",
//                     "0px 0px 8px rgba(255,255,255,0.6)",
//                     "0px 0px 5px rgba(255,255,255,0.4)",
//                     "0px 0px 3px rgba(255,255,255,0.2)",
//                   ]
//                 : "0px 0px 0px rgba(255,255,255,0)",
//               color: showAnimation
//                 ? ["#FFFFFF", "#FFFF00", "#FFFFAA", "#FFFFDD", "#FFFFFF"]
//                 : "#FFFFFF",
//             }}
//             transition={{
//               duration: 5,
//               ease: "easeOut",
//               times: [0, 0.1, 0.3, 0.7, 1],
//             }}>
//             ${Number(jackpot || 0).toFixed(2)}
//           </motion.p>

//           <div className="md:flex md:justify-center md:gap-2 mr-3">
//             <motion.span
//               className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white"
//               animate={{
//                 backgroundColor: showAnimation
//                   ? [
//                       "rgba(255,255,255,0.2)",
//                       "rgba(255,255,255,0.4)",
//                       "rgba(255,255,255,0.3)",
//                       "rgba(255,255,255,0.2)",
//                     ]
//                   : "rgba(255,255,255,0.2)",
//               }}
//               transition={{
//                 duration: 5,
//                 ease: "easeOut",
//                 times: [0, 0.2, 0.7, 1],
//               }}>
//               Total Pool
//             </motion.span>
//           </div>

//           {/* Optimized confetti container with longer-lasting particles */}
//           <AnimatePresence>
//             {showAnimation && (
//               <div className="absolute inset-0 overflow-hidden pointer-events-none">
//                 {confetti.map((particle) => (
//                   <Confetti
//                     key={particle.id}
//                     color={particle.color}
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

// /*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************  */

// import React, { useState, useEffect, useRef } from "react";
// import { useSelector } from "react-redux";
// import { motion, AnimatePresence } from "framer-motion";

// // Optimized Confetti particle component with reduced complexity
// const Confetti = ({ color }) => {
//   const size = Math.random() * 6 + 3; // Slightly smaller for better performance
//   const xStart = Math.random() * 100;
//   const fallDuration = 1.5 + Math.random() * 0.5; // Shorter fall duration
//   const swayAmount = 30 + Math.random() * 30; // Reduced sway amount
//   const delay = Math.random() * 0.3; // Shorter delay

//   return (
//     <motion.div
//       className="absolute top-0 rounded-md"
//       style={{
//         width: size,
//         height: size * (Math.random() + 1), // Simpler height calculation
//         backgroundColor: color,
//         left: `${xStart}%`,
//         zIndex: -1,
//       }}
//       initial={{ y: -10, rotate: 0, opacity: 1 }}
//       animate={{
//         y: ["0%", "150%"],
//         x: [`${-swayAmount / 2}px`, `${swayAmount / 2}px`],
//         rotate: [0, 180 * (Math.random() > 0.5 ? 1 : -1)],
//         opacity: [1, 0],
//       }}
//       transition={{
//         duration: fallDuration,
//         ease: "linear",
//         delay: delay,
//         times: [0, 1],
//         x: {
//           duration: fallDuration,
//           ease: "easeInOut",
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
//   const [isScrolled, setIsScrolled] = useState(false);
//   const containerRef = useRef(null);

//   // Reduced number of colors for better performance
//   const confettiColors = [
//     "#FFD700", // Gold
//     "#FF8C00", // Bright Orange
//     "#00FF88", // Bright Green
//     "#FFFF00", // Yellow
//   ];

//   // Throttled scroll handler for better performance
//   useEffect(() => {
//     let ticking = false;

//     const handleScroll = () => {
//       if (!ticking) {
//         window.requestAnimationFrame(() => {
//           const scrollPosition = window.scrollY;
//           setIsScrolled(scrollPosition > 100);
//           ticking = false;
//         });
//         ticking = true;
//       }
//     };

//     window.addEventListener("scroll", handleScroll);
//     // Initialize on mount
//     handleScroll();

//     return () => {
//       window.removeEventListener("scroll", handleScroll);
//     };
//   }, []);

//   // Optimized jackpot change detection
//   useEffect(() => {
//     if (jackpot && jackpot > prevJackpot) {
//       // Reduced number of confetti particles for mobile
//       const particleCount = window.innerWidth < 768 ? 40 : 60;

//       // Generate new confetti elements
//       const newConfetti = Array.from({ length: particleCount }).map((_, i) => ({
//         id: `confetti-${Date.now()}-${i}`,
//         color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
//       }));

//       setConfetti(newConfetti);
//       setShowAnimation(true);

//       // Hide confetti after 2.5 seconds for better mobile performance
//       const timer = setTimeout(() => {
//         setShowAnimation(false);
//       }, 2500);

//       return () => clearTimeout(timer);
//     }
//     setPrevJackpot(jackpot || 0);
//   }, [jackpot, prevJackpot]);

//   return (
//     <div
//       ref={containerRef}
//       className={`transition-all duration-500 ${
//         isScrolled
//           ? "fixed top-0 left-0 right-0 rounded-b-xl z-30"
//           : "absolute top-[207px] left-5 right-6 sm:left-16 sm:right-16 md:top-12 md:right-max z-10"
//       } ${showAnimation ? "z-[9999]" : ""}`}
//     >
//       <motion.div
//         className={`bg-gradient-to-br ${
//           showAnimation
//             ? "z-50 from-yellow-400 via-yellow-600 to-orange-500"
//             : "from-[#1ec275] to-[#11d67a]"
//         } ${
//           isScrolled ? "rounded-b-lg" : "rounded-xl"
//         } p-1 md:p-0 shadow-lg overflow-hidden`}
//         layout
//         layoutId="jackpot-container"
//         animate={{
//           scale: showAnimation ? [1, 1.03, 1] : 1,
//           boxShadow: showAnimation
//             ? "0px 0px 12px rgba(255, 215, 0, 0.6)"
//             : "0px 0px 0px rgba(255, 215, 0, 0)",
//         }}
//         transition={{
//           layout: { duration: 0.3, ease: "easeOut" },
//           scale: { duration: 0.6, ease: "easeOut" },
//           boxShadow: { duration: 0.6, ease: "easeOut" },
//         }}
//         whileHover={{ scale: isScrolled ? 1 : 1.02 }}
//       >
//         <div className="text-center flex items-center justify-between relative h-[50px] md:h-[60px]">
//           <h3
//             className={`text-sm md:text-lg font-semibold text-white uppercase tracking-wide ml-3 ${
//               showAnimation ? "font-bold" : "font-semibold"
//             }`}>
//             Jackpot
//           </h3>

//           <motion.p
//             className="text-sm md:text-3xl font-bold text-white drop-shadow-md mx-2 md:mx-0"
//             animate={{
//               scale: showAnimation ? [1, 1.15, 1.1] : 1,
//               textShadow: showAnimation
//                 ? "0px 0px 8px rgba(255,255,255,0.6)"
//                 : "0px 0px 0px rgba(255,255,255,0)",
//               color: showAnimation
//                 ? ["#FFFFFF", "#FFFF00", "#FFFFFF"]
//                 : "#FFFFFF",
//             }}
//             transition={{
//               duration: 0.8,
//               ease: "easeOut",
//             }}>
//             ${Number(jackpot || 0).toFixed(2)}
//           </motion.p>

//           <div className="md:flex md:justify-center md:gap-2 mr-3">
//             <motion.span
//               className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm text-white"
//               animate={{
//                 backgroundColor: showAnimation
//                   ? "rgba(255,255,255,0.3)"
//                   : "rgba(255,255,255,0.2)",
//               }}
//               transition={{
//                 duration: 0.5,
//                 ease: "easeOut",
//               }}>
//               Total Pool
//             </motion.span>
//           </div>

//           {/* Optimized confetti container */}
//           <AnimatePresence>
//             {showAnimation && (
//               <div className="absolute inset-0 overflow-hidden pointer-events-none">
//                 {confetti.map((particle) => (
//                   <Confetti
//                     key={particle.id}
//                     color={particle.color}
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
//   const [isScrolled, setIsScrolled] = useState(false);
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

//   // Detect scroll position
//   useEffect(() => {
//     const handleScroll = () => {
//       const scrollPosition = window.scrollY;
//       // Adjust this threshold based on when you want the transition to happen
//       setIsScrolled(scrollPosition > 100);
//     };

//     window.addEventListener("scroll", handleScroll);
//     // Initialize on mount
//     handleScroll();

//     return () => {
//       window.removeEventListener("scroll", handleScroll);
//     };
//   }, []);

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
//     // <div
//     //   ref={containerRef}
//     //   className={`transition-all duration-300 ${
//     //     isScrolled
//     //       ? "fixed top-0 left-0 right-0 rounded-b-xl z-30 "
//     //       : "absolute top-[207px] left-5 right-6 sm:left-16 sm:right-16 md:top-12 md:right-max z-10"
//     //   }`}>
//     <div
//       ref={containerRef}
//       className={`transition-all duration-1000 ${
//         isScrolled
//           ? "fixed top-0 left-0 right-0 rounded-b-xl z-30"
//           : "absolute top-[207px] left-5 right-6 sm:left-16 sm:right-16 md:top-12 md:right-max z-10"
//       } ${showAnimation ? "z-[9999]" : ""}`}>
//       {/* <motion.div
//         className={`bg-gradient-to-br ${
//           showAnimation
//             ? "z-50 from-yellow-400 via-yellow-600 to-orange-500"
//             : "from-[#1ec275] to-[#11d67a]"
//         } ${
//           isScrolled ? "rounded-none" : "rounded-xl"
//         } p-1 md:p-6 shadow-lg transition-all duration-200 overflow-hidden`}
//         animate={{
//           scale: showAnimation ? [1, 1.1, 1.05] : 1,
//           height: showAnimation ? ["70px", "70px", "70px"] : "auto",
//           boxShadow: showAnimation
//             ? "0px 0px 20px rgba(255, 215, 0, 0.8)"
//             : "0px 0px 0px rgba(255, 215, 0, 0)",
//         }}
//         transition={{
//           duration: 3,
//           ease: [0.64, 0.57, 0.67, 1],
//         }}
//         whileHover={{ scale: isScrolled ? 1 : 1.05 }}>
//         <div className="text-center flex items-center justify-between relative">
//           <h3
//             className={`text-sm md:text-lg font-semibold text-white uppercase tracking-wide ${
//               showAnimation ? "font-extrabold" : "font-semibold "
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
//           </div> */}
//       <motion.div
//         className={`bg-gradient-to-br ${
//           showAnimation
//             ? "z-50 from-yellow-400 via-yellow-600 to-orange-500"
//             : "from-[#1ec275] to-[#11d67a]"
//         } ${
//           isScrolled ? "rounded-b-lg  " : "rounded-xl"
//         } p-1 md:p-0 shadow-lg transition-all duration-200 overflow-hidden`}
//         animate={{
//           scale: showAnimation ? [1, 1.07, 1.05]  : 1,
//           height: showAnimation ? (isScrolled ? "70px" : "auto") : "auto",
//           boxShadow: showAnimation
//             ? "0px 0px 20px rgba(255, 215, 0, 0.8)"
//             : "0px 0px 0px rgba(255, 215, 0, 0)",
//         }}
//         transition={{
//           duration: 3,
//           ease: "easeInOut",
//         }}
//         whileHover={{ scale: isScrolled ? 1 : 1.05 }}>
//         <div className="text-center flex items-center justify-between relative h-full">
//           <h3
//             className={`text-sm md:text-lg font-semibold text-white uppercase tracking-wide ${
//               showAnimation ? "font-extrabold " : "font-semibold "
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
