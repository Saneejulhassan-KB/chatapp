import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import "./ChatWindow.css";

function ChatWindow({currentUser, selectedUser, messages, onSendMessage  }) {
  const [messageText, setMessageText] = useState("");
  return (
    <div className="chat-window">
      <div className="chat-header">
        <h5>{selectedUser?.name || "Select a user"}</h5>
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.senderId === currentUser?.id ? "sent" : "received"
            }`}
          >
            {msg.message}
          </div>
        ))}
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
          placeholder="Type a message..."
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
