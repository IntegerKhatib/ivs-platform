#!/usr/bin/env python3
from pathlib import Path

path = Path("src/components/Dashboard.jsx")
text = path.read_text(encoding="utf-8")

if 'import MAMBridge from "./MAMBridge";' not in text:
    anchor = 'import LiveChannelList from "./LiveChannelList";'
    text = text.replace(anchor, anchor + '\nimport MAMBridge from "./MAMBridge";')

if "UploadCloud" not in text:
    text = text.replace("Trash2, ChevronDown, X", "Trash2, ChevronDown, X, UploadCloud")

nav_anchor = '{ id: "live", label: "Live Now", icon: Radio },'
if 'id: "mambridge"' not in text:
    text = text.replace(nav_anchor, nav_anchor + '\n    { id: "mambridge", label: "MAM Bridge", icon: UploadCloud },')

header_anchor = "{activeTab === 'live' && 'Live Channels'}"
if "activeTab === 'mambridge'" not in text:
    text = text.replace(header_anchor, header_anchor + "\n          {activeTab === 'mambridge' && 'MAM Bridge'}")

content_anchor = "{activeTab === 'live' && <LiveChannelList />}"
if "<MAMBridge" not in text:
    replacement = content_anchor + "\n        {activeTab === 'mambridge' && <MAMBridge onUploaded={(asset) => addNotification(`Asset \\\"${asset.assetName || asset.assetId}\\\" uploaded.`, 'create')} />}"
    text = text.replace(content_anchor, replacement)

path.write_text(text, encoding="utf-8")
print(f"Patched {path}")
