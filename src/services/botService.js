// --- Configuration Constants ---
// // Bot Configuration Constants
export const ENABLE_BOTS = true; // Toggle to enable/disable bots
export const INITIAL_NUMBER_OF_BOTS = 30; // Initial number of bots at round start
export const BOT_BET_INTERVAL = 1000; // Interval for adding new bot bets
export const MAX_BOTS_PER_ROUND = 60; // Maximum number of bots to prevent overcrowding
export const BOT_WIN_MULTIPLIER = 2; // Example multiplier for winning bets
export const BOT_RESULTS_DISPLAY_TIME = 15000; // 15 seconds to display results

// // Betting Constants
export const CURRENCY_SYMBOL = "Ksh"; // Currency symbol (e.g., Kenyan Shilling)
export const MIN_BET = 10; // Minimum bet amount
export const MAX_BET = 1000;  // Maximum bet amount

/**
 * General settings for bot participation.
 */
export const BotSettings = {
  ENABLE_BOTS: true, // Master toggle for enabling/disabling bots
  INITIAL_NUMBER_OF_BOTS: 30, // Bots generated at the absolute start of a round
  BOT_BET_INTERVAL_MS: 1000, // Interval (in ms) for potentially adding NEW bot bets during a round
  MAX_BOTS_PER_ROUND: 60, // Ceiling for total bots in a single round
  BOT_RESULTS_DISPLAY_TIME_MS: 15000, // How long bot results might be highlighted or visible (e.g., 15 seconds)
  // NEW: Define simple bot strategy distributions
  STRATEGY_DISTRIBUTION: {
    RANDOM: 0.6, // 60% of bots bet randomly
    FAVORS_HEADS: 0.15, // 15% slightly favor heads
    FAVORS_TAILS: 0.15, // 15% slightly favor tails
    FOLLOW_TREND: 0.1, // 10% bet on the previous round's winning side (if applicable)
  },
};

/**
 * Betting-related constants.
 */
export const BettingConfig = {
  CURRENCY_SYMBOL: "Ksh", // Currency symbol
  MIN_BET: 10, // Minimum bet amount
  MAX_BET: 1000, // Maximum bet amount
  WIN_MULTIPLIER: 2, // Payout multiplier for winning bets (e.g., 2x means stake + winnings = 2 * stake)
};

/**
 * Configuration for generating simulated phone numbers (Kenyan format).
 */
export const PhoneConfig = {
  COUNTRY_CODE: 254,
  // Keep your comprehensive list of prefixes
  PREFIXES: [
    10, 11, 701, 702, 703, 704, 705, 706, 707, 708, 709,
    710, 711, 712, 713, 714, 715, 716, 717, 718, 719, 720,
    721, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731,
    732, 733, 734, 735, 736, 737, 738, 739, 740, 741, 742,
    743, 744, 745, 746, 747, 748, 750, 751, 752, 753, 754,
    755, 756, 757, 758, 759, 760, 761, 762, 763, 764, 765,
    766, 767, 768, 769, 770, 771, 772, 773, 774, 775, 776,
    777, 778, 779, 780, 781, 782, 783, 784, 785, 786, 787,
    788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799
  ],
};


// --- Utility Functions ---

/**
 * Generates a string of random digits of the specified length.
 * @param {number} length - The desired length of the digit string.
 * @returns {string} The generated random digit string.
 */
const generateRandomDigits = (length) =>
  Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");

/**
 * Generates a simulated Kenyan phone number string.
 * Ensures the local part (after country code) is 9 digits.
 * Handles 2-digit prefixes by appending a random digit to form a 3-digit operator code.
 * Note: These are simulated and not guaranteed to be valid or in-use numbers.
 *
 * @param {number} prefix - The numeric prefix (e.g., 10, 701).
 * @returns {string} The generated phone number string (e.g., "254701123456").
 */
export const generatePhoneNumber = (prefix) => {
  let prefixStr = prefix.toString();
  // If prefix is like '10' or '11', make it 3 digits (e.g., '10X')
  if (prefixStr.length === 2) {
     prefixStr += generateRandomDigits(1);
  }
  // Ensure total local number length is 9 digits
  const remainingDigitsLength = 9 - prefixStr.length;
  if (remainingDigitsLength < 0) {
      // This case shouldn't happen with current prefixes, but good to handle
      console.warn(`Prefix ${prefix} is too long for standard Kenyan format.`);
      prefixStr = prefixStr.substring(0, 9); // Truncate if needed
  }
  const randomPart = remainingDigitsLength > 0 ? generateRandomDigits(remainingDigitsLength) : "";
  return `${PhoneConfig.COUNTRY_CODE}${prefixStr}${randomPart}`;
};

/**
 * Generates a random simulated Kenyan phone number using a random prefix.
 * @returns {string} A randomly generated phone number string.
 */
export const generateBotPhone = () => {
  const randomIndex = Math.floor(Math.random() * PhoneConfig.PREFIXES.length);
  const prefix = PhoneConfig.PREFIXES[randomIndex];
  return generatePhoneNumber(prefix);
};

/**
 * Selects a betting side based on bot strategy.
 * @param {string} strategy - The bot's strategy ('RANDOM', 'FAVORS_HEADS', etc.).
 * @param {string|null} previousOutcome - The outcome of the previous round ('heads', 'tails', or null).
 * @returns {'heads' | 'tails'} The chosen side.
 */
const getSideByStrategy = (strategy, previousOutcome = null) => {
    const rand = Math.random();
    switch(strategy) {
        case 'FAVORS_HEADS':
            return rand < 0.6 ? 'heads' : 'tails'; // 60% chance of heads
        case 'FAVORS_TAILS':
            return rand < 0.6 ? 'tails' : 'heads'; // 60% chance of tails
        case 'FOLLOW_TREND':
            // If previous outcome exists, bet on it, otherwise random
            return previousOutcome ? previousOutcome : (rand < 0.5 ? 'heads' : 'tails');
        case 'RANDOM':
        default:
            return rand < 0.5 ? 'heads' : 'tails';
    }
}

/**
 * Selects a random bot strategy based on defined distribution.
 * @returns {string} The chosen strategy key (e.g., 'RANDOM').
 */
const getRandomStrategy = () => {
    const rand = Math.random();
    let cumulative = 0;
    for (const strategy in BotSettings.STRATEGY_DISTRIBUTION) {
        cumulative += BotSettings.STRATEGY_DISTRIBUTION[strategy];
        if (rand < cumulative) {
            return strategy;
        }
    }
    return 'RANDOM'; // Fallback
}

/**
 * Generates a simulated bet object for a bot.
 * IMPROVED: Uses integer bet amounts and assigns a betting strategy.
 *
 * @param {string} roundId - The identifier for the current betting round.
 * @param {string|null} previousOutcome - The outcome of the previous round for trend-following bots.
 * @returns {object} A bot bet object.
 */
export const generateBotBet = (roundId, previousOutcome = null) => {
  // IMPROVEMENT: Use Math.floor or Math.round for integer amounts (more realistic for Ksh)
  const betAmount = Math.floor(
    Math.random() * (BettingConfig.MAX_BET - BettingConfig.MIN_BET + 1) + BettingConfig.MIN_BET
  );

  // IMPROVEMENT: Assign a strategy and determine side based on it
  const strategy = getRandomStrategy();
  const side = getSideByStrategy(strategy, previousOutcome);

  return {
    betId: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // Slightly more unique ID
    phone: generateBotPhone(),
    betAmount: betAmount,
    side: side,
    strategy: strategy, // Store the strategy for potential analysis
    roundId: roundId,
    result: null, // 'win', 'loss', or null if not determined
    winAmount: 0,
    lossAmount: 0,
  };
};

/**
 * Updates an array of bot bets with results based on the round outcome.
 * Calculates win/loss amounts.
 *
 * @param {Array<object>} bets - Array of bot bet objects for the round.
 * @param {'heads' | 'tails'} outcome - The winning side of the round.
 * @returns {Array<object>} The updated array of bets with results.
 */
export const updateBotBetResults = (bets, outcome) => {
  return bets.map((bet) => {
    // Avoid reprocessing if result already set
    if (bet.result !== null) return bet;

    const isWin = bet.side === outcome;
    return {
      ...bet,
      result: isWin ? "win" : "loss",
      // Calculate winAmount based on multiplier (stake + winnings)
      winAmount: isWin ? bet.betAmount * BettingConfig.WIN_MULTIPLIER : 0,
      // Loss amount is simply the stake
      lossAmount: !isWin ? bet.betAmount : 0,
    };
  });
};

/**
 * Creates the initial batch of bot bets for a new round.
 *
 * @param {string} roundId - The identifier for the round.
 * @param {string|null} previousOutcome - Outcome of the previous round for strategies.
 * @returns {Array<object>} Array of initial bot bets.
 */
export const createInitialBots = (roundId, previousOutcome = null) => {
  const initialBets = [];
  const count = BotSettings.INITIAL_NUMBER_OF_BOTS;
  for (let i = 0; i < count; i++) {
    initialBets.push(generateBotBet(roundId, previousOutcome));
  }
  return initialBets;
};

// --- Game Logic Helpers ---

/**
 * Placeholder for logic to add more bot bets periodically during a round.
 * This would typically be called by your main game loop or a timer.
 *
 * @param {Array<object>} currentBots - The array of all current bot bets.
 * @param {string} roundId - The current round ID.
 * @param {string|null} previousOutcome - Outcome of the previous round.
 * @returns {object | null} A new bot bet object if one should be added, otherwise null.
 */
export const maybeGenerateNewBotBet = (currentBots, roundId, previousOutcome = null) => {
    const currentRoundBots = filterBotsForRound(currentBots, roundId);
    if (currentRoundBots.length >= BotSettings.MAX_BOTS_PER_ROUND) {
        return null; // Max bots reached for this round
    }
    // Add logic here if you want probabilistic additions, or just always add one
    // if called on the interval.
    return generateBotBet(roundId, previousOutcome);
    // --- In your game loop/timer ---
    // setInterval(() => {
    //      const newBotBet = maybeGenerateNewBotBet(allBotsState, currentRoundId, prevOutcome);
    //      if (newBotBet && isRoundActive(currentRound)) {
    //          // Add newBotBet to your state management (e.g., push to allBotsState)
    //      }
    // }, BotSettings.BOT_BET_INTERVAL_MS);
};

/**
 * Checks if a round is currently in an active betting phase.
 * Assumes round object has an 'outcome' property which is null or 'processing' when active.
 *
 * @param {object} round - The round object.
 * @returns {boolean} True if the round is active, false otherwise.
 */
export const isRoundActive = (round) => {
  // Adjust condition based on your actual round object structure
  return round && (!round.outcome || round.outcome === "processing");
};

/**
 * Filters an array of bot bets to get only those belonging to a specific round.
 *
 * @param {Array<object>} bots - The full array of bot bets across all rounds.
 * @param {string} roundId - The specific round identifier to filter by.
 * @returns {Array<object>} An array containing only bots for the specified round.
 */
export const filterBotsForRound = (bots, roundId) => {
  return bots.filter(bet => bet.roundId === roundId);
};

/**
 * Groups bot bets for a specific round by their chosen side ('heads' or 'tails').
 *
 * @param {Array<object>} bots - The array of bot bets (ideally already filtered for the round).
 * @param {string} roundId - The specific round identifier.
 * @returns {{heads: Array<object>, tails: Array<object>}} An object containing arrays of bets for each side.
 */
export const getBotsBySideForRound = (bots, roundId) => {
    const roundBots = filterBotsForRound(bots, roundId);
    return {
        heads: roundBots.filter(bet => bet.side === "heads"),
        tails: roundBots.filter(bet => bet.side === "tails")
    };
};

// // Bot Configuration Constants
// export const ENABLE_BOTS = true; // Toggle to enable/disable bots
// export const INITIAL_NUMBER_OF_BOTS = 30; // Initial number of bots at round start
// export const BOT_BET_INTERVAL = 1000; // Interval for adding new bot bets
// export const MAX_BOTS_PER_ROUND = 60; // Maximum number of bots to prevent overcrowding
// export const BOT_WIN_MULTIPLIER = 2; // Example multiplier for winning bets
// export const BOT_RESULTS_DISPLAY_TIME = 15000; // 15 seconds to display results

// // Betting Constants
// export const CURRENCY_SYMBOL = "Ksh"; // Currency symbol (e.g., Kenyan Shilling)
// export const MIN_BET = 10; // Minimum bet amount
// export const MAX_BET = 1000;  // Maximum bet amount

// // Constants for Phone Number Generation
// export const COUNTRY_CODE = 254;
// export const PREFIXES = [
//   10, 11, 701, 702, 703, 704, 705, 706, 707, 708, 709,
//   710, 711, 712, 713, 714, 715, 716, 717, 718, 719, 720,
//   721, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731,
//   732, 733, 734, 735, 736, 737, 738, 739, 740, 741, 742,
//   743, 744, 745, 746, 747, 748, 750, 751, 752, 753, 754,
//   755, 756, 757, 758, 759, 760, 761, 762, 763, 764, 765,
//   766, 767, 768, 769, 770, 771, 772, 773, 774, 775, 776,
//   777, 778, 779, 780, 781, 782, 783, 784, 785, 786, 787,
//   788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799
// ];

// /**
//  * Generates a string of random digits of the specified length.
//  */
// const generateRandomDigits = (length) =>
//   Math.floor(Math.random() * Math.pow(10, length))
//     .toString()
//     .padStart(length, "0");

// /**
//  * Generates a full phone number using the country code and the provided prefix.
//  * 
//  * For two-digit prefixes, one extra random digit is appended to form a three-digit operator code.
//  * The remaining digits are generated so that the total phone number (excluding the country code)
//  * is always 9 digits long.
//  *
//  * @param {number} prefix - The numeric prefix (e.g., 10, 701).
//  * @returns {string} The generated phone number (e.g., 254107123456).
//  */
// export const generatePhoneNumber = (prefix) => {
//   let prefixStr = prefix.toString();
//   if (prefixStr.length === 2) {
//     // Append one random digit for two-digit prefixes to form a three-digit operator code
//     prefixStr += generateRandomDigits(1);
//   }
//   // Calculate the remaining digits needed for a total of 9 digits after the country code
//   const remainingDigits = 9 - prefixStr.length;
//   const randomPart = generateRandomDigits(remainingDigits);
//   return `${COUNTRY_CODE}${prefixStr}${randomPart}`;
// };

// /**
//  * Utility to generate a random bot phone number by randomly picking a prefix
//  * from the allowed PREFIXES and generating a full phone number.
//  */
// export const generateBotPhone = () => {
//   const randomIndex = Math.floor(Math.random() * PREFIXES.length);
//   const prefix = PREFIXES[randomIndex];
//   return generatePhoneNumber(prefix);
// };

// /**
//  * Utility to generate a random bot bet.
//  * The bet amount is generated randomly between MIN_BET and MAX_BET, rounded to one decimal.
//  *
//  * @param {string} roundId - The identifier for the betting round.
//  * @returns {Object} A bot bet object.
//  */
// export const generateBotBet = (roundId) => ({
//   betId: `bot_${Math.random().toString(36).substr(2, 9)}`,
//   phone: generateBotPhone(),
//   betAmount: Number((Math.random() * (MAX_BET - MIN_BET) + MIN_BET).toFixed(1)),
//   side: Math.random() > 0.5 ? "heads" : "tails",
//   roundId,
//   result: null,
//   winAmount: 0,
//   lossAmount: 0,
// });

// /**
//  * Utility to update bot bet results based on round outcome.
//  * It assigns win/loss status along with the corresponding win/loss amounts.
//  *
//  * @param {Array} bets - Array of bot bet objects.
//  * @param {string} outcome - The outcome of the round ("heads" or "tails").
//  * @returns {Array} The updated bets array.
//  */
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

// /**
//  * Creates initial bots for a new round.
//  *
//  * @param {string} roundId - The identifier for the round.
//  * @param {number} count - Number of bots to create (default: INITIAL_NUMBER_OF_BOTS).
//  * @returns {Array} Array of initial bot bets.
//  */
// export const createInitialBots = (roundId, count = INITIAL_NUMBER_OF_BOTS) => {
//   const initialBets = [];
//   for (let i = 0; i < count; i++) {
//     initialBets.push(generateBotBet(roundId));
//   }
//   return initialBets;
// };

// /**
//  * Checks if a round is active.
//  *
//  * @param {Object} round - The round object.
//  * @returns {boolean} True if the round is active; false otherwise.
//  */
// export const isRoundActive = (round) => {
//   return !round?.outcome || round.outcome === "processing";
// };

// /**
//  * Filters bots for the current round.
//  *
//  * @param {Array} bots - Array of bot bets.
//  * @param {string} roundId - The round identifier.
//  * @returns {Array} Array of bots for the specified round.
//  */
// export const filterBotsForRound = (bots, roundId) => {
//   return bots.filter(bet => bet.roundId === roundId);
// };

// /**
//  * Gets bot bets by side for a specific round.
//  *
//  * @param {Array} bots - Array of bot bets.
//  * @param {string} roundId - The round identifier.
//  * @returns {Object} An object containing arrays for "heads" and "tails" bets.
//  */
// export const getBotsBySide = (bots, roundId) => {
//   return {
//     heads: bots.filter(bet => bet.side === "heads" && bet.roundId === roundId),
//     tails: bots.filter(bet => bet.side === "tails" && bet.roundId === roundId)
//   };
// };



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