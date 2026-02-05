import express from "express";
import { resolveEvent } from "../controllers/eventsController";
import authMiddleware from "../middleware/auth";

const router = express.Router();

// PUT /api/events/:id/resolve
router.put("/:id/resolve", authMiddleware, resolveEvent);

// GET /api/events (with query params)
import { getEvents } from "../controllers/eventsController";
router.get("/", authMiddleware, getEvents);

export default router;
