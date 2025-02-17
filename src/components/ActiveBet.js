// src/components/ActiveBet.js
import React from "react";

const ActiveBet = ({ userActiveBets }) => {
  return (
    <div className="bg-blue-100 rounded-lg p-4">
      <h3 className="text-xl font-bold text-center">Your Active Bet</h3>
      {userActiveBets.length > 0 ? (
        userActiveBets.map((bet, idx) => (
          <div key={bet.betId || idx} className="text-center my-2">
            <p className="text-lg">
              <strong>Amount:</strong> Ksh {bet.betAmount}
            </p>
            <p className="text-lg">
              <strong>Side:</strong> {bet.side}
            </p>
            {bet.result ? (
              <p className="text-green-600 text-lg">
                <strong>Result:</strong>{" "}
                {bet.result === "win"
                  ? `Won Ksh${bet.amount}`
                  : `Lost Ksh${bet.amount}`}
              </p>
            ) : (
              <p className="text-gray-600 text-lg">Bet is active</p>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-gray-600">
          You have not placed any bet this round.
        </p>
      )}
    </div>
  );
};

export default ActiveBet;
