import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

import initDB from "./src/db/init.js";

initDB()
  .then(async () => {
    const [auth, channels, users, recordings] = await Promise.all([
      import("./src/routes/auth.js"),
      import("./src/routes/channels.js"),
      import("./src/routes/users.js"),
      import("./src/routes/recordings.js"),
    ]);
    app.use("/api/auth", auth.default);
    app.use("/api/channels", channels.default);
    app.use("/api/users", users.default);
    app.use("/api/recordings", recordings.default);
    app.listen(process.env.PORT || 3001, () => console.log("Server running on port 3001"));
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
