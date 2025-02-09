// src/components/LiveChat.js
import React, { useEffect, useState } from 'react';
import Ably from 'ably';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage } from '../features/chatSlice';

const LiveChat = () => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.chat.messages);
  const [msgInput, setMsgInput] = useState('');
  const [ablyClient, setAblyClient] = useState(null);

  useEffect(() => {
    const ably = new Ably.Realtime('YOUR_ABLY_API_KEY'); // Replace with your Ably API key
    setAblyClient(ably);
    const channel = ably.channels.get('game-chat');
    channel.subscribe((message) => {
      dispatch(addMessage(message.data));
    });
    return () => channel.unsubscribe();
  }, [dispatch]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (ablyClient) {
      const channel = ablyClient.channels.get('game-chat');
      channel.publish('chat', msgInput);
      setMsgInput('');
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Live Chat</h2>
      <div className="border p-2 h-64 overflow-y-scroll bg-gray-50">
        {messages.map((msg, i) => (
          <p key={i} className="mb-1">{msg}</p>
        ))}
      </div>
      <form onSubmit={sendMessage} className="mt-4 flex">
        <input
          type="text"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          placeholder="Type your message..."
          className="border p-2 flex-grow rounded"
        />
        <button 
          type="submit" 
          className="bg-green-500 text-white p-2 ml-2 rounded hover:bg-green-600"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default LiveChat;
