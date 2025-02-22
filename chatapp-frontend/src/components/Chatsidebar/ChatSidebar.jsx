import React, { useState, useEffect } from "react";
import { ListGroup, InputGroup, FormControl } from "react-bootstrap";
import axios from "axios";
import "./ChatSidebar.css";

function ChatSidebar({onSelectUser}) {
  const [searchQuery, setSearchQuery] = useState(""); // Ensure it's a string

  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (typeof searchQuery !== "string" || !searchQuery.trim()) {
        setSearchResults([]); // Prevent errors when input is invalid
        return;
      }
  
      try {
        const response = await axios.get(
          `http://localhost:3001/api/search?query=${searchQuery}`
        );
        console.log("API Response:", response.data);
        setSearchResults(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching search results", error);
        setSearchResults([]);
      }
    };
  
    const delayDebounce = setTimeout(fetchUsers, 500);
  
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <div className="sidebar">
      <h4 className="logo">💬 chat</h4>
      <InputGroup className="search-bar">
        <FormControl
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </InputGroup>
      <ListGroup variant="flush">
        {searchResults.length > 0
          ? searchResults.map((user) => (
              <ListGroup.Item
                key={user.id}
                className="chat-item"
                onClick={() => onSelectUser(user)} // Pass entire user object
                style={{ cursor: "pointer" }}
              >
                <div>
                  <strong>{user.name}</strong>
                  <p>Click to chat</p>
                </div>
              </ListGroup.Item>
            ))
          : searchQuery && <p className="no-results">No users found</p>}
      </ListGroup>
    </div>
  );
}

export default ChatSidebar;
