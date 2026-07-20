import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading...</span>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}