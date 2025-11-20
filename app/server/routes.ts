import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import {
  insertUserSchema,
  loginSchema,
  insertWorkspaceSchema,
  insertChannelSchema,
  insertMessageSchema,
  insertDirectMessageSchema,
} from "@shared/schema";
import { z } from "zod";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const SALT_ROUNDS = 10;

// Extended Request type with user
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// JWT Middleware
const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
    };
    req.user = { id: decoded.userId, email: decoded.email, name: decoded.name };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// WebSocket connections
const userConnections = new Map<string, Set<WebSocket>>();
const channelSubscriptions = new Map<string, Set<WebSocket>>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket Server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req) => {
    let userId: string | null = null;

    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;

        if (!userConnections.has(userId)) {
          userConnections.set(userId, new Set());
        }
        userConnections.get(userId)!.add(ws);

        console.log(`WebSocket connected: ${userId}`);
        broadcastPresenceUpdate();
      } catch (error) {
        console.error("WebSocket auth error:", error);
        ws.close();
        return;
      }
    }

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.event) {
          case "typing:start":
            if (message.data.channelId && userId) {
              const user = await storage.getUser(userId);
              broadcastToChannel(message.data.channelId, {
                event: "typing:start",
                data: { channelId: message.data.channelId, userName: user?.name },
              });
            }
            break;

          case "typing:stop":
            if (message.data.channelId && userId) {
              const user = await storage.getUser(userId);
              broadcastToChannel(message.data.channelId, {
                event: "typing:stop",
                data: { channelId: message.data.channelId, userName: user?.name },
              });
            }
            break;

          case "channel:subscribe":
            if (message.data.channelId) {
              if (!channelSubscriptions.has(message.data.channelId)) {
                channelSubscriptions.set(message.data.channelId, new Set());
              }
              channelSubscriptions.get(message.data.channelId)!.add(ws);
            }
            break;

          case "channel:unsubscribe":
            if (
              message.data.channelId &&
              channelSubscriptions.has(message.data.channelId)
            ) {
              channelSubscriptions.get(message.data.channelId)!.delete(ws);
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      if (userId) {
        const connections = userConnections.get(userId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            userConnections.delete(userId);
          }
        }
        console.log(`WebSocket disconnected: ${userId}`);
        broadcastPresenceUpdate();
      }

      channelSubscriptions.forEach((subs) => subs.delete(ws));
    });
  });

  // Broadcast helpers
  function broadcastPresenceUpdate() {
    const onlineUserIds = Array.from(userConnections.keys());
    const message = JSON.stringify({
      event: "presence:update",
      data: { onlineUserIds },
    });

    userConnections.forEach((connections) => {
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    });
  }

  function broadcastToChannel(channelId: string, data: any) {
    const subscribers = channelSubscriptions.get(channelId);
    if (subscribers) {
      const message = JSON.stringify(data);
      subscribers.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  function broadcastToUser(userId: string, data: any) {
    const connections = userConnections.get(userId);
    if (connections) {
      const message = JSON.stringify(data);
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  // Auth Routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(data.password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Workspace Routes
  app.get(
    "/api/workspaces",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const workspaces = await storage.getWorkspacesByUserId(req.user!.id);
        res.json(workspaces);
      } catch (error) {
        console.error("Get workspaces error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/workspaces",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const data = insertWorkspaceSchema.parse(req.body);
        const workspace = await storage.createWorkspace(data, req.user!.id);
        res.json(workspace);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation error", errors: error.errors });
        }
        console.error("Create workspace error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.get(
    "/api/workspaces/:workspaceId/members",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const members = await storage.getWorkspaceMembers(
          req.params.workspaceId
        );
        res.json(members);
      } catch (error) {
        console.error("Get workspace members error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Channel Routes
  app.get(
    "/api/channels/:workspaceId",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const channels = await storage.getChannelsByWorkspaceId(
          req.params.workspaceId
        );
        res.json(channels);
      } catch (error) {
        console.error("Get channels error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/channels",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const data = insertChannelSchema.parse(req.body);
        const channel = await storage.createChannel(data, req.user!.id);
        res.json(channel);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation error", errors: error.errors });
        }
        console.error("Create channel error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Message Routes
  app.get(
    "/api/messages/:channelId",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const messages = await storage.getMessagesByChannelId(
          req.params.channelId
        );
        res.json(messages);
      } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/messages",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const data = insertMessageSchema.parse(req.body);
        const message = await storage.createMessage(data, req.user!.id);

        const user = await storage.getUser(req.user!.id);

        broadcastToChannel(data.channelId, {
          event: "message:new",
          data: { ...message, user, channelId: data.channelId },
        });

        res.json(message);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation error", errors: error.errors });
        }
        console.error("Create message error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Direct Message Routes
  app.get(
    "/api/dm/:userId",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const directMessages = await storage.getDirectMessages(
          req.user!.id,
          req.params.userId
        );
        res.json(directMessages);
      } catch (error) {
        console.error("Get direct messages error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/dm",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const data = insertDirectMessageSchema.parse(req.body);
        const dm = await storage.createDirectMessage(data, req.user!.id);

        const sender = await storage.getUser(req.user!.id);
        const receiver = await storage.getUser(data.receiverId);

        broadcastToUser(data.receiverId, {
          event: "dm:new",
          data: {
            ...dm,
            sender,
            receiver,
            senderId: req.user!.id,
            receiverId: data.receiverId,
          },
        });

        res.json(dm);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation error", errors: error.errors });
        }
        console.error("Create direct message error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Search Routes
  app.get(
    "/api/search",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const { q, workspaceId } = req.query;

        if (
          !q ||
          !workspaceId ||
          typeof q !== "string" ||
          typeof workspaceId !== "string"
        ) {
          return res
            .status(400)
            .json({ message: "Query and workspaceId are required" });
        }

        const results = await storage.searchMessages(workspaceId, q);
        res.json(results);
      } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // User Profile Routes
  app.patch(
    "/api/profile",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const { name, customStatus } = req.body;
        const user = await storage.updateUser(req.user!.id, {
          name,
          customStatus,
        });
        res.json({ ...user, password: undefined });
      } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get user by ID (for DM user info)
  app.get(
    "/api/users/:userId",
    authenticateJWT,
    async (req: AuthRequest, res: Response) => {
      try {
        const user = await storage.getUser(req.params.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.json({ ...user, password: undefined });
      } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  return httpServer;
}
