// // src/components/Profile.js

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDeposits, fetchWithdrawals } from '../features/transactionSlice';

const Profile = () => {
  const { user, loading: authLoading, error: authError } = useSelector((state) => state.auth);
  const { deposits, withdrawals, loading: txLoading, error: txError } = useSelector((state) => state.transaction);
  const dispatch = useDispatch();

  // 'deposits' or 'withdrawals'
  const [activeTab, setActiveTab] = useState('deposits');

  // Fetch transactions when the active tab or user changes.
  useEffect(() => {
    if (user && activeTab === 'deposits') {
      dispatch(fetchDeposits({ phone: user.phone }));
    } else if (user && activeTab === 'withdrawals') {
      dispatch(fetchWithdrawals({ phone: user.phone }));
    }
  }, [activeTab, dispatch, user]);

  if (authLoading) return <div>Loading profile...</div>;
  if (authError) return <div>Error loading profile.</div>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold">User Profile</h2>
      {user ? (
        <div className="mt-4">
          <p className="mb-2">Username: {user.username}</p>
          <p className="mb-2">Balance: {user.balance}</p>
          {/* Additional profile customization can be added here */}
        </div>
      ) : (
        <p>No user data available.</p>
      )}

      {/* Transaction History Tabs */}
      <div className="mt-6">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 focus:outline-none ${
              activeTab === 'deposits'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('deposits')}
          >
            Deposits
          </button>
          <button
            className={`px-4 py-2 focus:outline-none ${
              activeTab === 'withdrawals'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('withdrawals')}
          >
            Withdrawals
          </button>
        </div>

        <div className="mt-4">
          {txLoading && <p>Loading transactions...</p>}
          {txError && <p className="text-red-500">{txError}</p>}
          {activeTab === 'deposits' && (
            <div>
              {deposits && deposits.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Receipt Number</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((deposit) => (
                      <tr key={deposit._id}>
                        <td className="px-4 py-2">{deposit.receiptNumber}</td>
                        <td className="px-4 py-2">{deposit.depositAmount}</td>
                        <td className="px-4 py-2">
                          {new Date(deposit.transactionDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No deposits found.</p>
              )}
            </div>
          )}
          {activeTab === 'withdrawals' && (
            <div>
              {withdrawals && withdrawals.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Transaction ID</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal._id}>
                        <td className="px-4 py-2">{withdrawal.transactionId}</td>
                        <td className="px-4 py-2">{withdrawal.amount}</td>
                        <td className="px-4 py-2">
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No withdrawals found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

// import React from 'react';
// import { useSelector } from 'react-redux';

// const Profile = () => {
//   const { user, loading, error } = useSelector((state) => state.auth);

//   if (loading) return <div>Loading profile...</div>;
//   if (error) return <div>Error loading profile.</div>;

//   return (
//     <div className="p-4 bg-white rounded shadow">
//       <h2 className="text-xl font-bold">User Profile</h2>
//       {user ? (
//         <div className="mt-4">
//           <p className="mb-2">Username: {user.username}</p>
//           <p className="mb-2">Balance: {user.balance}</p>
//           {/* Additional profile customization can be added here */}
//         </div>
//       ) : (
//         <p>No user data available.</p>
//       )}
//     </div>
//   );
// };

// export default Profile;
