import { useState } from "react";
export default function CreateChannel({ onCreated }) {
  const [name, setName] = useState(""); 
  const [region, setRegion] = useState("us-east-1"); 
  const [tagsInput, setTagsInput] = useState(""); // New tags state
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreate = async (e) => {
    e.preventDefault(); 
    if(!name.trim()) return; 
    setIsCreating(true);
    try { 
      // Split tags by comma, filter out empty strings
      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      const r = await fetch("/api/channels", { 
        method: "POST", 
        headers:{"Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")}`}, 
        body: JSON.stringify({ name: name.trim(), region, tags }) 
      }); 
      const d = await r.json(); 
      if(d.success) { setName(""); setTagsInput(""); onCreated(d.data); } else alert(d.error); 
    } catch { alert("Network error"); } 
    finally { setIsCreating(false); }
  };

  return (
    <div className="create-channel-card">
      <h3>+ Create New Channel</h3>
      <form className="create-channel-form" onSubmit={handleCreate} style={{alignItems:'flex-end'}}>
        <div className="form-group" style={{flex:'2', minWidth:'200px'}}><label>Channel Name</label><input value={name} onChange={e => setName(e.target.value)} required disabled={isCreating} placeholder="My Live Stream" /></div>
        <div className="form-group region-select"><label>Region</label><select value={region} onChange={e => setRegion(e.target.value)} disabled={isCreating}><option value="us-east-1">US East</option><option value="us-west-2">US West</option><option value="eu-west-1">EU Ireland</option></select></div>
        <div className="form-group" style={{flex:'2', minWidth:'200px'}}><label>Tags (comma separated)</label><input value={tagsInput} onChange={e => setTagsInput(e.target.value)} disabled={isCreating} placeholder="sports, news, english" /></div>
        <button type="submit" className="btn btn-primary" disabled={isCreating || !name.trim()} style={{width:'auto', height:'42px', padding:'0 24px'}}>{isCreating ? "Creating..." : "Create"}</button>
      </form>
    </div>
  );
}
