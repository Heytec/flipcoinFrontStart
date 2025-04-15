import React, { useState } from "react";
import TopWinsBets from "./TopWinsBets"; // Import the component

const BotConfigAdmin = () => {
  const [enableBots, setEnableBots] = useState(true);
  const [botConfig, setBotConfig] = useState({
    daily: {
      count: 10,
      minAmount: 10000,
      maxAmount: 100000,
      usePhoneAsName: true,
      namesPrefix: "Daily Winner"
    },
    weekly: {
      count: 10,
      minAmount: 50000,
      maxAmount: 200000,
      usePhoneAsName: true,
      namesPrefix: "Weekly Champ"
    },
    monthly: {
      count: 10,
      minAmount: 60000,
      maxAmount: 350000,
      usePhoneAsName: true,
      namesPrefix: "Monthly Star"
    }
  });
  
  // Handle config changes
  const handleConfigChange = (category, field, value) => {
    // Convert numeric fields to numbers
    if (["count", "minAmount", "maxAmount"].includes(field)) {
      value = parseInt(value, 10);
    }
    
    // Convert checkbox values to booleans
    if (field === "usePhoneAsName") {
      value = Boolean(value);
    }
    
    setBotConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };
  
  return (
    <div className="bg-gray-900 text-white p-6 rounded-xl border border-gray-800 max-w-4xl mx-auto my-8">
      <h2 className="text-3xl font-semibold mb-8 text-center text-[#00ff88]">
        Bot Winners Configuration
      </h2>
      
      {/* Master toggle */}
      <div className="mb-8">
        <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
          <span className="font-medium">Enable Bot Winners:</span>
          <div className="relative inline-block w-14 align-middle select-none">
            <input
              type="checkbox"
              checked={enableBots}
              onChange={() => setEnableBots(!enableBots)}
              className="sr-only"
              id="toggle-bots"
            />
            <label
              htmlFor="toggle-bots"
              className={`block h-8 overflow-hidden rounded-full cursor-pointer transition-colors duration-200 ease-in ${
                enableBots ? "bg-[#00ff88]" : "bg-gray-600"
              }`}
            >
              <span
                className={`block h-8 w-8 rounded-full bg-white transform transition-transform duration-200 ease-in ${
                  enableBots ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </label>
          </div>
        </label>
      </div>
      
      {/* Category configs */}
      {enableBots && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(botConfig).map(category => (
            <div key={category} className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-center capitalize border-b border-gray-700 pb-2">
                {category} Winners
              </h3>
              
              <div className="space-y-4">
                {/* Number of bots */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Number of Winners:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={botConfig[category].count}
                    onChange={(e) => handleConfigChange(category, "count", e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-[#00ff88] focus:outline-none"
                  />
                </div>
                
                {/* Min Amount */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Minimum Win Amount (Ksh):
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={botConfig[category].minAmount}
                    onChange={(e) => handleConfigChange(category, "minAmount", e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-[#00ff88] focus:outline-none"
                  />
                </div>
                
                {/* Max Amount */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Maximum Win Amount (Ksh):
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={botConfig[category].maxAmount}
                    onChange={(e) => handleConfigChange(category, "maxAmount", e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-[#00ff88] focus:outline-none"
                  />
                </div>
                
                {/* Use Phone Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Use Phone Numbers as Names:
                  </label>
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={botConfig[category].usePhoneAsName}
                      onChange={(e) => handleConfigChange(category, "usePhoneAsName", e.target.checked)}
                      className="sr-only"
                      id={`toggle-phone-${category}`}
                    />
                    <label
                      htmlFor={`toggle-phone-${category}`}
                      className={`block h-6 overflow-hidden rounded-full cursor-pointer transition-colors duration-200 ease-in ${
                        botConfig[category].usePhoneAsName ? "bg-[#00ff88]" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ease-in ${
                          botConfig[category].usePhoneAsName ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </label>
                  </div>
                </div>
                
                {/* Names Prefix (Only shown if usePhoneAsName is false) */}
                {!botConfig[category].usePhoneAsName && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Names Prefix:
                    </label>
                    <input
                      type="text"
                      value={botConfig[category].namesPrefix}
                      onChange={(e) => handleConfigChange(category, "namesPrefix", e.target.value)}
                      className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-[#00ff88] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Preview Section */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4 text-center">
          Preview With Current Configuration
        </h3>
        <TopWinsBets 
          enableBots={enableBots} 
          customBotConfig={botConfig} 
        />
      </div>
    </div>
  );
};

export default BotConfigAdmin;