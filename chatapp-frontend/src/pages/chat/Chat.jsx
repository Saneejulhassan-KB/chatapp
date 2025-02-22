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

    return () => {
      socket.disconnect();
    };
  }, []);

  // Send message
  const sendMessage = async (messageText) => {
    // Use messageText instead of newMessage
    if (!currentUser?.id || !selectedUser?.id || !messageText.trim()) {
      console.error("Missing fields:", {
        senderId: currentUser?.id,
        receiverId: selectedUser?.id,
        message: messageText,
      });
      return;
    }

    const messageData = {
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      message: messageText.trim(),
    };

    console.log("Sending message:", messageData);

    try {
      await axios.post("http://localhost:3001/messages", messageData);
      setMessages((prev) => [...prev, messageData]); // Add the message locally
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chat-container">
      <ChatSidebar onSelectUser={setSelectedUser} />
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
