import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { authRoutes } from "./routes/auth.js";
import { courseRoutes } from "./routes/courses.js";
import { lessonRoutes } from "./routes/lessons.js";
import { progressRoutes } from "./routes/progress.js";
import { worksheetRoutes } from "./routes/worksheets.js";
import { bingoRoutes } from "./routes/games-bingo.js";
import { wordSearchRoutes } from "./routes/games-word-search.js";
import { adminRoutes } from "./routes/admin.js";
import { scheduleRoutes } from "./routes/schedule.js";
import { documentRoutes } from "./routes/documents.js";
import { giaoVuRoutes } from "./routes/giaovu.js";
import { quizImportRoutes } from "./routes/quiz-import.js";
import { quizRoutes } from "./routes/quiz.js";

const app = Fastify({ logger: true, trustProxy: true });

// Set ALLOWED_ORIGINS in .env as a comma-separated list to override.
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://hanngusotam.com",
  "https://hanngusotam.com",
  "http://www.hanngusotam.com",
  "https://www.hanngusotam.com",
  "https://giaovu.hanngusotam.com",
  "http://localhost:5174",
];
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean))
  ?? DEFAULT_ORIGINS;

await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });

await app.register(cors, {
  origin: (origin, done) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return done(null, true);
    done(new Error(`CORS: origin ${origin} not allowed`), false);
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Session-Token"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

app.register(authRoutes, { prefix: "/auth" });
app.register(courseRoutes, { prefix: "/courses" });
app.register(lessonRoutes, { prefix: "/lessons" });
app.register(progressRoutes, { prefix: "/progress" });
app.register(worksheetRoutes, { prefix: "/worksheets" });
app.register(bingoRoutes, { prefix: "/games/bingo" });
app.register(wordSearchRoutes, { prefix: "/games/word-search" });
app.register(adminRoutes, { prefix: "/admin" });
app.register(quizImportRoutes, { prefix: "/admin/quiz" });
app.register(quizRoutes, { prefix: "/quiz" });
app.register(scheduleRoutes, { prefix: "/schedule" });
app.register(documentRoutes, { prefix: "/documents" });
app.register(giaoVuRoutes, { prefix: "/giaovu" });

app.get("/health", async () => ({ status: "ok", ts: Date.now() }));

const PORT = Number(process.env.PORT ?? 4000);
await app.listen({ port: PORT, host: "0.0.0.0" });
console.log(`API server listening on :${PORT}`);
