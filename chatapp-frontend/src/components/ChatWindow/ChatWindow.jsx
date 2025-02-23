import React, { useState, useEffect, useRef } from "react";
import { Form, Button } from "react-bootstrap";
import "./ChatWindow.css";

function ChatWindow({ currentUser, selectedUser, messages, onSendMessage }) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);  // Reference for the last message

  // Scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if currentUser is loaded and messages are populated
  useEffect(() => {
    if (!currentUser) {
      console.log("Current user is still loading.");
      return; // Exit early if currentUser is not yet available
    }
    if (!messages || messages.length === 0) {
      console.log("No messages yet.");
    }
  }, [currentUser, messages]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes() < 10 ? "0" : ""}${date.getMinutes()}`;
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="user-avatar">
          {/* Display first two letters of the user's name */}
          {selectedUser?.name ? selectedUser.name.slice(0, 2).toUpperCase() : "NN"}
        </div>
        <h5>{selectedUser?.name || "Select a user"}</h5>
      </div>
      <div className="chat-messages">
  {messages.map((msg, index) => {
    return (
      <div
        key={index}
        className={`message ${msg.senderId === currentUser?.id ? "sent" : "received"}`}
      >
        <p>{msg.message}</p>
        {/* Display the formatted timestamp below the message */}
        <small className="timestamp">{msg.formattedTimestamp}</small>
      </div>
    );
  })}
  <div ref={messagesEndRef} />
</div>
      <Form
        className="message-input"
        onSubmit={(e) => {
          e.preventDefault();
          if (messageText.trim()) {
            onSendMessage(messageText);
            setMessageText("");
          }
        }}
      >
        <Form.Control
          type="text"
          placeholder=" message"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />
        <Button variant="primary" type="submit">
          ➤
        </Button>
      </Form>
    </div>
  );
}

export default ChatWindow;
