import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth.js";
import { courseRoutes } from "./routes/courses.js";
import { lessonRoutes } from "./routes/lessons.js";
import { progressRoutes } from "./routes/progress.js";
import { worksheetRoutes } from "./routes/worksheets.js";

const app = Fastify({ logger: true, trustProxy: true });

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://sotamhsk-demo.web.app",
  "https://sotamhsk.web.app",
];

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

app.get("/health", async () => ({ status: "ok", ts: Date.now() }));

const PORT = Number(process.env.PORT ?? 4000);
await app.listen({ port: PORT, host: "0.0.0.0" });
console.log(`API server listening on :${PORT}`);
