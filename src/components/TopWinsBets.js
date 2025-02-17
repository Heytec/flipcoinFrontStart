// src/components/TopWinsBets.js
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTopWins } from "../features/roundSlice";

const TopWinsBets = () => {
  const dispatch = useDispatch();
  const { topWins = [], topWinsFilter, loading, error } = useSelector(
    (state) => state.round
  );

  // Local state for filter (defaults to "daily")
  const [filter, setFilter] = useState("daily");

  useEffect(() => {
    dispatch(fetchTopWins(filter));
  }, [dispatch, filter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

  return (
    <div className="bg-white rounded-lg shadow p-4 my-6">
      <h3 className="text-xl font-bold mb-4 text-center">
        Top 10 Wins ({filter.charAt(0).toUpperCase() + filter.slice(1)})
      </h3>

      <div className="flex justify-center space-x-4 mb-4">
        <button
          className={`px-3 py-1 rounded ${filter === "daily" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => handleFilterChange("daily")}
        >
          Daily
        </button>
        <button
          className={`px-3 py-1 rounded ${filter === "weekly" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => handleFilterChange("weekly")}
        >
          Weekly
        </button>
        <button
          className={`px-3 py-1 rounded ${filter === "monthly" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => handleFilterChange("monthly")}
        >
          Monthly
        </button>
      </div>

      {loading && <p className="text-center">Loading top wins...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}
      {!loading && topWins.length === 0 && (
        <p className="text-center text-gray-600">No top wins found.</p>
      )}
      <ul className="space-y-3">
        {topWins.map((bet, idx) => (
          <li key={bet._id || idx} className="border p-3 rounded">
            <div className="flex justify-between mb-1">
              <span>
                <strong>Rank #{idx + 1}</strong>
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(bet.createdAt)}
              </span>
            </div>
            <p>
              <strong>User:</strong>{" "}
              {bet.user && bet.user.name
                ? bet.user.name
                : bet.user && bet.user.phone
                ? bet.user.phone
                : "Unknown"}
            </p>
            <p>
              <strong>Amount Won:</strong> Ksh {bet.amountWon}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopWinsBets;
