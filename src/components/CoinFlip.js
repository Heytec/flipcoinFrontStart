///**************************************************************************************************************************************************************************************************************************************************************************************************** */


import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Enhanced Sparkle component with more dynamic effects
const Sparkle = ({ delay }) => {
  const size = Math.random() * 3 + 2; // Slightly larger sparkles (2-5px)
  const distance = 30 + Math.random() * 70; // Random distance from center
  const angle = Math.random() * Math.PI * 2; // Random angle
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  // More vibrant colors with gold/silver theme based on coin sides
  const colors = [
    "hsl(50, 100%, 50%)", // Gold
    "hsl(50, 90%, 60%)", // Light gold
    "hsl(45, 100%, 50%)", // Deep gold
    "hsl(0, 0%, 80%)", // Silver
    "hsl(0, 0%, 90%)", // Light silver
  ];

  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        top: "50%",
        left: "50%",
        x,
        y,
      }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
        x: [0, x * 1.2],
        y: [0, y * 1.2],
      }}
      transition={{
        duration: 0.8 + Math.random() * 0.5,
        delay,
        ease: "easeOut",
      }}
    />
  );
};

// New particle effect for the spinning coin
const SpinParticle = ({ isFlipping }) => {
  const size = Math.random() * 2 + 1;
  const color =
    Math.random() > 0.5
      ? `hsla(45, 100%, ${50 + Math.random() * 20}%, 0.7)`
      : `hsla(0, 0%, ${70 + Math.random() * 20}%, 0.7)`;

  return isFlipping ? (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        top: "50%",
        left: "50%",
      }}
      initial={{
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
        opacity: 0,
      }}
      animate={{
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 60,
        opacity: [0, 0.8, 0],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      }}
    />
  ) : null;
};

// // New Timer Circle component
// const TimerCircle = ({ timeLeft, maxTime }) => {
//   // Calculate percentage of time remaining
//   const percentage = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  
//   // Calculate circumference
//   const radius = 70; // Slightly larger than coin (32px + buffer)
//   const circumference = 2 * Math.PI * radius;
  
//   // Calculate stroke dash offset based on percentage
//   const strokeDashoffset = circumference * (1 - percentage / 100);
  
//   // Calculate color based on percentage (green to red)
//   const hue = (percentage / 100) * 120; // 0 is red, 120 is green in HSL
//   const color = `hsl(${hue}, 100%, 50%)`;

//   return (
//     <svg 
//       className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2  " 
//       width="210" 
//       height="210" 
//       viewBox="0 0 160 160"
//     >
//       {/* Background circle (optional, for visual aid) */}
//       <circle
//         cx="80"
//         cy="80"
//         r={radius}
//         fill="none"
//         stroke="rgba(255,255,255,0.1)"
//         strokeWidth="10"
//       />
      
//       {/* Timer progress circle */}
//       <circle
//         cx="80"
//         cy="80"
//         r={radius}
//         fill="none"
//         stroke={color}
//         strokeWidth="10"
//         strokeDasharray={circumference}
//         strokeDashoffset={strokeDashoffset}
//         strokeLinecap="round"
//         transform="rotate(-90 80 80)" // Start from top
//         style={{
//           transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease",
//           filter: `drop-shadow(0 0 3px ${color})`
//         }}
//       />
//     </svg>
//   );
// };

// New Timer Circle component with smooth animation
const TimerCircle = ({ timeLeft, maxTime }) => {
  // Calculate percentage of time remaining
  const percentage = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  
  // Calculate circumference
  const radius = 70; // Slightly larger than coin (32px + buffer)
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash offset based on percentage
  const strokeDashoffset = circumference * (1 - percentage / 100);
  
  // Calculate color based on percentage (green to red)
  const hue = (percentage / 100) * 120; // 0 is red, 120 is green in HSL
  const color = `hsl(${hue}, 100%, 50%)`;

  return (
    <svg 
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" 
      width="210" 
      height="210" 
      viewBox="0 0 160 160"
    >
      {/* Background circle (optional, for visual aid) */}
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="10"
      />
      
      {/* Timer progress circle */}
      <motion.circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform="rotate(-90 80 80)" // Start from top
        // style={{
        //   filter: `drop-shadow(0 0 3px ${color})`
        // }}
        initial={false}
        animate={{
          strokeDashoffset,
          stroke: color
        }}
        transition={{
          strokeDashoffset: { 
            duration: 1, // Longer and smoother transition 
            ease: "linear" // Linear movement for continuous animation
          },
          stroke: { 
            duration: 1,
            ease: "linear"
          }
        }}
      />
    </svg>
  );
};
export default function CoinFlip({ round, timeLeft }) {
  const [isMuted, setIsMuted] = useState(true);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const isFlipping = !round.outcome;
  const outcome = round?.outcome || "heads";
  
  // Set a maximum time value for the timer (adjust as needed)
  const maxTime = 30; // Assuming the timer counts down from 30 seconds

  // Define an array of three different flip songs
  const flipSongSources = [
    "/sounds/coi.mp3",
    "/sounds/sunny.mp3",
    "/sounds/sunshine.mp3",
  ];

  // Audio refs
  const flipSoundRef = useRef(null);
  const resultSoundRef = useRef(null);
  const edgeSoundRef = useRef(null);

  // Initialize audio only once after user interaction
  const initializeAudio = () => {
    if (!isAudioInitialized) {
      flipSoundRef.current = new Audio(flipSongSources[0]);
      resultSoundRef.current = new Audio("/sounds/result-chime.mp3");
      edgeSoundRef.current = new Audio("/sounds/edge-special.mp3");

      flipSoundRef.current.loop = true;
      flipSoundRef.current.volume = 0.3;
      resultSoundRef.current.volume = 0.5;
      edgeSoundRef.current.volume = 0.5;

      setIsAudioInitialized(true);
    }
  };

  // Toggle mute and initialize audio if needed
  const toggleSound = () => {
    if (!isAudioInitialized) {
      initializeAudio();
    }
    setIsMuted((prev) => !prev);

    if (isAudioInitialized) {
      [flipSoundRef, resultSoundRef, edgeSoundRef].forEach((soundRef) => {
        if (soundRef.current) {
          soundRef.current.muted = !isMuted;
        }
      });
    }
  };

  // Update flipSoundRef source based on round number (if provided)
  useEffect(() => {
    if (isAudioInitialized && round && round.roundNumber) {
      const index = (round.roundNumber - 1) % flipSongSources.length;
      if (flipSoundRef.current) {
        flipSoundRef.current.src = flipSongSources[index];
        flipSoundRef.current.load();
      }
    }
  }, [round.roundNumber, isAudioInitialized]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (isAudioInitialized) {
        flipSoundRef.current?.pause();
        resultSoundRef.current?.pause();
        edgeSoundRef.current?.pause();
      }
    };
  }, [isAudioInitialized]);

  // Play flip sound while coin is flipping
  useEffect(() => {
    if (isAudioInitialized && isFlipping && !isMuted) {
      flipSoundRef.current.currentTime = 0;
      flipSoundRef.current.play().catch(() => setIsMuted(true));
    } else if (isAudioInitialized) {
      flipSoundRef.current?.pause();
    }
  }, [isFlipping, isAudioInitialized, isMuted]);

  // Play result sound when outcome is determined
  useEffect(() => {
    if (round.outcome && isAudioInitialized && !isMuted) {
      const soundToPlay =
        outcome === "edge" ? edgeSoundRef.current : resultSoundRef.current;
      if (soundToPlay) {
        soundToPlay.currentTime = 0;
        soundToPlay.play().catch(() => setIsMuted(true));
      }
    }
  }, [round.outcome, outcome, isAudioInitialized, isMuted]);

  // Modified coin animation variants for immediate display of winning side
  const coinVariants = {
    initial: { rotateY: 0, scale: 1, y: 0 },
    flip: {
      // When outcome is determined, immediately show the correct side
      rotateY: isFlipping 
        ? [0, 180, 360, 540, 720, 900] 
        : outcome === "edge" 
          ? 90 // Show edge
          : outcome === "heads" 
            ? 0 // Show heads
            : 180, // Show tails
      scale: isFlipping
        ? [1, 1.05, 1, 1.05, 1]
        : outcome === "edge"
          ? 0.8
          : [1, 1.15, 0.95, 1.05, 1], // Enhanced bounce effect
      y: isFlipping
        ? [0, -5, 0, -5, 0] // Slight hovering while spinning
        : outcome === "edge"
          ? 0
          : [0, -30, -5, -15, 0], // More pronounced bounce
      transition: {
        rotateY: {
          duration: isFlipping ? 2 : 0.8, // Faster transition when showing result
          repeat: isFlipping ? Infinity : 0, // No repetition when outcome is determined
          ease: isFlipping ? "easeInOut" : [0.34, 1.56, 0.64, 1],
          // Add a delay of 0 to ensure immediate display of result
          delay: 0
        },
        scale: {
          duration: isFlipping ? 2 : 1.2,
          repeat: isFlipping ? Infinity : 0,
          ease: isFlipping ? "easeInOut" : "easeOut",
        },
        y: {
          duration: isFlipping ? 2 : 1,
          ease: isFlipping ? "easeInOut" : [0.22, 1.2, 0.36, 1], // Spring-like motion
          repeat: isFlipping ? Infinity : 0,
          delay: isFlipping ? 0 : 0.2,
        },
      },
    },
  };

  // Enhanced shadow animation
  const shadowVariants = {
    initial: { scale: 1, opacity: 0.3 },
    animate: {
      scale: isFlipping
        ? [0.9, 0.8, 0.9, 0.8, 0.9]
        : outcome === "edge"
          ? 0.6
          : [1, 0.7, 0.9, 0.8, 1],
      opacity: isFlipping
        ? [0.3, 0.2, 0.3, 0.2, 0.3]
        : outcome === "edge"
          ? 0.4
          : [0.3, 0.5, 0.4, 0.3, 0.3],
      transition: {
        duration: isFlipping ? 2 : 1.2,
        repeat: isFlipping ? Infinity : 0,
        ease: isFlipping ? "easeInOut" : "easeOut",
      },
    },
  };

  // New glow effect animation
  const glowVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: isFlipping ? [0.3, 0.5, 0.3] : outcome === "edge" ? 0.8 : 0.6,
      scale: isFlipping ? [1, 1.1, 1] : outcome === "edge" ? 1.2 : 1.1,
      transition: {
        duration: isFlipping ? 2 : 0.8,
        repeat: isFlipping ? Infinity : 0,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[220px] perspective-1000 relative">
      {/* Sound Toggle Button - Enhanced with animation */}
      <motion.button
        onClick={toggleSound}
        className={`absolute top-0 -right-20 p-2 z-50 rounded-full transition-colors ${
          isMuted
            ? "bg-red-500 hover:bg-red-300"
            : "bg-green-200 hover:bg-green-300"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: isMuted
            ? "0px 0px 0px rgba(239, 68, 68, 0.2)"
            : [
                "0px 0px 0px rgba(16, 185, 129, 0.2)",
                "0px 0px 8px rgba(16, 185, 129, 0.6)",
                "0px 0px 0px rgba(16, 185, 129, 0.2)",
              ],
        }}
        transition={{
          boxShadow: {
            repeat: isMuted ? 0 : Infinity,
            duration: 2,
          },
        }}
        aria-label={isMuted ? "Unmute sound" : "Mute sound"}>
        {isMuted ? (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        )}
      </motion.button>

      {/* Coin Container with enhanced background */}
      <div className="relative w-full h-full flex justify-center items-center">
        {/* Background circle - provides subtle contrast */}
        <motion.div
          className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-gray-100 to-gray-200"
          animate={{
            opacity: isFlipping
              ? [0.4, 0.6, 0.4]
              : outcome === "edge"
                ? 0.6
                : 0.5,
            scale: isFlipping ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: isFlipping ? Infinity : 0,
            ease: "easeInOut",
          }}
        />

        {/* Timer Border */}
        {isFlipping && timeLeft !== undefined && (
          <TimerCircle timeLeft={timeLeft} maxTime={maxTime} />
        )}

        <div className="relative w-32 h-32">
          {/* Enhanced glow effect with specific color based on outcome */}
          <motion.div
            className={`absolute inset-0 rounded-full blur-md ${
              outcome === "edge"
                ? "bg-orange-400"
                : outcome === "heads"
                  ? "bg-yellow-300"
                  : "bg-gray-300"
            }`}
            initial="initial"
            animate="animate"
            variants={glowVariants}
          />

          {/* Improved Coin Shadow */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/20 rounded-full blur-md"
            initial="initial"
            animate="animate"
            variants={shadowVariants}
          />

          {/* Spin Particles - only visible during flip */}
          {isFlipping && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <SpinParticle
                  key={`spin-${i}`}
                  isFlipping={isFlipping}
                />
              ))}
            </div>
          )}

          {/* Coin */}
          <motion.div
            className="absolute inset-0"
            initial="initial"
            animate="flip"
            variants={coinVariants}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}>
            {/* Heads Side - Enhanced with embossed effect */}
            <div className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 border-8 border-yellow-500 flex items-center justify-center shadow-inner overflow-hidden">
                {/* Inner embossed design */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-yellow-300 to-yellow-500 opacity-70" />
                <div className="relative z-10 w-12 h-12 rounded-full bg-yellow-400 border-4 border-yellow-500 flex items-center justify-center shadow-inner">
                  <div className="text-3xl font-extrabold text-yellow-800">
                    H
                  </div>
                </div>
              </div>
            </div>

            {/* Tails Side - Enhanced with embossed effect */}
            <div
              className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden"
              style={{ transform: "rotateY(180deg)" }}>
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 border-8 border-gray-500 flex items-center justify-center shadow-inner overflow-hidden">
                {/* Inner embossed design */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-gray-300 to-gray-500 opacity-70" />
                <div className="relative z-10 w-12 h-12 rounded-full bg-gray-400 border-4 border-gray-500 flex items-center justify-center shadow-inner">
                  <div className="text-3xl font-extrabold text-gray-800">T</div>
                </div>
              </div>
            </div>

            {/* Edge Side - Enhanced with texture */}
            <div
              className="absolute w-full h-8 rounded-full flex items-center justify-center backface-hidden overflow-hidden"
              style={{
                transform: "rotateY(90deg) translateZ(64px)",
                background: "linear-gradient(to right, #FFD700, #FFA500)",
              }}>
              {/* Edge texture */}
              <div className="absolute inset-0 opacity-30">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-full w-1 bg-yellow-900/20"
                    style={{
                      left: `${i * 5}%`,
                      transform: "rotate(90deg)",
                    }}
                  />
                ))}
              </div>
              <div className="text-sm font-bold text-yellow-900 tracking-widest z-10">
                EDGE
              </div>
            </div>
          </motion.div>

          {/* Enhanced Sparkles */}
          {round.outcome && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(round.outcome === "edge" ? 12 : 8)].map((_, i) => (
                <Sparkle
                  key={`spark-${i}`}
                  delay={i * 0.08}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Outcome Display */}
      {round.outcome && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            damping: 12,
            stiffness: 100,
            delay: 0.2,
          }}
          className={`mt-16 text-3xl font-bold ${
            outcome === "edge"
              ? "bg-gradient-to-r from-orange-400 via-red-500 to-orange-400"
              : outcome === "heads"
                ? "bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400"
                : "bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400"
          } bg-clip-text text-transparent relative`}>
          {/* Subtle highlight under text */}
          <div
            className={`absolute inset-0 ${
              outcome === "edge"
                ? "bg-orange-200"
                : outcome === "heads"
                  ? "bg-yellow-200"
                  : "bg-gray-200"
            } blur-lg opacity-30 -z-10 rounded-lg`}
          />

          {/* Text with animation */}
          <motion.span
            animate={{
              textShadow: [
                "0 0 5px rgba(255,255,255,0.1)",
                "0 0 10px rgba(255,255,255,0.6)",
                "0 0 5px rgba(255,255,255,0.1)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}>
            {outcome.toUpperCase()} {outcome === "edge" ? "!" : "WINS!"}
          </motion.span>
        </motion.div>
      )}

      {/* Optional: Display time left as text (can be removed if not needed) */}
      {/* {isFlipping && timeLeft !== undefined && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-sm font-bold">
          {Math.ceil(timeLeft)}s
        </div>
      )} */}
    </div>
  );
}


///**************************************************************************************************************************************************************************************************************************************************************************************************** */
// import React, { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion";

// // Enhanced Sparkle component with more dynamic effects
// const Sparkle = ({ delay }) => {
//   const size = Math.random() * 3 + 2; // Slightly larger sparkles (2-5px)
//   const distance = 30 + Math.random() * 70; // Random distance from center
//   const angle = Math.random() * Math.PI * 2; // Random angle
//   const x = Math.cos(angle) * distance;
//   const y = Math.sin(angle) * distance;

//   // More vibrant colors with gold/silver theme based on coin sides
//   const colors = [
//     "hsl(50, 100%, 50%)", // Gold
//     "hsl(50, 90%, 60%)", // Light gold
//     "hsl(45, 100%, 50%)", // Deep gold
//     "hsl(0, 0%, 80%)", // Silver
//     "hsl(0, 0%, 90%)", // Light silver
//   ];

//   const color = colors[Math.floor(Math.random() * colors.length)];

//   return (
//     <motion.div
//       className="absolute rounded-full"
//       style={{
//         width: size,
//         height: size,
//         backgroundColor: color,
//         boxShadow: `0 0 ${size * 2}px ${color}`,
//         top: "50%",
//         left: "50%",
//         x,
//         y,
//       }}
//       initial={{ scale: 0, opacity: 1 }}
//       animate={{
//         scale: [0, 1, 0],
//         opacity: [0, 1, 0],
//         x: [0, x * 1.2],
//         y: [0, y * 1.2],
//       }}
//       transition={{
//         duration: 0.8 + Math.random() * 0.5,
//         delay,
//         ease: "easeOut",
//       }}
//     />
//   );
// };

// // New particle effect for the spinning coin
// const SpinParticle = ({ isFlipping }) => {
//   const size = Math.random() * 2 + 1;
//   const color =
//     Math.random() > 0.5
//       ? `hsla(45, 100%, ${50 + Math.random() * 20}%, 0.7)`
//       : `hsla(0, 0%, ${70 + Math.random() * 20}%, 0.7)`;

//   return isFlipping ? (
//     <motion.div
//       className="absolute rounded-full"
//       style={{
//         width: size,
//         height: size,
//         backgroundColor: color,
//         top: "50%",
//         left: "50%",
//       }}
//       initial={{
//         x: (Math.random() - 0.5) * 10,
//         y: (Math.random() - 0.5) * 10,
//         opacity: 0,
//       }}
//       animate={{
//         x: (Math.random() - 0.5) * 60,
//         y: (Math.random() - 0.5) * 60,
//         opacity: [0, 0.8, 0],
//       }}
//       transition={{
//         duration: 1.2,
//         repeat: Infinity,
//         repeatType: "loop",
//         ease: "easeInOut",
//       }}
//     />
//   ) : null;
// };

// export default function CoinFlip({ round ,timeLeft}) {
//   const [isMuted, setIsMuted] = useState(true);
//   const [isAudioInitialized, setIsAudioInitialized] = useState(false);
//   const isFlipping = !round.outcome;
//   const outcome = round?.outcome || "heads";

//   // Define an array of three different flip songs
//   const flipSongSources = [
//     "/sounds/coi.mp3",
//     "/sounds/sunny.mp3",
//     "/sounds/sunshine.mp3",
//   ];

//   // Audio refs
//   const flipSoundRef = useRef(null);
//   const resultSoundRef = useRef(null);
//   const edgeSoundRef = useRef(null);

//   // Initialize audio only once after user interaction
//   const initializeAudio = () => {
//     if (!isAudioInitialized) {
//       flipSoundRef.current = new Audio(flipSongSources[0]);
//       resultSoundRef.current = new Audio("/sounds/result-chime.mp3");
//       edgeSoundRef.current = new Audio("/sounds/edge-special.mp3");

//       flipSoundRef.current.loop = true;
//       flipSoundRef.current.volume = 0.3;
//       resultSoundRef.current.volume = 0.5;
//       edgeSoundRef.current.volume = 0.5;

//       setIsAudioInitialized(true);
//     }
//   };

//   // Toggle mute and initialize audio if needed
//   const toggleSound = () => {
//     if (!isAudioInitialized) {
//       initializeAudio();
//     }
//     setIsMuted((prev) => !prev);

//     if (isAudioInitialized) {
//       [flipSoundRef, resultSoundRef, edgeSoundRef].forEach((soundRef) => {
//         if (soundRef.current) {
//           soundRef.current.muted = !isMuted;
//         }
//       });
//     }
//   };

//   // Update flipSoundRef source based on round number (if provided)
//   useEffect(() => {
//     if (isAudioInitialized && round && round.roundNumber) {
//       const index = (round.roundNumber - 1) % flipSongSources.length;
//       if (flipSoundRef.current) {
//         flipSoundRef.current.src = flipSongSources[index];
//         flipSoundRef.current.load();
//       }
//     }
//   }, [round.roundNumber, isAudioInitialized]);

//   // Cleanup audio on unmount
//   useEffect(() => {
//     return () => {
//       if (isAudioInitialized) {
//         flipSoundRef.current?.pause();
//         resultSoundRef.current?.pause();
//         edgeSoundRef.current?.pause();
//       }
//     };
//   }, [isAudioInitialized]);

//   // Play flip sound while coin is flipping
//   useEffect(() => {
//     if (isAudioInitialized && isFlipping && !isMuted) {
//       flipSoundRef.current.currentTime = 0;
//       flipSoundRef.current.play().catch(() => setIsMuted(true));
//     } else if (isAudioInitialized) {
//       flipSoundRef.current?.pause();
//     }
//   }, [isFlipping, isAudioInitialized, isMuted]);

//   // Play result sound when outcome is determined
//   useEffect(() => {
//     if (round.outcome && isAudioInitialized && !isMuted) {
//       const soundToPlay =
//         outcome === "edge" ? edgeSoundRef.current : resultSoundRef.current;
//       if (soundToPlay) {
//         soundToPlay.currentTime = 0;
//         soundToPlay.play().catch(() => setIsMuted(true));
//       }
//     }
//   }, [round.outcome, outcome, isAudioInitialized, isMuted]);

//   // Modified coin animation variants for immediate display of winning side
//   const coinVariants = {
//     initial: { rotateY: 0, scale: 1, y: 0 },
//     flip: {
//       // When outcome is determined, immediately show the correct side
//       rotateY: isFlipping 
//         ? [0, 180, 360, 540, 720, 900] 
//         : outcome === "edge" 
//           ? 90 // Show edge
//           : outcome === "heads" 
//             ? 0 // Show heads
//             : 180, // Show tails
//       scale: isFlipping
//         ? [1, 1.05, 1, 1.05, 1]
//         : outcome === "edge"
//           ? 0.8
//           : [1, 1.15, 0.95, 1.05, 1], // Enhanced bounce effect
//       y: isFlipping
//         ? [0, -5, 0, -5, 0] // Slight hovering while spinning
//         : outcome === "edge"
//           ? 0
//           : [0, -30, -5, -15, 0], // More pronounced bounce
//       transition: {
//         rotateY: {
//           duration: isFlipping ? 2 : 0.8, // Faster transition when showing result
//           repeat: isFlipping ? Infinity : 0, // No repetition when outcome is determined
//           ease: isFlipping ? "easeInOut" : [0.34, 1.56, 0.64, 1],
//           // Add a delay of 0 to ensure immediate display of result
//           delay: 0
//         },
//         scale: {
//           duration: isFlipping ? 2 : 1.2,
//           repeat: isFlipping ? Infinity : 0,
//           ease: isFlipping ? "easeInOut" : "easeOut",
//         },
//         y: {
//           duration: isFlipping ? 2 : 1,
//           ease: isFlipping ? "easeInOut" : [0.22, 1.2, 0.36, 1], // Spring-like motion
//           repeat: isFlipping ? Infinity : 0,
//           delay: isFlipping ? 0 : 0.2,
//         },
//       },
//     },
//   };

//   // Enhanced shadow animation
//   const shadowVariants = {
//     initial: { scale: 1, opacity: 0.3 },
//     animate: {
//       scale: isFlipping
//         ? [0.9, 0.8, 0.9, 0.8, 0.9]
//         : outcome === "edge"
//           ? 0.6
//           : [1, 0.7, 0.9, 0.8, 1],
//       opacity: isFlipping
//         ? [0.3, 0.2, 0.3, 0.2, 0.3]
//         : outcome === "edge"
//           ? 0.4
//           : [0.3, 0.5, 0.4, 0.3, 0.3],
//       transition: {
//         duration: isFlipping ? 2 : 1.2,
//         repeat: isFlipping ? Infinity : 0,
//         ease: isFlipping ? "easeInOut" : "easeOut",
//       },
//     },
//   };

//   // New glow effect animation
//   const glowVariants = {
//     initial: { opacity: 0 },
//     animate: {
//       opacity: isFlipping ? [0.3, 0.5, 0.3] : outcome === "edge" ? 0.8 : 0.6,
//       scale: isFlipping ? [1, 1.1, 1] : outcome === "edge" ? 1.2 : 1.1,
//       transition: {
//         duration: isFlipping ? 2 : 0.8,
//         repeat: isFlipping ? Infinity : 0,
//         ease: "easeInOut",
//       },
//     },
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-[220px] perspective-1000 relative">
//       {/* Sound Toggle Button - Enhanced with animation */}
//       <motion.button
//         onClick={toggleSound}
//         className={`absolute top-0 -right-20 p-2 z-50 rounded-full transition-colors ${
//           isMuted
//             ? "bg-red-500 hover:bg-red-300"
//             : "bg-green-200 hover:bg-green-300"
//         }`}
//         whileHover={{ scale: 1.1 }}
//         whileTap={{ scale: 0.9 }}
//         animate={{
//           boxShadow: isMuted
//             ? "0px 0px 0px rgba(239, 68, 68, 0.2)"
//             : [
//                 "0px 0px 0px rgba(16, 185, 129, 0.2)",
//                 "0px 0px 8px rgba(16, 185, 129, 0.6)",
//                 "0px 0px 0px rgba(16, 185, 129, 0.2)",
//               ],
//         }}
//         transition={{
//           boxShadow: {
//             repeat: isMuted ? 0 : Infinity,
//             duration: 2,
//           },
//         }}
//         aria-label={isMuted ? "Unmute sound" : "Mute sound"}>
//         {isMuted ? (
//           <svg
//             className="w-6 h-6"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
//             />
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
//             />
//           </svg>
//         ) : (
//           <svg
//             className="w-6 h-6"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
//             />
//           </svg>
//         )}
//       </motion.button>

//       {/* Coin Container with enhanced background */}
//       <div className="relative w-full h-full flex justify-center items-center">
//         {/* Background circle - provides subtle contrast */}
//         <motion.div
//           className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-gray-100 to-gray-200"
//           animate={{
//             opacity: isFlipping
//               ? [0.4, 0.6, 0.4]
//               : outcome === "edge"
//                 ? 0.6
//                 : 0.5,
//             scale: isFlipping ? [1, 1.05, 1] : 1,
//           }}
//           transition={{
//             duration: 2,
//             repeat: isFlipping ? Infinity : 0,
//             ease: "easeInOut",
//           }}
//         />

//         <div className="relative w-32 h-32">
//           {/* Enhanced glow effect with specific color based on outcome */}
//           <motion.div
//             className={`absolute inset-0 rounded-full blur-md ${
//               outcome === "edge"
//                 ? "bg-orange-400"
//                 : outcome === "heads"
//                   ? "bg-yellow-300"
//                   : "bg-gray-300"
//             }`}
//             initial="initial"
//             animate="animate"
//             variants={glowVariants}
//           />

//           {/* Improved Coin Shadow */}
//           <motion.div
//             className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/20 rounded-full blur-md"
//             initial="initial"
//             animate="animate"
//             variants={shadowVariants}
//           />

//           {/* Spin Particles - only visible during flip */}
//           {isFlipping && (
//             <div className="absolute inset-0 pointer-events-none">
//               {[...Array(12)].map((_, i) => (
//                 <SpinParticle
//                   key={`spin-${i}`}
//                   isFlipping={isFlipping}
//                 />
//               ))}
//             </div>
//           )}

//           {/* Coin */}
//           <motion.div
//             className="absolute inset-0"
//             initial="initial"
//             animate="flip"
//             variants={coinVariants}
//             style={{ transformStyle: "preserve-3d", perspective: "1000px" }}>
//             {/* Heads Side - Enhanced with embossed effect */}
//             <div className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden">
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 border-8 border-yellow-500 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-yellow-300 to-yellow-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-yellow-400 border-4 border-yellow-500 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-yellow-800">
//                     H
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Tails Side - Enhanced with embossed effect */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden"
//               style={{ transform: "rotateY(180deg)" }}>
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 border-8 border-gray-500 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-gray-300 to-gray-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-gray-400 border-4 border-gray-500 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-gray-800">T</div>
//                 </div>
//               </div>
//             </div>

//             {/* Edge Side - Enhanced with texture */}
//             <div
//               className="absolute w-full h-8 rounded-full flex items-center justify-center backface-hidden overflow-hidden"
//               style={{
//                 transform: "rotateY(90deg) translateZ(64px)",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//               }}>
//               {/* Edge texture */}
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={i}
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                       transform: "rotate(90deg)",
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10">
//                 EDGE
//               </div>
//             </div>
//           </motion.div>

//           {/* Enhanced Sparkles */}
//           {round.outcome && (
//             <div className="absolute inset-0 pointer-events-none">
//               {[...Array(round.outcome === "edge" ? 12 : 8)].map((_, i) => (
//                 <Sparkle
//                   key={`spark-${i}`}
//                   delay={i * 0.08}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Enhanced Outcome Display */}
//       {round.outcome && (
//         <motion.div
//           initial={{ opacity: 0, y: 30, scale: 0.9 }}
//           animate={{ opacity: 1, y: 0, scale: 1 }}
//           transition={{
//             type: "spring",
//             damping: 12,
//             stiffness: 100,
//             delay: 0.2,
//           }}
//           className={`mt-16 text-3xl font-bold ${
//             outcome === "edge"
//               ? "bg-gradient-to-r from-orange-400 via-red-500 to-orange-400"
//               : outcome === "heads"
//                 ? "bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400"
//                 : "bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400"
//           } bg-clip-text text-transparent relative`}>
//           {/* Subtle highlight under text */}
//           <div
//             className={`absolute inset-0 ${
//               outcome === "edge"
//                 ? "bg-orange-200"
//                 : outcome === "heads"
//                   ? "bg-yellow-200"
//                   : "bg-gray-200"
//             } blur-lg opacity-30 -z-10 rounded-lg`}
//           />

//           {/* Text with animation */}
//           <motion.span
//             animate={{
//               textShadow: [
//                 "0 0 5px rgba(255,255,255,0.1)",
//                 "0 0 10px rgba(255,255,255,0.6)",
//                 "0 0 5px rgba(255,255,255,0.1)",
//               ],
//             }}
//             transition={{
//               duration: 2,
//               repeat: Infinity,
//               ease: "easeInOut",
//             }}>
//             {outcome.toUpperCase()} {outcome === "edge" ? "!" : "WINS!"}
//           </motion.span>
//         </motion.div>
//       )}
//     </div>
//   );
// }
///************************************************************************************************************************************************** */



// import React, { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion";

// // Enhanced Sparkle component with more dynamic effects
// const Sparkle = ({ delay }) => {
//   const size = Math.random() * 3 + 2; // Slightly larger sparkles (2-5px)
//   const distance = 30 + Math.random() * 70; // Random distance from center
//   const angle = Math.random() * Math.PI * 2; // Random angle
//   const x = Math.cos(angle) * distance;
//   const y = Math.sin(angle) * distance;

//   // More vibrant colors with gold/silver theme based on coin sides
//   const colors = [
//     "hsl(50, 100%, 50%)", // Gold
//     "hsl(50, 90%, 60%)", // Light gold
//     "hsl(45, 100%, 50%)", // Deep gold
//     "hsl(0, 0%, 80%)", // Silver
//     "hsl(0, 0%, 90%)", // Light silver
//   ];

//   const color = colors[Math.floor(Math.random() * colors.length)];

//   return (
//     <motion.div
//       className="absolute rounded-full"
//       style={{
//         width: size,
//         height: size,
//         backgroundColor: color,
//         boxShadow: `0 0 ${size * 2}px ${color}`,
//         top: "50%",
//         left: "50%",
//         x,
//         y,
//       }}
//       initial={{ scale: 0, opacity: 1 }}
//       animate={{
//         scale: [0, 1, 0],
//         opacity: [0, 1, 0],
//         x: [0, x * 1.2],
//         y: [0, y * 1.2],
//       }}
//       transition={{
//         duration: 0.8 + Math.random() * 0.5,
//         delay,
//         ease: "easeOut",
//       }}
//     />
//   );
// };

// // New particle effect for the spinning coin
// const SpinParticle = ({ isFlipping }) => {
//   const size = Math.random() * 2 + 1;
//   const color =
//     Math.random() > 0.5
//       ? `hsla(45, 100%, ${50 + Math.random() * 20}%, 0.7)`
//       : `hsla(0, 0%, ${70 + Math.random() * 20}%, 0.7)`;

//   return isFlipping ? (
//     <motion.div
//       className="absolute rounded-full"
//       style={{
//         width: size,
//         height: size,
//         backgroundColor: color,
//         top: "50%",
//         left: "50%",
//       }}
//       initial={{
//         x: (Math.random() - 0.5) * 10,
//         y: (Math.random() - 0.5) * 10,
//         opacity: 0,
//       }}
//       animate={{
//         x: (Math.random() - 0.5) * 60,
//         y: (Math.random() - 0.5) * 60,
//         opacity: [0, 0.8, 0],
//       }}
//       transition={{
//         duration: 1.2,
//         repeat: Infinity,
//         repeatType: "loop",
//         ease: "easeInOut",
//       }}
//     />
//   ) : null;
// };

// export default function CoinFlip({ round }) {
//   const [isMuted, setIsMuted] = useState(true);
//   const [isAudioInitialized, setIsAudioInitialized] = useState(false);
//   const isFlipping = !round.outcome;
//   const outcome = round?.outcome || "heads";

//   // Define an array of three different flip songs
//   const flipSongSources = [
//     "/sounds/coi.mp3",
//     "/sounds/sunny.mp3",
//     "/sounds/sunshine.mp3",
//   ];

//   // Audio refs
//   const flipSoundRef = useRef(null);
//   const resultSoundRef = useRef(null);
//   const edgeSoundRef = useRef(null);

//   // Initialize audio only once after user interaction
//   const initializeAudio = () => {
//     if (!isAudioInitialized) {
//       flipSoundRef.current = new Audio(flipSongSources[0]);
//       resultSoundRef.current = new Audio("/sounds/result-chime.mp3");
//       edgeSoundRef.current = new Audio("/sounds/edge-special.mp3");

//       flipSoundRef.current.loop = true;
//       flipSoundRef.current.volume = 0.3;
//       resultSoundRef.current.volume = 0.5;
//       edgeSoundRef.current.volume = 0.5;

//       setIsAudioInitialized(true);
//     }
//   };

//   // Toggle mute and initialize audio if needed
//   const toggleSound = () => {
//     if (!isAudioInitialized) {
//       initializeAudio();
//     }
//     setIsMuted((prev) => !prev);

//     if (isAudioInitialized) {
//       [flipSoundRef, resultSoundRef, edgeSoundRef].forEach((soundRef) => {
//         if (soundRef.current) {
//           soundRef.current.muted = !isMuted;
//         }
//       });
//     }
//   };

//   // Update flipSoundRef source based on round number (if provided)
//   useEffect(() => {
//     if (isAudioInitialized && round && round.roundNumber) {
//       const index = (round.roundNumber - 1) % flipSongSources.length;
//       if (flipSoundRef.current) {
//         flipSoundRef.current.src = flipSongSources[index];
//         flipSoundRef.current.load();
//       }
//     }
//   }, [round.roundNumber, isAudioInitialized]);

//   // Cleanup audio on unmount
//   useEffect(() => {
//     return () => {
//       if (isAudioInitialized) {
//         flipSoundRef.current?.pause();
//         resultSoundRef.current?.pause();
//         edgeSoundRef.current?.pause();
//       }
//     };
//   }, [isAudioInitialized]);

//   // Play flip sound while coin is flipping
//   useEffect(() => {
//     if (isAudioInitialized && isFlipping && !isMuted) {
//       flipSoundRef.current.currentTime = 0;
//       flipSoundRef.current.play().catch(() => setIsMuted(true));
//     } else if (isAudioInitialized) {
//       flipSoundRef.current?.pause();
//     }
//   }, [isFlipping, isAudioInitialized, isMuted]);

//   // Play result sound when outcome is determined
//   useEffect(() => {
//     if (round.outcome && isAudioInitialized && !isMuted) {
//       const soundToPlay =
//         outcome === "edge" ? edgeSoundRef.current : resultSoundRef.current;
//       if (soundToPlay) {
//         soundToPlay.currentTime = 0;
//         soundToPlay.play().catch(() => setIsMuted(true));
//       }
//     }
//   }, [round.outcome, outcome, isAudioInitialized, isMuted]);

//   // MODIFIED: Enhanced coin animation variants with fixed final positions based on outcome
//   const coinVariants = {
//     initial: { rotateY: 0, scale: 1, y: 0 },
//     flip: {
//       // When outcome is determined, freeze at the correct rotation angle:
//       // - heads: 0 degrees (no rotation)
//       // - tails: 180 degrees (flipped)
//       // - edge: 90 degrees (side)
//       rotateY: isFlipping
//         ? [0, 180, 360, 540, 720, 900]
//         : outcome === "heads"
//         ? 0
//         : outcome === "tails"
//         ? 180
//         : 90,
//       scale: isFlipping
//         ? [1, 1.05, 1, 1.05, 1]
//         : outcome === "edge"
//         ? 0.8
//         : [1, 1.15, 0.95, 1.05, 1], // Enhanced bounce effect
//       y: isFlipping
//         ? [0, -5, 0, -5, 0] // Slight hovering while spinning
//         : outcome === "edge"
//         ? 0
//         : [0, -30, -5, -15, 0], // More pronounced bounce
//       transition: {
//         rotateY: {
//           duration: isFlipping ? 2 : 1.2,
//           repeat: isFlipping ? Infinity : 0,
//           ease: isFlipping ? "easeInOut" : [0.34, 1.56, 0.64, 1],
//         },
//         scale: {
//           duration: isFlipping ? 2 : 1.2,
//           repeat: isFlipping ? Infinity : 0,
//           ease: isFlipping ? "easeInOut" : "easeOut",
//         },
//         y: {
//           duration: isFlipping ? 2 : 1,
//           ease: isFlipping ? "easeInOut" : [0.22, 1.2, 0.36, 1], // Spring-like motion
//           repeat: isFlipping ? Infinity : 0,
//           delay: isFlipping ? 0 : 0.2,
//         },
//       },
//     },
//   };

//   // Enhanced shadow animation
//   const shadowVariants = {
//     initial: { scale: 1, opacity: 0.3 },
//     animate: {
//       scale: isFlipping
//         ? [0.9, 0.8, 0.9, 0.8, 0.9]
//         : outcome === "edge"
//         ? 0.6
//         : [1, 0.7, 0.9, 0.8, 1],
//       opacity: isFlipping
//         ? [0.3, 0.2, 0.3, 0.2, 0.3]
//         : outcome === "edge"
//         ? 0.4
//         : [0.3, 0.5, 0.4, 0.3, 0.3],
//       transition: {
//         duration: isFlipping ? 2 : 1.2,
//         repeat: isFlipping ? Infinity : 0,
//         ease: isFlipping ? "easeInOut" : "easeOut",
//       },
//     },
//   };

//   // MODIFIED: Enhanced glow effect animation with stronger highlight for edge
//   const glowVariants = {
//     initial: { opacity: 0 },
//     animate: {
//       opacity: isFlipping 
//         ? [0.3, 0.5, 0.3] 
//         : outcome === "edge" 
//         ? [0.6, 0.9, 0.6] // Pulsing highlight for edge
//         : 0.6,
//       scale: isFlipping 
//         ? [1, 1.1, 1] 
//         : outcome === "edge" 
//         ? [1.1, 1.3, 1.1] // Enhanced scale for edge
//         : 1.1,
//       transition: {
//         duration: isFlipping ? 2 : 1.8,
//         repeat: isFlipping ? Infinity : outcome === "edge" ? Infinity : 0,
//         ease: "easeInOut",
//       },
//     },
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-[220px] perspective-1000 relative">
//       {/* Sound Toggle Button - Enhanced with animation */}
//       <motion.button
//         onClick={toggleSound}
//         className={`absolute top-0 -right-20 p-2 z-50 rounded-full transition-colors ${
//           isMuted
//             ? "bg-red-300 hover:bg-red-400"
//             : "bg-green-200 hover:bg-green-300"
//         }`}
//         whileHover={{ scale: 1.1 }}
//         whileTap={{ scale: 0.9 }}
//         animate={{
//           boxShadow: isMuted
//             ? "0px 0px 0px rgba(239, 68, 68, 0.2)"
//             : [
//                 "0px 0px 0px rgba(16, 185, 129, 0.2)",
//                 "0px 0px 8px rgba(16, 185, 129, 0.6)",
//                 "0px 0px 0px rgba(16, 185, 129, 0.2)",
//               ],
//         }}
//         transition={{
//           boxShadow: {
//             repeat: isMuted ? 0 : Infinity,
//             duration: 2,
//           },
//         }}
//         aria-label={isMuted ? "Unmute sound" : "Mute sound"}>
//         {isMuted ? (
//           <svg
//             className="w-6 h-6"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
//             />
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
//             />
//           </svg>
//         ) : (
//           <svg
//             className="w-6 h-6"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
//             />
//           </svg>
//         )}
//       </motion.button>

//       {/* Coin Container with enhanced background */}
//       <div className="relative w-full h-full flex justify-center items-center">
//         {/* Background circle - provides subtle contrast */}
//         <motion.div
//           className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-gray-100 to-gray-200"
//           animate={{
//             opacity: isFlipping
//               ? [0.4, 0.6, 0.4]
//               : outcome === "edge"
//               ? 0.6
//               : 0.5,
//             scale: isFlipping ? [1, 1.05, 1] : 1,
//           }}
//           transition={{
//             duration: 2,
//             repeat: isFlipping ? Infinity : 0,
//             ease: "easeInOut",
//           }}
//         />

//         <div className="relative w-32 h-32">
//           {/* MODIFIED: Enhanced glow effect with stronger highlight for edge */}
//           <motion.div
//             className={`absolute inset-0 rounded-full blur-md ${
//               outcome === "edge"
//                 ? "bg-orange-400"
//                 : outcome === "heads"
//                 ? "bg-yellow-300"
//                 : "bg-gray-300"
//             }`}
//             initial="initial"
//             animate="animate"
//             variants={glowVariants}
//           />

//           {/* MODIFIED: Enhanced edge highlight when edge is the outcome */}
//           {outcome === "edge" && !isFlipping && (
//             <motion.div
//               className="absolute inset-0 rounded-full bg-orange-500 opacity-0"
//               animate={{
//                 opacity: [0, 0.3, 0],
//                 scale: [0.9, 1.1, 0.9],
//               }}
//               transition={{
//                 duration: 2,
//                 repeat: Infinity,
//                 ease: "easeInOut",
//               }}
//             />
//           )}

//           {/* Improved Coin Shadow */}
//           <motion.div
//             className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/20 rounded-full blur-md"
//             initial="initial"
//             animate="animate"
//             variants={shadowVariants}
//           />

//           {/* Spin Particles - only visible during flip */}
//           {isFlipping && (
//             <div className="absolute inset-0 pointer-events-none">
//               {[...Array(12)].map((_, i) => (
//                 <SpinParticle
//                   key={`spin-${i}`}
//                   isFlipping={isFlipping}
//                 />
//               ))}
//             </div>
//           )}

//           {/* Coin */}
//           <motion.div
//             className="absolute inset-0"
//             initial="initial"
//             animate="flip"
//             variants={coinVariants}
//             style={{ transformStyle: "preserve-3d", perspective: "1000px" }}>
//             {/* Heads Side - Enhanced with embossed effect */}
//             <div className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden">
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 border-8 border-yellow-500 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-yellow-300 to-yellow-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-yellow-400 border-4 border-yellow-500 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-yellow-800">
//                     H
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Tails Side - Enhanced with embossed effect */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden"
//               style={{ transform: "rotateY(180deg)" }}>
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 border-8 border-gray-500 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-gray-300 to-gray-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-gray-400 border-4 border-gray-500 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-gray-800">T</div>
//                 </div>
//               </div>
//             </div>

//             {/* MODIFIED: Edge Side - Enhanced with texture and highlighting when outcome is edge */}
//             <div
//               className="absolute w-full h-8 rounded-full flex items-center justify-center backface-hidden overflow-hidden"
//               style={{
//                 transform: "rotateY(90deg) translateZ(64px)",
//                 background: outcome === "edge" && !isFlipping 
//                   ? "linear-gradient(to right, #FFA500, #FFD700, #FFA500)" 
//                   : "linear-gradient(to right, #FFD700, #FFA500)",
//                 boxShadow: outcome === "edge" && !isFlipping 
//                   ? "0 0 15px 5px rgba(255, 165, 0, 0.7)" 
//                   : "none",
//               }}>
//               {/* Edge texture */}
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={i}
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                       transform: "rotate(90deg)",
//                     }}
//                   />
//                 ))}
//               </div>
              
//               {/* MODIFIED: More prominent EDGE text when outcome is edge */}
//               <motion.div 
//                 className={`text-sm font-bold tracking-widest z-10 ${
//                   outcome === "edge" && !isFlipping 
//                     ? "text-yellow-900 text-lg font-extrabold" 
//                     : "text-yellow-900"
//                 }`}
//                 animate={outcome === "edge" && !isFlipping ? {
//                   textShadow: ["0 0 2px #FFF", "0 0 8px #FFF", "0 0 2px #FFF"],
//                   scale: [1, 1.1, 1]
//                 } : {}}
//                 transition={{
//                   duration: 1.5,
//                   repeat: outcome === "edge" && !isFlipping ? Infinity : 0,
//                   ease: "easeInOut"
//                 }}
//               >
//                 EDGE
//               </motion.div>
//             </div>
//           </motion.div>

//           {/* Enhanced Sparkles - More sparkles for edge outcome */}
//           {round.outcome && (
//             <div className="absolute inset-0 pointer-events-none">
//               {[...Array(outcome === "edge" ? 16 : 8)].map((_, i) => (
//                 <Sparkle
//                   key={`spark-${i}`}
//                   delay={i * 0.08}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* MODIFIED: Enhanced Outcome Display with special formatting for edge */}
//       {round.outcome && (
//         <motion.div
//           initial={{ opacity: 0, y: 30, scale: 0.9 }}
//           animate={{ opacity: 1, y: 0, scale: 1 }}
//           transition={{
//             type: "spring",
//             damping: 12,
//             stiffness: 100,
//             delay: 0.2,
//           }}
//           className={`mt-16 text-3xl font-bold ${
//             outcome === "edge"
//               ? "bg-gradient-to-r from-orange-400 via-red-500 to-orange-400"
//               : outcome === "heads"
//               ? "bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400"
//               : "bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400"
//           } bg-clip-text text-transparent relative`}>
//           {/* Subtle highlight under text - enhanced for edge */}
//           <div
//             className={`absolute inset-0 ${
//               outcome === "edge"
//                 ? "bg-orange-200"
//                 : outcome === "heads"
//                 ? "bg-yellow-200"
//                 : "bg-gray-200"
//             } blur-lg opacity-${outcome === "edge" ? "50" : "30"} -z-10 rounded-lg`}
//           />

//           {/* Text with animation - enhanced for edge */}
//           <motion.span
//             animate={{
//               textShadow: outcome === "edge" 
//                 ? [
//                     "0 0 5px rgba(255,165,0,0.3)",
//                     "0 0 15px rgba(255,165,0,0.8)",
//                     "0 0 5px rgba(255,165,0,0.3)",
//                   ]
//                 : [
//                     "0 0 5px rgba(255,255,255,0.1)",
//                     "0 0 10px rgba(255,255,255,0.6)",
//                     "0 0 5px rgba(255,255,255,0.1)",
//                   ],
//               scale: outcome === "edge" ? [1, 1.05, 1] : 1,
//             }}
//             transition={{
//               duration: outcome === "edge" ? 1.5 : 2,
//               repeat: Infinity,
//               ease: "easeInOut",
//             }}>
//             {outcome.toUpperCase()} {outcome === "edge" ? "!" : "WINS!"}
//           </motion.span>
//         </motion.div>
//       )}
//     </div>
//   );
// }

//////*************************************************************************************************************************************************************************Trae code above********* */






// import React, { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion";

// // Enhanced Sparkle component with more dynamic effects
// const Sparkle = ({ delay }) => {
//   const size = Math.random() * 3 + 2; // Slightly larger sparkles (2-5px)
//   const distance = 30 + Math.random() * 70; // Random distance from center
//   const angle = Math.random() * Math.PI * 2; // Random angle
//   const x = Math.cos(angle) * distance;
//   const y = Math.sin(angle) * distance;

//   // More vibrant colors with gold/silver theme based on coin sides
//   const colors = [
//     "hsl(50, 100%, 50%)", // Gold
//     "hsl(50, 90%, 60%)", // Light gold
//     "hsl(45, 100%, 50%)", // Deep gold
//     "hsl(0, 0%, 80%)", // Silver
//     "hsl(0, 0%, 90%)", // Light silver
//   ];

//   const color = colors[Math.floor(Math.random() * colors.length)];

//   return (
//     <motion.div
//       className="absolute rounded-full"
//       style={{
//         width: size,
//         height: size,
//         backgroundColor: color,
//         boxShadow: `0 0 ${size * 2}px ${color}`,
//         top: "50%",
//         left: "50%",
//         x,
//         y,
//       }}
//       initial={{ scale: 0, opacity: 1 }}
//       animate={{
//         scale: [0, 1, 0],
//         opacity: [0, 1, 0],
//         x: [0, x * 1.2],
//         y: [0, y * 1.2],
//       }}
//       transition={{
//         duration: 0.8 + Math.random() * 0.5,
//         delay,
//         ease: "easeOut",
//       }}
//     />
//   );
// };

// // New particle effect for the spinning coin
// const SpinParticle = ({ isFlipping }) => {
//   const size = Math.random() * 2 + 1;
//   const color =
//     Math.random() > 0.5
//       ? `hsla(45, 100%, ${50 + Math.random() * 20}%, 0.7)`
//       : `hsla(0, 0%, ${70 + Math.random() * 20}%, 0.7)`;

//   return isFlipping ? (
//     <motion.div
//       className="absolute rounded-full"
//       style={{
//         width: size,
//         height: size,
//         backgroundColor: color,
//         top: "50%",
//         left: "50%",
//       }}
//       initial={{
//         x: (Math.random() - 0.5) * 10,
//         y: (Math.random() - 0.5) * 10,
//         opacity: 0,
//       }}
//       animate={{
//         x: (Math.random() - 0.5) * 60,
//         y: (Math.random() - 0.5) * 60,
//         opacity: [0, 0.8, 0],
//       }}
//       transition={{
//         duration: 1.2,
//         repeat: Infinity,
//         repeatType: "loop",
//         ease: "easeInOut",
//       }}
//     />
//   ) : null;
// };

// export default function CoinFlip({ round }) {
//   const [isMuted, setIsMuted] = useState(true);
//   const [isAudioInitialized, setIsAudioInitialized] = useState(false);
//   const isFlipping = !round.outcome;
//   const outcome = round?.outcome || "heads";

//   // Define an array of three different flip songs
//   const flipSongSources = [
//     "/sounds/coi.mp3",
//     "/sounds/sunny.mp3",
//     "/sounds/sunshine.mp3",
//   ];

//   // Audio refs
//   const flipSoundRef = useRef(null);
//   const resultSoundRef = useRef(null);
//   const edgeSoundRef = useRef(null);

//   // Initialize audio only once after user interaction
//   const initializeAudio = () => {
//     if (!isAudioInitialized) {
//       flipSoundRef.current = new Audio(flipSongSources[0]);
//       resultSoundRef.current = new Audio("/sounds/result-chime.mp3");
//       edgeSoundRef.current = new Audio("/sounds/edge-special.mp3");

//       flipSoundRef.current.loop = true;
//       flipSoundRef.current.volume = 0.3;
//       resultSoundRef.current.volume = 0.5;
//       edgeSoundRef.current.volume = 0.5;

//       setIsAudioInitialized(true);
//     }
//   };

//   // Toggle mute and initialize audio if needed
//   const toggleSound = () => {
//     if (!isAudioInitialized) {
//       initializeAudio();
//     }
//     setIsMuted((prev) => !prev);

//     if (isAudioInitialized) {
//       [flipSoundRef, resultSoundRef, edgeSoundRef].forEach((soundRef) => {
//         if (soundRef.current) {
//           soundRef.current.muted = !isMuted;
//         }
//       });
//     }
//   };

//   // Update flipSoundRef source based on round number (if provided)
//   useEffect(() => {
//     if (isAudioInitialized && round && round.roundNumber) {
//       const index = (round.roundNumber - 1) % flipSongSources.length;
//       if (flipSoundRef.current) {
//         flipSoundRef.current.src = flipSongSources[index];
//         flipSoundRef.current.load();
//       }
//     }
//   }, [round.roundNumber, isAudioInitialized]);

//   // Cleanup audio on unmount
//   useEffect(() => {
//     return () => {
//       if (isAudioInitialized) {
//         flipSoundRef.current?.pause();
//         resultSoundRef.current?.pause();
//         edgeSoundRef.current?.pause();
//       }
//     };
//   }, [isAudioInitialized]);

//   // Play flip sound while coin is flipping
//   useEffect(() => {
//     if (isAudioInitialized && isFlipping && !isMuted) {
//       flipSoundRef.current.currentTime = 0;
//       flipSoundRef.current.play().catch(() => setIsMuted(true));
//     } else if (isAudioInitialized) {
//       flipSoundRef.current?.pause();
//     }
//   }, [isFlipping, isAudioInitialized, isMuted]);

//   // Play result sound when outcome is determined
//   useEffect(() => {
//     if (round.outcome && isAudioInitialized && !isMuted) {
//       const soundToPlay =
//         outcome === "edge" ? edgeSoundRef.current : resultSoundRef.current;
//       if (soundToPlay) {
//         soundToPlay.currentTime = 0;
//         soundToPlay.play().catch(() => setIsMuted(true));
//       }
//     }
//   }, [round.outcome, outcome, isAudioInitialized, isMuted]);

//   // Enhanced coin animation variants
//   const coinVariants = {
//     initial: { rotateY: 0, scale: 1, y: 0 },
//     flip: {
//       rotateY: isFlipping
//         ? [0, 180, 360, 540, 720, 900]
//         : outcome === "edge"
//         ? 90
//         : outcome === "heads"
//         ? 0
//         : 180,
//       scale: isFlipping
//         ? [1, 1.05, 1, 1.05, 1]
//         : outcome === "edge"
//         ? 0.8
//         : [1, 1.15, 0.95, 1.05, 1], // Enhanced bounce effect
//       y: isFlipping
//         ? [0, -5, 0, -5, 0] // Slight hovering while spinning
//         : outcome === "edge"
//         ? 0
//         : [0, -30, -5, -15, 0], // More pronounced bounce
//       transition: {
//         rotateY: {
//           duration: isFlipping ? 2 : 1.2,
//           repeat: isFlipping ? Infinity : 0,
//           ease: isFlipping ? "easeInOut" :  [0.34, 1.56, 0.64, 1],
//         },
//         scale: {
//           duration: isFlipping ? 2 : 1.2,
//           repeat: isFlipping ? Infinity : 0,
//           ease: isFlipping ? "easeInOut" : "easeOut",
//         },
//         y: {
//           duration: isFlipping ? 2 : 1,
//           ease: isFlipping ? "easeInOut" : [0.22, 1.2, 0.36, 1], // Spring-like motion
//           repeat: isFlipping ? Infinity : 0,
//           delay: isFlipping ? 0 : 0.2,
//         },
//       },
//     },
//   };

//   // Enhanced shadow animation
//   const shadowVariants = {
//     initial: { scale: 1, opacity: 0.3 },
//     animate: {
//       scale: isFlipping
//         ? [0.9, 0.8, 0.9, 0.8, 0.9]
//         : outcome === "edge"
//         ? 0.6
//         : [1, 0.7, 0.9, 0.8, 1],
//       opacity: isFlipping
//         ? [0.3, 0.2, 0.3, 0.2, 0.3]
//         : outcome === "edge"
//         ? 0.4
//         : [0.3, 0.5, 0.4, 0.3, 0.3],
//       transition: {
//         duration: isFlipping ? 2 : 1.2,
//         repeat: isFlipping ? Infinity : 0,
//         ease: isFlipping ? "easeInOut" : "easeOut",
//       },
//     },
//   };

//   // New glow effect animation
//   const glowVariants = {
//     initial: { opacity: 0 },
//     animate: {
//       opacity: isFlipping ? [0.3, 0.5, 0.3] : outcome === "edge" ? 0.8 : 0.6,
//       scale: isFlipping ? [1, 1.1, 1] : outcome === "edge" ? 1.2 : 1.1,
//       transition: {
//         duration: isFlipping ? 2 : 0.8,
//         repeat: isFlipping ? Infinity : 0,
//         ease: "easeInOut",
//       },
//     },
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-[220px] perspective-1000 relative">
//       {/* Sound Toggle Button - Enhanced with animation */}
//       <motion.button
//         onClick={toggleSound}
//         className={`absolute top-0 -right-20 p-2 z-50 rounded-full transition-colors ${
//           isMuted
//             ? "bg-red-300 hover:bg-red-400"
//             : "bg-green-200 hover:bg-green-300"
//         }`}
//         whileHover={{ scale: 1.1 }}
//         whileTap={{ scale: 0.9 }}
//         animate={{
//           boxShadow: isMuted
//             ? "0px 0px 0px rgba(239, 68, 68, 0.2)"
//             : [
//                 "0px 0px 0px rgba(16, 185, 129, 0.2)",
//                 "0px 0px 8px rgba(16, 185, 129, 0.6)",
//                 "0px 0px 0px rgba(16, 185, 129, 0.2)",
//               ],
//         }}
//         transition={{
//           boxShadow: {
//             repeat: isMuted ? 0 : Infinity,
//             duration: 2,
//           },
//         }}
//         aria-label={isMuted ? "Unmute sound" : "Mute sound"}>
//         {isMuted ? (
//           <svg
//             className="w-6 h-6"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
//             />
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
//             />
//           </svg>
//         ) : (
//           <svg
//             className="w-6 h-6"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
//             />
//           </svg>
//         )}
//       </motion.button>

//       {/* Coin Container with enhanced background */}
//       <div className="relative w-full h-full flex justify-center items-center">
//         {/* Background circle - provides subtle contrast */}
//         <motion.div
//           className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-gray-100 to-gray-200"
//           animate={{
//             opacity: isFlipping
//               ? [0.4, 0.6, 0.4]
//               : outcome === "edge"
//               ? 0.6
//               : 0.5,
//             scale: isFlipping ? [1, 1.05, 1] : 1,
//           }}
//           transition={{
//             duration: 2,
//             repeat: isFlipping ? Infinity : 0,
//             ease: "easeInOut",
//           }}
//         />

//         <div className="relative w-32 h-32">
//           {/* Enhanced glow effect */}
//           <motion.div
//             className={`absolute inset-0 rounded-full blur-md ${
//               outcome === "edge"
//                 ? "bg-orange-400"
//                 : outcome === "heads"
//                 ? "bg-yellow-300"
//                 : "bg-gray-300"
//             }`}
//             initial="initial"
//             animate="animate"
//             variants={glowVariants}
//           />

//           {/* Improved Coin Shadow */}
//           <motion.div
//             className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/20 rounded-full blur-md"
//             initial="initial"
//             animate="animate"
//             variants={shadowVariants}
//           />

//           {/* Spin Particles - only visible during flip */}
//           {isFlipping && (
//             <div className="absolute inset-0 pointer-events-none">
//               {[...Array(12)].map((_, i) => (
//                 <SpinParticle
//                   key={`spin-${i}`}
//                   isFlipping={isFlipping}
//                 />
//               ))}
//             </div>
//           )}

//           {/* Coin */}
//           <motion.div
//             className="absolute inset-0"
//             initial="initial"
//             animate="flip"
//             variants={coinVariants}
//             style={{ transformStyle: "preserve-3d", perspective: "1000px" }}>
//             {/* Heads Side - Enhanced with embossed effect */}
//             <div className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden">
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 border-8 border-yellow-500 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-yellow-300 to-yellow-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-yellow-400 border-4 border-yellow-500 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-yellow-800">
//                     H
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Tails Side - Enhanced with embossed effect */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden"
//               style={{ transform: "rotateY(180deg)" }}>
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 border-8 border-gray-500 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-gray-300 to-gray-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-gray-400 border-4 border-gray-500 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-gray-800">T</div>
//                 </div>
//               </div>
//             </div>

//             {/* Edge Side - Enhanced with texture */}
//             <div
//               className="absolute w-full h-8 rounded-full flex items-center justify-center backface-hidden overflow-hidden"
//               style={{
//                 transform: "rotateY(90deg) translateZ(64px)",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//               }}>
//               {/* Edge texture */}
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={i}
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                       transform: "rotate(90deg)",
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10">
//                 EDGE
//               </div>
//             </div>
//           </motion.div>

//           {/* Enhanced Sparkles */}
//           {round.outcome && (
//             <div className="absolute inset-0 pointer-events-none">
//               {[...Array(round.outcome === "edge" ? 12 : 8)].map((_, i) => (
//                 <Sparkle
//                   key={`spark-${i}`}
//                   delay={i * 0.08}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Enhanced Outcome Display */}
//       {round.outcome && (
//         <motion.div
//           initial={{ opacity: 0, y: 30, scale: 0.9 }}
//           animate={{ opacity: 1, y: 0, scale: 1 }}
//           transition={{
//             type: "spring",
//             damping: 12,
//             stiffness: 100,
//             delay: 0.2,
//           }}
//           className={`mt-16 text-3xl font-bold ${
//             outcome === "edge"
//               ? "bg-gradient-to-r from-orange-400 via-red-500 to-orange-400"
//               : outcome === "heads"
//               ? "bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400"
//               : "bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400"
//           } bg-clip-text text-transparent relative`}>
//           {/* Subtle highlight under text */}
//           <div
//             className={`absolute inset-0 ${
//               outcome === "edge"
//                 ? "bg-orange-200"
//                 : outcome === "heads"
//                 ? "bg-yellow-200"
//                 : "bg-gray-200"
//             } blur-lg opacity-30 -z-10 rounded-lg`}
//           />

//           {/* Text with animation */}
//           <motion.span
//             animate={{
//               textShadow: [
//                 "0 0 5px rgba(255,255,255,0.1)",
//                 "0 0 10px rgba(255,255,255,0.6)",
//                 "0 0 5px rgba(255,255,255,0.1)",
//               ],
//             }}
//             transition={{
//               duration: 2,
//               repeat: Infinity,
//               ease: "easeInOut",
//             }}>
//             {outcome.toUpperCase()} {outcome === "edge" ? "!" : "WINS!"}
//           </motion.span>
//         </motion.div>
//       )}
//     </div>
//   );
// }

/********************************************************************************************* */

// // // // src/components/CoinFlip.js
// import React, { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion";

// // Sparkle component for visual effects
// const Sparkle = ({ delay }) => {
//   const size = Math.random() * 2 + 1; // Random size between 1 and 3 pixels
//   const color = `hsl(${Math.random() * 360}, 100%, 50%)`; // Random vibrant color
//   return (
//     <motion.div
//       className="absolute rounded-full"
//       style={{
//         width: size,
//         height: size,
//         backgroundColor: color,
//         top: `${Math.random() * 100}%`,
//         left: `${Math.random() * 100}%`,
//       }}
//       initial={{ scale: 0, opacity: 1 }}
//       animate={{ scale: 1.5, opacity: 0 }}
//       transition={{ duration: 0.5, delay }}
//     />
//   );
// };

// export default function CoinFlip({ round }) {
//   const [isMuted, setIsMuted] = useState(true); // Start muted by default
//   const [isAudioInitialized, setIsAudioInitialized] = useState(false);
//   const isFlipping = !round.outcome;
//   const outcome = round?.outcome || "heads";

//   // Define an array of three different flip songs
//   const flipSongSources = [
//     "/sounds/coi.mp3",
//     "/sounds/sunny.mp3",
//     "/sounds/sunshine.mp3",
//   ];

//   // Audio refs
//   const flipSoundRef = useRef(null);
//   const resultSoundRef = useRef(null);
//   const edgeSoundRef = useRef(null);

//   // Initialize audio only once after user interaction
//   const initializeAudio = () => {
//     if (!isAudioInitialized) {
//       // Use the first song by default; later we update it based on round number
//       flipSoundRef.current = new Audio(flipSongSources[0]);
//       resultSoundRef.current = new Audio("/sounds/result-chime.mp3");
//       edgeSoundRef.current = new Audio("/sounds/edge-special.mp3");

//       flipSoundRef.current.loop = true;
//       flipSoundRef.current.volume = 0.3;
//       resultSoundRef.current.volume = 0.5;
//       edgeSoundRef.current.volume = 0.5;

//       setIsAudioInitialized(true);
//     }
//   };

//   // Toggle mute and initialize audio if needed
//   const toggleSound = () => {
//     if (!isAudioInitialized) {
//       initializeAudio();
//     }
//     setIsMuted((prev) => !prev);

//     if (isAudioInitialized) {
//       [flipSoundRef, resultSoundRef, edgeSoundRef].forEach((soundRef) => {
//         if (soundRef.current) {
//           soundRef.current.muted = !isMuted;
//         }
//       });
//     }
//   };

//   // Update flipSoundRef source based on round number (if provided)
//   useEffect(() => {
//     // Check that audio is initialized and round.roundNumber exists
//     if (isAudioInitialized && round && round.roundNumber) {
//       // Use modulo to cycle through the three songs
//       const index = (round.roundNumber - 1) % flipSongSources.length;
//       if (flipSoundRef.current) {
//         flipSoundRef.current.src = flipSongSources[index];
//         flipSoundRef.current.load();
//       }
//     }
//   }, [round.roundNumber, isAudioInitialized]);

//   // Cleanup audio on unmount
//   useEffect(() => {
//     return () => {
//       if (isAudioInitialized) {
//         flipSoundRef.current?.pause();
//         resultSoundRef.current?.pause();
//         edgeSoundRef.current?.pause();
//       }
//     };
//   }, [isAudioInitialized]);

//   // Play flip sound while coin is flipping
//   useEffect(() => {
//     if (isAudioInitialized && isFlipping && !isMuted) {
//       flipSoundRef.current.currentTime = 0;
//       flipSoundRef.current.play().catch(() => setIsMuted(true));
//     } else if (isAudioInitialized) {
//       flipSoundRef.current?.pause();
//     }
//   }, [isFlipping, isAudioInitialized, isMuted]);

//   // Play result sound when outcome is determined
//   useEffect(() => {
//     if (round.outcome && isAudioInitialized && !isMuted) {
//       const soundToPlay =
//         outcome === "edge" ? edgeSoundRef.current : resultSoundRef.current;
//       if (soundToPlay) {
//         soundToPlay.currentTime = 0;
//         soundToPlay.play().catch(() => setIsMuted(true));
//       }
//     }
//   }, [round.outcome, outcome, isAudioInitialized, isMuted]);

//   // Coin animation variants with bounce effect
//   const coinVariants = {
//     initial: { rotateY: 0, scale: 1, y: 0 },
//     flip: {
//       rotateY: isFlipping
//         ? [0, 180, 360, 540, 720, 900]
//         : outcome === "edge"
//         ? 90
//         : outcome === "heads"
//         ? 0
//         : 180,
//       scale: isFlipping
//         ? [1, 1.1, 1, 1.1, 1]
//         : outcome === "edge"
//         ? 0.8
//         : 1,
//       y: isFlipping
//         ? 0
//         : outcome === "edge"
//         ? 0
//         : [0, -20, 0, -10, 0], // Bounce effect
//       transition: {
//         rotateY: {
//           duration: isFlipping ? 2.5 : 0.8,
//           repeat: isFlipping ? Infinity : 0,
//           ease: isFlipping ? "easeInOut" : "easeOut",
//         },
//         scale: {
//           duration: isFlipping ? 2.5 : 0.8,
//           repeat: isFlipping ? Infinity : 0,
//           ease: isFlipping ? "easeInOut" : "easeOut",
//         },
//         y: {
//           duration: 0.5,
//           ease: "easeOut",
//           repeat: 0,
//           delay: 0.8, // Starts after rotateY completes
//         },
//       },
//     },
//   };

//   // Shadow animation variants
//   const shadowVariants = {
//     initial: { scale: 1, opacity: 0.3 },
//     animate: {
//       scale: isFlipping
//         ? [1, 0.8, 1, 0.8, 1]
//         : outcome === "edge"
//         ? 0.6
//         : 1,
//       opacity: isFlipping
//         ? [0.3, 0.2, 0.3, 0.2, 0.3]
//         : outcome === "edge"
//         ? 0.4
//         : 0.3,
//       transition: {
//         duration: isFlipping ? 2.5 : 0.8,
//         repeat: isFlipping ? Infinity : 0,
//         ease: "easeInOut",
//       },
//     },
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-[160px] perspective-1000 relative">
//       {/* Sound Toggle Button */}
//       <motion.button
//         onClick={toggleSound}
//         className={`absolute top-4 right-0 p-2 z-50 rounded-full transition-colors ${
//           isMuted ? "bg-red-200 hover:bg-red-300" : "bg-green-200 hover:bg-green-300"
//         }`}
//         whileTap={{ scale: 0.9 }}
//         aria-label={isMuted ? "Unmute sound" : "Mute sound"}
//       >
//         {isMuted ? (
//           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
//             />
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
//             />
//           </svg>
//         ) : (
//           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
//             />
//           </svg>
//         )}
//       </motion.button>

//       {/* Coin Container */}
//       <div className="relative  w-full h-full flex justify-center items-center">
//         <div className="relative  w-32 h-32">
//           {/* Coin Shadow */}
//           <motion.div
//             className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/20 rounded-full blur-md"
//             initial="initial"
//             animate="animate"
//             variants={shadowVariants}
//           />

//           {/* Coin */}
//           <motion.div
//             className="absolute inset-0"
//             initial="initial"
//             animate="flip"
//             variants={coinVariants}
//             style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
//           >
//             {/* Heads Side */}
//             <div className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden">
//               <div className="w-full h-full rounded-full bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500 border-8 border-yellow-500 flex items-center justify-center shadow-inner">
//                 <div className="text-4xl font-bold text-yellow-800">H</div>
//               </div>
//             </div>

//             {/* Tails Side */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden"
//               style={{ transform: "rotateY(180deg)" }}
//             >
//               <div className="w-full h-full rounded-full bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 border-8 border-gray-500 flex items-center justify-center shadow-inner">
//                 <div className="text-4xl font-bold text-gray-800">T</div>
//               </div>
//             </div>

//             {/* Edge Side */}
//             <div
//               className="absolute w-full h-8 rounded-full flex items-center justify-center backface-hidden"
//               style={{
//                 transform: "rotateY(90deg) translateZ(64px)",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//               }}
//             >
//               <div className="text-sm font-bold text-yellow-900">EDGE</div>
//             </div>
//           </motion.div>

//           {/* Sparkles */}
//           {round.outcome && round.outcome !== "edge" && (
//             <div className="absolute inset-0 pointer-events-none">
//               {[...Array(5)].map((_, i) => (
//                 <Sparkle key={i} delay={i * 0.1} />
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Outcome Display */}
//       {round.outcome && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className={`mt-16 text-3xl font-bold ${
//             outcome === "edge"
//               ? "bg-gradient-to-r from-orange-400 to-red-600"
//               : "bg-gradient-to-r from-yellow-400 to-yellow-600"
//           } bg-clip-text text-transparent`}
//         >
//           {outcome.toUpperCase()} {outcome === "edge" ? "!" : "WINS!"}
//         </motion.div>
//       )}
//     </div>
//   );
// }
