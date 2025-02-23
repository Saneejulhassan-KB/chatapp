import React, { useState, useEffect } from "react";
import { ListGroup, InputGroup, FormControl } from "react-bootstrap";
import axios from "axios";
import "./ChatSidebar.css";

function ChatSidebar({ onSelectUser, recentChats, setRecentChats }) {
  const [searchQuery, setSearchQuery] = useState(""); // Ensure it's a string
  const [searchResults, setSearchResults] = useState([]);
  const userId = JSON.parse(localStorage.getItem("user"))?.id;


  useEffect(() => {
    const storedRecentChats = localStorage.getItem("recentChats");
    if (storedRecentChats) {
      setRecentChats(JSON.parse(storedRecentChats));
    }
  }, []);
  

  useEffect(() => {
    if (!userId) return;

    const fetchRecentChats = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/recent-chats/${userId}`);
        const uniqueChats = response.data.reduce((acc, chat) => {
          if (!acc.find((c) => c.chat_user_id === chat.chat_user_id)) {
            acc.push(chat);
          }
          return acc;
        }, []);
        setRecentChats(uniqueChats);
      } catch (error) {
        console.error("Error fetching recent chats:", error);
      }
    };

    fetchRecentChats();
  }, [userId]);


  // Search registered users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/search?query=${searchQuery}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error("Error fetching search results", error);
        setSearchResults([]);
      }
    };

    const delayDebounce = setTimeout(fetchUsers, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return ""; // Check if the date is valid
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };
  

  // Handle user selection from search or recent chats
  const handleSelectUser = (user) => {
    onSelectUser(user); // Send selected user to chat component

    // Prevent adding a duplicate entry in recent chats
    setRecentChats((prev) => {
      if (prev.some((chat) => chat.chat_user_id === user.id)) {
        return prev; // Do not add again if user already exists
      }
      return [{ chat_user_id: user.id, chat_user_name: user.name, message: "" }, ...prev];
    });

    setSearchQuery(""); // Clear search after selecting a user
    setSearchResults([]); // Hide search results after selection
  };





  return (
    <div className="sidebar">
      <img
        src="./90c79d5b9c428484581b2a811dd92aa7.png"
        alt="Logo"
        className="logo "
        width={"150px"}
        style={{fontSize:'20px',fontWeight:'bold',marginTop:'-20px',marginLeft:'-20px'}}
      />

      {/* Search Bar */}
      <InputGroup className="search-bar">
      
      <FormControl
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </InputGroup>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <ListGroup variant="flush">
          {searchResults.map((user) => (
            <ListGroup.Item
              key={user.id}
              onClick={() => handleSelectUser({ id: user.id, name: user.name })}
              className="chat-item"
              style={{ cursor: "pointer" }}
            >
              <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>{user.name}</strong>
              </div>
              <span className="chat-time">{formatTime(user.timestamp)}</span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* Recent Chats */}
      <ListGroup variant="flush">
        {recentChats
          .filter((chat) => chat.chat_user_id !== userId) // Exclude logged-in user
          .map((chat) => (
            <ListGroup.Item
              key={chat.chat_user_id}
              onClick={() => handleSelectUser({ id: chat.chat_user_id, name: chat.chat_user_name })}
              className="chat-item"
              style={{ cursor: "pointer" }}
            >
              <div className="avatar">{chat.chat_user_name.slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>{chat.chat_user_name}</strong>
                <p>{chat.message || "No messages yet"}</p>
              </div>
              <span className="chat-time  ">{formatTime(chat.timestamp)}</span>
            </ListGroup.Item>
          ))}
      </ListGroup>
    </div>
  );
}

export default ChatSidebar;