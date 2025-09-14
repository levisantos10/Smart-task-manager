import React, { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
  }, [token]);

  return token ? (
    <Dashboard token={token} setToken={setToken} />
  ) : (
    <Login setToken={setToken} />
  );
}

export default App;