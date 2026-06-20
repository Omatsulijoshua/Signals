import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { initIO } from "./config/socket";
import authRoutes from "./modules/auth/auth.controller";
import signalRoutes from "./modules/signals/signals.controller";
import paymentRoutes from "./modules/payments/payments.controller";
import adminRoutes from "./modules/admin/admin.controller";
import { startTrackingEngine } from "./modules/tracker/tracker.service";
import prisma from "./config/db";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize WebSockets
initIO(httpServer);

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/signals", signalRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

// Simple Health Check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Confirm database connection
    await prisma.$connect();
    console.log("📂 Database connected successfully.");

    // Start Real-Time Price/Signal Tracking Engine
    startTrackingEngine();

    httpServer.listen(PORT, () => {
      console.log(`📡 Signals Pro API Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start the server:", error);
    process.exit(1);
  }
}

bootstrap();
