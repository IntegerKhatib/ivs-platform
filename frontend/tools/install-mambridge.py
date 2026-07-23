#!/usr/bin/env python3
"""Install the MAM Bridge frontend update into the current frontend folder."""
from pathlib import Path
import re
import shutil
import sys

root = Path.cwd()
dashboard = root / "src/components/Dashboard.jsx"
package_root = Path(__file__).resolve().parents[1]

if not dashboard.exists():
    sys.exit("ERROR: Run this script from the frontend folder. Dashboard.jsx was not found.")

# Copy update files.
for relative in [
    Path("src/components/MAMBridge.jsx"),
    Path("src/api/assets.js"),
    Path("src/styles/mambridge.css"),
]:
    source = package_root / relative
    target = root / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    print(f"Copied {relative}")

backup = dashboard.with_suffix(".jsx.mambridge-backup")
if not backup.exists():
    shutil.copy2(dashboard, backup)
    print(f"Backup created: {backup}")

text = dashboard.read_text(encoding="utf-8")
original = text

# Add component import.
import_line = 'import MAMBridge from "./MAMBridge";'
if import_line not in text:
    import_anchor = 'import LiveChannelList from "./LiveChannelList";'
    if import_anchor in text:
        text = text.replace(import_anchor, import_anchor + "\n" + import_line, 1)
    else:
        # Place after the last local component import.
        matches = list(re.finditer(r'^import .* from "\./[^\n]+";\s*$', text, re.M))
        if matches:
            pos = matches[-1].end()
            text = text[:pos] + "\n" + import_line + text[pos:]
        else:
            text = import_line + "\n" + text

# The current EMP dashboard already has the /mambridge route and menu but uses
# a placeholder component. Replace the one-line placeholder return with MAMBridge.
lines = text.splitlines()
replaced_placeholder = False
for index, line in enumerate(lines):
    if "This module is reserved for future media asset management features" in line:
        indent = re.match(r"\s*", line).group(0)
        lines[index] = indent + "return <MAMBridge />;"
        replaced_placeholder = True
text = "\n".join(lines) + ("\n" if original.endswith("\n") else "")

# Fallback render replacements for common dashboard implementations.
replacements = [
    (r'(case\s+[\"\']mam[\"\']\s*:\s*return\s*)<[^;]+>;?', r'\1<MAMBridge />;'),
    (r'(mam\s*:\s*)<\w*(?:MAM|Mam)\w*\s*/>', r'\1<MAMBridge />'),
    (r'(activeTab\s*===\s*[\"\']mam[\"\']\s*&&\s*)<\w*(?:MAM|Mam)\w*\s*/>', r'\1<MAMBridge />'),
]
for pattern, replacement in replacements:
    text = re.sub(pattern, replacement, text)

# Older Dashboard variant: add a complete tab only when no mam navigation exists.
if not re.search(r'[\"\']mam(?:bridge)?[\"\']', text):
    # Icon import.
    if "UploadCloud" not in text:
        text = re.sub(r'(from\s+[\"\']lucide-react[\"\'];)', lambda m: m.group(1), text)
        # Insert into a named lucide import block.
        text = re.sub(r'import\s*\{([^}]+)\}\s*from\s*[\"\']lucide-react[\"\'];',
                      lambda m: 'import {' + m.group(1).rstrip() + ', UploadCloud } from "lucide-react";', text, count=1)
    # Nav array.
    nav_match = re.search(r'(const\s+navItems\s*=\s*\[)(.*?)(\];)', text, re.S)
    if nav_match:
        body = nav_match.group(2)
        item = '\n    { id: "mambridge", label: "MAM Bridge", icon: UploadCloud },'
        text = text[:nav_match.start(2)] + body + item + text[nav_match.end(2):]
    # Heading and content for activeTab dashboard style.
    text = text.replace("{activeTab === 'live' && 'Live Channels'}",
                        "{activeTab === 'live' && 'Live Channels'}\n          {activeTab === 'mambridge' && 'MAM Bridge'}", 1)
    text = text.replace("{activeTab === 'live' && <LiveChannelList />}",
                        "{activeTab === 'live' && <LiveChannelList />}\n        {activeTab === 'mambridge' && <MAMBridge />}", 1)

# Remove accidental duplicate imports from prior patch attempts.
seen = False
cleaned = []
for line in text.splitlines():
    if line.strip() == import_line:
        if seen:
            continue
        seen = True
    cleaned.append(line)
text = "\n".join(cleaned) + "\n"

dashboard.write_text(text, encoding="utf-8")

print("Dashboard integration complete.")
if replaced_placeholder:
    print("Replaced the existing EMP MAMBridge placeholder.")
else:
    print("No exact placeholder text was found; fallback integration rules were applied.")
print("Next: from the repository root run: docker compose build --no-cache frontend && docker compose up -d frontend")
