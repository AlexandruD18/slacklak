import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { loginSchema, registerSchema } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "slack-clone-secret-key";

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; name: string };
}

// JWT middleware
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// WebSocket connections by user ID
const wsConnections = new Map<string, Set<WebSocket>>();
// Track user workspaces for targeted broadcasts
const userWorkspaces = new Map<string, Set<string>>();

function broadcastToUser(userId: string, type: string, payload: any) {
  const connections = wsConnections.get(userId);
  if (connections) {
    const message = JSON.stringify({ type, payload });
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

async function broadcastToWorkspaceMembers(workspaceId: string, type: string, payload: any, excludeUserId?: string) {
  const members = await storage.getWorkspaceMembers(workspaceId);
  const message = JSON.stringify({ type, payload });
  
  members.forEach(({ user }) => {
    if (user.id !== excludeUserId) {
      const connections = wsConnections.get(user.id);
      if (connections) {
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    }
  });
}

async function broadcastToChannelMembers(channelId: string, type: string, payload: any, excludeUserId?: string) {
  // Get channel to find workspace, then get workspace members
  const channel = await storage.getChannel(channelId);
  if (!channel) return;
  
  const members = await storage.getWorkspaceMembers(channel.workspaceId);
  const message = JSON.stringify({ type, payload });
  
  members.forEach(({ user }) => {
    if (user.id !== excludeUserId) {
      const connections = wsConnections.get(user.id);
      if (connections) {
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(1008, "No token provided");
      return;
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      userId = decoded.id;
    } catch (error) {
      ws.close(1008, "Invalid token");
      return;
    }

    // Add connection
    if (!wsConnections.has(userId)) {
      wsConnections.set(userId, new Set());
    }
    wsConnections.get(userId)!.add(ws);

    // Update presence to online
    await storage.updatePresence(userId, "online");
    const user = await storage.getUser(userId);

    // Get user's workspaces and notify members
    const workspaces = await storage.getWorkspacesByUser(userId);
    const workspaceIds = new Set(workspaces.map(w => w.id));
    userWorkspaces.set(userId, workspaceIds);

    // Notify workspace members that user is online
    for (const workspace of workspaces) {
      await broadcastToWorkspaceMembers(workspace.id, "presence:update", {
        userId,
        userName: user?.name,
        status: "online",
      }, userId);
    }

    ws.on("message", async (data) => {
      try {
        const { type, payload } = JSON.parse(data.toString());
        
        switch (type) {
          case "typing:start":
            if (payload.channelId) {
              // Verify user has access to this channel's workspace
              const channel = await storage.getChannel(payload.channelId);
              if (channel) {
                const isMember = await storage.isWorkspaceMember(channel.workspaceId, userId);
                if (isMember) {
                  await broadcastToChannelMembers(payload.channelId, "typing:start", {
                    channelId: payload.channelId,
                    userId,
                    userName: user?.name,
                  }, userId);
                }
              }
            }
            break;
          
          case "typing:stop":
            if (payload.channelId) {
              const channel = await storage.getChannel(payload.channelId);
              if (channel) {
                const isMember = await storage.isWorkspaceMember(channel.workspaceId, userId);
                if (isMember) {
                  await broadcastToChannelMembers(payload.channelId, "typing:stop", {
                    channelId: payload.channelId,
                    userId,
                    userName: user?.name,
                  }, userId);
                }
              }
            }
            break;
          
          case "dm:typing:start":
            broadcastToUser(payload.receiverId, "dm:typing:start", {
              senderId: userId,
              receiverId: payload.receiverId,
              senderName: user?.name,
            });
            break;
          
          case "dm:typing:stop":
            broadcastToUser(payload.receiverId, "dm:typing:stop", {
              senderId: userId,
              receiverId: payload.receiverId,
            });
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", async () => {
      const connections = wsConnections.get(userId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          wsConnections.delete(userId);
          // Update presence to offline
          await storage.updatePresence(userId, "offline");
          
          // Notify workspace members
          const userWs = userWorkspaces.get(userId);
          if (userWs) {
            for (const workspaceId of userWs) {
              await broadcastToWorkspaceMembers(workspaceId, "presence:update", {
                userId,
                userName: user?.name,
                status: "offline",
              }, userId);
            }
            userWorkspaces.delete(userId);
          }
        }
      }
    });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hash(data.password, 10);
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        name: data.name,
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const { password, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const { password, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Workspace routes
  app.get("/api/workspaces", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const workspaces = await storage.getWorkspacesByUser(req.user!.id);
      res.json(workspaces);
    } catch (error) {
      console.error("Get workspaces error:", error);
      res.status(500).json({ message: "Failed to get workspaces" });
    }
  });

  app.post("/api/workspaces", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.length < 2) {
        return res.status(400).json({ message: "Workspace name must be at least 2 characters" });
      }

      const workspace = await storage.createWorkspace({
        name,
        ownerId: req.user!.id,
      });

      // Add creator as member
      await storage.addWorkspaceMember({
        workspaceId: workspace.id,
        userId: req.user!.id,
        role: "owner",
      });

      // Create a default general channel
      const generalChannel = await storage.createChannel({
        workspaceId: workspace.id,
        name: "general",
        description: "This is the general channel for team discussions",
        isPrivate: false,
        createdById: req.user!.id,
      });

      // Add creator as channel member
      await storage.addChannelMember({
        channelId: generalChannel.id,
        userId: req.user!.id,
      });

      res.status(201).json(workspace);
    } catch (error) {
      console.error("Create workspace error:", error);
      res.status(500).json({ message: "Failed to create workspace" });
    }
  });

  app.get("/api/workspaces/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const workspace = await storage.getWorkspace(req.params.id);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      // Check membership
      const isMember = await storage.isWorkspaceMember(workspace.id, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this workspace" });
      }

      res.json(workspace);
    } catch (error) {
      console.error("Get workspace error:", error);
      res.status(500).json({ message: "Failed to get workspace" });
    }
  });

  app.get("/api/workspaces/:id/members", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Check membership
      const isMember = await storage.isWorkspaceMember(req.params.id, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this workspace" });
      }

      const members = await storage.getWorkspaceMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Get workspace members error:", error);
      res.status(500).json({ message: "Failed to get workspace members" });
    }
  });

  // Channel routes
  app.get("/api/workspaces/:workspaceId/channels", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Check workspace membership
      const isMember = await storage.isWorkspaceMember(req.params.workspaceId, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this workspace" });
      }

      const channels = await storage.getChannelsByWorkspace(req.params.workspaceId);
      res.json(channels);
    } catch (error) {
      console.error("Get channels error:", error);
      res.status(500).json({ message: "Failed to get channels" });
    }
  });

  app.post("/api/workspaces/:workspaceId/channels", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Check workspace membership
      const isMember = await storage.isWorkspaceMember(req.params.workspaceId, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this workspace" });
      }

      const { name, description, isPrivate } = req.body;
      if (!name || typeof name !== "string" || name.length < 2) {
        return res.status(400).json({ message: "Channel name must be at least 2 characters" });
      }

      const channel = await storage.createChannel({
        workspaceId: req.params.workspaceId,
        name: name.toLowerCase().replace(/\s+/g, "-"),
        description: description || null,
        isPrivate: isPrivate || false,
        createdById: req.user!.id,
      });

      // Add creator as member
      await storage.addChannelMember({
        channelId: channel.id,
        userId: req.user!.id,
      });

      res.status(201).json(channel);
    } catch (error) {
      console.error("Create channel error:", error);
      res.status(500).json({ message: "Failed to create channel" });
    }
  });

  // Message routes
  app.get("/api/channels/:channelId/messages", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const channel = await storage.getChannel(req.params.channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // Check workspace membership
      const isMember = await storage.isWorkspaceMember(channel.workspaceId, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this workspace" });
      }

      const messages = await storage.getMessages(req.params.channelId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/channels/:channelId/messages", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const channel = await storage.getChannel(req.params.channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // Check workspace membership
      const isMember = await storage.isWorkspaceMember(channel.workspaceId, req.user!.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this workspace" });
      }

      const { content } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const message = await storage.createMessage({
        channelId: req.params.channelId,
        senderId: req.user!.id,
        content: content.trim(),
      });

      const user = await storage.getUser(req.user!.id);

      // Broadcast to workspace members only
      await broadcastToChannelMembers(req.params.channelId, "message:new", {
        ...message,
        channelId: req.params.channelId,
        sender: user,
      }, req.user!.id);

      res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Direct message routes
  app.get("/api/dm/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Verify the other user exists
      const otherUser = await storage.getUser(req.params.userId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const messages = await storage.getDirectMessages(req.user!.id, req.params.userId);
      res.json(messages);
    } catch (error) {
      console.error("Get DMs error:", error);
      res.status(500).json({ message: "Failed to get direct messages" });
    }
  });

  app.post("/api/dm/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const receiver = await storage.getUser(req.params.userId);
      if (!receiver) {
        return res.status(404).json({ message: "User not found" });
      }

      const { content } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const message = await storage.createDirectMessage({
        senderId: req.user!.id,
        receiverId: req.params.userId,
        content: content.trim(),
      });

      const sender = await storage.getUser(req.user!.id);

      // Notify receiver only
      broadcastToUser(req.params.userId, "dm:new", {
        ...message,
        sender,
        receiver,
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Create DM error:", error);
      res.status(500).json({ message: "Failed to send direct message" });
    }
  });

  // User profile routes
  app.patch("/api/users/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { name, avatar, statusMessage } = req.body;
      
      const updateData: any = {};
      if (name) updateData.name = name;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (statusMessage !== undefined) updateData.statusMessage = statusMessage;

      const user = await storage.updateUser(req.user!.id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  return httpServer;
}
