import express from "express";
import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// 🔴 Connect using REDIS_URL from .env
const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

// Connect to Redis
await redisClient.connect();
console.log("Redis Connected");

// 🎟 Booking Endpoint
app.post("/book", async (req, res) => {
  const { seatId } = req.body;

  if (!seatId) {
    return res.status(400).json({ message: "Seat ID required" });
  }

  const lockKey = `lock:${seatId}`;
  const lockValue = uuidv4();

  // Try to acquire lock
  const lock = await redisClient.set(lockKey, lockValue, {
    NX: true,
    PX: 5000
  });

  if (!lock) {
    return res.status(409).json({
      message: "Seat is currently locked. Try again."
    });
  }

  try {
    // Simulate booking delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return res.json({
      message: `Seat ${seatId} booked successfully`
    });

  } finally {
    // Release lock safely
    const currentValue = await redisClient.get(lockKey);
    if (currentValue === lockValue) {
      await redisClient.del(lockKey);
    }
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});