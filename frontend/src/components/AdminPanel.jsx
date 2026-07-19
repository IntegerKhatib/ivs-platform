import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "user" });

  const fetchUsers = async () => {
    const r = await fetch("/api/users", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
    const d = await r.json();
    if (d.success) setUsers(d.data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify(form)
    });
    setShowModal(false);
    setForm({ email: "", password: "", name: "", role: "user" });
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    fetchUsers();
  };

  return (
    <div style={{maxWidth: '800px', margin: '0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'24px'}}>
        <h2>User Management</h2>
        <button className="btn btn-primary" style={{width:'auto'}} onClick={() => setShowModal(true)}>+ Add User</button>
      </div>

      <table style={{width:'100%', borderCollapse:'collapse', background:'white', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
        <thead style={{background:'#f8fafc', textAlign:'left'}}>
          <tr>
            <th style={{padding:'12px 16px', fontSize:'12px', textTransform:'uppercase', color:'#64748b'}}>Name</th>
            <th style={{padding:'12px 16px', fontSize:'12px', textTransform:'uppercase', color:'#64748b'}}>Email</th>
            <th style={{padding:'12px 16px', fontSize:'12px', textTransform:'uppercase', color:'#64748b'}}>Role</th>
            <th style={{padding:'12px 16px', fontSize:'12px', textTransform:'uppercase', color:'#64748b'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{borderTop:'1px solid #f1f5f9'}}>
              <td style={{padding:'12px 16px'}}>{u.name}</td>
              <td style={{padding:'12px 16px', color:'#475569'}}>{u.email}</td>
              <td style={{padding:'12px 16px'}}><span className="status-badge active" style={{background: u.role==='admin' ? '#dbeafe' : '#dcfce7', color: u.role==='admin' ? '#1e40af' : '#166534'}}>{u.role}</span></td>
              <td style={{padding:'12px 16px'}}>
                {u.id !== user.id && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add New User</h3>
            <form onSubmit={handleCreate} style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <div className="form-group" style={{margin:0}}><label>Name</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required /></div>
              <div className="form-group" style={{margin:0}}><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required /></div>
              <div className="form-group" style={{margin:0}}><label>Password</label><input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required /></div>
              <div className="form-group" style={{margin:0}}>
                <label>Role</label>
                <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions" style={{justifyContent:'flex-end', gap:'8px', marginTop:'8px'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{width:'auto'}}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
