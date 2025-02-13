// src/components/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { performLogout } from '../features/authSlice';

const Header = ({ onDepositOpen, onWithdrawOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accessToken, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(performLogout())
      .unwrap()
      .then(() => {
        navigate('/login');
      })
      .catch((error) => console.error('Logout failed:', error));
  };

  return (
    <header className="bg-blue-600 text-white p-4">
      <nav className="container mx-auto flex space-x-4 items-center">
        <Link to="/" className="hover:underline">
          Game Room
        </Link>
        <Link to="/leaderboard" className="hover:underline">
          Leaderboard
        </Link>
        <Link to="/chat" className="hover:underline">
          Live Chat
        </Link>
        <Link to="/profile" className="hover:underline">
          Profile
        </Link>
        {accessToken ? (
          <>
            <span className="ml-4">
              Balance: <strong>{user?.balance?.toFixed(2) || '0.00'}</strong>
            </span>
            <button
              onClick={onDepositOpen}
              className="hover:underline px-2 py-1 border rounded"
            >
              Deposit
            </button>
            <button
              onClick={onWithdrawOpen}
              className="hover:underline px-2 py-1 border rounded"
            >
              Withdraw
            </button>
            <button
              onClick={handleLogout}
              className="hover:underline px-2 py-1 border rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">
              Login
            </Link>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
