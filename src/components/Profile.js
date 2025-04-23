
/******** profile image update code but not complete coz thre is need to adjust other code files to be compatible ************************************************************************* */

// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { fetchDeposits, fetchWithdrawals } from '../features/transactionSlice';
// // import { updateUserProfile } from '../features/authSlice'; // Assumed action creator for updating profile

// const Profile = () => {
//   const { user, loading: authLoading, error: authError } = useSelector((state) => state.auth);
//   const { deposits, withdrawals, loading: txLoading, error: txError } = useSelector((state) => state.transaction);
//   const dispatch = useDispatch();
//   const userBalance = user?.balance?.toFixed(2) || "0.00";

//   // 'deposits' or 'withdrawals'
//   const [activeTab, setActiveTab] = useState('deposits');
  
//   // For profile image selection
//   const [showImageSelector, setShowImageSelector] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(user?.profileImage || 'avatar1.png');
  
//   // Available profile images
//   const profileImages = [
//     'avatar1.jpg',
//     'avatar2.jpg',
//     'avatar3.png',
//     'avatar4.png',
//     'avatar5.png'
//   ];

//   // Fetch transactions when the active tab or user changes.
//   useEffect(() => {
//     if (user && activeTab === 'deposits') {
//       dispatch(fetchDeposits({ phone: user.phone }));
//     } else if (user && activeTab === 'withdrawals') {
//       dispatch(fetchWithdrawals({ phone: user.phone }));
//     }
//   }, [activeTab, dispatch, user]);
  
//   // Update user's selected profile image
//   const handleImageSelect = (image) => {
//     setSelectedImage(image);
    
//     // Dispatch action to update the user profile in the backend
//     if (user) {
//       dispatch(updateUserProfile({
//         userId: user._id,
//         profileImage: image
//       }));
//     }
    
//     // Close the image selector
//     setShowImageSelector(false);
//   };

//   if (authLoading) return (
//     <div className="flex justify-center items-center h-40 bg-gray-900 text-[#00ff88] rounded-xl">
//       Loading profile...
//     </div>
//   );
  
//   if (authError) return (
//     <div className="flex justify-center items-center h-40 bg-gray-900 text-red-400 rounded-xl">
//       Error loading profile.
//     </div>
//   );

//   return (
//     <div className="mt-8 p-6 bg-gray-900 text-white rounded-xl shadow-lg">
//       <h2 className="text-2xl font-semibold text-center mb-6">User Profile</h2>
      
//       {user ? (
//         <div className="mt-4 bg-gray-800 p-4 rounded-lg">
//           <div className="flex flex-col items-center space-y-3">
//             {/* Profile Image with Change Option */}
//             <div className="relative">
//               {selectedImage ? (
//                 <img 
//                   src={`/images/${selectedImage}`} 
//                   alt="Profile" 
//                   className="w-20 h-20 rounded-full object-cover border-2 border-[#00ff88]"
//                 />
//               ) : (
//                 <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-2xl text-[#00ff88] font-bold">
//                   {user.username ? user.username.charAt(0).toUpperCase() : "U"}
//                 </div>
//               )}
              
//               {/* Change Image Button */}
//               <button 
//                 onClick={() => setShowImageSelector(!showImageSelector)}
//                 className="absolute bottom-0 right-0 bg-[#00ff88] text-gray-900 rounded-full p-1 hover:bg-[#00cc66] transition-colors"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
//                 </svg>
//               </button>
//             </div>
            
//             {/* Image Selector Modal */}
//             {showImageSelector && (
//               <div className="mt-2 p-3 bg-gray-700 rounded-lg">
//                 <h3 className="text-sm font-medium text-center mb-2">Select Profile Image</h3>
//                 <div className="flex flex-wrap justify-center gap-3">
//                   {profileImages.map((image, index) => (
//                     <div 
//                       key={index}
//                       className={`cursor-pointer p-1 rounded-full ${selectedImage === image ? 'border-2 border-[#00ff88]' : ''}`}
//                       onClick={() => handleImageSelect(image)}
//                     >
//                       <img 
//                         src={`/images/${image}`} 
//                         alt={`Avatar ${index + 1}`} 
//                         className="w-12 h-12 rounded-full object-cover"
//                       />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
            
//             <p className="text-lg font-medium">{user.username}</p>
//             <div className="bg-[#1b3a3d8a] w-full py-3 px-4 rounded-lg text-center">
//               <p className="text-sm text-gray-400">Available Balance</p>
//               <p className="text-2xl font-bold text-[#00ff88]">Ksh {userBalance}</p>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <p className="text-center text-gray-400">No user data available.</p>
//       )}

//       {/* Transaction History Tabs */}
//       <div className="mt-8">
//         <div className="flex border-b border-gray-700">
//           <button
//             className={`flex-1 px-4 py-3 focus:outline-none transition-colors duration-200 font-medium ${
//               activeTab === 'deposits'
//                 ? 'border-b-2 border-[#00ff88] text-[#00ff88]'
//                 : 'text-gray-400 hover:text-gray-300'
//             }`}
//             onClick={() => setActiveTab('deposits')}
//           >
//             Deposits
//           </button>
//           <button
//             className={`flex-1 px-4 py-3 focus:outline-none transition-colors duration-200 font-medium ${
//               activeTab === 'withdrawals'
//                 ? 'border-b-2 border-[#00ff88] text-[#00ff88]'
//                 : 'text-gray-400 hover:text-gray-300'
//             }`}
//             onClick={() => setActiveTab('withdrawals')}
//           >
//             Withdrawals
//           </button>
//         </div>

//         <div className="mt-4">
//           {txLoading && (
//             <div className="flex justify-center items-center h-32 text-[#00ff88]">
//               <svg className="animate-spin h-8 w-8 mr-2" viewBox="0 0 24 24">
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                   fill="none"
//                 />
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
//                 />
//               </svg>
//               Loading transactions...
//             </div>
//           )}
          
//           {txError && (
//             <p className="text-red-400 text-center p-4">{txError}</p>
//           )}
          
//           {activeTab === 'deposits' && !txLoading && (
//             <div className="overflow-x-auto">
//               {deposits && deposits.length > 0 ? (
//                 <table className="min-w-full divide-y divide-gray-700">
//                   <thead className="bg-gray-800">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Receipt Number</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-gray-800 divide-y divide-gray-700">
//                     {deposits.map((deposit) => (
//                       <tr key={deposit._id} className="hover:bg-gray-700">
//                         <td className="px-4 py-3 whitespace-nowrap">{deposit.receiptNumber}</td>
//                         <td className="px-4 py-3 whitespace-nowrap text-[#00ff88] font-medium">Ksh {deposit.depositAmount}</td>
//                         <td className="px-4 py-3 whitespace-nowrap text-gray-300">
//                           {new Date(deposit.transactionDate).toLocaleDateString()}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p className="text-center py-8 text-gray-400">No deposits found.</p>
//               )}
//             </div>
//           )}
          
//           {activeTab === 'withdrawals' && !txLoading && (
//             <div className="overflow-x-auto">
//               {withdrawals && withdrawals.length > 0 ? (
//                 <table className="min-w-full divide-y divide-gray-700">
//                   <thead className="bg-gray-800">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction ID</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-gray-800 divide-y divide-gray-700">
//                     {withdrawals.map((withdrawal) => (
//                       <tr key={withdrawal._id} className="hover:bg-gray-700">
//                         <td className="px-4 py-3 whitespace-nowrap">{withdrawal.transactionId}</td>
//                         <td className="px-4 py-3 whitespace-nowrap text-red-400 font-medium">Ksh {withdrawal.amount}</td>
//                         <td className="px-4 py-3 whitespace-nowrap text-gray-300">
//                           {new Date(withdrawal.createdAt).toLocaleDateString()}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p className="text-center py-8 text-gray-400">No withdrawals found.</p>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Profile;



/********************************************************************************************************************* */

// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { fetchDeposits, fetchWithdrawals } from '../features/transactionSlice';

// const Profile = () => {
//   const { user, loading: authLoading, error: authError } = useSelector((state) => state.auth);
//   const { deposits, withdrawals, loading: txLoading, error: txError } = useSelector((state) => state.transaction);
//   const dispatch = useDispatch();
// const userBalance=user.balance.toFixed(2)


//   // 'deposits' or 'withdrawals'
//   const [activeTab, setActiveTab] = useState('deposits');

//   // Fetch transactions when the active tab or user changes.
//   useEffect(() => {
//     if (user && activeTab === 'deposits') {
//       dispatch(fetchDeposits({ phone: user.phone }));
//     } else if (user && activeTab === 'withdrawals') {
//       dispatch(fetchWithdrawals({ phone: user.phone }));
//     }
//   }, [activeTab, dispatch, user]);

//   if (authLoading) return (
//     <div className="flex justify-center items-center h-40 bg-gray-900 text-[#00ff88] rounded-xl">
//       Loading profile...
//     </div>
//   );
  
//   if (authError) return (
//     <div className="flex justify-center items-center h-40 bg-gray-900 text-red-400 rounded-xl">
//       Error loading profile.
//     </div>
//   );

//   return (
//     <div className="mt-8 p-6 bg-gray-900 text-white rounded-xl shadow-lg">
//       <h2 className="text-2xl font-semibold text-center mb-6">User Profile</h2>
      
//       {user ? (
//         <div className="mt-4 bg-gray-800 p-4 rounded-lg">
//           <div className="flex flex-col items-center space-y-3">
//             <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-2xl text-[#00ff88] font-bold mb-2">
//               {user.username ? user.username.charAt(4).toUpperCase() : "U"}
//             </div>
//             <p className="text-lg font-medium">{user.username}</p>
//             <div className="bg-[#1b3a3d8a] w-full py-3 px-4 rounded-lg text-center">
//               <p className="text-sm text-gray-400">Available Balance</p>
//               <p className="text-2xl font-bold text-[#00ff88]">Ksh {userBalance}</p>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <p className="text-center text-gray-400">No user data available.</p>
//       )}

//       {/* Transaction History Tabs */}
//       <div className="mt-8">
//         <div className="flex border-b border-gray-700">
//           <button
//             className={`flex-1 px-4 py-3 focus:outline-none transition-colors duration-200 font-medium ${
//               activeTab === 'deposits'
//                 ? 'border-b-2 border-[#00ff88] text-[#00ff88]'
//                 : 'text-gray-400 hover:text-gray-300'
//             }`}
//             onClick={() => setActiveTab('deposits')}
//           >
//             Deposits
//           </button>
//           <button
//             className={`flex-1 px-4 py-3 focus:outline-none transition-colors duration-200 font-medium ${
//               activeTab === 'withdrawals'
//                 ? 'border-b-2 border-[#00ff88] text-[#00ff88]'
//                 : 'text-gray-400 hover:text-gray-300'
//             }`}
//             onClick={() => setActiveTab('withdrawals')}
//           >
//             Withdrawals
//           </button>
//         </div>

//         <div className="mt-4">
//           {txLoading && (
//             <div className="flex justify-center items-center h-32 text-[#00ff88]">
//               <svg className="animate-spin h-8 w-8 mr-2" viewBox="0 0 24 24">
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                   fill="none"
//                 />
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
//                 />
//               </svg>
//               Loading transactions...
//             </div>
//           )}
          
//           {txError && (
//             <p className="text-red-400 text-center p-4">{txError}</p>
//           )}
          
//           {activeTab === 'deposits' && !txLoading && (
//             <div className="overflow-x-auto">
//               {deposits && deposits.length > 0 ? (
//                 <table className="min-w-full divide-y divide-gray-700">
//                   <thead className="bg-gray-800">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Receipt Number</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-gray-800 divide-y divide-gray-700">
//                     {deposits.map((deposit) => (
//                       <tr key={deposit._id} className="hover:bg-gray-700">
//                         <td className="px-4 py-3 whitespace-nowrap">{deposit.receiptNumber}</td>
//                         <td className="px-4 py-3 whitespace-nowrap text-[#00ff88] font-medium">Ksh {deposit.depositAmount}</td>
//                         <td className="px-4 py-3 whitespace-nowrap text-gray-300">
//                           {new Date(deposit.transactionDate).toLocaleDateString()}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p className="text-center py-8 text-gray-400">No deposits found.</p>
//               )}
//             </div>
//           )}
          
//           {activeTab === 'withdrawals' && !txLoading && (
//             <div className="overflow-x-auto">
//               {withdrawals && withdrawals.length > 0 ? (
//                 <table className="min-w-full divide-y divide-gray-700">
//                   <thead className="bg-gray-800">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction ID</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-gray-800 divide-y divide-gray-700">
//                     {withdrawals.map((withdrawal) => (
//                       <tr key={withdrawal._id} className="hover:bg-gray-700">
//                         <td className="px-4 py-3 whitespace-nowrap">{withdrawal.transactionId}</td>
//                         <td className="px-4 py-3 whitespace-nowrap text-red-400 font-medium">Ksh {withdrawal.amount}</td>
//                         <td className="px-4 py-3 whitespace-nowrap text-gray-300">
//                           {new Date(withdrawal.createdAt).toLocaleDateString()}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p className="text-center py-8 text-gray-400">No withdrawals found.</p>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Profile;

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// Assuming points are part of the user object from state.auth
// If points are selected separately like in Jackpot, import the selector:
// import { selectPoints } from '../features/authSlice'; // Adjust path if needed
import { fetchDeposits, fetchWithdrawals } from '../features/transactionSlice';

const Profile = () => {
  // Select state from Redux
  const { user, loading: authLoading, error: authError } = useSelector((state) => state.auth);
  const { deposits, withdrawals, loading: txLoading, error: txError } = useSelector((state) => state.transaction);
  const dispatch = useDispatch();

  // Safely calculate balance and points *after* checking if user exists
  // Use optional chaining (?.) and nullish coalescing (??) for safety
  const userBalance = user?.balance != null ? user.balance.toFixed(2) : '0.00';
  const userPoints = user?.points ?? 0; // Default to 0 if points are null/undefined

  // State for active transaction tab
  const [activeTab, setActiveTab] = useState('deposits');

  // Effect to fetch transactions when tab or user changes
  useEffect(() => {
    // Check if user and user.phone exist before dispatching
    if (user?.phone && activeTab === 'deposits') {
      dispatch(fetchDeposits({ phone: user.phone }));
    } else if (user?.phone && activeTab === 'withdrawals') {
      dispatch(fetchWithdrawals({ phone: user.phone }));
    }
    // Dependency array includes user object to refetch if user logs in/out or data changes
  }, [activeTab, dispatch, user]);

  // --- Loading State ---
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-40 bg-gray-900 text-[#00ff88] rounded-xl">
        Loading profile...
      </div>
    );
  }

  // --- Auth Error State ---
  if (authError) {
    return (
      <div className="flex justify-center items-center h-40 bg-gray-900 text-red-400 rounded-xl p-4 text-center">
        Error loading profile: {authError} {/* Display the actual error */}
      </div>
    );
  }

  // --- Main Component Render ---
  return (
    <div className="mt-8 p-4 sm:p-6 bg-gray-900 text-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-center mb-6">User Profile</h2>

      {/* --- User Info Section (Conditional) --- */}
      {user ? (
        <div className="mb-8 bg-gray-800 p-4 rounded-lg">
          <div className="flex flex-col items-center space-y-4"> {/* Increased spacing */}
            {/* User Initial */}
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-3xl text-[#00ff88] font-bold mb-2">
              {/* Use first character of username, default to 'U' */}
              {user.username ? user.username.charAt(0).toUpperCase() : "U"}
            </div>
            {/* Username */}
            <p className="text-xl font-medium">{user.username || 'Username N/A'}</p>

            {/* Balance Display */}
            <div className="bg-[#1b3a3d8a] w-full py-3 px-4 rounded-lg text-center">
              <p className="text-sm text-gray-400 uppercase tracking-wide">Available Balance</p>
              <p className="text-2xl font-bold text-[#00ff88]">Ksh {userBalance}</p>
            </div>

            {/* Points Display */}
            <div className="bg-[#3d1b3d8a] w-full py-3 px-4 rounded-lg text-center"> {/* Different background */}
              <p className="text-sm text-gray-400 uppercase tracking-wide">Loyalty Points</p>
              <p className="text-2xl font-bold text-[#ff88ff]"> {/* Different color */}
                {userPoints} Points
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Message shown if user is null (e.g., not logged in) and no authError occurred
        <p className="text-center text-gray-400 mb-8">Please log in to view your profile.</p>
      )}

      {/* --- Transaction History Section (Conditional on User) --- */}
      {user && (
        <div>
          {/* Tabs */}
          <div className="flex border-b border-gray-700 mb-4">
            <button
              className={`flex-1 px-4 py-3 focus:outline-none transition-colors duration-200 font-medium text-sm sm:text-base ${
                activeTab === 'deposits'
                  ? 'border-b-2 border-[#00ff88] text-[#00ff88]'
                  : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
              }`}
              onClick={() => setActiveTab('deposits')}
            >
              Deposits
            </button>
            <button
              className={`flex-1 px-4 py-3 focus:outline-none transition-colors duration-200 font-medium text-sm sm:text-base ${
                activeTab === 'withdrawals'
                  ? 'border-b-2 border-[#00ff88] text-[#00ff88]'
                  : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
              }`}
              onClick={() => setActiveTab('withdrawals')}
            >
              Withdrawals
            </button>
          </div>

          {/* Transaction List Area */}
          <div className="min-h-[200px]"> {/* Min height to prevent collapse */}
            {/* Loading Indicator */}
            {txLoading && (
              <div className="flex justify-center items-center h-32 text-[#00ff88]">
                <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                   <path d="M4 12a8 8 0 018-8" strokeLinecap="round"/>
                </svg>
                Loading transactions...
              </div>
            )}

            {/* Transaction Error */}
            {txError && !txLoading && (
              <p className="text-red-400 text-center p-4">Error loading transactions: {txError}</p>
            )}

            {/* Deposits Table */}
            {!txLoading && !txError && activeTab === 'deposits' && (
              <div className="overflow-x-auto">
                {deposits && deposits.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Receipt No.</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {deposits.map((deposit) => (
                        <tr key={deposit._id} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{deposit.receiptNumber || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#00ff88] font-medium">
                            Ksh {deposit.depositAmount?.toFixed(2) ?? '0.00'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                            {deposit.transactionDate ? new Date(deposit.transactionDate).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-8 text-gray-400">No deposits found.</p>
                )}
              </div>
            )}

            {/* Withdrawals Table */}
            {!txLoading && !txError && activeTab === 'withdrawals' && (
              <div className="overflow-x-auto">
                {withdrawals && withdrawals.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction ID</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal._id} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{withdrawal.transactionId || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-red-400 font-medium">
                            Ksh {withdrawal.amount?.toFixed(2) ?? '0.00'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                            {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-8 text-gray-400">No withdrawals found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )} {/* End conditional rendering of transaction section */}
    </div>
  );
};

export default Profile;

/******************************************************************************************************************************************* */


/// // // src/components/Profile.js

// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { fetchDeposits, fetchWithdrawals } from '../features/transactionSlice';

// const Profile = () => {
//   const { user, loading: authLoading, error: authError } = useSelector((state) => state.auth);
//   const { deposits, withdrawals, loading: txLoading, error: txError } = useSelector((state) => state.transaction);
//   const dispatch = useDispatch();

//   // 'deposits' or 'withdrawals'
//   const [activeTab, setActiveTab] = useState('deposits');

//   // Fetch transactions when the active tab or user changes.
//   useEffect(() => {
//     if (user && activeTab === 'deposits') {
//       dispatch(fetchDeposits({ phone: user.phone }));
//     } else if (user && activeTab === 'withdrawals') {
//       dispatch(fetchWithdrawals({ phone: user.phone }));
//     }
//   }, [activeTab, dispatch, user]);

//   if (authLoading) return <div>Loading profile...</div>;
//   if (authError) return <div>Error loading profile.</div>;

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

//       {/* Transaction History Tabs */}
//       <div className="mt-6">
//         <div className="flex border-b">
//           <button
//             className={`px-4 py-2 focus:outline-none ${
//               activeTab === 'deposits'
//                 ? 'border-b-2 border-blue-500 text-blue-500'
//                 : 'text-gray-600'
//             }`}
//             onClick={() => setActiveTab('deposits')}
//           >
//             Deposits
//           </button>
//           <button
//             className={`px-4 py-2 focus:outline-none ${
//               activeTab === 'withdrawals'
//                 ? 'border-b-2 border-blue-500 text-blue-500'
//                 : 'text-gray-600'
//             }`}
//             onClick={() => setActiveTab('withdrawals')}
//           >
//             Withdrawals
//           </button>
//         </div>

//         <div className="mt-4">
//           {txLoading && <p>Loading transactions...</p>}
//           {txError && <p className="text-red-500">{txError}</p>}
//           {activeTab === 'deposits' && (
//             <div>
//               {deposits && deposits.length > 0 ? (
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead>
//                     <tr>
//                       <th className="px-4 py-2 text-left">Receipt Number</th>
//                       <th className="px-4 py-2 text-left">Amount</th>
//                       <th className="px-4 py-2 text-left">Date</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {deposits.map((deposit) => (
//                       <tr key={deposit._id}>
//                         <td className="px-4 py-2">{deposit.receiptNumber}</td>
//                         <td className="px-4 py-2">{deposit.depositAmount}</td>
//                         <td className="px-4 py-2">
//                           {new Date(deposit.transactionDate).toLocaleDateString()}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p>No deposits found.</p>
//               )}
//             </div>
//           )}
//           {activeTab === 'withdrawals' && (
//             <div>
//               {withdrawals && withdrawals.length > 0 ? (
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead>
//                     <tr>
//                       <th className="px-4 py-2 text-left">Transaction ID</th>
//                       <th className="px-4 py-2 text-left">Amount</th>
//                       <th className="px-4 py-2 text-left">Date</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {withdrawals.map((withdrawal) => (
//                       <tr key={withdrawal._id}>
//                         <td className="px-4 py-2">{withdrawal.transactionId}</td>
//                         <td className="px-4 py-2">{withdrawal.amount}</td>
//                         <td className="px-4 py-2">
//                           {new Date(withdrawal.createdAt).toLocaleDateString()}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p>No withdrawals found.</p>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Profile;




/*************************************************************************************************************************************** */

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
