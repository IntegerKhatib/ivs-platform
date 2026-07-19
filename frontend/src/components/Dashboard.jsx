import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import CreateChannel from "./CreateChannel";
import ChannelList from "./ChannelList";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [newChannel, setNewChannel] = useState(null);
  
  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const addNotification = (message, type = "success") => {
    const id = Date.now();
    setNotifications((prev) => [
      { id, message, type, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  const handleChannelCreated = (ch) => {
    setNewChannel(ch);
    addNotification(`Channel "${ch.name}" created successfully!`, "create");
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo">
          <div className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
          </div>
          IVS Platform
        </div>

        <div className="user-menu">
          {/* Notification Bell */}
          <div className="notification-wrapper">
            <button 
              className="notification-btn" 
              onClick={() => setShowNotifMenu(!showNotifMenu)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>

            {showNotifMenu && (
              <div className="notification-dropdown">
                <div className="notification-header">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="notification-item empty">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="notification-item">
                      <div className="notif-icon">
                        {n.type === "create" ? "✅" : "🗑️"}
                      </div>
                      <div className="notif-content">
                        <span>{n.message}</span>
                        <small>{n.time}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="email">{user?.email}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <h2 style={{marginBottom:'24px'}}>Channels</h2>
        <CreateChannel onCreated={handleChannelCreated} />
        <ChannelList newChannel={newChannel} addNotification={addNotification} />
      </main>
    </div>
  );
}
