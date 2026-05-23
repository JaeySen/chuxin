import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth.js";

const app = Fastify({ logger: true, trustProxy: true });

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://sotamhsk-demo.web.app",
  "https://sotamhsk.web.app",
];

await app.register(cors, {
  origin: (origin, done) => {
    // Allow requests with no origin (server-to-server, curl)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return done(null, true);
    done(new Error(`CORS: origin ${origin} not allowed`), false);
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Session-Token"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

// Routes
app.register(authRoutes, { prefix: "/auth" });

// Health check (used by Cloud Run / load balancer)
app.get("/health", async () => ({ status: "ok", ts: Date.now() }));

// Start
const PORT = Number(process.env.PORT ?? 4000);
await app.listen({ port: PORT, host: "0.0.0.0" });
console.log(`API server listening on :${PORT}`);
