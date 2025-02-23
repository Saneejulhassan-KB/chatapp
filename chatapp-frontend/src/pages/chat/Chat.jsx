import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import ChatSidebar from "../../components/Chatsidebar/ChatSidebar";
import ChatWindow from "../../components/ChatWindow/ChatWindow";
import axios from "axios";
import "./Chat.css"; // Import CSS for styling

const socket = io("http://localhost:3001", { autoConnect: false });
function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]); // Store chat messages
  const [userId, setUserId] = useState(null); // Store logged-in user ID
  const [recentChats, setRecentChats] = useState([]);
  


  useEffect(() => {
    // Fetch recent chats from localStorage
    const storedRecentChats = localStorage.getItem("recentChats");
    if (storedRecentChats) {
      setRecentChats(JSON.parse(storedRecentChats));
    }
  }, []); // This will run once on mount



  // Fetch logged-in user details
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUserId(userData.id);
      socket.connect(); //Connect only when component mounts
      socket.emit("join", userData.id);
    }

    return () => {
      socket.disconnect(); //Disconnect when unmounting
    };
  }, []);

  useEffect(() => {
    if (selectedUser && currentUser) {
      axios
        .get(`http://localhost:3001/messages/${currentUser.id}/${selectedUser.id}`)
        .then((response) => setMessages(response.data))
        .catch((error) => console.error("Error fetching messages", error));
    }
  }, [selectedUser, currentUser]); //Ensure userId is checked

  // Fetch chat history when user selects a contact
  useEffect(() => {
    if (selectedUser && userId) {
      axios
        .get(`http://localhost:3001/messages/${userId}/${selectedUser.id}`)
        .then((response) => setMessages(response.data))
        .catch((error) => console.error("Error fetching messages", error));
    }
  }, [selectedUser, userId]); //Ensure userId is checked

  // Listen for new messages
  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        setUserId(parsedUser.id);
        socket.connect(); // Ensure socket connection only happens if user exists
        socket.emit("join", parsedUser.id);
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
      }
    } else {
      console.error("No user found in localStorage");
      window.location.href = "/login"; // Redirect to login if no user is found
    }

    // Check for selected user in localStorage
    const storedSelectedUser = localStorage.getItem("selectedUser");
    if (storedSelectedUser) {
      setSelectedUser(JSON.parse(storedSelectedUser));
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      // Store the selected user in localStorage
      localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
    }
  }, [selectedUser]); // Update the selected user in localStorage whenever it changes


  // Send message
  // Format the current timestamp to a readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes() < 10 ? "0" : ""}${date.getMinutes()}`;
  };

  const sendMessage = async (messageText) => {
    if (!currentUser?.id || !selectedUser?.id || !messageText.trim()) return;

    const timestamp = new Date().toISOString(); // Add current timestamp

    const messageData = {
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      message: messageText.trim(),
      timestamp: timestamp, // Add current timestamp
      formattedTimestamp: formatTimestamp(timestamp), // Store formatted timestamp for easy display
    };

    try {
      await axios.post("http://localhost:3001/messages", messageData);
      setMessages((prev) => [...prev, messageData]);

      setRecentChats((prevChats) => {
        // Remove any existing entry for the selected user
        const updatedChats = [
          {
            chat_user_id: selectedUser.id,
            chat_user_name: selectedUser.name,
            message: messageText,
            timestamp: messageData.timestamp, // Add timestamp to recent chats
          },
          ...prevChats.filter((chat) => chat.chat_user_id !== selectedUser.id),
        ];

        // Store updated chats in localStorage
        localStorage.setItem("recentChats", JSON.stringify(updatedChats));

        return updatedChats;
      });

    } catch (error) {
      console.error("Error sending message:", error);
    }
  };




  return (
    <div className="chat-container">
      <ChatSidebar onSelectUser={setSelectedUser} recentChats={recentChats} setRecentChats={setRecentChats} />
      <ChatWindow
        currentUser={currentUser}
        selectedUser={selectedUser}
        messages={messages}
        onSendMessage={(messageText) => sendMessage(messageText)}
      />
    </div>
  );
}

export default Chat;