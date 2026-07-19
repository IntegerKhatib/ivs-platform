import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

import initDB from "./src/db/init.js";
initDB().then(() => {
  import("./src/routes/auth.js").then(m => app.use("/api/auth", m.default));
  import("./src/routes/channels.js").then(m => app.use("/api/channels", m.default));
  import("./src/routes/users.js").then(m => app.use("/api/users", m.default));
  app.listen(process.env.PORT || 3001, () => console.log("Server running on port 3001"));
}).catch(err => { console.error("Failed to start server:", err); process.exit(1); });
