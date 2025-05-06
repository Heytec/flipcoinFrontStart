import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import PropTypes from 'prop-types';

// ### Constants Definition ###
const MAX_TIMER_SECONDS = 20;
const COIN_THICKNESS_PIXELS = 32;
const COIN_TRANSLATE_Z_OFFSET = COIN_THICKNESS_PIXELS / 2;

const SOUND_FILES = {
  FLIP_SONGS: [
    "/sounds/coi.mp3",
    "/sounds/sunny.mp3",
    "/sounds/sunshine.mp3",
  ],
  RESULT_CHIME: "/sounds/result-chime.mp3",
  HOUSE_SOUND: "/sounds/edge-special.mp3",
};

const OUTCOMES = {
  HEADS: 'heads',
  TAILS: 'tails',
  HOUSE: 'house',
};

// Enhanced Sparkle component
const Sparkle = ({ delay, outcome }) => { // Added outcome prop
  const size = Math.random() * 3 + 2;
  const distance = 30 + Math.random() * 70;
  const angle = Math.random() * Math.PI * 2;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  let R_colors = [
    "hsl(50, 100%, 50%)", // Gold
    "hsl(50, 90%, 60%)", // Light gold
    "hsl(45, 100%, 50%)", // Deep gold
  ];
  if (outcome === OUTCOMES.HOUSE) {
    // For HOUSE outcome, bias towards gold and orange
    R_colors = [
      "hsl(50, 100%, 50%)", // Gold
      "hsl(45, 100%, 55%)", // Deep Gold
      "hsl(35, 100%, 50%)", // Orange-Gold
      "hsl(25, 100%, 50%)", // Orange
      "hsl(50, 100%, 70%)", // Bright Yellow
    ];
  } else if (outcome === OUTCOMES.TAILS) {
    // For TAILS, bias towards silver
     R_colors = [
      "hsl(0, 0%, 80%)",   // Silver
      "hsl(0, 0%, 90%)",   // Light silver
      "hsl(0, 0%, 70%)",   // Darker Silver
      "hsl(210, 50%, 70%)", // Bluish Silver
    ];
  }
  // HEADS will use the default gold-biased colors if not HOUSE or TAILS

  const color = R_colors[Math.floor(Math.random() * R_colors.length)];


  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2}px ${color}`, // Brighter glow for sparkles
        top: "50%",
        left: "50%",
        x,
        y,
      }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{
        scale: [0, 1.2, 0], // Slightly larger peak scale for more pop
        opacity: [0, 1, 0],
        x: [0, x * 1.25], // Travel a bit further
        y: [0, y * 1.25],
      }}
      transition={{
        duration: 0.9 + Math.random() * 0.6, // Slightly longer, more varied duration
        delay,
        ease: "circOut", // Changed ease for a different feel
      }}
    />
  );
};
Sparkle.propTypes = {
    delay: PropTypes.number.isRequired,
    outcome: PropTypes.string, // Can be one of OUTCOMES or undefined
};


const SpinParticle = () => {
  const size = Math.random() * 2 + 1;
  const color =
    Math.random() > 0.5
      ? `hsla(45, 100%, ${50 + Math.random() * 20}%, 0.7)`
      : `hsla(0, 0%, ${70 + Math.random() * 20}%, 0.7)`;

  return (
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
        x: (Math.random() - 0.5) * 70, // Increased range for more spread
        y: (Math.random() - 0.5) * 70,
        opacity: [0, 0.9, 0], // Slightly more visible
      }}
      transition={{
        duration: 1.3 + Math.random() * 0.4, // Slightly longer and more varied
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeOut",
      }}
    />
  );
};

const TimerCircle = ({ timeLeft, maxTime }) => {
  const percentage = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage / 100);
  const hue = (percentage / 100) * 120;
  const color = `hsl(${hue}, 100%, 50%)`;

  return (
    <svg
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      width="210" height="210" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
      <motion.circle
        cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
        strokeLinecap="round" transform="rotate(-90 80 80)" initial={false}
        animate={{ strokeDashoffset, stroke: color }}
        transition={{
          strokeDashoffset: { duration: 1, ease: "linear" },
          stroke: { duration: 1, ease: "linear" },
        }}
      />
    </svg>
  );
};

export default function CoinFlip({ round, timeLeft }) {
  const [isMuted, setIsMuted] = useState(true);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const isFlipping = !round.outcome;
  const currentOutcome = round?.outcome || OUTCOMES.HEADS;

  const maxTime = MAX_TIMER_SECONDS;
  const flipSongSources = SOUND_FILES.FLIP_SONGS;

  const flipSoundRef = useRef(null);
  const resultSoundRef = useRef(null);
  const houseSoundRef = useRef(null);

  const initializeAudio = () => {
    if (!isAudioInitialized) {
      flipSoundRef.current = new Audio(flipSongSources[0]);
      resultSoundRef.current = new Audio(SOUND_FILES.RESULT_CHIME);
      houseSoundRef.current = new Audio(SOUND_FILES.HOUSE_SOUND);
      flipSoundRef.current.loop = true;
      flipSoundRef.current.volume = 0.3;
      resultSoundRef.current.volume = 0.5;
      houseSoundRef.current.volume = 0.5;
      setIsAudioInitialized(true);
    }
  };

  const toggleSound = () => {
    if (!isAudioInitialized) initializeAudio();
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (isAudioInitialized) {
      [flipSoundRef, resultSoundRef, houseSoundRef].forEach((soundRef) => {
        if (soundRef.current) soundRef.current.muted = newMutedState;
      });
    }
  };

  useEffect(() => {
    if (isAudioInitialized && round?.roundNumber) {
      const index = (round.roundNumber - 1) % flipSongSources.length;
      if (flipSoundRef.current && flipSoundRef.current.src !== flipSongSources[index]) {
        flipSoundRef.current.src = flipSongSources[index];
        flipSoundRef.current.load();
      }
    }
  }, [round?.roundNumber, isAudioInitialized, flipSongSources]);

  useEffect(() => {
    return () => {
      if (isAudioInitialized) {
        flipSoundRef.current?.pause();
        resultSoundRef.current?.pause();
        houseSoundRef.current?.pause();
      }
    };
  }, [isAudioInitialized]);

  useEffect(() => {
    if (isAudioInitialized && !isMuted) {
        if (isFlipping) {
            if (flipSoundRef.current?.paused) {
                flipSoundRef.current.currentTime = 0;
                flipSoundRef.current.play().catch(() => setIsMuted(true));
            }
        } else {
            flipSoundRef.current?.pause();
        }
    } else if (isAudioInitialized && isMuted) {
        flipSoundRef.current?.pause();
    }
  }, [isFlipping, isAudioInitialized, isMuted]);

  useEffect(() => {
    if (round.outcome && isAudioInitialized && !isMuted) {
      const soundToPlay = round.outcome === OUTCOMES.HOUSE ? houseSoundRef.current : resultSoundRef.current;
      if (soundToPlay) {
        soundToPlay.currentTime = 0;
        soundToPlay.play().catch(() => setIsMuted(true));
      }
    }
  }, [round.outcome, isAudioInitialized, isMuted]);

  const coinVariants = {
    initial: { rotateY: 0, scale: 1, y: 0 },
    flip: {
      rotateY: isFlipping
        ? [0, 90, 180, 270, 360, 450, 540, 630, 720, 810, 900, 990, 1080] // Added more rotations for a longer spin feel
        : currentOutcome === OUTCOMES.HEADS
          ? 0
          : currentOutcome === OUTCOMES.TAILS
            ? 180
            : 90, // HOUSE outcome lands on edge
      scale: isFlipping
        ? [1, 1.05, 1, 1.05, 1]
        : currentOutcome === OUTCOMES.HOUSE
          ? [0.8, 0.85, 0.8] // Subtle settle animation for HOUSE
          : 1, // Heads/Tails scale handled by spring y
      y: isFlipping
        ? [0, -10, 0, -10, 0] // Slightly less hover
        : currentOutcome === OUTCOMES.HOUSE
          ? 0 // HOUSE lands flat
          : 0, // For Heads/Tails, y is controlled by spring physics on result
      transition: {
        rotateY: {
          duration: isFlipping ? 2.5 : 0.7, // Longer flip, slightly faster result presentation
          repeat: isFlipping ? Infinity : 0,
          ease: isFlipping ? "linear" : [0.34, 1.56, 0.64, 1],
        },
        scale: { // Scale transition for HOUSE outcome
          duration: currentOutcome === OUTCOMES.HOUSE ? 0.5 : (isFlipping ? 2.5 : 0.8),
          delay: currentOutcome === OUTCOMES.HOUSE ? 0.7 : 0, // Delay HOUSE scale settle
          repeat: isFlipping ? Infinity : (currentOutcome === OUTCOMES.HOUSE ? 1 : 0), // HOUSE settle repeats once
          ease: isFlipping ? "easeInOut" : "easeOut",
        },
        y: isFlipping
          ? { duration: 2.5, ease: "easeInOut", repeat: Infinity }
          : (currentOutcome !== OUTCOMES.HOUSE // Apply spring only if not HOUSE
            ? { type: "spring", damping: 8, stiffness: 120, mass: 0.8, delay: 0.1 } // Spring for H/T bounce
            : { duration: 0.7, ease: "easeOut" }), // Standard transition for HOUSE y (if it had y motion)
      },
    },
    // Separate variant for Heads/Tails result bounce to use spring for y and scale together
    resultBounce: {
        y: [0, -45, 5, -15, 0], // More pronounced bounce
        scale: [1, 1.15, 0.9, 1.05, 1],
        transition: {
            y: { type: "spring", damping: 10, stiffness: 100, mass: 1, delay: 0.1},
            scale: { type: "spring", damping: 10, stiffness: 100, mass: 1, delay: 0.1},
        }
    }
  };

  const shadowVariants = {
    initial: { scale: 1, opacity: 0.3 },
    animate: {
      scale: isFlipping
        ? [0.9, 0.8, 0.9, 0.8, 0.9]
        : currentOutcome === OUTCOMES.HOUSE
          ? 0.6 // Static shadow for HOUSE
          : [1, 0.65, 0.95, 0.8, 1], // Shadow reacts to bounce for H/T
      opacity: isFlipping
        ? [0.3, 0.2, 0.3, 0.2, 0.3]
        : currentOutcome === OUTCOMES.HOUSE
          ? 0.4 // Static shadow for HOUSE
          : [0.3, 0.1, 0.25, 0.15, 0.3], // Shadow reacts to bounce for H/T
      transition: {
        duration: isFlipping ? 2.5 : (currentOutcome === OUTCOMES.HOUSE ? 0.7 : 1.2), // Match coin y duration for H/T
        repeat: isFlipping ? Infinity : 0,
        ease: isFlipping ? "easeInOut" : "easeOut",
        // For H/T, shadow ease should ideally match the "feel" of the spring,
        // but direct sync is hard. `easeOut` is a general approximation.
        // If using the resultBounce variant, this shadow animation needs to align with that.
      },
    },
  };


  const glowVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: isFlipping ? [0.3, 0.6, 0.3] : currentOutcome === OUTCOMES.HOUSE ? [0.7, 0.9, 0.7] : 0.6, // Pulsing glow for HOUSE
      scale: isFlipping ? [1, 1.15, 1] : currentOutcome === OUTCOMES.HOUSE ? [1.2, 1.3, 1.2] : 1.1, // Pulsing glow for HOUSE
      transition: {
        duration: isFlipping ? 2.5 : (currentOutcome === OUTCOMES.HOUSE ? 1.5 : 0.8),
        repeat: isFlipping || currentOutcome === OUTCOMES.HOUSE ? Infinity : 0,
        ease: "easeInOut",
      },
    },
  };

  // Determine which animation target to use for the coin
  let coinAnimationTarget = "flip";
  if (!isFlipping && currentOutcome !== OUTCOMES.HOUSE) {
      coinAnimationTarget = ["flip", "resultBounce"]; // Apply flip for rotateY, then resultBounce for y/scale
  } else if (!isFlipping && currentOutcome === OUTCOMES.HOUSE) {
      coinAnimationTarget = "flip"; // Only use the 'flip' variant's end state for HOUSE
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-[220px] perspective-1000 relative">
      <motion.button
        onClick={toggleSound}
        className={`absolute top-0 -right-20 p-2 z-50 rounded-full transition-colors ${isMuted ? "bg-red-500 hover:bg-red-300" : "bg-green-200 hover:bg-green-300"}`}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        animate={{ boxShadow: isMuted ? "0px 0px 0px rgba(239, 68, 68, 0.2)" : ["0px 0px 0px rgba(16, 185, 129, 0.2)", "0px 0px 8px rgba(16, 185, 129, 0.6)", "0px 0px 0px rgba(16, 185, 129, 0.2)"]}}
        transition={{ boxShadow: { repeat: isMuted ? 0 : Infinity, duration: 2 }}}
        aria-label={isMuted ? "Unmute sound" : "Mute sound"}>
        {isMuted ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
               : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>}
      </motion.button>

      <div className="relative w-full h-full flex justify-center items-center">
        <motion.div
          className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-gray-100 to-gray-200"
          animate={{
            opacity: isFlipping ? [0.4, 0.6, 0.4] : currentOutcome === OUTCOMES.HOUSE ? 0.6 : 0.5,
            scale: isFlipping ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 2.5, repeat: isFlipping ? Infinity : 0, ease: "easeInOut" }}
        />

        {isFlipping && timeLeft !== undefined && (<TimerCircle timeLeft={timeLeft} maxTime={maxTime} />)}

        <div className="relative w-32 h-32">
          <motion.div
            className={`absolute inset-0 rounded-full blur-md ${currentOutcome === OUTCOMES.HOUSE ? "bg-orange-400" : currentOutcome === OUTCOMES.HEADS ? "bg-yellow-300" : "bg-gray-300"}`}
            initial="initial" animate="animate" variants={glowVariants}
          />
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/20 rounded-full blur-md"
            initial="initial" animate="animate" variants={shadowVariants}
          />
          {isFlipping && (<div className="absolute inset-0 pointer-events-none">{[...Array(15)].map((_, i) => (<SpinParticle key={`spin-${i}`} />))}</div>)} {/* Increased spin particles */}

          <motion.div
            className="absolute inset-0"
            initial="initial"
            animate={coinAnimationTarget} // Use the determined animation target
            variants={coinVariants}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}>
            {/* Heads Side */}
            <div className="absolute w-full h-full rounded-full flex items-center justify-center" style={{ transform: `rotateY(0deg) translateZ(${COIN_TRANSLATE_Z_OFFSET}px)`, backfaceVisibility: "hidden" }}>
              <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-inner overflow-hidden">
                <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-yellow-300 to-yellow-500 opacity-70" />
                <div className="relative z-10 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-inner"><div className="text-3xl font-extrabold text-yellow-800">H</div></div>
              </div>
            </div>
            {/* Tails Side */}
            <div className="absolute w-full h-full rounded-full flex items-center justify-center" style={{ transform: `rotateY(180deg) translateZ(${COIN_TRANSLATE_Z_OFFSET}px)`, backfaceVisibility: "hidden" }}>
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 flex items-center justify-center shadow-inner overflow-hidden">
                <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-gray-300 to-gray-500 opacity-70" />
                <div className="relative z-10 w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center shadow-inner"><div className="text-3xl font-extrabold text-gray-800">T</div></div>
              </div>
            </div>
            {/* House Side - Back/Bottom Edge */}
            <div className="absolute w-full flex items-center justify-center overflow-hidden" style={{ transform: `rotateX(-90deg) translateZ(${COIN_TRANSLATE_Z_OFFSET}px)`, height: `${COIN_THICKNESS_PIXELS}px`, background: "linear-gradient(to bottom, #FFD700, #FFA500)", backfaceVisibility: "hidden" }}>
              <div className="absolute inset-0 opacity-30">{[...Array(20)].map((_, i) => (<div key={`back-house-${i}`} className="absolute h-full w-1 bg-yellow-900/20" style={{ left: `${i * 5}%` }} />))}</div>
              <div className="text-sm font-bold text-yellow-900 tracking-widest z-10">JACKPOT</div>
            </div>
            {/* House Side - Left Edge */}
            <div className="absolute h-full flex items-center justify-center overflow-hidden" style={{ transform: `rotateY(-90deg) translateZ(${COIN_TRANSLATE_Z_OFFSET}px)`, width: `${COIN_THICKNESS_PIXELS}px`, background: "linear-gradient(to right, #FFD700, #FFA500)", backfaceVisibility: "hidden" }}>
              <div className="absolute inset-0 opacity-30">{[...Array(20)].map((_, i) => (<div key={`left-house-${i}`} className="absolute w-full h-1 bg-yellow-900/20" style={{ top: `${i * 5}%` }}/>))}</div>
              <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">JACKPOT</div>
            </div>
            {/* House Side - Right Edge */}
            <div className="absolute h-full flex items-center justify-center overflow-hidden" style={{ transform: `rotateY(90deg) translateZ(${COIN_TRANSLATE_Z_OFFSET}px)`, width: `${COIN_THICKNESS_PIXELS}px`, background: "linear-gradient(to right, #FFD700, #FFA500)", backfaceVisibility: "hidden" }}>
              <div className="absolute inset-0 opacity-30">{[...Array(20)].map((_, i) => (<div key={`right-house-${i}`} className="absolute w-full h-1 bg-yellow-900/20" style={{ top: `${i * 5}%` }} />))}</div>
              <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">House</div>
            </div>
          </motion.div>

          {round.outcome && (<div className="absolute inset-0 pointer-events-none">{[...Array(currentOutcome === OUTCOMES.HOUSE ? 15 : 10)].map((_, i) => (<Sparkle key={`spark-${i}`} delay={i * 0.06} outcome={currentOutcome} />))}</div>)} {/* Increased sparkles, pass outcome */}
        </div>
      </div>

      {round.outcome && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.2 }}
          className={`mt-16 text-3xl font-bold ${currentOutcome === OUTCOMES.HOUSE ? "bg-gradient-to-r from-orange-400 via-red-500 to-orange-400" : currentOutcome === OUTCOMES.HEADS ? "bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400" : "bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400"} bg-clip-text text-transparent relative`}>
          <div className={`absolute inset-0 ${currentOutcome === OUTCOMES.HOUSE ? "bg-orange-200" : currentOutcome === OUTCOMES.HEADS ? "bg-yellow-200" : "bg-gray-200"} blur-lg opacity-30 -z-10 rounded-lg`} />
          <motion.span
            animate={{ textShadow: ["0 0 5px rgba(255,255,255,0.1)", "0 0 15px rgba(255,255,255,0.7)", "0 0 5px rgba(255,255,255,0.1)"]}} // Enhanced text shadow
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
            {currentOutcome === OUTCOMES.HOUSE ? "JACKPOT" : currentOutcome.toUpperCase()}{" "}
            {currentOutcome === OUTCOMES.HOUSE ? "UPDATE!" : "WINS!"}
          </motion.span>
        </motion.div>
      )}
    </div>
  );
}

CoinFlip.propTypes = {
  round: PropTypes.shape({
    outcome: PropTypes.oneOf([OUTCOMES.HEADS, OUTCOMES.TAILS, OUTCOMES.HOUSE, null, undefined]),
    roundNumber: PropTypes.number,
  }).isRequired,
  timeLeft: PropTypes.number,
};
CoinFlip.defaultProps = { timeLeft: undefined };


// import React, { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion";
// import PropTypes from 'prop-types'; // 1. Added PropTypes import

// // ### Constants Definition ###
// const MAX_TIMER_SECONDS = 20;
// const COIN_THICKNESS_PIXELS = 32; // Represents the full perceived thickness of the coin
// const COIN_TRANSLATE_Z_OFFSET = COIN_THICKNESS_PIXELS / 2; // For positioning faces and edges

// const SOUND_FILES = {
//   FLIP_SONGS: [
//     "/sounds/coi.mp3",
//     "/sounds/sunny.mp3",
//     "/sounds/sunshine.mp3",
//   ],
//   RESULT_CHIME: "/sounds/result-chime.mp3",
//   HOUSE_SOUND: "/sounds/edge-special.mp3", // Consider renaming if it's a jackpot sound
// };

// const OUTCOMES = {
//   HEADS: 'heads',
//   TAILS: 'tails',
//   HOUSE: 'house', // Represents the 'edge' or 'jackpot' outcome
// };

// // Enhanced Sparkle component with more dynamic effects
// const Sparkle = ({ delay }) => {
//   const size = Math.random() * 3 + 2;
//   const distance = 30 + Math.random() * 70;
//   const angle = Math.random() * Math.PI * 2;
//   const x = Math.cos(angle) * distance;
//   const y = Math.sin(angle) * distance;

//   const colors = [
//     "hsl(50, 100%, 50%)", // Gold
//     "hsl(50, 90%, 60%)", // Light gold
//     "hsl(45, 100%, 50%)", // Deep gold
//     "hsl(0, 0%, 80%)",   // Silver
//     "hsl(0, 0%, 90%)",   // Light silver
//     "hsl(25, 100%, 50%)", // Orange for 'house'
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

// // Simplified SpinParticle component
// const SpinParticle = () => { // 3. Removed isFlipping prop
//   const size = Math.random() * 2 + 1;
//   const color =
//     Math.random() > 0.5
//       ? `hsla(45, 100%, ${50 + Math.random() * 20}%, 0.7)`
//       : `hsla(0, 0%, ${70 + Math.random() * 20}%, 0.7)`;

//   return ( // 3. No conditional return needed here
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
//   );
// };

// // Timer Circle component with smooth animation
// const TimerCircle = ({ timeLeft, maxTime }) => {
//   const percentage = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
//   const radius = 70;
//   const circumference = 2 * Math.PI * radius;
//   const strokeDashoffset = circumference * (1 - percentage / 100);
//   const hue = (percentage / 100) * 120;
//   const color = `hsl(${hue}, 100%, 50%)`;

//   return (
//     <svg
//       className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
//       width="210"
//       height="210"
//       viewBox="0 0 160 160">
//       <circle
//         cx="80"
//         cy="80"
//         r={radius}
//         fill="none"
//         stroke="rgba(255,255,255,0.1)"
//         strokeWidth="10"
//       />
//       <motion.circle
//         cx="80"
//         cy="80"
//         r={radius}
//         fill="none"
//         stroke={color}
//         strokeWidth="10"
//         strokeDasharray={circumference}
//         strokeDashoffset={strokeDashoffset}
//         strokeLinecap="round"
//         transform="rotate(-90 80 80)"
//         initial={false}
//         animate={{
//           strokeDashoffset,
//           stroke: color,
//         }}
//         transition={{
//           strokeDashoffset: { duration: 1, ease: "linear" },
//           stroke: { duration: 1, ease: "linear" },
//         }}
//       />
//     </svg>
//   );
// };

// export default function CoinFlip({ round, timeLeft }) {
//   const [isMuted, setIsMuted] = useState(true);
//   const [isAudioInitialized, setIsAudioInitialized] = useState(false);
//   const isFlipping = !round.outcome;
//   const currentOutcome = round?.outcome || OUTCOMES.HEADS; // Use constant for default

//   const maxTime = MAX_TIMER_SECONDS; // 2. Used constant

//   const flipSongSources = SOUND_FILES.FLIP_SONGS; // 2. Used constant

//   const flipSoundRef = useRef(null);
//   const resultSoundRef = useRef(null);
//   const houseSoundRef = useRef(null);

//   const initializeAudio = () => {
//     if (!isAudioInitialized) {
//       flipSoundRef.current = new Audio(flipSongSources[0]);
//       resultSoundRef.current = new Audio(SOUND_FILES.RESULT_CHIME); // 2. Used constant
//       houseSoundRef.current = new Audio(SOUND_FILES.HOUSE_SOUND); // 2. Used constant

//       flipSoundRef.current.loop = true;
//       flipSoundRef.current.volume = 0.3;
//       resultSoundRef.current.volume = 0.5;
//       houseSoundRef.current.volume = 0.5;

//       setIsAudioInitialized(true);
//     }
//   };

//   const toggleSound = () => {
//     if (!isAudioInitialized) {
//       initializeAudio();
//     }
//     // Important: setIsMuted is async. Use the callback form or the new value directly.
//     const newMutedState = !isMuted;
//     setIsMuted(newMutedState);

//     if (isAudioInitialized) {
//       [flipSoundRef, resultSoundRef, houseSoundRef].forEach((soundRef) => {
//         if (soundRef.current) {
//           soundRef.current.muted = newMutedState; // Use the new state directly
//         }
//       });
//     }
//   };

//   useEffect(() => {
//     if (isAudioInitialized && round?.roundNumber) { // Added optional chaining for round
//       const index = (round.roundNumber - 1) % flipSongSources.length;
//       if (flipSoundRef.current && flipSoundRef.current.src !== flipSongSources[index]) {
//         flipSoundRef.current.src = flipSongSources[index];
//         flipSoundRef.current.load();
//       }
//     }
//   }, [round?.roundNumber, isAudioInitialized, flipSongSources]); // Added flipSongSources

//   useEffect(() => {
//     return () => {
//       if (isAudioInitialized) {
//         flipSoundRef.current?.pause();
//         resultSoundRef.current?.pause();
//         houseSoundRef.current?.pause();
//       }
//     };
//   }, [isAudioInitialized]);

//   useEffect(() => {
//     if (isAudioInitialized && !isMuted) { // Check !isMuted before playing
//         if (isFlipping) {
//             if (flipSoundRef.current?.paused) { // Play only if paused
//                 flipSoundRef.current.currentTime = 0;
//                 flipSoundRef.current.play().catch(() => setIsMuted(true)); // Handle potential play error
//             }
//         } else {
//             flipSoundRef.current?.pause();
//         }
//     } else if (isAudioInitialized && isMuted) { // Explicitly pause if muted
//         flipSoundRef.current?.pause();
//     }
//   }, [isFlipping, isAudioInitialized, isMuted]);


//   useEffect(() => {
//     if (round.outcome && isAudioInitialized && !isMuted) {
//       const soundToPlay =
//         round.outcome === OUTCOMES.HOUSE // 2. Used constant
//           ? houseSoundRef.current
//           : resultSoundRef.current;
//       if (soundToPlay) {
//         soundToPlay.currentTime = 0;
//         soundToPlay.play().catch(() => setIsMuted(true));
//       }
//     }
//   }, [round.outcome, isAudioInitialized, isMuted]); // 4. Refined dependencies (currentOutcome was derived)

//   const coinVariants = {
//     initial: { rotateY: 0, scale: 1, y: 0 },
//     flip: {
//       rotateY: isFlipping
//         ? [0, 90, 180, 270, 360, 450, 540, 630, 720, 810, 900]
//         : currentOutcome === OUTCOMES.HEADS // 2. Used constant
//           ? 0
//           : currentOutcome === OUTCOMES.TAILS // 2. Used constant
//             ? 180
//             : 90, // For HOUSE outcome
//       scale: isFlipping
//         ? [1, 1.05, 1, 1.05, 1]
//         : currentOutcome === OUTCOMES.HOUSE // 2. Used constant
//           ? 0.8
//           : [1, 1.15, 0.95, 1.05, 1],
//       y: isFlipping
//         ? [0, -5, 0, -5, 0]
//         : currentOutcome === OUTCOMES.HOUSE // 2. Used constant
//           ? 0
//           : [0, -30, -5, -15, 0],
//       transition: {
//         rotateY: {
//           duration: isFlipping ? 2 : 0.8,
//           repeat: isFlipping ? Infinity : 0,
//           ease: isFlipping ? "linear" : [0.34, 1.56, 0.64, 1],
//           delay: 0,
//         },
//         scale: {
//           duration: isFlipping ? 2 : 1.2,
//           repeat: isFlipping ? Infinity : 0,
//           ease: isFlipping ? "easeInOut" : "easeOut",
//         },
//         y: {
//           duration: isFlipping ? 2 : 1,
//           ease: isFlipping ? "easeInOut" : [0.22, 1.2, 0.36, 1],
//           repeat: isFlipping ? Infinity : 0,
//           delay: isFlipping ? 0 : 0.2,
//         },
//       },
//     },
//   };

//   const shadowVariants = {
//     initial: { scale: 1, opacity: 0.3 },
//     animate: {
//       scale: isFlipping
//         ? [0.9, 0.8, 0.9, 0.8, 0.9]
//         : currentOutcome === OUTCOMES.HOUSE // 2. Used constant
//           ? 0.6
//           : [1, 0.7, 0.9, 0.8, 1],
//       opacity: isFlipping
//         ? [0.3, 0.2, 0.3, 0.2, 0.3]
//         : currentOutcome === OUTCOMES.HOUSE // 2. Used constant
//           ? 0.4
//           : [0.3, 0.5, 0.4, 0.3, 0.3],
//       transition: {
//         duration: isFlipping ? 2 : 1.2,
//         repeat: isFlipping ? Infinity : 0,
//         ease: isFlipping ? "easeInOut" : "easeOut",
//       },
//     },
//   };

//   const glowVariants = {
//     initial: { opacity: 0 },
//     animate: {
//       opacity: isFlipping ? [0.3, 0.5, 0.3] : currentOutcome === OUTCOMES.HOUSE ? 0.8 : 0.6, // 2. Used constant
//       scale: isFlipping ? [1, 1.1, 1] : currentOutcome === OUTCOMES.HOUSE ? 1.2 : 1.1, // 2. Used constant
//       transition: {
//         duration: isFlipping ? 2 : 0.8,
//         repeat: isFlipping ? Infinity : 0,
//         ease: "easeInOut",
//       },
//     },
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-[220px] perspective-1000 relative">
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
//           boxShadow: { repeat: isMuted ? 0 : Infinity, duration: 2 },
//         }}
//         aria-label={isMuted ? "Unmute sound" : "Mute sound"}>
//         {isMuted ? (
//           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
//           </svg>
//         ) : (
//           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
//           </svg>
//         )}
//       </motion.button>

//       <div className="relative w-full h-full flex justify-center items-center">
//         <motion.div
//           className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-gray-100 to-gray-200"
//           animate={{
//             opacity: isFlipping ? [0.4, 0.6, 0.4] : currentOutcome === OUTCOMES.HOUSE ? 0.6 : 0.5, // 2. Used constant
//             scale: isFlipping ? [1, 1.05, 1] : 1,
//           }}
//           transition={{ duration: 2, repeat: isFlipping ? Infinity : 0, ease: "easeInOut" }}
//         />

//         {isFlipping && timeLeft !== undefined && (
//           <TimerCircle timeLeft={timeLeft} maxTime={maxTime} />
//         )}

//         <div className="relative w-32 h-32"> {/* Main coin diameter */}
//           <motion.div
//             className={`absolute inset-0 rounded-full blur-md ${
//               currentOutcome === OUTCOMES.HOUSE // 2. Used constant
//                 ? "bg-orange-400"
//                 : currentOutcome === OUTCOMES.HEADS // 2. Used constant
//                   ? "bg-yellow-300"
//                   : "bg-gray-300"
//             }`}
//             initial="initial"
//             animate="animate"
//             variants={glowVariants}
//           />

//           <motion.div
//             className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/20 rounded-full blur-md"
//             initial="initial"
//             animate="animate"
//             variants={shadowVariants}
//           />

//           {isFlipping && (
//             <div className="absolute inset-0 pointer-events-none">
//               {[...Array(12)].map((_, i) => (
//                 <SpinParticle key={`spin-${i}`} /> // 3. isFlipping prop removed
//               ))}
//             </div>
//           )}

//           <motion.div
//             className="absolute inset-0"
//             initial="initial"
//             animate="flip"
//             variants={coinVariants}
//             style={{ transformStyle: "preserve-3d", perspective: "1000px" }}>
//             {/* Heads Side */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center"
//               style={{
//                 transform: `rotateY(0deg) translateZ(${COIN_TRANSLATE_Z_OFFSET}px)`, // 2. Used constant
//                 backfaceVisibility: "hidden",
//               }}>
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-inner overflow-hidden">
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-yellow-300 to-yellow-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-yellow-800">H</div>
//                 </div>
//               </div>
//             </div>

//             {/* Tails Side */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center"
//               style={{
//                 transform: `rotateY(180deg) translateZ(${COIN_TRANSLATE_Z_OFFSET}px)`, // 2. Used constant
//                 backfaceVisibility: "hidden",
//               }}>
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 flex items-center justify-center shadow-inner overflow-hidden">
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-gray-300 to-gray-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-gray-800">T</div>
//                 </div>
//               </div>
//             </div>

//             {/* House Side - Back/Bottom Edge */}
//             <div
//               className="absolute w-full flex items-center justify-center overflow-hidden" // Width is 100% of parent (coin diameter)
//               style={{
//                 transform: `rotateX(-90deg) translateZ(${COIN_TRANSLATE_Z_OFFSET}px)`, // 2. Used constant
//                 height: `${COIN_THICKNESS_PIXELS}px`, // 2. Used constant for edge thickness
//                 // borderRadius: `${COIN_TRANSLATE_Z_OFFSET}px / ${COIN_THICKNESS_PIXELS}px`, // For rounded edge appearance
//                 background: "linear-gradient(to bottom, #FFD700, #FFA500)",
//                 backfaceVisibility: "hidden",
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div key={`back-house-${i}`} className="absolute h-full w-1 bg-yellow-900/20" style={{ left: `${i * 5}%` }} />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10">House</div>
//             </div>

//             {/* House Side - Left Edge */}
//             <div
//               className="absolute h-full flex items-center justify-center overflow-hidden" // Height is 100% of parent (coin diameter)
//               style={{
//                 transform: `rotateY(-90deg) translateZ(${COIN_TRANSLATE_Z_OFFSET}px)`, // 2. Used constant
//                 width: `${COIN_THICKNESS_PIXELS}px`, // 2. Used constant for edge thickness
//                 // borderRadius: `${COIN_THICKNESS_PIXELS}px / ${COIN_TRANSLATE_Z_OFFSET}px`, // For rounded edge appearance
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//                 backfaceVisibility: "hidden",
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div key={`left-house-${i}`} className="absolute w-full h-1 bg-yellow-900/20" style={{ top: `${i * 5}%` }}/>
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">House</div>
//             </div>

//             {/* House Side - Right Edge (Shows when outcome="house") */}
//             <div
//               className="absolute h-full flex items-center justify-center overflow-hidden" // Height is 100% of parent (coin diameter)
//               style={{
//                 transform: `rotateY(90deg) translateZ(${COIN_TRANSLATE_Z_OFFSET}px)`, // 2. Used constant
//                 width: `${COIN_THICKNESS_PIXELS}px`, // 2. Used constant for edge thickness
//                 // borderRadius: `${COIN_THICKNESS_PIXELS}px / ${COIN_TRANSLATE_Z_OFFSET}px`, // For rounded edge appearance
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//                 backfaceVisibility: "hidden",
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div key={`right-house-${i}`} className="absolute w-full h-1 bg-yellow-900/20" style={{ top: `${i * 5}%` }} />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">House</div>
//             </div>
//             {/* Note: The "Top Edge" (rotateX(90deg)) is still missing if a fully enclosed 3D coin edge is desired. */}
//             {/* The original commented-out section for the top edge can be added here if needed, using COIN_THICKNESS_PIXELS and COIN_TRANSLATE_Z_OFFSET */}

//           </motion.div>

//           {round.outcome && (
//             <div className="absolute inset-0 pointer-events-none">
//               {[...Array(currentOutcome === OUTCOMES.HOUSE ? 12 : 8)].map((_, i) => ( // 2. Used constant
//                 <Sparkle key={`spark-${i}`} delay={i * 0.08} />
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {round.outcome && (
//         <motion.div
//           initial={{ opacity: 0, y: 30, scale: 0.9 }}
//           animate={{ opacity: 1, y: 0, scale: 1 }}
//           transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.2 }}
//           className={`mt-16 text-3xl font-bold ${
//             currentOutcome === OUTCOMES.HOUSE // 2. Used constant
//               ? "bg-gradient-to-r from-orange-400 via-red-500 to-orange-400"
//               : currentOutcome === OUTCOMES.HEADS // 2. Used constant
//                 ? "bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400"
//                 : "bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400"
//           } bg-clip-text text-transparent relative`}>
//           <div
//             className={`absolute inset-0 ${
//               currentOutcome === OUTCOMES.HOUSE // 2. Used constant
//                 ? "bg-orange-200"
//                 : currentOutcome === OUTCOMES.HEADS // 2. Used constant
//                   ? "bg-yellow-200"
//                   : "bg-gray-200"
//             } blur-lg opacity-30 -z-10 rounded-lg`}
//           />
//           <motion.span
//             animate={{ textShadow: ["0 0 5px rgba(255,255,255,0.1)", "0 0 10px rgba(255,255,255,0.6)", "0 0 5px rgba(255,255,255,0.1)"]}}
//             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
//             {currentOutcome === OUTCOMES.HOUSE ? "JACKPOT" : currentOutcome.toUpperCase()}{" "} {/* 2. Used constant */}
//             {currentOutcome === OUTCOMES.HOUSE ? "UPDATE!" : "WINS!"} {/* 2. Used constant */}
//           </motion.span>
//         </motion.div>
//       )}
//     </div>
//   );
// }

// // 1. Added PropTypes definition
// CoinFlip.propTypes = {
//   round: PropTypes.shape({
//     outcome: PropTypes.oneOf([OUTCOMES.HEADS, OUTCOMES.TAILS, OUTCOMES.HOUSE, null, undefined]),
//     roundNumber: PropTypes.number,
//   }).isRequired,
//   timeLeft: PropTypes.number,
// };

// CoinFlip.defaultProps = {
//   timeLeft: undefined,
//   // round.outcome can be undefined/null initially, handled by isFlipping and default currentOutcome
// };


// /**************************************************************************************************************************************************************************************************************************************************************************************************** */

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
//     "hsl(25, 100%, 50%)", // Adding an orange for 'house'
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

// // Timer Circle component with smooth animation
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
//       className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
//       width="210"
//       height="210"
//       viewBox="0 0 160 160">
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
//       <motion.circle
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
//         initial={false}
//         animate={{
//           strokeDashoffset,
//           stroke: color,
//         }}
//         transition={{
//           strokeDashoffset: {
//             duration: 1, // Longer and smoother transition
//             ease: "linear", // Linear movement for continuous animation
//           },
//           stroke: {
//             duration: 1,
//             ease: "linear",
//           },
//         }}
//       />
//     </svg>
//   );
// };

// export default function CoinFlip({ round, timeLeft }) {
//   const [isMuted, setIsMuted] = useState(true);
//   const [isAudioInitialized, setIsAudioInitialized] = useState(false);
//   const isFlipping = !round.outcome;
//   // Assuming round.outcome will now be 'heads', 'tails', or 'house'
//   const outcome = round?.outcome || "heads";

//   // Set a maximum time value for the timer (adjust as needed)
//   const maxTime = 20; // Assuming the timer counts down from 20 seconds

//   // Define an array of three different flip songs
//   const flipSongSources = [
//     "/sounds/coi.mp3",
//     "/sounds/sunny.mp3",
//     "/sounds/sunshine.mp3",
//   ];

//   // Audio refs
//   const flipSoundRef = useRef(null);
//   const resultSoundRef = useRef(null);
//   // Renamed edgeSoundRef to houseSoundRef
//   const houseSoundRef = useRef(null);

//   // Initialize audio only once after user interaction
//   const initializeAudio = () => {
//     if (!isAudioInitialized) {
//       flipSoundRef.current = new Audio(flipSongSources[0]);
//       resultSoundRef.current = new Audio("/sounds/result-chime.mp3");
//       // Assuming you might have or want a specific sound for 'house'
//       // If not, you might want to reuse resultSoundRef or remove this
//       houseSoundRef.current = new Audio("/sounds/edge-special.mp3"); // Kept original sound file, rename if needed

//       flipSoundRef.current.loop = true;
//       flipSoundRef.current.volume = 0.3;
//       resultSoundRef.current.volume = 0.5;
//       houseSoundRef.current.volume = 0.5; // Updated ref name

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
//       // Updated ref name in array
//       [flipSoundRef, resultSoundRef, houseSoundRef].forEach((soundRef) => {
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
//   }, [round?.roundNumber, isAudioInitialized]); // Added optional chaining

//   // Cleanup audio on unmount
//   useEffect(() => {
//     return () => {
//       if (isAudioInitialized) {
//         flipSoundRef.current?.pause();
//         resultSoundRef.current?.pause();
//         houseSoundRef.current?.pause(); // Updated ref name
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
//       // Use the correct sound based on the 'house' outcome
//       // Changed "edge" to "house" in comparison and ref name
//       const soundToPlay =
//         outcome === "house" ? houseSoundRef.current : resultSoundRef.current;
//       if (soundToPlay) {
//         soundToPlay.currentTime = 0;
//         soundToPlay.play().catch(() => setIsMuted(true));
//       }
//     }
//   }, [round.outcome, outcome, isAudioInitialized, isMuted]);

//   // Improved coin animation for proper house display
//   const coinVariants = {
//     initial: { rotateY: 0, scale: 1, y: 0 },
//     flip: {
//       // When outcome is determined, show the correct side
//       rotateY: isFlipping
//         ? [0, 90, 180, 270, 360, 450, 540, 630, 720, 810, 900] // Include multiples of 90 to show house during spin
//         : outcome === "heads"
//           ? 0 // Show heads (0 degrees)
//           : outcome === "tails"
//             ? 180 // Show tails (180 degrees)
//             : 90, // Show house (90 degrees) when outcome is house - Changed "edge" to "house"
//       scale: isFlipping
//         ? [1, 1.05, 1, 1.05, 1]
//         : outcome === "house" // Changed "edge" to "house"
//           ? 0.8
//           : [1, 1.15, 0.95, 1.05, 1], // Enhanced bounce effect
//       y: isFlipping
//         ? [0, -5, 0, -5, 0] // Slight hovering while spinning
//         : outcome === "house" // Changed "edge" to "house"
//           ? 0
//           : [0, -30, -5, -15, 0], // More pronounced bounce
//       transition: {
//         rotateY: {
//           duration: isFlipping ? 2 : 0.8, // Faster transition when showing result
//           repeat: isFlipping ? Infinity : 0, // No repetition when outcome is determined
//           ease: isFlipping ? "linear" : [0.34, 1.56, 0.64, 1], // Using linear for spinning to keep even speed
//           delay: 0,
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
//         : outcome === "house" // Changed "edge" to "house"
//           ? 0.6
//           : [1, 0.7, 0.9, 0.8, 1],
//       opacity: isFlipping
//         ? [0.3, 0.2, 0.3, 0.2, 0.3]
//         : outcome === "house" // Changed "edge" to "house"
//           ? 0.4
//           : [0.3, 0.5, 0.4, 0.3, 0.3],
//       transition: {
//         duration: isFlipping ? 2 : 1.2,
//         repeat: isFlipping ? Infinity : 0,
//         ease: isFlipping ? "easeInOut" : "easeOut",
//       },
//     },
//   };

//   // Glow effect animation
//   const glowVariants = {
//     initial: { opacity: 0 },
//     animate: {
//       opacity: isFlipping ? [0.3, 0.5, 0.3] : outcome === "house" ? 0.8 : 0.6, // Changed "edge" to "house"
//       scale: isFlipping ? [1, 1.1, 1] : outcome === "house" ? 1.2 : 1.1, // Changed "edge" to "house"
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
//               : outcome === "house" // Changed "edge" to "house"
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

//         {/* Timer Border */}
//         {isFlipping && timeLeft !== undefined && (
//           <TimerCircle timeLeft={timeLeft} maxTime={maxTime} />
//         )}

//         <div className="relative w-32 h-32">
//           {/* Enhanced glow effect with specific color based on outcome */}
//           <motion.div
//             className={`absolute inset-0 rounded-full blur-md ${
//               outcome === "house" // Style based on 'house' - Changed "edge" to "house"
//                 ? "bg-orange-400" // Kept orange for house, adjust if needed
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
//                 <SpinParticle key={`spin-${i}`} isFlipping={isFlipping} />
//               ))}
//             </div>
//           )}

//           {/* Coin with proper 3D rendering of all sides */}
//           <motion.div
//             className="absolute inset-0"
//             initial="initial"
//             animate="flip"
//             variants={coinVariants}
//             style={{
//               transformStyle: "preserve-3d",
//               perspective: "1000px",
//             }}>
//             {/* Heads Side */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center"
//               style={{
//                 transform: "rotateY(0deg) translateZ(16px)",
//                 backfaceVisibility: "hidden",
//               }}>
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-yellow-300 to-yellow-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-yellow-800">
//                     H
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Tails Side */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center"
//               style={{
//                 transform: "rotateY(180deg) translateZ(16px)",
//                 backfaceVisibility: "hidden",
//               }}>
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-gray-300 to-gray-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-gray-800">T</div>
//                 </div>
//               </div>
//             </div>

//             {/* House Side - Front/Top (formerly Edge) */}
//             {/* <div
//               className="absolute w-full h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateX(90deg) translateZ(16px)",
//                 height: "32px",
//                 borderRadius: "16px / 32px",
//                 background: "linear-gradient(to bottom, #FFD700, #FFA500)", // Kept gold/orange gradient, adjust if needed
//                 backfaceVisibility: "hidden"
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`front-house-${i}`} // Changed key name
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-180">
//                 House // Changed text
//               </div>
//             </div> */}

//             {/* House Side - Back/Bottom (formerly Edge) */}
//             <div
//               className="absolute w-full h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateX(-90deg) translateZ(16px)",
//                 height: "32px",
//                 borderRadius: "16px / 32px",
//                 background: "linear-gradient(to bottom, #FFD700, #FFA500)", // Kept gold/orange gradient
//                 backfaceVisibility: "hidden",
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`back-house-${i}`} // Changed key name
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10">
//                 House {/* Changed text */}
//               </div>
//             </div>

//             {/* House Side - Left (formerly Edge) */}
//             <div
//               className="absolute w-32 h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateY(-90deg) translateZ(16px)",
//                 width: "32px",
//                 borderRadius: "32px / 16px",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)", // Kept gold/orange gradient
//                 backfaceVisibility: "hidden",
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`left-house-${i}`} // Changed key name
//                     className="absolute w-full h-1 bg-yellow-900/20"
//                     style={{ top: `${i * 5}%` }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">
//                 House {/* Changed text */}
//               </div>
//             </div>

//             {/* House Side - Right (This is the one that shows when outcome="house") */}
//             {/* Changed comment */}
//             <div
//               className="absolute w-32 h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateY(90deg) translateZ(16px)",
//                 width: "32px",
//                 borderRadius: "32px / 16px",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)", // Kept gold/orange gradient
//                 backfaceVisibility: "hidden",
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`right-house-${i}`} // Changed key name
//                     className="absolute w-full h-1 bg-yellow-900/20"
//                     style={{ top: `${i * 5}%` }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">
//                 House {/* Changed text */}
//               </div>
//             </div>
//           </motion.div>

//           {/* Enhanced Sparkles */}
//           {round.outcome && (
//             <div className="absolute inset-0 pointer-events-none">
//               {/* Sparkle count based on 'house' outcome - Changed "edge" to "house" */}
//               {[...Array(outcome === "house" ? 12 : 8)].map((_, i) => (
//                 <Sparkle key={`spark-${i}`} delay={i * 0.08} />
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
//             outcome === "house" // Style based on 'house' - Changed "edge" to "house"
//               ? "bg-gradient-to-r from-orange-400 via-red-500 to-orange-400" // Kept orange gradient
//               : outcome === "heads"
//                 ? "bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400"
//                 : "bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400"
//           } bg-clip-text text-transparent relative`}>
//           {/* Subtle highlight under text */}
//           <div
//             className={`absolute inset-0 ${
//               outcome === "house" // Style based on 'house' - Changed "edge" to "house"
//                 ? "bg-orange-200" // Kept orange highlight
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
//             {/* Display "HOUSE" if outcome is "house", otherwise display the outcome */}
//             {/* Changed "edge" to "house" in comparisons */}
//             {outcome === "house" ? "JACKPOT" : outcome.toUpperCase()}{" "}
//             {outcome === "house" ? "UPDATE!" : "WINS!"}
//           </motion.span>
//         </motion.div>
//       )}
//     </div>
//   );
// }

//  ///**************************************************************************************************************************************************************************************************************************************************************************************************** */

//   import React, { useState, useEffect, useRef } from "react";
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

// // Timer Circle component with smooth animation
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
//       className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" 
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
//       <motion.circle
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
//         initial={false}
//         animate={{
//           strokeDashoffset,
//           stroke: color
//         }}
//         transition={{
//           strokeDashoffset: { 
//             duration: 1, // Longer and smoother transition 
//             ease: "linear" // Linear movement for continuous animation
//           },
//           stroke: { 
//             duration: 1,
//             ease: "linear"
//           }
//         }}
//       />
//     </svg>
//   );
// };

// export default function CoinFlip({ round, timeLeft }) {
//   const [isMuted, setIsMuted] = useState(true);
//   const [isAudioInitialized, setIsAudioInitialized] = useState(false);
//   const isFlipping = !round.outcome;
//   const outcome = round?.outcome || "heads";
  
//   // Set a maximum time value for the timer (adjust as needed)
//   const maxTime = 20; // Assuming the timer counts down from 30 seconds

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

//   // Improved coin animation for proper edge display
//   const coinVariants = {
//     initial: { rotateY: 0, scale: 1, y: 0 },
//     flip: {
//       // When outcome is determined, show the correct side
//       rotateY: isFlipping 
//         ? [0, 90, 180, 270, 360, 450, 540, 630, 720, 810, 900] // Include multiples of 90 to show edge during spin
//         : outcome === "heads" 
//           ? 0 // Show heads (0 degrees)
//           : outcome === "tails" 
//             ? 180 // Show tails (180 degrees)
//             : 90, // Show edge (90 degrees) when outcome is edge
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
//           ease: isFlipping ? "linear" : [0.34, 1.56, 0.64, 1], // Using linear for spinning to keep even speed
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

//   // Glow effect animation
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

//         {/* Timer Border */}
//         {isFlipping && timeLeft !== undefined && (
//           <TimerCircle timeLeft={timeLeft} maxTime={maxTime} />
//         )}

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

//           {/* Coin with proper 3D rendering of all sides - FIXED to properly show edge */}
//           <motion.div
//             className="absolute inset-0"
//             initial="initial"
//             animate="flip"
//             variants={coinVariants}
//             style={{ 
//               transformStyle: "preserve-3d", 
//               perspective: "1000px",
//             }}>
//             {/* Heads Side */}
//             <div 
//               className="absolute w-full h-full rounded-full flex items-center justify-center"
//               style={{ 
//                 transform: "rotateY(0deg) translateZ(16px)",
//                 backfaceVisibility: "hidden"
//               }}
//             >
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-yellow-300 to-yellow-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-yellow-800">
//                     H
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Tails Side */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center"
//               style={{ 
//                 transform: "rotateY(180deg) translateZ(16px)",
//                 backfaceVisibility: "hidden"
//               }}
//             >
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-gray-300 to-gray-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-gray-800">T</div>
//                 </div>
//               </div>
//             </div>

//             {/* Edge Side - Front/Top */}
//             {/* <div
//               className="absolute w-full h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateX(90deg) translateZ(16px)",
//                 height: "32px",
//                 borderRadius: "16px / 32px",
//                 background: "linear-gradient(to bottom, #FFD700, #FFA500)",
//                 backfaceVisibility: "hidden"
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`front-edge-${i}`}
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-180">
//                 Jackpot
//               </div>
//             </div> */}

//             {/* Edge Side - Back/Bottom */}
//             <div
//               className="absolute w-full h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateX(-90deg) translateZ(16px)",
//                 height: "32px",
//                 borderRadius: "16px / 32px",
//                 background: "linear-gradient(to bottom, #FFD700, #FFA500)",
//                 backfaceVisibility: "hidden"
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`back-edge-${i}`}
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10">
//                 Jackpot
//               </div>
//             </div>

//             {/* Edge Side - Left */}
//             <div
//               className="absolute w-32 h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateY(-90deg) translateZ(16px)", 
//                 width: "32px",
//                 borderRadius: "32px / 16px",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//                 backfaceVisibility: "hidden"
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`left-edge-${i}`}
//                     className="absolute w-full h-1 bg-yellow-900/20"
//                     style={{ top: `${i * 5}%` }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">
//                 Jackpot
//               </div>
//             </div>

//             {/* Edge Side - Right (This is the one that shows when outcome="edge") */}
//             <div
//               className="absolute w-32 h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateY(90deg) translateZ(16px)",
//                 width: "32px",
//                 borderRadius: "32px / 16px",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//                 backfaceVisibility: "hidden"
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`right-edge-${i}`}
//                     className="absolute w-full h-1 bg-yellow-900/20"
//                     style={{ top: `${i * 5}%` }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">
//                 Jackpot
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
 ///**************************************************************************************************************************************************************************************************************************************************************************************************** */
 
//  import React, { useState, useEffect, useRef } from "react";
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

// // Timer Circle component with smooth animation
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
//       className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" 
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
//       <motion.circle
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
//         initial={false}
//         animate={{
//           strokeDashoffset,
//           stroke: color
//         }}
//         transition={{
//           strokeDashoffset: { 
//             duration: 1, // Longer and smoother transition 
//             ease: "linear" // Linear movement for continuous animation
//           },
//           stroke: { 
//             duration: 1,
//             ease: "linear"
//           }
//         }}
//       />
//     </svg>
//   );
// };

// export default function CoinFlip({ round, timeLeft }) {
//   const [isMuted, setIsMuted] = useState(true);
//   const [isAudioInitialized, setIsAudioInitialized] = useState(false);
//   const isFlipping = !round.outcome;
//   const outcome = round?.outcome || "heads";
  
//   // Set a maximum time value for the timer (adjust as needed)
//   const maxTime = 30; // Assuming the timer counts down from 30 seconds

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

//   // Improved coin animation for proper edge display
//   const coinVariants = {
//     initial: { rotateY: 0, scale: 1, y: 0 },
//     flip: {
//       // When outcome is determined, show the correct side
//       rotateY: isFlipping 
//         ? [0, 90, 180, 270, 360, 450, 540, 630, 720, 810, 900] // Include multiples of 90 to show edge during spin
//         : outcome === "heads" 
//           ? 0 // Show heads (0 degrees)
//           : outcome === "tails" 
//             ? 180 // Show tails (180 degrees)
//             : 90, // Show edge (90 degrees) when outcome is edge
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
//           ease: isFlipping ? "linear" : [0.34, 1.56, 0.64, 1], // Using linear for spinning to keep even speed
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

//   // Glow effect animation
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

//         {/* Timer Border */}
//         {isFlipping && timeLeft !== undefined && (
//           <TimerCircle timeLeft={timeLeft} maxTime={maxTime} />
//         )}

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

//           {/* Coin with proper 3D rendering of all sides - FIXED to properly show edge */}
//           <motion.div
//             className="absolute inset-0"
//             initial="initial"
//             animate="flip"
//             variants={coinVariants}
//             style={{ 
//               transformStyle: "preserve-3d", 
//               perspective: "1000px",
//             }}>
//             {/* Heads Side */}
//             <div 
//               className="absolute w-full h-full rounded-full flex items-center justify-center"
//               style={{ 
//                 transform: "rotateY(0deg) translateZ(16px)",
//                 backfaceVisibility: "hidden"
//               }}
//             >
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-yellow-300 to-yellow-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-yellow-800">
//                     H
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Tails Side */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center"
//               style={{ 
//                 transform: "rotateY(180deg) translateZ(16px)",
//                 backfaceVisibility: "hidden"
//               }}
//             >
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-gray-300 to-gray-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-gray-800">T</div>
//                 </div>
//               </div>
//             </div>

//             {/* Edge Side - Front/Top */}
//             <div
//               className="absolute w-full h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateX(90deg) translateZ(16px)",
//                 height: "32px",
//                 borderRadius: "16px / 32px",
//                 background: "linear-gradient(to bottom, #FFD700, #FFA500)",
//                 backfaceVisibility: "hidden"
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`front-edge-${i}`}
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-180">
//                 Jackpot
//               </div>
//             </div>

//             {/* Edge Side - Back/Bottom */}
//             <div
//               className="absolute w-full h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateX(-90deg) translateZ(16px)",
//                 height: "32px",
//                 borderRadius: "16px / 32px",
//                 background: "linear-gradient(to bottom, #FFD700, #FFA500)",
//                 backfaceVisibility: "hidden"
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`back-edge-${i}`}
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10">
//                 Jackpot
//               </div>
//             </div>

//             {/* Edge Side - Left */}
//             <div
//               className="absolute w-32 h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateY(-90deg) translateZ(16px)", 
//                 width: "32px",
//                 borderRadius: "32px / 16px",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//                 backfaceVisibility: "hidden"
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`left-edge-${i}`}
//                     className="absolute w-full h-1 bg-yellow-900/20"
//                     style={{ top: `${i * 5}%` }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">
//                 Jackpot
//               </div>
//             </div>

//             {/* Edge Side - Right (This is the one that shows when outcome="edge") */}
//             <div
//               className="absolute w-32 h-32 flex items-center justify-center overflow-hidden"
//               style={{
//                 transform: "rotateY(90deg) translateZ(16px)",
//                 width: "32px",
//                 borderRadius: "32px / 16px",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//                 backfaceVisibility: "hidden"
//               }}>
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`right-edge-${i}`}
//                     className="absolute w-full h-1 bg-yellow-900/20"
//                     style={{ top: `${i * 5}%` }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">
//                 Jackpot
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
 // **************************************************************************************************************************************************************************************************************************************************************************************************** */
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

// // Timer Circle component with smooth animation
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
//       className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" 
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
//       <motion.circle
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
//         initial={false}
//         animate={{
//           strokeDashoffset,
//           stroke: color
//         }}
//         transition={{
//           strokeDashoffset: { 
//             duration: 1, // Longer and smoother transition 
//             ease: "linear" // Linear movement for continuous animation
//           },
//           stroke: { 
//             duration: 1,
//             ease: "linear"
//           }
//         }}
//       />
//     </svg>
//   );
// };

// export default function CoinFlip({ round, timeLeft }) {
//   const [isMuted, setIsMuted] = useState(true);
//   const [isAudioInitialized, setIsAudioInitialized] = useState(false);
//   const isFlipping = !round.outcome;
//   const outcome = round?.outcome || "heads";
  
//   // Set a maximum time value for the timer (adjust as needed)
//   const maxTime = 30; // Assuming the timer counts down from 30 seconds

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

//   // Fixed coin animation for proper edge display
//   const coinVariants = {
//     initial: { rotateY: 0, scale: 1, y: 0 },
//     flip: {
//       // When outcome is determined, immediately show the correct side
//       rotateY: isFlipping 
//         ? [0, 90, 180, 270, 360, 450, 540, 630, 720, 810, 900] // Include 90, 270, 450, etc. to show edge during spin
//         : outcome === "edge" 
//           ? 90 // Show edge (90 degrees) - this is the key fix
//           : outcome === "heads" 
//             ? 0 // Show heads (0 degrees)
//             : 180, // Show tails (180 degrees)
//       // Apply a different transform for edge to ensure it's displayed properly
//       rotateX: outcome === "edge" && !isFlipping ? 0 : null,
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
//           ease: isFlipping ? "linear" : [0.34, 1.56, 0.64, 1], // Using linear for spinning to keep even speed
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

//   // Glow effect animation
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

//         {/* Timer Border */}
//         {isFlipping && timeLeft !== undefined && (
//           <TimerCircle timeLeft={timeLeft} maxTime={maxTime} />
//         )}

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

//           {/* Coin with proper 3D rendering of all sides */}
//           <motion.div
//             className="absolute inset-0"
//             initial="initial"
//             animate="flip"
//             variants={coinVariants}
//             style={{ 
//               transformStyle: "preserve-3d", 
//               perspective: "1000px",
//               transform: `translateZ(-16px) ${outcome === "edge" && !isFlipping ? 'rotateY(90deg)' : ''}` // Force edge to show when outcome is edge
//             }}>
//             {/* Heads Side */}
//             <div 
//               className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden"
//               style={{ transform: "rotateY(0deg) translateZ(16px)" }} // Offset by half thickness
//             >
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

//             {/* Tails Side */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden"
//               style={{ transform: "rotateY(180deg) translateZ(16px)" }} // Offset by half thickness
//             >
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 border-8 border-gray-500 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-gray-300 to-gray-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-gray-400 border-4 border-gray-500 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-gray-800">T</div>
//                 </div>
//               </div>
//             </div>

//             {/* Edge Side - Four segments to create a complete edge */}
//             {/* Front Edge */}
//             <div
//               className="absolute w-full h-32 flex items-center justify-center backface-hidden overflow-hidden"
//               style={{
//                 transform: "rotateX(90deg) translateZ(16px)",
//                 height: "32px",
//                 borderRadius: "16px / 32px",
//                 background: "linear-gradient(to bottom, #FFD700, #FFA500)",
//               }}>
//               {/* Edge texture */}
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`front-edge-${i}`}
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-180">
//                 Jackpot
//               </div>
//             </div>

//             {/* Back Edge */}
//             <div
//               className="absolute w-full h-32 flex items-center justify-center backface-hidden overflow-hidden"
//               style={{
//                 transform: "rotateX(-90deg) translateZ(16px)",
//                 height: "32px",
//                 borderRadius: "16px / 32px",
//                 background: "linear-gradient(to bottom, #FFD700, #FFA500)",
//               }}>
//               {/* Edge texture */}
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`back-edge-${i}`}
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10">
//                 Jackpot
//               </div>
//             </div>

//             {/* Left Edge */}
//             <div
//               className="absolute w-32 h-32 flex items-center justify-center backface-hidden overflow-hidden"
//               style={{
//                 transform: "rotateY(-90deg) translateZ(16px)", 
//                 width: "32px",
//                 borderRadius: "32px / 16px",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//               }}>
//               {/* Edge texture */}
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`left-edge-${i}`}
//                     className="absolute w-full h-1 bg-yellow-900/20"
//                     style={{ top: `${i * 5}%` }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">
//                 Jackpot
//               </div>
//             </div>

//             {/* Right Edge */}
//             <div
//               className="absolute w-32 h-32 flex items-center justify-center backface-hidden overflow-hidden"
//               style={{
//                 transform: "rotateY(90deg) translateZ(16px)",
//                 width: "32px",
//                 borderRadius: "32px / 16px",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//               }}>
//               {/* Edge texture */}
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`right-edge-${i}`}
//                     className="absolute w-full h-1 bg-yellow-900/20"
//                     style={{ top: `${i * 5}%` }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">
//                 Jackpot
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

// // Timer Circle component with smooth animation
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
//       className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" 
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
//       <motion.circle
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
//         initial={false}
//         animate={{
//           strokeDashoffset,
//           stroke: color
//         }}
//         transition={{
//           strokeDashoffset: { 
//             duration: 1, // Longer and smoother transition 
//             ease: "linear" // Linear movement for continuous animation
//           },
//           stroke: { 
//             duration: 1,
//             ease: "linear"
//           }
//         }}
//       />
//     </svg>
//   );
// };

// export default function CoinFlip({ round, timeLeft }) {
//   const [isMuted, setIsMuted] = useState(true);
//   const [isAudioInitialized, setIsAudioInitialized] = useState(false);
//   const isFlipping = !round.outcome;
//   const outcome = round?.outcome || "heads";
  
//   // Set a maximum time value for the timer (adjust as needed)
//   const maxTime = 30; // Assuming the timer counts down from 30 seconds

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

//   // Modified coin animation for proper edge display during spinning
//   const coinVariants = {
//     initial: { rotateY: 0, scale: 1, y: 0 },
//     flip: {
//       // When outcome is determined, immediately show the correct side
//       rotateY: isFlipping 
//         ? [0, 90, 180, 270, 360, 450, 540, 630, 720, 810, 900] // Include 90, 270, 450, etc. to show edge during spin
//         : outcome === "edge" 
//           ? 90 // Show edge (90 degrees)
//           : outcome === "heads" 
//             ? 0 // Show heads (0 degrees)
//             : 180, // Show tails (180 degrees)
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
//           ease: isFlipping ? "linear" : [0.34, 1.56, 0.64, 1], // Using linear for spinning to keep even speed
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

//   // Glow effect animation
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

//         {/* Timer Border */}
//         {isFlipping && timeLeft !== undefined && (
//           <TimerCircle timeLeft={timeLeft} maxTime={maxTime} />
//         )}

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

//           {/* Coin with proper 3D rendering of all sides */}
//           <motion.div
//             className="absolute inset-0"
//             initial="initial"
//             animate="flip"
//             variants={coinVariants}
//             style={{ 
//               transformStyle: "preserve-3d", 
//               perspective: "1000px",
//               transform: "translateZ(-16px)" // This helps center the coin in perspective space
//             }}>
//             {/* Heads Side */}
//             <div 
//               className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden"
//               style={{ transform: "rotateY(0deg) translateZ(16px)" }} // Offset by half thickness
//             >
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

//             {/* Tails Side */}
//             <div
//               className="absolute w-full h-full rounded-full flex items-center justify-center backface-hidden"
//               style={{ transform: "rotateY(180deg) translateZ(16px)" }} // Offset by half thickness
//             >
//               <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 border-8 border-gray-500 flex items-center justify-center shadow-inner overflow-hidden">
//                 {/* Inner embossed design */}
//                 <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-gray-300 to-gray-500 opacity-70" />
//                 <div className="relative z-10 w-12 h-12 rounded-full bg-gray-400 border-4 border-gray-500 flex items-center justify-center shadow-inner">
//                   <div className="text-3xl font-extrabold text-gray-800">T</div>
//                 </div>
//               </div>
//             </div>

//             {/* Edge Side - Four segments to create a complete edge */}
//             {/* Front Edge */}
//             <div
//               className="absolute w-full h-32 flex items-center justify-center backface-hidden overflow-hidden"
//               style={{
//                 transform: "rotateX(90deg) translateZ(16px)",
//                 height: "32px",
//                 borderRadius: "16px / 32px",
//                 background: "linear-gradient(to bottom, #FFD700, #FFA500)",
//               }}>
//               {/* Edge texture */}
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`front-edge-${i}`}
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-180">
//                 Jackpot
//               </div>
//             </div>

//             {/* Back Edge */}
//             <div
//               className="absolute w-full h-32 flex items-center justify-center backface-hidden overflow-hidden"
//               style={{
//                 transform: "rotateX(-90deg) translateZ(16px)",
//                 height: "32px",
//                 borderRadius: "16px / 32px",
//                 background: "linear-gradient(to bottom, #FFD700, #FFA500)",
//               }}>
//               {/* Edge texture */}
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`back-edge-${i}`}
//                     className="absolute h-full w-1 bg-yellow-900/20"
//                     style={{
//                       left: `${i * 5}%`,
//                     }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10">
//                 Jackpot
//               </div>
//             </div>

//             {/* Left Edge */}
//             <div
//               className="absolute w-32 h-32 flex items-center justify-center backface-hidden overflow-hidden"
//               style={{
//                 transform: "rotateY(-90deg) translateZ(16px)", 
//                 width: "32px",
//                 borderRadius: "32px / 16px",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//               }}>
//               {/* Edge texture */}
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`left-edge-${i}`}
//                     className="absolute w-full h-1 bg-yellow-900/20"
//                     style={{ top: `${i * 5}%` }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">
//                 Jackpot
//               </div>
//             </div>

//             {/* Right Edge */}
//             <div
//               className="absolute w-32 h-32 flex items-center justify-center backface-hidden overflow-hidden"
//               style={{
//                 transform: "rotateY(90deg) translateZ(16px)",
//                 width: "32px",
//                 borderRadius: "32px / 16px",
//                 background: "linear-gradient(to right, #FFD700, #FFA500)",
//               }}>
//               {/* Edge texture */}
//               <div className="absolute inset-0 opacity-30">
//                 {[...Array(20)].map((_, i) => (
//                   <div
//                     key={`right-edge-${i}`}
//                     className="absolute w-full h-1 bg-yellow-900/20"
//                     style={{ top: `${i * 5}%` }}
//                   />
//                 ))}
//               </div>
//               <div className="text-sm font-bold text-yellow-900 tracking-widest z-10 rotate-90">
//                 Jackpot
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

///*******************************************************************************************************************************************************og code below********************************************************************************************************************************************* */


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

// // // New Timer Circle component
// // const TimerCircle = ({ timeLeft, maxTime }) => {
// //   // Calculate percentage of time remaining
// //   const percentage = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  
// //   // Calculate circumference
// //   const radius = 70; // Slightly larger than coin (32px + buffer)
// //   const circumference = 2 * Math.PI * radius;
  
// //   // Calculate stroke dash offset based on percentage
// //   const strokeDashoffset = circumference * (1 - percentage / 100);
  
// //   // Calculate color based on percentage (green to red)
// //   const hue = (percentage / 100) * 120; // 0 is red, 120 is green in HSL
// //   const color = `hsl(${hue}, 100%, 50%)`;

// //   return (
// //     <svg 
// //       className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2  " 
// //       width="210" 
// //       height="210" 
// //       viewBox="0 0 160 160"
// //     >
// //       {/* Background circle (optional, for visual aid) */}
// //       <circle
// //         cx="80"
// //         cy="80"
// //         r={radius}
// //         fill="none"
// //         stroke="rgba(255,255,255,0.1)"
// //         strokeWidth="10"
// //       />
      
// //       {/* Timer progress circle */}
// //       <circle
// //         cx="80"
// //         cy="80"
// //         r={radius}
// //         fill="none"
// //         stroke={color}
// //         strokeWidth="10"
// //         strokeDasharray={circumference}
// //         strokeDashoffset={strokeDashoffset}
// //         strokeLinecap="round"
// //         transform="rotate(-90 80 80)" // Start from top
// //         style={{
// //           transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease",
// //           filter: `drop-shadow(0 0 3px ${color})`
// //         }}
// //       />
// //     </svg>
// //   );
// // };

// // New Timer Circle component with smooth animation
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
//       className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" 
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
//       <motion.circle
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
//         // style={{
//         //   filter: `drop-shadow(0 0 3px ${color})`
//         // }}
//         initial={false}
//         animate={{
//           strokeDashoffset,
//           stroke: color
//         }}
//         transition={{
//           strokeDashoffset: { 
//             duration: 1, // Longer and smoother transition 
//             ease: "linear" // Linear movement for continuous animation
//           },
//           stroke: { 
//             duration: 1,
//             ease: "linear"
//           }
//         }}
//       />
//     </svg>
//   );
// };
// export default function CoinFlip({ round, timeLeft }) {
//   const [isMuted, setIsMuted] = useState(true);
//   const [isAudioInitialized, setIsAudioInitialized] = useState(false);
//   const isFlipping = !round.outcome;
//   const outcome = round?.outcome || "heads";
  
//   // Set a maximum time value for the timer (adjust as needed)
//   const maxTime = 30; // Assuming the timer counts down from 30 seconds

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

//         {/* Timer Border */}
//         {isFlipping && timeLeft !== undefined && (
//           <TimerCircle timeLeft={timeLeft} maxTime={maxTime} />
//         )}

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
//                 Jackpot
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

//       {/* Optional: Display time left as text (can be removed if not needed) */}
//       {/* {isFlipping && timeLeft !== undefined && (
//         <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-sm font-bold">
//           {Math.ceil(timeLeft)}s
//         </div>
//       )} */}
//     </div>
//   );
// }


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
