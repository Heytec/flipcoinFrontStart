// src/components/Profile.js
import React from 'react';
import { useSelector } from 'react-redux';

const Profile = () => {
  const { user, loading, error } = useSelector((state) => state.auth);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error loading profile.</div>;

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
    </div>
  );
};

export default Profile;
