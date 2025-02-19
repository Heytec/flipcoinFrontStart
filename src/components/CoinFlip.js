// // // // // // // // // // // // // // src/components/CoinFlip.js
// src/components/CoinFlip.js
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const flipVariants = {
  hidden: { opacity: 0, rotateY: "0deg" },
  visible: (flipKeyframes) => ({
    opacity: 1,
    // Animate through the provided keyframes (converted to "deg" strings)
    rotateY: flipKeyframes.map((angle) => `${angle}deg`),
    transition: { duration: 3, ease: "easeInOut" },
  }),
};

export default function CoinFlip({ round }) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [flipKeyframes, setFlipKeyframes] = useState([]);
  const [displaySide, setDisplaySide] = useState("?");
  const flipTimeoutRef = useRef(null);
  // Use a ref to track the previous round ID so that we trigger the flip for every new round
  const prevRoundIdRef = useRef(null);

  // Cleanup any pending timeouts when the component unmounts
  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) {
        clearTimeout(flipTimeoutRef.current);
      }
    };
  }, []);

  // When a new round is received, start the flip if there's a new round ID with an outcome
  useEffect(() => {
    if (!round) return;

    if (round.outcome && round._id !== prevRoundIdRef.current) {
      setOutcome(round.outcome);
      setIsFlipping(true);
      prevRoundIdRef.current = round._id;
    }
  }, [round]);

  // Compute keyframes for the coin flip animation based on the outcome
  useEffect(() => {
    if (isFlipping && outcome) {
      const baseAngle =
        outcome === "tails" ? 180 : outcome === "house" ? 90 : 0;
      const fullFlips = Math.floor(Math.random() * 3) + 2; // between 2 and 4 flips
      const totalRotation = fullFlips * 360 + baseAngle;

      const keyframes = [
        0,
        totalRotation * 0.25,
        totalRotation * 0.5,
        totalRotation * 0.75,
        totalRotation - 30,
        totalRotation,
      ];
      setFlipKeyframes(keyframes);
    }
  }, [isFlipping, outcome]);

  // Update the displayed side at short intervals while flipping
  useEffect(() => {
    let intervalId;
    if (isFlipping) {
      intervalId = setInterval(() => {
        const sides = ["H", "T", "EDGE"];
        setDisplaySide(sides[Math.floor(Math.random() * sides.length)]);
      }, 100);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isFlipping]);

  // When the animation completes, show the final outcome (no callback needed)
  const handleAnimationComplete = () => {
    const finalDisplay =
      outcome === "heads"
        ? "H"
        : outcome === "tails"
        ? "T"
        : outcome === "house"
        ? "EDGE"
        : "?";
    setDisplaySide(finalDisplay);
    setIsFlipping(false);
    console.log("Animation complete. Outcome:", outcome);
  };

  const finalDisplay =
    outcome === "heads"
      ? "H"
      : outcome === "tails"
      ? "T"
      : outcome === "house"
      ? "EDGE"
      : "?";

  return (
    <div className="mt-4 flex justify-center">
      {isFlipping && outcome && flipKeyframes.length > 0 ? (
        <motion.div
          key="coin-flip"
          className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
          variants={flipVariants}
          initial="hidden"
          animate="visible"
          custom={flipKeyframes}
          onAnimationComplete={handleAnimationComplete}
        >
          {displaySide}
        </motion.div>
      ) : (
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
          {finalDisplay}
        </div>
      )}
    </div>
  );
}

// src/components/CoinFlip.js
// import React, { useEffect, useState, useRef } from "react";
// import { motion } from "framer-motion";

// const flipVariants = {
//   hidden: { opacity: 0, rotateY: "0deg" },
//   visible: (flipKeyframes) => ({
//     opacity: 1,
//     // Animate through the provided keyframes (converted to "deg" strings)
//     rotateY: flipKeyframes.map((angle) => `${angle}deg`),
//     transition: { duration: 3, ease: "easeInOut" },
//   }),
// };

// export default function CoinFlip({ round, onFlipComplete }) {
//   const [isFlipping, setIsFlipping] = useState(false);
//   const [outcome, setOutcome] = useState(null);
//   const [flipKeyframes, setFlipKeyframes] = useState([]);
//   const [displaySide, setDisplaySide] = useState("?");
//   const flipTimeoutRef = useRef(null);
//   // Use a ref to track the previous round ID so that we always trigger the flip on a new round
//   const prevRoundIdRef = useRef(null);

//   // Cleanup any pending timeouts when the component unmounts
//   useEffect(() => {
//     return () => {
//       if (flipTimeoutRef.current) {
//         clearTimeout(flipTimeoutRef.current);
//       }
//     };
//   }, []);

//   // When a new round is received, start the flip if there's a new round ID with an outcome
//   useEffect(() => {
//     if (!round) return;

//     if (round.outcome && round._id !== prevRoundIdRef.current) {
//       setOutcome(round.outcome);
//       setIsFlipping(true);
//       prevRoundIdRef.current = round._id;
//     }
//   }, [round]);

//   // Compute keyframes for the coin flip animation based on the outcome
//   useEffect(() => {
//     if (isFlipping && outcome) {
//       const baseAngle =
//         outcome === "tails" ? 180 : outcome === "house" ? 90 : 0;
//       const fullFlips = Math.floor(Math.random() * 3) + 2; // between 2 and 4 flips
//       const totalRotation = fullFlips * 360 + baseAngle;
      
//       const keyframes = [
//         0,
//         totalRotation * 0.25,
//         totalRotation * 0.5,
//         totalRotation * 0.75,
//         totalRotation - 30,
//         totalRotation,
//       ];
//       setFlipKeyframes(keyframes);
//     }
//   }, [isFlipping, outcome]);

//   // Update the displayed side at short intervals while flipping
//   useEffect(() => {
//     let intervalId;
//     if (isFlipping) {
//       intervalId = setInterval(() => {
//         const sides = ["H", "T", "EDGE"];
//         setDisplaySide(sides[Math.floor(Math.random() * sides.length)]);
//       }, 100);
//     }
//     return () => {
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [isFlipping]);

//   // When the animation completes, show the final outcome and trigger the callback
//   const handleAnimationComplete = () => {
//     const finalDisplay =
//       outcome === "heads"
//         ? "H"
//         : outcome === "tails"
//         ? "T"
//         : outcome === "house"
//         ? "EDGE"
//         : "?";
//     setDisplaySide(finalDisplay);
//     setIsFlipping(false);
//     console.log("Animation complete. Outcome:", outcome);
    
//     // Small delay before firing the callback to ensure a smooth transition
//     flipTimeoutRef.current = setTimeout(() => {
//       if (typeof onFlipComplete === "function") {
//         onFlipComplete();
//       }
//     }, 100);
//   };

//   const finalDisplay =
//     outcome === "heads"
//       ? "H"
//       : outcome === "tails"
//       ? "T"
//       : outcome === "house"
//       ? "EDGE"
//       : "?";

//   return (
//     <div className="mt-4 flex justify-center">
//       {isFlipping && outcome && flipKeyframes.length > 0 ? (
//         <motion.div
//           key="coin-flip"
//           className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//           variants={flipVariants}
//           initial="hidden"
//           animate="visible"
//           custom={flipKeyframes}
//           onAnimationComplete={handleAnimationComplete}
//         >
//           {displaySide}
//         </motion.div>
//       ) : (
//         <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
//           {finalDisplay}
//         </div>
//       )}
//     </div>
//   );
// }

// // src/components/CoinFlip.js
// import React, { useEffect, useState, useRef } from "react";
// import { motion } from "framer-motion";

// const flipVariants = {
//   hidden: { opacity: 0, rotateY: "0deg" },
//   visible: (flipKeyframes) => ({
//     opacity: 1,
//     // Animate through the provided keyframes (converted to "deg" strings)
//     rotateY: flipKeyframes.map((angle) => `${angle}deg`),
//     transition: { duration: 3, ease: "easeInOut" },
//   }),
// };

// export default function CoinFlip({ round, onFlipComplete }) {
//   const [isFlipping, setIsFlipping] = useState(false);
//   const [outcome, setOutcome] = useState(null);
//   const [flipKeyframes, setFlipKeyframes] = useState([]);
//   const [displaySide, setDisplaySide] = useState("?");
//   const prevOutcomeRef = useRef(null);
//   const flipTimeoutRef = useRef(null);

//   // Cleanup any pending timeouts when the component unmounts
//   useEffect(() => {
//     return () => {
//       if (flipTimeoutRef.current) {
//         clearTimeout(flipTimeoutRef.current);
//       }
//     };
//   }, []);

//   // When a new round is received, start the flip if there's a new outcome
//   useEffect(() => {
//     if (!round) return;
    
//     const realOutcome = round.outcome;
//     if (realOutcome && realOutcome !== prevOutcomeRef.current) {
//       setOutcome(realOutcome);
//       setIsFlipping(true);
//       prevOutcomeRef.current = realOutcome;
//     }
//   }, [round]);

//   // Compute keyframes for the coin flip animation based on the outcome
//   useEffect(() => {
//     if (isFlipping && outcome) {
//       const baseAngle =
//         outcome === "tails" ? 180 : outcome === "house" ? 90 : 0;
//       const fullFlips = Math.floor(Math.random() * 3) + 2; // between 2 and 4 flips
//       const totalRotation = fullFlips * 360 + baseAngle;
      
//       const keyframes = [
//         0,
//         totalRotation * 0.25,
//         totalRotation * 0.5,
//         totalRotation * 0.75,
//         totalRotation - 30,
//         totalRotation,
//       ];
//       setFlipKeyframes(keyframes);
//     }
//   }, [isFlipping, outcome]);

//   // Update the displayed side at short intervals while flipping
//   useEffect(() => {
//     let intervalId;
//     if (isFlipping) {
//       intervalId = setInterval(() => {
//         const sides = ["H", "T", "EDGE"];
//         setDisplaySide(sides[Math.floor(Math.random() * sides.length)]);
//       }, 100);
//     }
//     return () => {
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [isFlipping]);

//   // When the animation completes, show the final outcome and trigger the callback
//   const handleAnimationComplete = () => {
//     const finalDisplay =
//       outcome === "heads"
//         ? "H"
//         : outcome === "tails"
//         ? "T"
//         : outcome === "house"
//         ? "EDGE"
//         : "?";
//     setDisplaySide(finalDisplay);
//     setIsFlipping(false);
//     console.log("Animation complete. Outcome:", outcome);
    
//     // Small delay before firing the callback to ensure a smooth transition
//     flipTimeoutRef.current = setTimeout(() => {
//       if (typeof onFlipComplete === "function") {
//         onFlipComplete();
//       }
//     }, 100);
//   };

//   const finalDisplay =
//     outcome === "heads"
//       ? "H"
//       : outcome === "tails"
//       ? "T"
//       : outcome === "house"
//       ? "EDGE"
//       : "?";

//   return (
//     <div className="mt-4 flex justify-center">
//       {isFlipping && outcome && flipKeyframes.length > 0 ? (
//         <motion.div
//           key="coin-flip"
//           className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//           variants={flipVariants}
//           initial="hidden"
//           animate="visible"
//           custom={flipKeyframes}
//           onAnimationComplete={handleAnimationComplete}
//         >
//           {displaySide}
//         </motion.div>
//       ) : (
//         <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
//           {finalDisplay}
//         </div>
//       )}
//     </div>
//   );
// }


// // src/components/CoinFlip.js
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// const flipVariants = {
//   hidden: { opacity: 0, rotateY: "0deg" },
//   visible: (keyframes) => ({
//     opacity: 1,
//     rotateY: keyframes.map((angle) => `${angle}deg`),
//     transition: { duration: 3, ease: "easeInOut" },
//   }),
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// export default function CoinFlip({ round, onFlipComplete }) {
//   const [isFlipping, setIsFlipping] = useState(false);
//   const [outcome, setOutcome] = useState(null);
//   const [flipKeyframes, setFlipKeyframes] = useState([]);
//   const [displaySide, setDisplaySide] = useState("?");
//   const prevOutcomeRef = useRef(null);
//   const flipTimeoutRef = useRef(null);

//   // Clean up any pending timeouts
//   useEffect(() => {
//     return () => {
//       if (flipTimeoutRef.current) {
//         clearTimeout(flipTimeoutRef.current);
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (!round) return;
    
//     const realOutcome = round.outcome;
//     if (realOutcome && realOutcome !== prevOutcomeRef.current) {
//       setOutcome(realOutcome);
//       setIsFlipping(true);
//       prevOutcomeRef.current = realOutcome;
//     }
//   }, [round]);

//   useEffect(() => {
//     if (isFlipping && outcome) {
//       const baseAngle =
//         outcome === "tails" ? 180 : outcome === "house" ? 90 : 0;
//       const fullFlips = Math.floor(Math.random() * 3) + 2;
//       const totalRotation = fullFlips * 360 + baseAngle;
      
//       const keyframes = [
//         0,
//         totalRotation * 0.25,
//         totalRotation * 0.5,
//         totalRotation * 0.75,
//         totalRotation - 30,
//         totalRotation,
//       ];
//       setFlipKeyframes(keyframes);
//     }
//   }, [isFlipping, outcome]);

//   useEffect(() => {
//     let intervalId;
//     if (isFlipping) {
//       intervalId = setInterval(() => {
//         const sides = ["H", "T", "EDGE"];
//         setDisplaySide(sides[Math.floor(Math.random() * sides.length)]);
//       }, 100);
//     }
//     return () => {
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [isFlipping]);

//   const handleAnimationComplete = () => {
//     const finalDisplay =
//       outcome === "heads"
//         ? "H"
//         : outcome === "tails"
//         ? "T"
//         : outcome === "house"
//         ? "EDGE"
//         : "?";
//     setDisplaySide(finalDisplay);
//     setIsFlipping(false);
    
//     // Add a small delay before calling onFlipComplete to ensure smooth transition
//     flipTimeoutRef.current = setTimeout(() => {
//       if (typeof onFlipComplete === "function") {
//         onFlipComplete();
//       }
//     }, 100);
//   };

//   const finalDisplay =
//     outcome === "heads"
//       ? "H"
//       : outcome === "tails"
//       ? "T"
//       : outcome === "house"
//       ? "EDGE"
//       : "?";

//   return (
//     <div className="mt-4 flex justify-center">
//       <AnimatePresence>
//         {isFlipping && outcome && flipKeyframes.length > 0 && (
//           <motion.div
//             key="coin-flip"
//             className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//             custom={flipKeyframes}
//             variants={flipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={handleAnimationComplete}
//           >
//             {displaySide}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {!isFlipping && (
//         <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
//           {finalDisplay}
//         </div>
//       )}
//     </div>
//   );
// }







// import React, { useEffect, useState, useRef } from "react";

// import { motion, AnimatePresence } from "framer-motion";

// const flipVariants = {
//   hidden: { opacity: 0, rotateY: "0deg" },
//   visible: (keyframes) => ({
//     opacity: 1,
//     rotateY: keyframes.map((angle) => `${angle}deg`),
//     transition: { duration: 3, ease: "easeInOut" },
//   }),
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// export default function CoinFlip({ round, onFlipComplete }) {
//   const [isFlipping, setIsFlipping] = useState(false);
//   const [outcome, setOutcome] = useState(null);
//   const [flipKeyframes, setFlipKeyframes] = useState([]);
//   const [displaySide, setDisplaySide] = useState("?");
//   const prevOutcomeRef = useRef(null);
//   const flipTimeoutRef = useRef(null);

//   // Clean up any pending timeouts
//   useEffect(() => {
//     return () => {
//       if (flipTimeoutRef.current) {
//         clearTimeout(flipTimeoutRef.current);
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (!round) return;
    
//     const realOutcome = round.outcome;
//     if (realOutcome && realOutcome !== prevOutcomeRef.current) {
//       setOutcome(realOutcome);
//       setIsFlipping(true);
//       prevOutcomeRef.current = realOutcome;
//     }
//   }, [round]);

//   useEffect(() => {
//     if (isFlipping && outcome) {
//       const baseAngle = outcome === "tails" ? 180 : outcome === "house" ? 90 : 0;
//       const fullFlips = Math.floor(Math.random() * 3) + 2;
//       const totalRotation = fullFlips * 360 + baseAngle;
      
//       const keyframes = [
//         0,
//         totalRotation * 0.25,
//         totalRotation * 0.5,
//         totalRotation * 0.75,
//         totalRotation - 30,
//         totalRotation,
//       ];
//       setFlipKeyframes(keyframes);
//     }
//   }, [isFlipping, outcome]);

//   useEffect(() => {
//     let intervalId;
//     if (isFlipping) {
//       intervalId = setInterval(() => {
//         const sides = ["H", "T", "EDGE"];
//         setDisplaySide(sides[Math.floor(Math.random() * sides.length)]);
//       }, 100);
//     }
//     return () => {
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [isFlipping]);

//   const handleAnimationComplete = () => {
//     const finalDisplay = outcome === "heads" ? "H" : outcome === "tails" ? "T" : outcome === "house" ? "EDGE" : "?";
//     setDisplaySide(finalDisplay);
//     setIsFlipping(false);
    
//     // Add a small delay before calling onFlipComplete to ensure smooth transition
//     flipTimeoutRef.current = setTimeout(() => {
//       if (typeof onFlipComplete === "function") {
//         onFlipComplete();
//       }
//     }, 100);
//   };

//   const finalDisplay = outcome === "heads" ? "H" : outcome === "tails" ? "T" : outcome === "house" ? "EDGE" : "?";

//   return (
//     <div className="mt-4 flex justify-center">
//       <AnimatePresence>
//         {isFlipping && outcome && flipKeyframes.length > 0 && (
//           <motion.div
//             key="coin-flip"
//             className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//             custom={flipKeyframes}
//             variants={flipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={handleAnimationComplete}
//           >
//             {displaySide}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {!isFlipping && (
//         <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
//           {finalDisplay}
//         </div>
//       )}
//     </div>
//   );
// }
// // src/components/CoinFlip.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// const flipVariants = {
//   hidden: { opacity: 0, rotateY: "0deg" },
//   visible: (keyframes) => ({
//     opacity: 1,
//     // Convert keyframe numbers to strings with "deg"
//     rotateY: keyframes.map((angle) => `${angle}deg`),
//     transition: { duration: 3, ease: "easeInOut" },
//   }),
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// export default function CoinFlip({ round, onFlipComplete }) {
//   const [isFlipping, setIsFlipping] = useState(false);
//   const [outcome, setOutcome] = useState(null);
//   const [flipKeyframes, setFlipKeyframes] = useState([]);
//   // New state to display a random side while flipping
//   const [displaySide, setDisplaySide] = useState("?");
//   const prevOutcomeRef = useRef(null);

//   // Trigger the flip when a new round outcome is received.
//   useEffect(() => {
//     if (!round) return;
//     const realOutcome = round.outcome; // "heads", "tails", or "house"
//     // Always trigger the flip regardless of previous outcome.
//     if (realOutcome) {
//       setOutcome(realOutcome);
//       setIsFlipping(true);
//       prevOutcomeRef.current = realOutcome; // Update the previous outcome.
//     }
//   }, [round]);

//   // Compute the keyframes for the rotation animation.
//   useEffect(() => {
//     if (isFlipping && outcome) {
//       const baseAngle =
//         outcome === "tails" ? 180 : outcome === "house" ? 90 : 0;
//       // Choose a random number of full rotations (2 to 4 flips)
//       const fullFlips = Math.floor(Math.random() * 3) + 2;
//       const totalRotation = fullFlips * 360 + baseAngle;
//       // Keyframes for a smooth landing effect
//       const keyframes = [
//         0,
//         totalRotation * 0.25,
//         totalRotation * 0.5,
//         totalRotation * 0.75,
//         totalRotation - 30, // pre-final angle
//         totalRotation, // final angle landing on the correct face
//       ];
//       setFlipKeyframes(keyframes);
//     }
//   }, [isFlipping, outcome]);

//   // During the flip, update displaySide every 100ms to show a random outcome.
//   useEffect(() => {
//     let intervalId;
//     if (isFlipping) {
//       intervalId = setInterval(() => {
//         const sides = ["H", "T", "EDGE"];
//         setDisplaySide(sides[Math.floor(Math.random() * sides.length)]);
//       }, 100);
//     }
//     return () => {
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [isFlipping]);

//   // Determine the final display based on the outcome.
//   const finalDisplay =
//     outcome === "heads"
//       ? "H"
//       : outcome === "tails"
//       ? "T"
//       : outcome === "house"
//       ? "EDGE"
//       : "?";

//   return (
//     <div className="mt-4 flex justify-center">
//       <AnimatePresence>
//         {isFlipping && outcome && flipKeyframes.length > 0 && (
//           <motion.div
//             key="coin-flip"
//             className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//             custom={flipKeyframes}
//             variants={flipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               // When animation completes, show the final outcome.
//               setDisplaySide(finalDisplay);
//               setIsFlipping(false);
//               if (typeof onFlipComplete === "function") {
//                 onFlipComplete();
//               }
//             }}
//           >
//             {displaySide}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* When not flipping, show the coin with the final outcome */}
//       {!isFlipping && (
//         <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
//           {finalDisplay}
//         </div>
//       )}
//     </div>
//   );
// }

// // src/components/CoinFlip.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// const flipVariants = {
//   hidden: { opacity: 0, rotateY: 0 },
//   visible: (keyframes) => ({
//     opacity: 1,
//     // If needed, append "deg" (e.g. keyframes.map(frame => `${frame}deg`))
//     rotateY: keyframes,
//     transition: { duration: 3, ease: "easeInOut" },
//   }),
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// export default function CoinFlip({ round, onFlipComplete }) {
//   const [isFlipping, setIsFlipping] = useState(false);
//   const [outcome, setOutcome] = useState(null);
//   const [flipKeyframes, setFlipKeyframes] = useState([]);
//   // New state to display a random side while flipping
//   const [displaySide, setDisplaySide] = useState("?");
//   const prevOutcomeRef = useRef(null);

//   // Trigger the flip when a new round outcome is received.
//   useEffect(() => {
//     if (!round) return;
//     const realOutcome = round.outcome; // "heads", "tails", or "house"
//     const prevOutcome = prevOutcomeRef.current;

//     // Ensure we trigger a new flip only when the outcome has actually changed
//     if (realOutcome && realOutcome !== prevOutcome) {
//       setOutcome(realOutcome);
//       setIsFlipping(true);
//       prevOutcomeRef.current = realOutcome;
//     }
//   }, [round]);

//   // Compute the keyframes for the rotation animation.
//   useEffect(() => {
//     if (isFlipping && outcome) {
//       const baseAngle =
//         outcome === "tails" ? 180 : outcome === "house" ? 90 : 0;
//       // Choose a random number of full rotations (2 to 4 flips)
//       const fullFlips = Math.floor(Math.random() * 3) + 2;
//       const totalRotation = fullFlips * 360 + baseAngle;
//       // Keyframes for a smooth landing effect
//       const keyframes = [
//         0,
//         totalRotation * 0.25,
//         totalRotation * 0.5,
//         totalRotation * 0.75,
//         totalRotation - 30, // pre-final angle
//         totalRotation, // final angle landing on the correct face
//       ];
//       setFlipKeyframes(keyframes);
//     }
//   }, [isFlipping, outcome]);

//   // During the flip, update displaySide every 100ms to show a random outcome.
//   useEffect(() => {
//     let intervalId;
//     if (isFlipping) {
//       intervalId = setInterval(() => {
//         const sides = ["H", "T", "EDGE"];
//         setDisplaySide(sides[Math.floor(Math.random() * sides.length)]);
//       }, 100);
//     }
//     return () => {
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [isFlipping]);

//   // Determine the final display based on the outcome.
//   const finalDisplay =
//     outcome === "heads"
//       ? "H"
//       : outcome === "tails"
//       ? "T"
//       : outcome === "house"
//       ? "EDGE"
//       : "?";

//   return (
//     <div className="mt-4 flex justify-center">
//       <AnimatePresence>
//         {isFlipping && outcome && flipKeyframes.length > 0 && (
//           <motion.div
//             key="coin-flip"
//             className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//             custom={flipKeyframes}
//             variants={flipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               // Ensure the onAnimationComplete callback only runs once.
//               setDisplaySide(finalDisplay);
//               setIsFlipping(false);
//               if (typeof onFlipComplete === "function") {
//                 onFlipComplete();
//               }
//             }}
//           >
//             {displaySide}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* When not flipping, show the coin with the final outcome */}
//       {!isFlipping && (
//         <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
//           {finalDisplay}
//         </div>
//       )}
//     </div>
//   );
// }

// // src/components/CoinFlip.jsx
// // src/components/CoinFlip.jsx
// // src/components/CoinFlip.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// const flipVariants = {
//   hidden: { opacity: 0, rotateY: 0 },
//   visible: (keyframes) => ({
//     opacity: 1,
//     rotateY: keyframes,
//     transition: { duration: 3, ease: "easeInOut" },
//   }),
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// export default function CoinFlip({ round, onFlipComplete }) {
//   const [isFlipping, setIsFlipping] = useState(false);
//   const [outcome, setOutcome] = useState(null);
//   const [flipKeyframes, setFlipKeyframes] = useState([]);
//   // New state to display a random side while flipping
//   const [displaySide, setDisplaySide] = useState("?");
//   const prevOutcomeRef = useRef(null);

//   // Trigger the flip when a new round outcome is received.
//   useEffect(() => {
//     if (!round) return;
//     const realOutcome = round.outcome; // "heads", "tails", or "house"
//     const prevOutcome = prevOutcomeRef.current;

//     if (realOutcome && realOutcome !== prevOutcome) {
//       setOutcome(realOutcome);
//       setIsFlipping(true);
//       prevOutcomeRef.current = realOutcome;
//     }
//   }, [round]);

//   // Compute the keyframes for the rotation animation.
//   useEffect(() => {
//     if (isFlipping && outcome) {
//       const baseAngle =
//         outcome === "tails" ? 180 : outcome === "house" ? 90 : 0;
//       // Choose a random number of full rotations (2 to 4 flips)
//       const fullFlips = Math.floor(Math.random() * 3) + 2;
//       const totalRotation = fullFlips * 360 + baseAngle;
//       // Keyframes for a smooth landing effect
//       const keyframes = [
//         0,
//         totalRotation * 0.25,
//         totalRotation * 0.5,
//         totalRotation * 0.75,
//         totalRotation - 30, // pre-final angle
//         totalRotation, // final angle landing on the correct face
//       ];
//       setFlipKeyframes(keyframes);
//     }
//   }, [isFlipping, outcome]);

//   // During the flip, update displaySide every 100ms to show a random outcome.
//   useEffect(() => {
//     let intervalId;
//     if (isFlipping) {
//       intervalId = setInterval(() => {
//         const sides = ["H", "T", "EDGE"];
//         setDisplaySide(sides[Math.floor(Math.random() * sides.length)]);
//       }, 100);
//     }
//     return () => {
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [isFlipping]);

//   // Determine the final display based on the outcome.
//   const finalDisplay =
//     outcome === "heads"
//       ? "H"
//       : outcome === "tails"
//       ? "T"
//       : outcome === "house"
//       ? "EDGE"
//       : "?";

//   return (
//     <div className="mt-4 flex justify-center">
//       <AnimatePresence>
//         {isFlipping && outcome && flipKeyframes.length > 0 && (
//           <motion.div
//             key="coin-flip"
//             className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//             custom={flipKeyframes}
//             variants={flipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               // When animation completes, show the final outcome
//               setDisplaySide(finalDisplay);
//               setIsFlipping(false);
//               if (typeof onFlipComplete === "function") {
//                 onFlipComplete();
//               }
//             }}
//           >
//             {displaySide}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* When not flipping, show the coin with the final outcome */}
//       {!isFlipping && (
//         <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
//           {finalDisplay}
//         </div>
//       )}
//     </div>
//   );
// }

// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// const flipVariants = {
//   hidden: { opacity: 0, rotateY: 0 },
//   visible: (keyframes) => ({
//     opacity: 1,
//     rotateY: keyframes,
//     transition: { duration: 3, ease: "easeInOut" },
//   }),
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// export default function CoinFlip({ round }) {
//   const [isFlipping, setIsFlipping] = useState(false);
//   const [outcome, setOutcome] = useState(null);
//   const [flipKeyframes, setFlipKeyframes] = useState([]);
//   const prevOutcomeRef = useRef(null);

//   const betsClosed =
//     round && round.countdownEndTime
//       ? Date.now() >= new Date(round.countdownEndTime).getTime()
//       : false;

//   useEffect(() => {
//     if (!round) return;
//     const realOutcome = round.outcome; // may be null or "heads"/"tails"/"house"
//     const prevOutcome = prevOutcomeRef.current;

//     if (realOutcome && realOutcome !== prevOutcome) {
//       setOutcome(realOutcome);
//       setIsFlipping(true);
//       prevOutcomeRef.current = realOutcome;
//     } else if (!realOutcome && betsClosed) {
//       if (!isFlipping) {
//         const possible = ["heads", "tails", "house"];
//         const randomOutcome =
//           possible[Math.floor(Math.random() * possible.length)];
//         setOutcome(randomOutcome);
//         setIsFlipping(true);
//       }
//     }
//   }, [round, betsClosed, isFlipping]);

//   useEffect(() => {
//     if (isFlipping && outcome) {
//       // Determine the base angle for the outcome.
//       const baseAngle =
//         outcome === "tails" ? 180 : outcome === "house" ? 90 : 0;
//       // Choose a random number of full flips (2-4 full rotations)
//       const fullFlips = Math.floor(Math.random() * 3) + 2;
//       const totalRotation = fullFlips * 360 + baseAngle;

//       // Add an extra keyframe so that the coin gets to a "pre-final" angle,
//       // then snaps to the final value.
//       const keyframes = [
//         0,
//         totalRotation * 0.25,
//         totalRotation * 0.5,
//         totalRotation * 0.75,
//         totalRotation - 30, // pre-final angle (adjust the offset as needed)
//         totalRotation, // final rotation landing on the correct face
//       ];
//       setFlipKeyframes(keyframes);
//     }
//   }, [isFlipping, outcome]);

//   return (
//     <div className="mt-4 flex justify-center">
//       <AnimatePresence>
//         {isFlipping && outcome && flipKeyframes.length > 0 && (
//           <motion.div
//             key={outcome} // re-run animation on outcome change
//             className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//             custom={flipKeyframes}
//             variants={flipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               // Stop flipping when the animation completes.
//               setIsFlipping(false);
//             }}
//           >
//             {outcome === "heads"
//               ? "H"
//               : outcome === "tails"
//               ? "T"
//               : outcome === "house"
//               ? "EDGE"
//               : "?"}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {!isFlipping && (
//         <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
//           {outcome
//             ? outcome === "heads"
//               ? "H"
//               : outcome === "tails"
//               ? "T"
//               : outcome === "house"
//               ? "EDGE"
//               : "?"
//             : "?"}
//         </div>
//       )}
//     </div>
//   );
// }


// // src/components/CoinFlip.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // We'll update our variant to accept an array of keyframes.
// const flipVariants = {
//   hidden: { opacity: 0, rotateY: 0 },
//   visible: (keyframes) => ({
//     opacity: 1,
//     rotateY: keyframes,
//     transition: { duration: 3, ease: "easeInOut" },
//   }),
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// export default function CoinFlip({ round }) {
//   // Controls whether we are animating.
//   const [isFlipping, setIsFlipping] = useState(false);
//   // The outcome to use for the animation (real or simulated)
//   const [outcome, setOutcome] = useState(null);
//   // The keyframes for the flip rotation.
//   const [flipKeyframes, setFlipKeyframes] = useState([]);

//   // To track previous outcome (so we animate when it changes)
//   const prevOutcomeRef = useRef(null);

//   // Check if bets are closed.
//   const betsClosed = round && round.countdownEndTime 
//     ? Date.now() >= new Date(round.countdownEndTime).getTime()
//     : false;

//   // When the round updates, trigger the animation either when:
//   // 1. A real outcome is provided and it changed, OR
//   // 2. Bets are closed and no outcome is yet available (simulate a flip).
//   useEffect(() => {
//     if (!round) return;
//     const realOutcome = round.outcome; // may be null or "heads"/"tails"/"house"
//     const prevOutcome = prevOutcomeRef.current;

//     if (realOutcome && realOutcome !== prevOutcome) {
//       // Use the real outcome.
//       setOutcome(realOutcome);
//       setIsFlipping(true);
//       prevOutcomeRef.current = realOutcome;
//     } else if (!realOutcome && betsClosed) {
//       // Bets are closed but no outcome yet; simulate one.
//       // Only trigger if we’re not already flipping.
//       if (!isFlipping) {
//         const possible = ["heads", "tails", "house"];
//         const randomOutcome =
//           possible[Math.floor(Math.random() * possible.length)];
//         setOutcome(randomOutcome);
//         setIsFlipping(true);
//       }
//     }
//   }, [round, betsClosed, isFlipping]);

//   // Whenever we start flipping (with a determined outcome), compute random keyframes.
//   useEffect(() => {
//     if (isFlipping && outcome) {
//       // Determine the base angle for the outcome.
//       const baseAngle =
//         outcome === "tails" ? 180 : outcome === "house" ? 90 : 0;
//       // Choose a random number of full flips (between 2 and 4, for example)
//       const fullFlips = Math.floor(Math.random() * 3) + 2; // 2,3,or 4
//       const totalRotation = fullFlips * 360 + baseAngle;
//       // Create an array of keyframes for a smooth animation.
//       const keyframes = [
//         0,
//         totalRotation * 0.25,
//         totalRotation * 0.5,
//         totalRotation * 0.75,
//         totalRotation,
//       ];
//       setFlipKeyframes(keyframes);
//     }
//   }, [isFlipping, outcome]);

//   return (
//     <div className="mt-4 flex justify-center">
//       <AnimatePresence>
//         {isFlipping && outcome && flipKeyframes.length > 0 && (
//           <motion.div
//             key={outcome} // ensures a re-animation on outcome change
//             className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//             custom={flipKeyframes}
//             variants={flipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               // Stop flipping when the animation completes.
//               setIsFlipping(false);
//             }}
//           >
//             {outcome === "heads"
//               ? "H"
//               : outcome === "tails"
//               ? "T"
//               : outcome === "house"
//               ? "EDGE"
//               : "?"}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {!isFlipping && (
//         <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
//           {outcome ? (outcome === "heads" ? "H" : outcome === "tails" ? "T" : outcome === "house" ? "EDGE" : "?") : "?"}
//         </div>
//       )}
//     </div>
//   );
// }

// // src/components/CoinFlip.jsx

// // src/components/CoinFlip.jsx
// // src/components/CoinFlip.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// const flipVariants = {
//   hidden: { opacity: 0, rotateY: 0 },
//   visible: (finalRotate) => ({
//     opacity: 1,
//     // Example multi-rotation: do 3 full flips, then settle at finalRotate
//     rotateY: [0, 360, 720, 1080, finalRotate],
//     transition: { duration: 3, ease: "easeInOut" },
//   }),
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// export default function CoinFlip({ round }) {
//   // Should we show the flipping animation?
//   const [isFlipping, setIsFlipping] = useState(false);
//   // The final outcome (heads/tails/house)
//   const [outcome, setOutcome] = useState(null);

//   // We keep track of the old outcome to detect a change
//   const prevOutcomeRef = useRef(null);

//   useEffect(() => {
//     if (!round) return;
//     const newOutcome = round.outcome; // might be null or "heads"/"tails"/"house"
//     const oldOutcome = prevOutcomeRef.current;

//     // If the new outcome is defined and different from old => trigger animation
//     if (newOutcome && newOutcome !== oldOutcome) {
//       setOutcome(newOutcome);
//       setIsFlipping(true);
//     }
//     prevOutcomeRef.current = newOutcome;
//   }, [round]);

//   // Determine final rotation
//   let finalRotate = 0;
//   if (outcome === "tails") {
//     finalRotate = 180;
//   } else if (outcome === "house") {
//     // example: 90 deg for "edge"
//     finalRotate = 90;
//   }
//   // "heads" => 0 deg (face up)

//   return (
//     <div className="mt-4 flex justify-center">
//       <AnimatePresence>
//         {isFlipping && outcome && (
//           <motion.div
//             key={outcome} // important for AnimatePresence
//             className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//             custom={finalRotate}
//             variants={flipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               // Once animation ends, we stop flipping
//               setIsFlipping(false);
//             }}
//           >
//             {outcome === "heads"
//               ? "H"
//               : outcome === "tails"
//               ? "T"
//               : outcome === "house"
//               ? "EDGE"
//               : "?"}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {!isFlipping && (
//         <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
//           {outcome || "?"}
//         </div>
//       )}
//     </div>
//   );
// }


// src/components/CoinFlip.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Updated variants: transition duration is now 5 seconds.
// const flipVariants = {
//   hidden: { rotateY: 0, opacity: 0 },
//   visible: (finalAngle) => ({
//     // Multiple spins and then settle at finalAngle.
//     rotateY: [0, 360, 720, finalAngle],
//     opacity: 1,
//     transition: { duration: 5, ease: "easeInOut" }, // <-- 5 seconds duration
//   }),
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// function CoinFlip({ round }) {
//   const [animating, setAnimating] = useState(false);
//   const [displayOutcome, setDisplayOutcome] = useState(null);
//   const prevRoundId = useRef(null);

//   useEffect(() => {
//     if (!round) return;

//     // Reset state when a new round starts.
//     if (prevRoundId.current !== round._id) {
//       setDisplayOutcome(null);
//       setAnimating(false);
//       prevRoundId.current = round._id;
//     }

//     // When a new outcome is available, trigger the animation.
//     if (round.outcome && round.outcome !== displayOutcome) {
//       setDisplayOutcome(round.outcome);
//       setAnimating(true);
//     }
//   }, [round, displayOutcome]);

//   // Set final rotation based on outcome:
//   // Heads: 0°; Tails: 180°; House: 90° (edge)
//   let finalAngle = 0;
//   if (displayOutcome === "tails") {
//     finalAngle = 180;
//   } else if (displayOutcome === "house") {
//     finalAngle = 90;
//   }

//   return (
//     // Adding perspective for proper 3D rotation view.
//     <div className="mt-4 flex justify-center" style={{ perspective: 1000 }}>
//       <AnimatePresence>
//         {animating && displayOutcome && (
//           <motion.div
//             key={displayOutcome + "_anim"} // Forces re-mount when outcome changes
//             className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//             custom={finalAngle} // Pass the final angle to the variants
//             variants={flipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             style={{ transformStyle: "preserve-3d" }} // Ensure 3D transforms are preserved
//             onAnimationComplete={() => setAnimating(false)}
//           >
//             {displayOutcome === "heads"
//               ? "H"
//               : displayOutcome === "tails"
//               ? "T"
//               : displayOutcome === "house"
//               ? "Edge"
//               : "?"}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Display static coin face when not animating */}
//       {!animating && (
//         <div
//           className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold"
//           style={{ transformStyle: "preserve-3d" }}
//         >
//           {displayOutcome === "heads"
//             ? "H"
//             : displayOutcome === "tails"
//             ? "T"
//             : displayOutcome === "house"
//             ? "Edge"
//             : "?"}
//         </div>
//       )}
//     </div>
//   );
// }

// export default CoinFlip;


// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // A variant setup with multiple rotations
// const flipVariants = {
//   hidden: { rotateY: 0, opacity: 0 },
//   visible: (finalAngle) => ({
//     rotateY: [0, 360, 720, finalAngle], // multiple spins, then final angle
//     opacity: 1,
//     transition: { duration: 3, ease: "easeInOut" },
//   }),
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// /**
//  * CoinFlip:
//  *  - Watches round.outcome
//  *  - When outcome changes from null/previous to "heads"/"tails"/"house",
//  *    triggers an animation spin.
//  */
// function CoinFlip({ round }) {
//   const [outcome, setOutcome] = useState(null);
//   const [animating, setAnimating] = useState(false);
//   const prevOutcomeRef = useRef(null);

//   useEffect(() => {
//     if (!round) return;

//     // If outcome changes
//     if (round.outcome && round.outcome !== prevOutcomeRef.current) {
//       setOutcome(round.outcome);
//       setAnimating(true);
//     }
//     prevOutcomeRef.current = round.outcome;
//   }, [round]);

//   // Decide final rotation for each outcome
//   let finalAngle = 0;
//   if (outcome === "tails") {
//     finalAngle = 180; // flip 180° for tails
//   } else if (outcome === "house") {
//     finalAngle = 90; // an edge
//   }

//   return (
//     <div className="mt-4 flex justify-center">
//       <AnimatePresence>
//         {animating && outcome && (
//           <motion.div
//             key={outcome} // forces re-mount when outcome changes
//             className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//             custom={finalAngle} // pass final rotation to variants
//             variants={flipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               // Once the spin finishes, show static face
//               setAnimating(false);
//             }}
//           >
//             {outcome === "heads"
//               ? "H"
//               : outcome === "tails"
//               ? "T"
//               : outcome === "house"
//               ? "Edge"
//               : "?"}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* If not animating, show a static coin face */}
//       {!animating && (
//         <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold">
//           {/* If outcome is null, show ?, else show the final outcome symbol */}
//           {outcome === "heads"
//             ? "H"
//             : outcome === "tails"
//             ? "T"
//             : outcome === "house"
//             ? "Edge"
//             : "?"}
//         </div>
//       )}
//     </div>
//   );
// }

// export default CoinFlip;

// // src/components/CoinFlip.js
// src/components/CoinFlip.jsx
// import React, { useEffect, useState, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// const flipVariants = {
//   hidden: { opacity: 0, rotateY: 0 },
//   visible: (finalRotate) => ({
//     opacity: 1,
//     rotateY: [0, 360, 720, finalRotate],
//     transition: { duration: 2, ease: 'easeInOut' },
//   }),
//   exit: { opacity: 0 },
// };

// export default function CoinFlip({ round }) {
//   const [outcome, setOutcome] = useState(null);
//   const [flip, setFlip] = useState(false);
//   const prevOutcomeRef = useRef(null);

//   useEffect(() => {
//     if (round?.outcome && round.outcome !== prevOutcomeRef.current) {
//       setOutcome(round.outcome);
//       setFlip(true);
//     }
//     prevOutcomeRef.current = round?.outcome;
//   }, [round]);

//   let finalRotate = 0;
//   if (outcome === 'tails') finalRotate = 180;
//   if (outcome === 'house') finalRotate = 90;

//   return (
//     <div className="mt-4 flex justify-center">
//       <AnimatePresence>
//         {flip && outcome && (
//           <motion.div
//             key={outcome}
//             className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold"
//             custom={finalRotate}
//             variants={flipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => setFlip(false)}
//           >
//             {outcome === 'heads'
//               ? 'H'
//               : outcome === 'tails'
//               ? 'T'
//               : outcome === 'house'
//               ? 'Edge'
//               : '?'}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {!flip && (
//         <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
//           {outcome || '?'}
//         </div>
//       )}
//     </div>
//   );
// }



///////////////////////////////////////  ##############################################  last working 
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // Define dynamic variants that use a custom property for final rotation.
// const finalCoinFlipVariants = {
//   hidden: { rotateY: 0, rotateX: 0, opacity: 0 },
//   visible: (custom) => ({
//     // Rotate several full turns then settle on the final rotation.
//     // The array shows a multi-flip (full 360° turns) then ends on the correct side.
//     rotateY: [0, 360, 720, 1080, 1440, custom.finalRotateY],
//     rotateX: [0, 0, 0, 0, 0, custom.finalRotateX],
//     opacity: 1,
//     transition: { duration: 5, ease: "easeInOut" },
//   }),
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// function CoinFlip({ round }) {
//   const [showFinalFlip, setShowFinalFlip] = useState(false);
//   const [finalResult, setFinalResult] = useState(null);

//   // Use a ref to track the previous outcome so we only animate on changes.
//   const prevOutcomeRef = useRef(null);

//   useEffect(() => {
//     if (!round) return;

//     const newOutcome = round.outcome;
//     const oldOutcome = prevOutcomeRef.current;

//     console.log("CoinFlip -> newOutcome:", newOutcome, "oldOutcome:", oldOutcome);

//     // If the outcome changed from null (or a different value) start the flip.
//     if (newOutcome && newOutcome !== oldOutcome) {
//       setFinalResult(newOutcome);
//       setShowFinalFlip(true);
//     }

//     // If outcome is null or remains the same, don’t run the animation.
//     if (!newOutcome || newOutcome === oldOutcome) {
//       setShowFinalFlip(false);
//     }

//     // Remember this new outcome for the next render.
//     prevOutcomeRef.current = newOutcome;
//   }, [round]);

//   // Determine the final rotation values based on the outcome.
//   let finalRotateY = 0;
//   let finalRotateX = 0;
//   if (finalResult === "tails") {
//     finalRotateY = 180; // For tails, finish rotated 180° (showing the backside).
//   } else if (finalResult === "house") {
//     // For a coin edge, you might tilt it on the X axis.
//     finalRotateX = 90;
//     finalRotateY = 0; // or any value that makes sense for your design
//   }
//   // For heads (or any other value), we can keep finalRotateY at 0.

//   return (
//     <div className="mt-4 flex justify-center">
//       {/* If not flipping, show the static face (or a "?" if outcome is not yet determined) */}
//       {!showFinalFlip && (
//         <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold">
//           {finalResult === "heads"
//             ? "H"
//             : finalResult === "tails"
//             ? "T"
//             : finalResult === "house"
//             ? "Edge"
//             : "?"}
//         </div>
//       )}

//       {/* AnimatePresence handles mounting/unmounting with animations */}
//       <AnimatePresence>
//         {showFinalFlip && finalResult && (
//           <motion.div
//             key={finalResult}
//             className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold"
//             custom={{ finalRotateY, finalRotateX }} // Pass the custom final rotations to the variant
//             variants={finalCoinFlipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               setShowFinalFlip(false);
//             }}
//           >
//             {finalResult === "heads"
//               ? "H"
//               : finalResult === "tails"
//               ? "T"
//               : finalResult === "house"
//               ? "Edge"
//               : "?"}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// /**
//  * Use React.memo() to avoid unnecessary re-renders unless round.outcome changes.
//  */
// function propsAreEqual(prevProps, nextProps) {
//   const prevOutcome = prevProps.round?.outcome || null;
//   const nextOutcome = nextProps.round?.outcome || null;
//   return prevOutcome === nextOutcome;
// }

// export default React.memo(CoinFlip, propsAreEqual);




// // src/components/CoinFlip.js
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // A 5-second multi-flip animation
// const finalCoinFlipVariants = {
//   hidden: { rotateY: 0, opacity: 0 },
//   visible: {
//     rotateY: [0, 360, 720, 1080, 1440, 1800],
//     opacity: 1,
//     transition: { duration: 5, ease: "easeInOut" },
//   },
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// function CoinFlip({ round }) {
//   const [showFinalFlip, setShowFinalFlip] = useState(false);
//   const [finalResult, setFinalResult] = useState(null);

//   // Keep track of the previous outcome so we only animate on actual changes.
//   const prevOutcomeRef = useRef(null);

//   useEffect(() => {
//     if (!round) return;

//     const newOutcome = round.outcome;
//     const oldOutcome = prevOutcomeRef.current;

//     console.log("CoinFlip -> newOutcome:", newOutcome, "oldOutcome:", oldOutcome);

//     // If outcome changed from null to heads/tails/house => start the flip
//     if (newOutcome && newOutcome !== oldOutcome) {
//       setFinalResult(newOutcome);
//       setShowFinalFlip(true);
//     }

//     // If outcome is null or the same as old => we stop flipping
//     if (!newOutcome || newOutcome === oldOutcome) {
//       setShowFinalFlip(false);
//     }

//     // Remember this new outcome for next render
//     prevOutcomeRef.current = newOutcome;
//   }, [round]);

//   return (
//     <div className="mt-4 flex justify-center">
//       {/* If not flipping, show static face or "?" if outcome is null */}
//       {!showFinalFlip && (
//         <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold">
//           {finalResult === "heads"
//             ? "H"
//             : finalResult === "tails"
//             ? "T"
//             : finalResult === "house"
//             ? "Edge"
//             : "?"}
//         </div>
//       )}

//       {/* AnimatePresence for the final flip */}
//       <AnimatePresence>
//         {showFinalFlip && finalResult && (
//           <motion.div
//             key={finalResult}
//             className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold"
//             variants={finalCoinFlipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               setShowFinalFlip(false);
//             }}
//           >
//             {finalResult === "heads"
//               ? "H"
//               : finalResult === "tails"
//               ? "T"
//               : finalResult === "house"
//               ? "Edge"
//               : "?"}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// /**
//  * Use React.memo() to avoid re-renders unless round.outcome changes.
//  *
//  * propsAreEqual compares the old and new round.outcome:
//  * - If they are the same, skip re-render.
//  * - If they differ, re-render to show the new flip.
//  */
// function propsAreEqual(prevProps, nextProps) {
//   const prevOutcome = prevProps.round?.outcome || null;
//   const nextOutcome = nextProps.round?.outcome || null;
//   return prevOutcome === nextOutcome;
// }

// export default React.memo(CoinFlip, propsAreEqual);


// // src/components/CoinFlip.js
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// const finalCoinFlipVariants = {
//   hidden: { rotateY: 0, opacity: 0 },
//   visible: {
//     rotateY: [0, 360, 720, 1080, 1440, 1800], // 5 full spins
//     opacity: 1,
//     transition: { duration: 5, ease: "easeInOut" },
//   },
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// function CoinFlip({ round }) {
//   const [showFinalFlip, setShowFinalFlip] = useState(false);
//   const [finalResult, setFinalResult] = useState(null);
//   const prevOutcomeRef = useRef(null);

//   useEffect(() => {
//     if (!round) return;

//     const newOutcome = round.outcome;
//     const oldOutcome = prevOutcomeRef.current;

//     console.log("CoinFlip -> newOutcome:", newOutcome, "oldOutcome:", oldOutcome);

//     // If outcome changes from null to a real value => start flip
//     if (newOutcome && newOutcome !== oldOutcome) {
//       setFinalResult(newOutcome);
//       setShowFinalFlip(true);
//     }

//     // If outcome is null or unchanged => no new flip
//     if (!newOutcome || newOutcome === oldOutcome) {
//       setShowFinalFlip(false);
//     }

//     // Update prevOutcome
//     prevOutcomeRef.current = newOutcome;
//   }, [round]);

//   return (
//     <div className="mt-4 flex justify-center">
//       {/* Static face if not flipping */}
//       {!showFinalFlip && (
//         <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold">
//           {finalResult === "heads"
//             ? "H"
//             : finalResult === "tails"
//             ? "T"
//             : finalResult === "house"
//             ? "Edge"
//             : "?"}
//         </div>
//       )}

//       {/* Final flip animation */}
//       <AnimatePresence>
//         {showFinalFlip && finalResult && (
//           <motion.div
//             key={finalResult}
//             className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold"
//             variants={finalCoinFlipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => setShowFinalFlip(false)}
//           >
//             {finalResult === "heads"
//               ? "H"
//               : finalResult === "tails"
//               ? "T"
//               : finalResult === "house"
//               ? "Edge"
//               : "?"}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// export default CoinFlip;


// // src/components/CoinFlip.js
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // A 5-second multi-flip animation
// const finalCoinFlipVariants = {
//   hidden: { rotateY: 0, opacity: 0 },
//   visible: {
//     rotateY: [0, 360, 720, 1080, 1440, 1800],
//     opacity: 1,
//     transition: { duration: 5, ease: "easeInOut" },
//   },
//   exit: { opacity: 0, transition: { duration: 0.5 } },
// };

// function CoinFlip({ round }) {
//   const [showFinalFlip, setShowFinalFlip] = useState(false);
//   const [finalResult, setFinalResult] = useState(null);

//   // Keep track of the previous outcome so we only animate on actual changes.
//   const prevOutcomeRef = useRef(null);

//   useEffect(() => {
//     if (!round) return;

//     const newOutcome = round.outcome;
//     const oldOutcome = prevOutcomeRef.current;

//     console.log("CoinFlip -> newOutcome:", newOutcome, "oldOutcome:", oldOutcome);

//     // If outcome changed from null to heads/tails/house => start the flip
//     if (newOutcome && newOutcome !== oldOutcome) {
//       setFinalResult(newOutcome);
//       setShowFinalFlip(true);
//     }

//     // If outcome is null or the same as old => we stop flipping
//     if (!newOutcome || newOutcome === oldOutcome) {
//       setShowFinalFlip(false);
//     }

//     // Remember this new outcome for next render
//     prevOutcomeRef.current = newOutcome;
//   }, [round]);

//   return (
//     <div className="mt-4 flex justify-center">
//       {/* If not flipping, show static face or "?" if outcome is null */}
//       {!showFinalFlip && (
//         <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold">
//           {finalResult === "heads"
//             ? "H"
//             : finalResult === "tails"
//             ? "T"
//             : finalResult === "house"
//             ? "Edge"
//             : "?"}
//         </div>
//       )}

//       {/* AnimatePresence for the final flip */}
//       <AnimatePresence>
//         {showFinalFlip && finalResult && (
//           <motion.div
//             key={finalResult}
//             className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold"
//             variants={finalCoinFlipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               setShowFinalFlip(false);
//             }}
//           >
//             {finalResult === "heads"
//               ? "H"
//               : finalResult === "tails"
//               ? "T"
//               : finalResult === "house"
//               ? "Edge"
//               : "?"}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// /**
//  * Use React.memo() to avoid re-renders unless round.outcome changes.
//  *
//  * propsAreEqual compares the old and new round.outcome:
//  * - If they are the same, skip re-render.
//  * - If they differ, re-render to show the new flip.
//  */
// function propsAreEqual(prevProps, nextProps) {
//   const prevOutcome = prevProps.round?.outcome || null;
//   const nextOutcome = nextProps.round?.outcome || null;
//   return prevOutcome === nextOutcome;
// }

// export default React.memo(CoinFlip, propsAreEqual);

// // src/components/CoinFlip.js
// import React, { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// const CoinFlip = ({ round }) => {
//   const [showFinalFlip, setShowFinalFlip] = useState(false);
//   const [finalResult, setFinalResult] = useState(null);

//   // Keep track of the previous outcome so we only animate on actual changes.
//   const prevOutcomeRef = useRef(null);

//   useEffect(() => {
//     if (!round) return;

//     // Let's see if outcome is truly different from the previous
//     const newOutcome = round.outcome;
//     const oldOutcome = prevOutcomeRef.current;

//     console.log("CoinFlip -> newOutcome:", newOutcome, "oldOutcome:", oldOutcome);

//     // If outcome changed from null to heads/tails/house => start the flip
//     if (newOutcome && newOutcome !== oldOutcome) {
//       setFinalResult(newOutcome);
//       setShowFinalFlip(true);
//     }

//     // If outcome is null (round in progress), or same as before => do nothing special
//     if (!newOutcome || newOutcome === oldOutcome) {
//       setShowFinalFlip(false);
//     }

//     // Update the ref
//     prevOutcomeRef.current = newOutcome;
//   }, [round]);

//   // 5s multi-flip animation
//   const finalCoinFlipVariants = {
//     hidden: { rotateY: 0, opacity: 0 },
//     visible: {
//       rotateY: [0, 360, 720, 1080, 1440, 1800],
//       opacity: 1,
//       transition: { duration: 5, ease: "easeInOut" },
//     },
//     exit: { opacity: 0, transition: { duration: 0.5 } },
//   };

//   return (
//     <div className="mt-4 flex justify-center">
//       {/* If not flipping, show static face or "?" if outcome is null */}
//       {!showFinalFlip && (
//         <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold">
//           {finalResult === "heads"
//             ? "H"
//             : finalResult === "tails"
//             ? "T"
//             : finalResult === "house"
//             ? "Edge"
//             : "?"}
//         </div>
//       )}

//       {/* AnimatePresence for the final flip */}
//       <AnimatePresence>
//         {showFinalFlip && finalResult && (
//           <motion.div
//             key={finalResult}
//             className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold"
//             variants={finalCoinFlipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               setShowFinalFlip(false);
//             }}
//           >
//             {finalResult === "heads"
//               ? "H"
//               : finalResult === "tails"
//               ? "T"
//               : finalResult === "house"
//               ? "Edge"
//               : "?"}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default CoinFlip;


// // src/components/CoinFlip.js
// import React, { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// const CoinFlip = ({ round }) => {
//   const [showFinalFlip, setShowFinalFlip] = useState(false);
//   const [finalResult, setFinalResult] = useState(null);

//   useEffect(() => {
//     if (!round) return;

//     // If no outcome, show still coin with "?"
//     if (!round.outcome) {
//       setShowFinalFlip(false);
//       setFinalResult(null);
//     } else {
//       // Once outcome is present, start the 5s final flip
//       setFinalResult(round.outcome);
//       setShowFinalFlip(true);
//     }

//     // Debug:
//     console.log("CoinFlip -> round.outcome:", round.outcome);
//   }, [round]);

//   // Flip variants: 5-second animation, multiple spins
//   const finalCoinFlipVariants = {
//     hidden: { rotateY: 0, opacity: 0 },
//     visible: {
//       rotateY: [0, 360, 720, 1080, 1440, 1800], // e.g. 5 full 360° spins
//       opacity: 1,
//       transition: { duration: 5, ease: "easeInOut" },
//     },
//     exit: { opacity: 0, transition: { duration: 0.5 } },
//   };

//   return (
//     <div className="mt-4 flex justify-center">
//       {/* STILL coin if outcome = null */}
//       {!showFinalFlip && !finalResult && (
//         <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold">
//           ?
//         </div>
//       )}

//       <AnimatePresence>
//         {showFinalFlip && finalResult && (
//           <motion.div
//             key={finalResult}
//             className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg text-3xl font-bold"
//             variants={finalCoinFlipVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             onAnimationComplete={() => {
//               // After 5 seconds, remain on the final face
//               setShowFinalFlip(false);
//             }}
//           >
//             {finalResult === "heads" ? "H" : "T"}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default CoinFlip;
