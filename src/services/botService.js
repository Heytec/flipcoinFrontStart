// Bot Configuration Constants
export const ENABLE_BOTS = true; // Toggle to enable/disable bots
export const INITIAL_NUMBER_OF_BOTS = 5; // Initial number of bots at round start
export const BOT_BET_INTERVAL = 3000; // Interval for adding new bot bets
export const MAX_BOTS_PER_ROUND = 20; // Maximum number of bots to prevent overcrowding
export const BOT_WIN_MULTIPLIER = 2; // Example multiplier for winning bets
export const BOT_RESULTS_DISPLAY_TIME = 15000; // 15 seconds to display results

// Betting Constants
export const CURRENCY_SYMBOL = "Ksh"; // Currency symbol (e.g., Kenyan Shilling)
export const MIN_BET = 10; // Minimum bet amount
export const MAX_BET = 100;  // Maximum bet amount

// Constants for Phone Number Generation
export const COUNTRY_CODE = 254;
export const PREFIXES = [
  10, 11, 701, 702, 703, 704, 705, 706, 707, 708, 709,
  710, 711, 712, 713, 714, 715, 716, 717, 718, 719, 720,
  721, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731,
  732, 733, 734, 735, 736, 737, 738, 739, 740, 741, 742,
  743, 744, 745, 746, 747, 748, 750, 751, 752, 753, 754,
  755, 756, 757, 758, 759, 760, 761, 762, 763, 764, 765,
  766, 767, 768, 769, 770, 771, 772, 773, 774, 775, 776,
  777, 778, 779, 780, 781, 782, 783, 784, 785, 786, 787,
  788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799
];

/**
 * Generates a string of random digits of the specified length.
 */
const generateRandomDigits = (length) =>
  Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");

/**
 * Generates a full phone number using the country code and the provided prefix.
 * 
 * For two-digit prefixes, one extra random digit is appended to form a three-digit operator code.
 * The remaining digits are generated so that the total phone number (excluding the country code)
 * is always 9 digits long.
 *
 * @param {number} prefix - The numeric prefix (e.g., 10, 701).
 * @returns {string} The generated phone number (e.g., 254107123456).
 */
export const generatePhoneNumber = (prefix) => {
  let prefixStr = prefix.toString();
  if (prefixStr.length === 2) {
    // Append one random digit for two-digit prefixes to form a three-digit operator code
    prefixStr += generateRandomDigits(1);
  }
  // Calculate the remaining digits needed for a total of 9 digits after the country code
  const remainingDigits = 9 - prefixStr.length;
  const randomPart = generateRandomDigits(remainingDigits);
  return `${COUNTRY_CODE}${prefixStr}${randomPart}`;
};

/**
 * Utility to generate a random bot phone number by randomly picking a prefix
 * from the allowed PREFIXES and generating a full phone number.
 */
export const generateBotPhone = () => {
  const randomIndex = Math.floor(Math.random() * PREFIXES.length);
  const prefix = PREFIXES[randomIndex];
  return generatePhoneNumber(prefix);
};

/**
 * Utility to generate a random bot bet.
 * The bet amount is generated randomly between MIN_BET and MAX_BET, rounded to one decimal.
 *
 * @param {string} roundId - The identifier for the betting round.
 * @returns {Object} A bot bet object.
 */
export const generateBotBet = (roundId) => ({
  betId: `bot_${Math.random().toString(36).substr(2, 9)}`,
  phone: generateBotPhone(),
  betAmount: Number((Math.random() * (MAX_BET - MIN_BET) + MIN_BET).toFixed(1)),
  side: Math.random() > 0.5 ? "heads" : "tails",
  roundId,
  result: null,
  winAmount: 0,
  lossAmount: 0,
});

/**
 * Utility to update bot bet results based on round outcome.
 * It assigns win/loss status along with the corresponding win/loss amounts.
 *
 * @param {Array} bets - Array of bot bet objects.
 * @param {string} outcome - The outcome of the round ("heads" or "tails").
 * @returns {Array} The updated bets array.
 */
export const updateBotBetResults = (bets, outcome) => {
  return bets.map((bet) => {
    if (bet.result) return bet; // Skip if already processed
    const isWin = bet.side === outcome;
    return {
      ...bet,
      result: isWin ? "win" : "loss",
      winAmount: isWin ? bet.betAmount * BOT_WIN_MULTIPLIER : 0,
      lossAmount: !isWin ? bet.betAmount : 0,
    };
  });
};

/**
 * Creates initial bots for a new round.
 *
 * @param {string} roundId - The identifier for the round.
 * @param {number} count - Number of bots to create (default: INITIAL_NUMBER_OF_BOTS).
 * @returns {Array} Array of initial bot bets.
 */
export const createInitialBots = (roundId, count = INITIAL_NUMBER_OF_BOTS) => {
  const initialBets = [];
  for (let i = 0; i < count; i++) {
    initialBets.push(generateBotBet(roundId));
  }
  return initialBets;
};

/**
 * Checks if a round is active.
 *
 * @param {Object} round - The round object.
 * @returns {boolean} True if the round is active; false otherwise.
 */
export const isRoundActive = (round) => {
  return !round?.outcome || round.outcome === "processing";
};

/**
 * Filters bots for the current round.
 *
 * @param {Array} bots - Array of bot bets.
 * @param {string} roundId - The round identifier.
 * @returns {Array} Array of bots for the specified round.
 */
export const filterBotsForRound = (bots, roundId) => {
  return bots.filter(bet => bet.roundId === roundId);
};

/**
 * Gets bot bets by side for a specific round.
 *
 * @param {Array} bots - Array of bot bets.
 * @param {string} roundId - The round identifier.
 * @returns {Object} An object containing arrays for "heads" and "tails" bets.
 */
export const getBotsBySide = (bots, roundId) => {
  return {
    heads: bots.filter(bet => bet.side === "heads" && bet.roundId === roundId),
    tails: bots.filter(bet => bet.side === "tails" && bet.roundId === roundId)
  };
};



// // Bot Configuration Constants
// export const ENABLE_BOTS = true; // Toggle to enable/disable bots
// export const INITIAL_NUMBER_OF_BOTS = 5; // Initial number of bots at round start
// export const BOT_BET_INTERVAL = 3000; // Interval for adding new bot bets
// export const MAX_BOTS_PER_ROUND = 10; // Maximum number of bots to prevent overcrowding
// export const BOT_WIN_MULTIPLIER = 2; // Example multiplier for winning bets
// export const BOT_RESULTS_DISPLAY_TIME = 15000; // 15 seconds to display results

// // Utility to generate a random bot phone number
// export const generateBotPhone = () => {
//   const areaCode = Math.floor(Math.random() * 900) + 100;
//   const middle = Math.floor(Math.random() * 900) + 100;
//   const last = Math.floor(Math.random() * 9000) + 1000;
//   return `${areaCode}${middle}${last}`;
// };

// // Utility to generate a random bot bet
// export const generateBotBet = (roundId) => ({
//   betId: `bot_${Math.random().toString(36).substr(2, 9)}`,
//   phone: generateBotPhone(),
//   betAmount: (Math.floor(Math.random() * 100) + 1) / 10, // Random amount between 0.1 and 10
//   side: Math.random() > 0.5 ? "heads" : "tails",
//   roundId,
//   result: null,
//   winAmount: 0,
//   lossAmount: 0,
// });

// // Utility to update bot bet results based on round outcome
// export const updateBotBetResults = (bets, outcome) => {
//   return bets.map((bet) => {
//     if (bet.result) return bet; // Skip if already processed
//     const isWin = bet.side === outcome;
//     return {
//       ...bet,
//       result: isWin ? "win" : "loss",
//       winAmount: isWin ? bet.betAmount * BOT_WIN_MULTIPLIER : 0,
//       lossAmount: !isWin ? bet.betAmount : 0,
//     };
//   });
// };

// // Create initial bots for a new round
// export const createInitialBots = (roundId, count = INITIAL_NUMBER_OF_BOTS) => {
//   const initialBets = [];
//   for (let i = 0; i < count; i++) {
//     initialBets.push(generateBotBet(roundId));
//   }
//   return initialBets;
// };

// // Check if a round is active
// export const isRoundActive = (round) => {
//   return !round?.outcome || round.outcome === "processing";
// };

// // Filter bots for the current round
// export const filterBotsForRound = (bots, roundId) => {
//   return bots.filter(bet => bet.roundId === roundId);
// };

// // Get bot bets by side for a specific round
// export const getBotsBySide = (bots, roundId) => {
//   return {
//     heads: bots.filter(bet => bet.side === "heads" && bet.roundId === roundId),
//     tails: bots.filter(bet => bet.side === "tails" && bet.roundId === roundId)
//   };
// };