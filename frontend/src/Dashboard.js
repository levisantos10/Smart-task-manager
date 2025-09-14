import React, { useEffect, useState } from "react";
import axios from "axios";

function Dashboard({ token, setToken }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:8000/protected", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessage(res.data.message))
      .catch(() => setMessage("Token inválido ou expirado."));
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", marginTop: 100 }}>
      <h2>Dashboard</h2>
      <p>{message}</p>
      <button onClick={handleLogout}>Sair</button>
    </div>
  );
}

export default Dashboard;