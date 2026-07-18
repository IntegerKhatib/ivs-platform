import { useState } from "react";
import { useAuth } from "../context/AuthContext";
export default function Login() {
  const { login, error } = useAuth(); const [email, setEmail] = useState("admin@example.com"); const [password, setPassword] = useState("password123"); const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e) => { e.preventDefault(); setIsLoading(true); await login(email, password); setIsLoading(false); };
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo"><div className="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg></div><h1>IVS Platform</h1><p>Manage your live streams</p></div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} /></div>
          <div className="form-group"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} /></div>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? "Signing in..." : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}
