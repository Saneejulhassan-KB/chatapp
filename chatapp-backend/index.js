require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const socketIo = require("socket.io");
const moment = require("moment");

const app = express();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Ensure this matches your frontend port
    methods: ["GET", "POST"],
  },
});


app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// MySQL Connection Pool
const pool = mysql.createPool({
  connectionLimit: 10,
  user: "root",
  host: "localhost",
  password: "Admin@1998",
  database: "chatappdb",
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database.");
    connection.release();
  }
});


const activeUsers = new Map(); // Track online users

// ********** User Registration **********
app.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  const checkEmailQuery = `SELECT * FROM register WHERE email = ?`;
  pool.query(checkEmailQuery, [email], async (err, results) => {
    if (err) {
      console.error("Error querying database:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }

    if (results.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists." });
    }

    const checkPhoneQuery = `SELECT * FROM register WHERE phone = ?`;
    pool.query(checkPhoneQuery, [phone], async (err, results) => {
      if (err) {
        console.error("Error querying database:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error." });
      }

      if (results.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Phone number already exists." });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO register (name, email, phone, password) VALUES (?, ?, ?, ?)`;
        pool.query(sql, [name, email, phone, hashedPassword], (err, result) => {
          if (err) {
            console.error("Error inserting into database:", err);
            return res
              .status(500)
              .json({ success: false, message: "Database error." });
          }
          res.status(200).json({
            success: true,
            message: "User registered successfully.",
          });
        });
      } catch (error) {
        console.error("Error hashing password:", error);
        res.status(500).json({ success: false, message: "Server error." });
      }
    });
  });
});

// ********** User Login **********
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });

  pool.query(
    "SELECT * FROM register WHERE email = ?",
    [email],
    async (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Database error." });

      if (results.length === 0)
        return res
          .status(401)
          .json({ success: false, message: "Invalid email or password." });

      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch)
        return res
          .status(401)
          .json({ success: false, message: "Invalid email or password." });

      // Update online status
      pool.query("UPDATE register SET is_online = 1 WHERE id = ?", [user.id]);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(200).json({
        success: true,
        message: "Login successful.",
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          is_online: 1, 
        },
      });
    }
  );
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token)
    return res.status(403).json({ success: false, message: "Access denied." });

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err)
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });

    req.user = decoded; // Attach user data to request object
    next();
  });
};

// ********** Search Users **********
app.get("/api/search", (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.json([]); // Return empty array if no search input
  }

  const searchQuery = `
    SELECT id, name 
    FROM register 
    WHERE name LIKE ? OR phone LIKE ?`; // Search by name or phone

  pool.query(searchQuery, [`%${query}%`, `%${query}%`], (err, results) => {
    if (err) {
      console.error("Search error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json(results);
  });
});


//********** Real-time Messaging with Socket.IO **********
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // User joins
  socket.on("join", (userId) => {
    activeUsers.set(userId, socket.id);
    console.log(`User ${userId} is online.`);
    io.emit("updateUserStatus", Array.from(activeUsers.keys())); // Send online users to frontend
  });

  // Send Message
  socket.on("sendMessage", (data) => {
    const { senderId, receiverId, message } = data;
    const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");

    // Save message in database
    pool.query(
      "INSERT INTO messages (sender_id, receiver_id, message, timestamp) VALUES (?, ?, ?, ?)",
      [senderId, receiverId, message, timestamp],
      (err) => {
        if (err) console.error("Message save error:", err);
      }
    );

    // Send message to the receiver if online
    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", {
        senderId,
        message,
        timestamp,
      });
    }
  });

  // User disconnects
  socket.on("disconnect", () => {
    let userId = null;
    for (let [key, value] of activeUsers.entries()) {
      if (value === socket.id) {
        userId = key;
        activeUsers.delete(key);
        break;
      }
    }

    if (userId) {
      pool.query("UPDATE register SET is_online = 0 WHERE id = ?", [userId]);
      console.log(`User ${userId} is offline.`);
      io.emit("updateUserStatus", Array.from(activeUsers.keys())); // Update online users
    }
  });
});

// ********** Fetch Messages **********
app.get("/messages/:userId/:receiverId", (req, res) => {
  const { userId, receiverId } = req.params;

  const sql = `
    SELECT sender_id, receiver_id, message, timestamp 
    FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY timestamp ASC`;

  pool.query(sql, [userId, receiverId, receiverId, userId], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    res.json(results);
  });
});

// Save messages in database
app.post("/messages", (req, res) => {
  const { senderId, receiverId, message } = req.body;
  
  // Debug: Log received request data
  console.log("Received message data:", req.body);

  if (!senderId || !receiverId || !message) {
    console.error("Missing fields:", { senderId, receiverId, message });
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

  const sql = `INSERT INTO messages (sender_id, receiver_id, message, timestamp) VALUES (?, ?, ?, ?)`;
  pool.query(sql, [senderId, receiverId, message, timestamp], (err, result) => {
    if (err) {
      console.error("Error saving message:", err);
      return res.status(500).json({ success: false, message: "Database error", error: err });
    }
    console.log("Message saved successfully:", result);
    res.status(200).json({ success: true, message: "Message saved successfully" });
  });
});


app.get("/recent-chats/:userId", (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT 
        u.id AS chat_user_id, 
        u.name AS chat_user_name, 
        m.message, 
        m.timestamp AS latest_timestamp
    FROM messages m
    JOIN register u ON (m.sender_id = u.id OR m.receiver_id = u.id)
    WHERE (m.sender_id = ? OR m.receiver_id = ?)
    AND m.timestamp = (
        SELECT MAX(timestamp) 
        FROM messages 
        WHERE (sender_id = u.id OR receiver_id = u.id) 
        AND (sender_id = ? OR receiver_id = ?)
    )
    ORDER BY latest_timestamp DESC;
  `;

  pool.query(query, [userId, userId, userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching recent chats:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    
    console.log("Recent Chats Response:", results); // DEBUG
    res.json(results);
  });
});





// ********** Start Server **********
server.listen(3001, () => console.log("Running backend server on port 3001"));