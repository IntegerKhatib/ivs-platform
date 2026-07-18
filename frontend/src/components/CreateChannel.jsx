import { useState } from "react";
export default function CreateChannel({ onCreated }) {
  const [name, setName] = useState(""); const [region, setRegion] = useState("us-east-1"); const [isCreating, setIsCreating] = useState(false);
  const handleCreate = async (e) => { e.preventDefault(); if(!name.trim()) return; setIsCreating(true);
    try { const r = await fetch("/api/channels", { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")}`}, body: JSON.stringify({name: name.trim(), region}) }); const d = await r.json(); if(d.success) { setName(""); onCreated(d.data); } else alert(d.error); } catch { alert("Network error"); } finally { setIsCreating(false); }
  };
  return (
    <div className="create-channel-card">
      <h3>+ Create New Channel</h3>
      <form className="create-channel-form" onSubmit={handleCreate}>
        <div className="form-group"><label>Name</label><input value={name} onChange={e => setName(e.target.value)} required disabled={isCreating} /></div>
        <div className="form-group region-select"><label>Region</label><select value={region} onChange={e => setRegion(e.target.value)} disabled={isCreating}><option value="us-east-1">US East</option><option value="us-west-2">US West</option><option value="eu-west-1">EU Ireland</option></select></div>
        <button type="submit" className="btn btn-primary" disabled={isCreating || !name.trim()} style={{width:'auto'}}>{isCreating ? "Creating..." : "Create"}</button>
      </form>
    </div>
  );
}
