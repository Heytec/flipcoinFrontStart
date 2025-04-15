import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTopWins } from "../features/roundSlice";

// Helper function to mask a phone number: show the first 2 digits and the last 3 digits.
const maskPhoneNumber = (phone) => {
  if (!phone) return "Unknown";
  // If the phone number is too short to mask (i.e. less than or equal to 5 digits), return it as is.
  if (phone.length <= 5) return phone;
  
  const firstTwo = phone.slice(0, 2);
  const lastThree = phone.slice(-3);
  // Replace the digits between with asterisks.
  const maskedMiddle = phone.slice(2, phone.length - 3).replace(/./g, "*");
  return firstTwo + maskedMiddle + lastThree;
};

// Bot data generation configuration
const botConfig = {
  daily: {
    count: 10,
    minAmount: 1000,
    maxAmount: 5000,
    // Use phone numbers as display names instead of custom prefixes
    usePhoneAsName: true,
    // Below options will be used if usePhoneAsName is false
    namesPrefix: "Daily Winner",
    customNames: null
  },
  weekly: {
    count: 10,
    minAmount: 5000,
    maxAmount: 10000,
    usePhoneAsName: true,
    namesPrefix: "Weekly Champ",
    customNames: null
  },
  monthly: {
    count: 10,
    minAmount: 10000,
    maxAmount: 20000,
    usePhoneAsName: true,
    namesPrefix: "Monthly Star",
    customNames: null
  }
};

// Function to generate random bot winners based on configuration
const generateBotWinners = (type) => {
  const config = botConfig[type];
  const now = new Date();
  let startDate;
  
  // Set date range based on category
  if (type === 'daily') {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  } else if (type === 'weekly') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (type === 'monthly') {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
  }
  
  return Array.from({ length: config.count }, (_, i) => {
    // Generate random timestamp within the period
    const createdAt = new Date(
      startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime())
    ).toISOString();
    
    // Create a random win amount between configured min and max
    const amountWon = Math.floor(Math.random() * (config.maxAmount - config.minAmount + 1)) + config.minAmount;
    
    // Generate a random Kenya mobile phone number (07XX XXX XXX format)
    const phoneProviders = ["0700", "0701", "0702", "0703", "0704", "0705", "0706", "0707", "0708", "0709", 
                            "0710", "0711", "0712", "0713", "0714", "0715", "0716", "0717", "0718", "0719",
                            "0720", "0721", "0722", "0723", "0724", "0725", "0726", "0727", "0728", "0729",
                            "0730", "0731", "0732", "0733", "0734", "0735", "0736", "0737", "0738", "0739",
                            "0740", "0741", "0742", "0743", "0744", "0745", "0746", "0747", "0748", "0749",
                            "0750", "0790", "0791", "0792", "0793", "0794", "0795", "0796", "0797", "0798", "0799"];
    
    const phonePrefix = phoneProviders[Math.floor(Math.random() * phoneProviders.length)];
    const phoneRest = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const phone = phonePrefix + phoneRest;
    
    // Use custom name if provided, otherwise use phone as name or prefix + number
    let name;
    if (config.customNames && config.customNames[i]) {
      name = config.customNames[i];
    } else if (config.usePhoneAsName) {
      name = null; // Will use masked phone number in the component
    } else {
      name = `${config.namesPrefix} ${i + 1}`;
    }
    
    return {
      _id: `bot_${type}_${i + 1}`,
      user: {
        name,
        phone
      },
      createdAt,
      amountWon
    };
  }).sort((a, b) => b.amountWon - a.amountWon); // Sort by amount won in descending order
};

// Generate bot winners on demand
const getBotWinners = (type) => {
  return generateBotWinners(type);
};

// Controls for bot configuration that can be exposed via props or admin panel
const updateBotConfig = (type, updates) => {
  if (botConfig[type]) {
    botConfig[type] = { ...botConfig[type], ...updates };
  }
};

// Example usage: 
// updateBotConfig('daily', { count: 5, minAmount: 20000, maxAmount: 150000 });
// updateBotConfig('weekly', { customNames: ["VIP Winner 1", "VIP Winner 2", ...] });

const TopWinsBets = ({ 
  // Props to customize bot behavior
  enableBots = true,
  customBotConfig = null
}) => {
  const dispatch = useDispatch();
  const { topWins = [], loading, error } = useSelector((state) => state.round);
  const [filter, setFilter] = useState("daily");
  const [combinedWins, setCombinedWins] = useState([]);

  // Memoize filter change handler
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  // Fetch data only when filter changes
  useEffect(() => {
    dispatch(fetchTopWins(filter));
  }, [dispatch, filter]);

  // Apply custom bot configuration if provided via props
  useEffect(() => {
    if (customBotConfig) {
      Object.keys(customBotConfig).forEach(type => {
        if (botConfig[type]) {
          updateBotConfig(type, customBotConfig[type]);
        }
      });
    }
  }, [customBotConfig]);

  // Combine API data with bot winners when topWins changes
  useEffect(() => {
    if (!loading && !error) {
      if (enableBots) {
        // Generate fresh bot winners for the current filter
        const currentBotWinners = getBotWinners(filter);
        
        // Combine real winners with bot winners and sort by amount won
        const combined = [...topWins, ...currentBotWinners].sort(
          (a, b) => b.amountWon - a.amountWon
        ).slice(0, 10); // Take top 10
        
        setCombinedWins(combined);
      } else {
        // If bots are disabled, just use the API data
        setCombinedWins([...topWins].slice(0, 10));
      }
    }
  }, [topWins, filter, loading, error, enableBots]);

  // Memoized date formatter
  const formatDate = useCallback((dateStr) => {
    return new Date(dateStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, []);

  // Filter button component for reusability
  const FilterButton = ({ type, currentFilter, onClick }) => (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        currentFilter === type
          ? "bg-[#00ff88] text-gray-900 shadow-[0_0_15px_#00ff8860]"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-[#00ff88] border border-gray-700"
      }`}
      onClick={() => onClick(type)}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  );

  return (
    <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6 my-6 max-w-2xl mx-auto border border-gray-800">
      <h3 className="text-2xl font-semibold mb-6 text-center text-[#00ff88]">
        <span className="inline-block border-b-2 border-[#00ff88] pb-1">
          Top 10 Wins ({filter.charAt(0).toUpperCase() + filter.slice(1)})
        </span>
      </h3>

      <div className="flex justify-center gap-3 mb-6">
        <FilterButton type="daily" currentFilter={filter} onClick={handleFilterChange} />
        <FilterButton type="weekly" currentFilter={filter} onClick={handleFilterChange} />
        <FilterButton type="monthly" currentFilter={filter} onClick={handleFilterChange} />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-[#00ff88]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
          </svg>
          <p className="text-gray-400">Loading top winners...</p>
        </div>
      ) : error ? (
        <p className="text-center text-red-400 font-medium py-10">Error: {error}</p>
      ) : combinedWins.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="mb-2">No wins available for this time period.</p>
          <p className="text-sm">Check back later or try a different filter.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {combinedWins.map((bet, idx) => (
            <li
              key={bet._id || idx}
              className={`border ${idx < 3 ? 'border-[#00ff8860]' : 'border-gray-700'} bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition-all duration-200 ${
                idx === 0 ? 'shadow-[0_0_15px_#00ff8840]' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                    idx === 0 ? 'bg-[#00ff88] text-gray-900' : 
                    idx === 1 ? 'bg-[#29babd] text-gray-900' : 
                    idx === 2 ? 'bg-[#1b3a3d] text-[#00ff88]' : 
                    'bg-gray-700 text-gray-300'
                  } font-bold`}>
                    {idx + 1}
                  </div>
                  <span className={`font-bold ${
                    idx === 0 ? 'text-[#00ff88]' : 
                    idx === 1 ? 'text-[#29babd]' : 
                    idx === 2 ? 'text-[#00ff88]' : 
                    'text-white'
                  }`}>
                    {bet.user?.name ||
                      (bet.user?.phone && maskPhoneNumber(bet.user.phone)) ||
                      "Anonymous"}
                  </span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
                  {formatDate(bet.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 pl-11">
                <span className="text-gray-400 text-sm">Won:</span>
                <span className={`text-[#00ff88] font-semibold ${idx === 0 ? 'text-lg' : ''}`}>
                  Ksh {bet.amountWon.toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopWinsBets;


//###################################################################c  fake number ####################################3

// import React, { useEffect, useState, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchTopWins } from "../features/roundSlice";

// // Helper function to mask a phone number: show the first 2 digits and the last 3 digits.
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "Unknown";
//   // If the phone number is too short to mask (i.e. less than or equal to 5 digits), return it as is.
//   if (phone.length <= 5) return phone;
  
//   const firstTwo = phone.slice(0, 2);
//   const lastThree = phone.slice(-3);
//   // Replace the digits between with asterisks.
//   const maskedMiddle = phone.slice(2, phone.length - 3).replace(/./g, "*");
//   return firstTwo + maskedMiddle + lastThree;
// };

// // Bot data generation configuration
// const botConfig = {
//   daily: {
//     count: 10,
//     minAmount: 100,
//     maxAmount: 5000,
//     namesPrefix: "Daily Winner",
//     // Names can also be fully customized with an array if needed
//     customNames: null
//   },
//   weekly: {
//     count: 10,
//     minAmount: 5000,
//     maxAmount: 10000,
//     namesPrefix: "Weekly Champ",
//     customNames: null
//   },
//   monthly: {
//     count: 10,
//     minAmount: 10000,
//     maxAmount: 20000,
//     namesPrefix: "Monthly Star",
//     customNames: null
//   }
// };

// // Function to generate random bot winners based on configuration
// const generateBotWinners = (type) => {
//   const config = botConfig[type];
//   const now = new Date();
//   let startDate;
  
//   // Set date range based on category
//   if (type === 'daily') {
//     startDate = new Date(now);
//     startDate.setHours(0, 0, 0, 0);
//   } else if (type === 'weekly') {
//     startDate = new Date(now);
//     startDate.setDate(now.getDate() - 7);
//   } else if (type === 'monthly') {
//     startDate = new Date(now);
//     startDate.setMonth(now.getMonth() - 1);
//   }
  
//   return Array.from({ length: config.count }, (_, i) => {
//     // Generate random timestamp within the period
//     const createdAt = new Date(
//       startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime())
//     ).toISOString();
    
//     // Create a random win amount between configured min and max
//     const amountWon = Math.floor(Math.random() * (config.maxAmount - config.minAmount + 1)) + config.minAmount;
    
//     // Generate a random Kenya mobile phone number (07XX XXX XXX format)
//     const phonePrefix = Math.random() > 0.5 ? "07" : "01";
//     const phoneRest = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
//     const phone = phonePrefix + phoneRest;
    
//     // Use custom name if provided, otherwise use prefix + number
//     const name = config.customNames && config.customNames[i] 
//       ? config.customNames[i]
//       : `${config.namesPrefix} ${i + 1}`;
    
//     return {
//       _id: `bot_${type}_${i + 1}`,
//       user: {
//         name,
//         phone
//       },
//       createdAt,
//       amountWon
//     };
//   }).sort((a, b) => b.amountWon - a.amountWon); // Sort by amount won in descending order
// };

// // Generate bot winners on demand
// const getBotWinners = (type) => {
//   return generateBotWinners(type);
// };

// // Controls for bot configuration that can be exposed via props or admin panel
// const updateBotConfig = (type, updates) => {
//   if (botConfig[type]) {
//     botConfig[type] = { ...botConfig[type], ...updates };
//   }
// };

// // Example usage: 
// // updateBotConfig('daily', { count: 5, minAmount: 20000, maxAmount: 150000 });
// // updateBotConfig('weekly', { customNames: ["VIP Winner 1", "VIP Winner 2", ...] });

// const TopWinsBets = ({ 
//   // Props to customize bot behavior
//   enableBots = true,
//   customBotConfig = null
// }) => {
//   const dispatch = useDispatch();
//   const { topWins = [], loading, error } = useSelector((state) => state.round);
//   const [filter, setFilter] = useState("daily");
//   const [combinedWins, setCombinedWins] = useState([]);

//   // Memoize filter change handler
//   const handleFilterChange = useCallback((newFilter) => {
//     setFilter(newFilter);
//   }, []);

//   // Fetch data only when filter changes
//   useEffect(() => {
//     dispatch(fetchTopWins(filter));
//   }, [dispatch, filter]);

//   // Apply custom bot configuration if provided via props
//   useEffect(() => {
//     if (customBotConfig) {
//       Object.keys(customBotConfig).forEach(type => {
//         if (botConfig[type]) {
//           updateBotConfig(type, customBotConfig[type]);
//         }
//       });
//     }
//   }, [customBotConfig]);

//   // Combine API data with bot winners when topWins changes
//   useEffect(() => {
//     if (!loading && !error) {
//       if (enableBots) {
//         // Generate fresh bot winners for the current filter
//         const currentBotWinners = getBotWinners(filter);
        
//         // Combine real winners with bot winners and sort by amount won
//         const combined = [...topWins, ...currentBotWinners].sort(
//           (a, b) => b.amountWon - a.amountWon
//         ).slice(0, 10); // Take top 10
        
//         setCombinedWins(combined);
//       } else {
//         // If bots are disabled, just use the API data
//         setCombinedWins([...topWins].slice(0, 10));
//       }
//     }
//   }, [topWins, filter, loading, error, enableBots]);

//   // Memoized date formatter
//   const formatDate = useCallback((dateStr) => {
//     return new Date(dateStr).toLocaleString("en-US", {
//       dateStyle: "medium",
//       timeStyle: "short",
//     });
//   }, []);

//   // Filter button component for reusability
//   const FilterButton = ({ type, currentFilter, onClick }) => (
//     <button
//       className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
//         currentFilter === type
//           ? "bg-[#00ff88] text-gray-900 shadow-[0_0_15px_#00ff8860]"
//           : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-[#00ff88] border border-gray-700"
//       }`}
//       onClick={() => onClick(type)}
//     >
//       {type.charAt(0).toUpperCase() + type.slice(1)}
//     </button>
//   );

//   return (
//     <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6 my-6 max-w-2xl mx-auto border border-gray-800">
//       <h3 className="text-2xl font-semibold mb-6 text-center text-[#00ff88]">
//         <span className="inline-block border-b-2 border-[#00ff88] pb-1">
//           Top 10 Wins ({filter.charAt(0).toUpperCase() + filter.slice(1)})
//         </span>
//       </h3>

//       <div className="flex justify-center gap-3 mb-6">
//         <FilterButton type="daily" currentFilter={filter} onClick={handleFilterChange} />
//         <FilterButton type="weekly" currentFilter={filter} onClick={handleFilterChange} />
//         <FilterButton type="monthly" currentFilter={filter} onClick={handleFilterChange} />
//       </div>

//       {loading ? (
//         <div className="text-center py-10">
//           <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-[#00ff88]" viewBox="0 0 24 24">
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
//           </svg>
//           <p className="text-gray-400">Loading top winners...</p>
//         </div>
//       ) : error ? (
//         <p className="text-center text-red-400 font-medium py-10">Error: {error}</p>
//       ) : combinedWins.length === 0 ? (
//         <div className="text-center py-10 text-gray-400">
//           <p className="mb-2">No wins available for this time period.</p>
//           <p className="text-sm">Check back later or try a different filter.</p>
//         </div>
//       ) : (
//         <ul className="space-y-4">
//           {combinedWins.map((bet, idx) => (
//             <li
//               key={bet._id || idx}
//               className={`border ${idx < 3 ? 'border-[#00ff8860]' : 'border-gray-700'} bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition-all duration-200 ${
//                 idx === 0 ? 'shadow-[0_0_15px_#00ff8840]' : ''
//               }`}
//             >
//               <div className="flex justify-between items-center mb-3">
//                 <div className="flex items-center">
//                   <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
//                     idx === 0 ? 'bg-[#00ff88] text-gray-900' : 
//                     idx === 1 ? 'bg-[#29babd] text-gray-900' : 
//                     idx === 2 ? 'bg-[#1b3a3d] text-[#00ff88]' : 
//                     'bg-gray-700 text-gray-300'
//                   } font-bold`}>
//                     {idx + 1}
//                   </div>
//                   <span className={`font-bold ${
//                     idx === 0 ? 'text-[#00ff88]' : 
//                     idx === 1 ? 'text-[#29babd]' : 
//                     idx === 2 ? 'text-[#00ff88]' : 
//                     'text-white'
//                   }`}>
//                     {bet.user?.name ||
//                       (bet.user?.phone && maskPhoneNumber(bet.user.phone)) ||
//                       "Anonymous"}
//                   </span>
//                 </div>
//                 <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
//                   {formatDate(bet.createdAt)}
//                 </span>
//               </div>
//               <div className="flex justify-between items-center mt-2 pl-11">
//                 <span className="text-gray-400 text-sm">Won:</span>
//                 <span className={`text-[#00ff88] font-semibold ${idx === 0 ? 'text-lg' : ''}`}>
//                   Ksh {bet.amountWon.toLocaleString()}
//                 </span>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default TopWinsBets;



//###############################################################################################################################
//################################################################################################################################

//###################################################################c  orignal   number ####################################3

// import React, { useEffect, useState, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchTopWins } from "../features/roundSlice";

// // Helper function to mask a phone number: show the first 2 digits and the last 3 digits.
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "Unknown";
//   // If the phone number is too short to mask (i.e. less than or equal to 5 digits), return it as is.
//   if (phone.length <= 5) return phone;
  
//   const firstTwo = phone.slice(0, 2);
//   const lastThree = phone.slice(-3);
//   // Replace the digits between with asterisks.
//   const maskedMiddle = phone.slice(2, phone.length - 3).replace(/./g, "*");
//   return firstTwo + maskedMiddle + lastThree;
// };

// const TopWinsBets = () => {
//   const dispatch = useDispatch();
//   const { topWins = [], loading, error } = useSelector((state) => state.round);
//   const [filter, setFilter] = useState("daily");

//   // Memoize filter change handler
//   const handleFilterChange = useCallback((newFilter) => {
//     setFilter(newFilter);
//   }, []);

//   // Fetch data only when filter changes
//   useEffect(() => {
//     dispatch(fetchTopWins(filter));
//   }, [dispatch, filter]);

//   // Memoized date formatter
//   const formatDate = useCallback((dateStr) => {
//     return new Date(dateStr).toLocaleString("en-US", {
//       dateStyle: "medium",
//       timeStyle: "short",
//     });
//   }, []);

//   // Filter button component for reusability
//   const FilterButton = ({ type, currentFilter, onClick }) => (
//     <button
//       className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
//         currentFilter === type
//           ? "bg-[#00ff88] text-gray-900 shadow-[0_0_15px_#00ff8860]"
//           : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-[#00ff88] border border-gray-700"
//       }`}
//       onClick={() => onClick(type)}
//     >
//       {type.charAt(0).toUpperCase() + type.slice(1)}
//     </button>
//   );

//   return (
//     <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6 my-6 max-w-2xl mx-auto border border-gray-800">
//       <h3 className="text-2xl font-semibold mb-6 text-center text-[#00ff88]">
//         <span className="inline-block border-b-2 border-[#00ff88] pb-1">
//           Top 10 Wins ({filter.charAt(0).toUpperCase() + filter.slice(1)})
//         </span>
//       </h3>

//       <div className="flex justify-center gap-3 mb-6">
//         <FilterButton type="daily" currentFilter={filter} onClick={handleFilterChange} />
//         <FilterButton type="weekly" currentFilter={filter} onClick={handleFilterChange} />
//         <FilterButton type="monthly" currentFilter={filter} onClick={handleFilterChange} />
//       </div>

//       {loading ? (
//         <div className="text-center py-10">
//           <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-[#00ff88]" viewBox="0 0 24 24">
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
//           </svg>
//           <p className="text-gray-400">Loading top winners...</p>
//         </div>
//       ) : error ? (
//         <p className="text-center text-red-400 font-medium py-10">Error: {error}</p>
//       ) : topWins.length === 0 ? (
//         <div className="text-center py-10 text-gray-400">
//           <p className="mb-2">No wins available for this time period.</p>
//           <p className="text-sm">Check back later or try a different filter.</p>
//         </div>
//       ) : (
//         <ul className="space-y-4">
//           {topWins.map((bet, idx) => (
//             <li
//               key={bet._id || idx}
//               className={`border ${idx < 3 ? 'border-[#00ff8860]' : 'border-gray-700'} bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition-all duration-200 ${
//                 idx === 0 ? 'shadow-[0_0_15px_#00ff8840]' : ''
//               }`}
//             >
//               <div className="flex justify-between items-center mb-3">
//                 <div className="flex items-center">
//                   <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
//                     idx === 0 ? 'bg-[#00ff88] text-gray-900' : 
//                     idx === 1 ? 'bg-[#29babd] text-gray-900' : 
//                     idx === 2 ? 'bg-[#1b3a3d] text-[#00ff88]' : 
//                     'bg-gray-700 text-gray-300'
//                   } font-bold`}>
//                     {idx + 1}
//                   </div>
//                   <span className={`font-bold ${
//                     idx === 0 ? 'text-[#00ff88]' : 
//                     idx === 1 ? 'text-[#29babd]' : 
//                     idx === 2 ? 'text-[#00ff88]' : 
//                     'text-white'
//                   }`}>
//                     {bet.user?.name ||
//                       (bet.user?.phone && maskPhoneNumber(bet.user.phone)) ||
//                       "Anonymous"}
//                   </span>
//                 </div>
//                 <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
//                   {formatDate(bet.createdAt)}
//                 </span>
//               </div>
//               <div className="flex justify-between items-center mt-2 pl-11">
//                 <span className="text-gray-400 text-sm">Won:</span>
//                 <span className={`text-[#00ff88] font-semibold ${idx === 0 ? 'text-lg' : ''}`}>
//                   Ksh {bet.amountWon.toLocaleString()}
//                 </span>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default TopWinsBets;





///****************************************************************************************************************** */


// // // src/components/TopWinsBets.js
// import React, { useEffect, useState, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchTopWins } from "../features/roundSlice";

// // Helper function to mask a phone number: show the first 2 digits and the last 3 digits.
// const maskPhoneNumber = (phone) => {
//   if (!phone) return "Unknown";
//   // If the phone number is too short to mask (i.e. less than or equal to 5 digits), return it as is.
//   if (phone.length <= 5) return phone;
  
//   const firstTwo = phone.slice(0, 2);
//   const lastThree = phone.slice(-3);
//   // Replace the digits between with asterisks.
//   const maskedMiddle = phone.slice(2, phone.length - 3).replace(/./g, "*");
//   return firstTwo + maskedMiddle + lastThree;
// };

// const TopWinsBets = () => {
//   const dispatch = useDispatch();
//   const { topWins = [], loading, error } = useSelector((state) => state.round);
//   const [filter, setFilter] = useState("daily");

//   // Memoize filter change handler
//   const handleFilterChange = useCallback((newFilter) => {
//     setFilter(newFilter);
//   }, []);

//   // Fetch data only when filter changes
//   useEffect(() => {
//     dispatch(fetchTopWins(filter));
//   }, [dispatch, filter]);

//   // Memoized date formatter
//   const formatDate = useCallback((dateStr) => {
//     return new Date(dateStr).toLocaleString("en-US", {
//       dateStyle: "medium",
//       timeStyle: "short",
//     });
//   }, []);

//   // Filter button component for reusability
//   const FilterButton = ({ type, currentFilter, onClick }) => (
//     <button
//       className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
//         currentFilter === type
//           ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
//           : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//       }`}
//       onClick={() => onClick(type)}
//     >
//       {type.charAt(0).toUpperCase() + type.slice(1)}
//     </button>
//   );

//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6 my-6 max-w-2xl mx-auto">
//       <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">
//         Top 10 Wins ({filter.charAt(0).toUpperCase() + filter.slice(1)})
//       </h3>

//       <div className="flex justify-center gap-4 mb-6">
//         <FilterButton type="daily" currentFilter={filter} onClick={handleFilterChange} />
//         <FilterButton type="weekly" currentFilter={filter} onClick={handleFilterChange} />
//         <FilterButton type="monthly" currentFilter={filter} onClick={handleFilterChange} />
//       </div>

//       {loading ? (
//         <p className="text-center text-gray-500 animate-pulse">Loading...</p>
//       ) : error ? (
//         <p className="text-center text-red-600 font-medium">Error: {error}</p>
//       ) : topWins.length === 0 ? (
//         <p className="text-center text-gray-500">No wins available.</p>
//       ) : (
//         <ul className="space-y-4">
//           {topWins.map((bet, idx) => (
//             <li
//               key={bet._id || idx}
//               className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-150"
//             >
//               <div className="flex justify-between items-center mb-2">
//                 <span className="font-bold text-blue-600">Rank #{idx + 1}</span>
//                 <span className="text-xs text-gray-400">{formatDate(bet.createdAt)}</span>
//               </div>
//               <p className="text-sm">
//                 <span className="font-medium">User:</span>{" "}
//                 {bet.user?.name ||
//                   (bet.user?.phone && maskPhoneNumber(bet.user.phone)) ||
//                   "Unknown"}
//               </p>
//               <p className="text-sm">
//                 <span className="font-medium">Won:</span>{" "}
//                 <span className="text-green-600 font-semibold">Ksh {bet.amountWon.toLocaleString()}</span>
//               </p>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default TopWinsBets;


// import React, { useEffect, useState, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchTopWins } from "../features/roundSlice";

// const TopWinsBets = () => {
//   const dispatch = useDispatch();
//   const { topWins = [], loading, error } = useSelector((state) => state.round);
//   const [filter, setFilter] = useState("daily");

//   // Memoize filter change handler
//   const handleFilterChange = useCallback((newFilter) => {
//     setFilter(newFilter);
//   }, []);

//   // Fetch data only when filter changes
//   useEffect(() => {
//     dispatch(fetchTopWins(filter));
//   }, [dispatch, filter]);

//   // Memoized date formatter
//   const formatDate = useCallback((dateStr) => {
//     return new Date(dateStr).toLocaleString("en-US", {
//       dateStyle: "medium",
//       timeStyle: "short",
//     });
//   }, []);

//   // Filter button component for reusability
//   const FilterButton = ({ type, currentFilter, onClick }) => (
//     <button
//       className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
//         currentFilter === type
//           ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
//           : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//       }`}
//       onClick={() => onClick(type)}
//     >
//       {type.charAt(0).toUpperCase() + type.slice(1)}
//     </button>
//   );

//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6 my-6 max-w-2xl mx-auto">
//       <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">
//         Top 10 Wins ({filter.charAt(0).toUpperCase() + filter.slice(1)})
//       </h3>

//       <div className="flex justify-center gap-4 mb-6">
//         <FilterButton type="daily" currentFilter={filter} onClick={handleFilterChange} />
//         <FilterButton type="weekly" currentFilter={filter} onClick={handleFilterChange} />
//         <FilterButton type="monthly" currentFilter={filter} onClick={handleFilterChange} />
//       </div>

//       {loading ? (
//         <p className="text-center text-gray-500 animate-pulse">Loading...</p>
//       ) : error ? (
//         <p className="text-center text-red-600 font-medium">Error: {error}</p>
//       ) : topWins.length === 0 ? (
//         <p className="text-center text-gray-500">No wins available.</p>
//       ) : (
//         <ul className="space-y-4">
//           {topWins.map((bet, idx) => (
//             <li
//               key={bet._id || idx}
//               className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-150"
//             >
//               <div className="flex justify-between items-center mb-2">
//                 <span className="font-bold text-blue-600">Rank #{idx + 1}</span>
//                 <span className="text-xs text-gray-400">{formatDate(bet.createdAt)}</span>
//               </div>
//               <p className="text-sm">
//                 <span className="font-medium">User:</span>{" "}
//                 {bet.user?.name || bet.user?.phone || "Unknown"}
//               </p>
//               <p className="text-sm">
//                 <span className="font-medium">Won:</span>{" "}
//                 <span className="text-green-600 font-semibold">Ksh {bet.amountWon.toLocaleString()}</span>
//               </p>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default TopWinsBets;
// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchTopWins } from "../features/roundSlice";

// const TopWinsBets = () => {
//   const dispatch = useDispatch();
//   const { topWins = [], topWinsFilter, loading, error } = useSelector(
//     (state) => state.round
//   );

//   // Local state for filter (defaults to "daily")
//   const [filter, setFilter] = useState("daily");

//   useEffect(() => {
//     dispatch(fetchTopWins(filter));
//   }, [dispatch, filter]);

//   const handleFilterChange = (newFilter) => {
//     setFilter(newFilter);
//   };

//   const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

//   return (
//     <div className="bg-white rounded-lg shadow p-4 my-6">
//       <h3 className="text-xl font-bold mb-4 text-center">
//         Top 10 Wins ({filter.charAt(0).toUpperCase() + filter.slice(1)})
//       </h3>

//       <div className="flex justify-center space-x-4 mb-4">
//         <button
//           className={`px-3 py-1 rounded ${filter === "daily" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
//           onClick={() => handleFilterChange("daily")}
//         >
//           Daily
//         </button>
//         <button
//           className={`px-3 py-1 rounded ${filter === "weekly" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
//           onClick={() => handleFilterChange("weekly")}
//         >
//           Weekly
//         </button>
//         <button
//           className={`px-3 py-1 rounded ${filter === "monthly" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
//           onClick={() => handleFilterChange("monthly")}
//         >
//           Monthly
//         </button>
//       </div>

//       {loading && <p className="text-center">Loading top wins...</p>}
//       {error && <p className="text-center text-red-500">Error: {error}</p>}
//       {!loading && topWins.length === 0 && (
//         <p className="text-center text-gray-600">No top wins found.</p>
//       )}
//       <ul className="space-y-3">
//         {topWins.map((bet, idx) => (
//           <li key={bet._id || idx} className="border p-3 rounded">
//             <div className="flex justify-between mb-1">
//               <span>
//                 <strong>Rank #{idx + 1}</strong>
//               </span>
//               <span className="text-sm text-gray-500">
//                 {formatDate(bet.createdAt)}
//               </span>
//             </div>
//             <p>
//               <strong>User:</strong>{" "}
//               {bet.user && bet.user.name
//                 ? bet.user.name
//                 : bet.user && bet.user.phone
//                 ? bet.user.phone
//                 : "Unknown"}
//             </p>
//             <p>
//               <strong>Amount Won:</strong> Ksh {bet.amountWon}
//             </p>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default TopWinsBets;
