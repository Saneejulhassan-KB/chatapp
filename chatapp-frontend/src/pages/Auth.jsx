import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Form, Button, Card } from "react-bootstrap";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Auth.css"; // Custom CSS for additional styling
import axios from "axios";

function Auth() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerStatus, setRegisterStatus] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const baseURL = "http://localhost:3001"; // Backend API URL

  // **Function to handle user signup**
  const handleSignup = (e) => {
    e.preventDefault();

    // **Frontend Validation**
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setRegisterStatus("All fields are required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setRegisterStatus("Invalid email format.");
      return;
    }

    if (password.length < 6) {
      setRegisterStatus("Password must be at least 6 characters long.");
      return;
    }

    // **Send Registration Request**
    axios
      .post(`${baseURL}/register`, { name, email, phone, password })
      .then((response) => {
        if (response.data.success) {
          setIsRegistering(false);

          // Clear the form fields
          setName("");
          setEmail("");
          setPhone("");
          setPassword("");
          setRegisterStatus("")
        } else {
          // If the response indicates failure (e.g., email already exists)
          setRegisterStatus(response.data.message || "Registration failed.");
        }
      })
      .catch((err) => {
        // This will catch network errors or other unexpected issues
        console.error(err);
        if (err.response && err.response.data) {
          // Handle specific backend errors here
          setRegisterStatus(
            err.response.data.message ||
              "An error occurred during registration. Please try again."
          );
        } else {
          setRegisterStatus(
            "An error occurred during registration. Please try again."
          );
        }
      });
  };

  // **Function to handle user signin**
  const handleSignin = async (e) => {
    e.preventDefault();
  
    if (!email.trim() || !password.trim()) {
      setRegisterStatus("All fields are required.");
      return;
    }
  
    try {
      const response = await axios.post(`${baseURL}/login`, { email, password });
  
      if (response.data.success) {
        const user = response.data.user;
        
        // Store entire user object
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", response.data.token); // Store token
  
        setRegisterStatus("Login successful!");
        navigate("/chat"); // Redirect to chat page
      } else {
        setRegisterStatus(response.data.message || "Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setRegisterStatus("Invalid email or password.");
    }
  };
  

  return (
    <div className="signup-container">
      <Card className="signup-card">
        <Card.Body className="px-5 pb-5">
          <div className="logo-container d-flex align-items-center justify-content-center">
            <img
              src="./90c79d5b9c428484581b2a811dd92aa7.png"
              alt="Logo"
              className="logo"
              width={"150px"}
            />
          </div>
          {isRegistering ? (
            // **signup Form**
            <Form style={{ width: "300px" }} onSubmit={handleSignup}>
              <Form.Group className="mb-3" controlId="formName">
                <Form.Control
                  type="text"
                  placeholder="Name"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEmail">
                <Form.Control
                  type="email"
                  placeholder="Email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPhone">
                <PhoneInput
                  country={"in"} // Default country code
                  value={phone}
                  onChange={(value) => setPhone(value)} // Use value directly
                  inputClass="form-control"
                  placeholder="Phone number"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Control
                  type="password"
                  placeholder="Password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="signup-btn">
                Sign Up
              </Button>
            </Form>
          ) : (
            // **signin Form**
            <Form style={{ width: "300px" }} onSubmit={handleSignin}>
              <Form.Group className="mb-3" controlId="formEmail">
                <Form.Control
                  type="email"
                  placeholder="Email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Control
                  type="password"
                  placeholder="Password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="signup-btn">
                Sign In
              </Button>
            </Form>
          )}

          <div className="text-center mt-4">
            {isRegistering ? (
              <p>
                Already have an account?{" "}
                <a href="#" onClick={() => setIsRegistering(false)}>
                  Signin here.
                </a>
              </p>
            ) : (
              <p>
                Don't have an account?{" "}
                <a href="#" onClick={() => setIsRegistering(true)}>
                  Signup here.
                </a>
              </p>
            )}
          </div>

          {/* Display status message */}
          {registerStatus && (
            <p className="text-center text-danger">{registerStatus}</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default Auth;
