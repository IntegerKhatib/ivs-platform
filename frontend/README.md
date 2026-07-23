# EMP MAM Bridge frontend update

This package replaces the existing **EMP MAMBridge placeholder** with the new asset-upload page.

## Installation on EC2

Upload and extract this folder anywhere on the EC2 instance. Then run:

```bash
cd /home/ec2-user/ivs-platform/frontend
python3 /PATH/TO/mambridge-complete-update/tools/install-mambridge.py

cd /home/ec2-user/ivs-platform
docker compose build --no-cache frontend
docker compose up -d frontend
```

Open `/mambridge` and perform a hard refresh (`Ctrl+F5`).

## Included files

- `src/components/MAMBridge.jsx`
- `src/api/assets.js`
- `src/styles/mambridge.css`
- `tools/install-mambridge.py`

The installer creates this backup before modifying the dashboard:

```text
frontend/src/components/Dashboard.jsx.mambridge-backup
```

## Backend APIs expected by the page

```text
POST   /api/assets/uploads/initiate
POST   /api/assets/uploads/:assetId/parts
POST   /api/assets/uploads/:assetId/complete
DELETE /api/assets/uploads/:assetId
```

The page itself and navigation will load without these APIs, but an upload will fail until the backend endpoints are implemented.
