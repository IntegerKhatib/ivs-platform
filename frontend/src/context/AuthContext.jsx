import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) { localStorage.removeItem("token"); localStorage.removeItem("user"); }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => { 
    setError(null); 
    try { 
      const r = await api.post("/auth/login", {email, password}); 
      localStorage.setItem("token", r.data.data.token); 
      localStorage.setItem("user", JSON.stringify(r.data.data.user)); 
      setUser(r.data.data.user); 
      return {success:true}; 
    } catch(e) { 
      setError(e.response?.data?.error || "Login failed"); 
      return {success:false}; 
    } 
  };
  
  const logout = () => { 
    // FIX: Only remove login data, do NOT clear notifications!
    localStorage.removeItem("token"); 
    localStorage.removeItem("user"); 
    setUser(null); 
  };

  return <AuthContext.Provider value={{user,loading,error,login,logout}}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
