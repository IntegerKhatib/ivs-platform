import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import CreateChannel from "./CreateChannel";
import ChannelList from "./ChannelList";
export default function Dashboard() {
  const { user, logout } = useAuth(); const [newChannel, setNewChannel] = useState(null);
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo"><div className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg></div>IVS Platform</div>
        <div className="user-menu"><div className="user-info"><div className="name">{user?.name}</div><div className="email">{user?.email}</div></div><button className="btn btn-secondary btn-sm" onClick={logout}>Logout</button></div>
      </header>
      <main className="dashboard-content"><h2 style={{marginBottom:'24px'}}>Channels</h2><CreateChannel onCreated={ch => setNewChannel(ch)} /><ChannelList newChannel={newChannel} /></main>
    </div>
  );
}
