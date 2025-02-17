// src/components/BetUpdates.js
import React from "react";

export default function BetUpdates({ headBets, tailBets }) {
  // If there are no bets, return nothing
  if (headBets.length === 0 && tailBets.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-2xl font-semibold mb-4 text-center">Bet Updates</h3>
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Heads Bets */}
        <div className="bg-white rounded-lg shadow p-4 flex-1 mb-4 md:mb-0">
          <h4 className="text-xl font-semibold mb-2 border-b pb-1">Heads Bets</h4>
          {headBets.length > 0 ? (
            <ul className="space-y-2">
              {headBets.map((bet, index) => (
                <li
                  key={bet.betId || index}
                  className="p-2 border rounded hover:bg-gray-50"
                >
                  <div className="flex justify-between">
                    <span>
                      <strong>Bet #{index + 1}</strong>
                    </span>
                    <span className="text-sm text-gray-500">
                      {bet.user
                        ? `User: ${bet.user}`
                        : bet.phone
                        ? `Phone: ${bet.phone}`
                        : "N/A"}
                    </span>
                  </div>
                  <p>
                    <span className="font-medium">Amount:</span> {bet.betAmount}
                  </p>
                  {bet.result ? (
                    <p>
                      <span className="font-medium">Result:</span> {bet.result} |{" "}
                      {bet.result === "win"
                        ? `Won: ${bet.amount}`
                        : `Lost: ${bet.amount}`}
                    </p>
                  ) : (
                    <p className="text-gray-600">Placed</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No Heads bets yet.</p>
          )}
        </div>

        {/* Tails Bets */}
        <div className="bg-white rounded-lg shadow p-4 flex-1">
          <h4 className="text-xl font-semibold mb-2 border-b pb-1">Tails Bets</h4>
          {tailBets.length > 0 ? (
            <ul className="space-y-2">
              {tailBets.map((bet, index) => (
                <li
                  key={bet.betId || index}
                  className="p-2 border rounded hover:bg-gray-50"
                >
                  <div className="flex justify-between">
                    <span>
                      <strong>Bet #{index + 1}</strong>
                    </span>
                    <span className="text-sm text-gray-500">
                      {bet.user
                        ? `User: ${bet.user}`
                        : bet.phone
                        ? `Phone: ${bet.phone}`
                        : "N/A"}
                    </span>
                  </div>
                  <p>
                    <span className="font-medium">Amount:</span> {bet.betAmount}
                  </p>
                  {bet.result ? (
                    <p>
                      <span className="font-medium">Result:</span> {bet.result} |{" "}
                      {bet.result === "win"
                        ? `Won: ${bet.amount}`
                        : `Lost: ${bet.amount}`}
                    </p>
                  ) : (
                    <p className="text-gray-600">Placed</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No Tails bets yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
