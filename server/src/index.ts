import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { matchesRouter } from "./routes/matches.js";
import { playersRouter } from "./routes/players.js";
import { contestsRouter } from "./routes/contests.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";

config();

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001");

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "zkfl-server" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/players", playersRouter);
app.use("/api/contests", contestsRouter);
app.use("/api/admin", adminRouter);

app.listen(PORT, () => {
  console.log(`ZKFL server running on http://localhost:${PORT}`);
});
