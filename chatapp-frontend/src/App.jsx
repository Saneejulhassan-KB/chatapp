import './App.css'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Auth from './pages/Auth';
import Chat from './pages/chat/Chat';


function App() {
  

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />}></Route>
        <Route path="/chat" element={<Chat />}></Route>
      </Routes>
    </Router>
  )
}

export default App
