import {
  type User,
  type InsertUser,
  type Workspace,
  type InsertWorkspace,
  type WorkspaceMember,
  type Channel,
  type InsertChannel,
  type Message,
  type InsertMessage,
  type DirectMessage,
  type InsertDirectMessage,
  users,
  workspaces,
  workspaceMembers,
  channels,
  messages,
  directMessages,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, or, like, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Workspace operations
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspacesByUserId(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace, ownerId: string): Promise<Workspace>;
  addWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember>;
  getWorkspaceMembers(workspaceId: string): Promise<User[]>;

  // Channel operations
  getChannel(id: string): Promise<Channel | undefined>;
  getChannelsByWorkspaceId(workspaceId: string): Promise<Channel[]>;
  createChannel(channel: InsertChannel, createdBy: string): Promise<Channel>;

  // Message operations
  getMessagesByChannelId(channelId: string): Promise<Array<Message & { user: User }>>;
  createMessage(message: InsertMessage, userId: string): Promise<Message>;

  // Direct message operations
  getDirectMessages(userId1: string, userId2: string): Promise<Array<DirectMessage & { sender: User; receiver: User }>>;
  createDirectMessage(dm: InsertDirectMessage, senderId: string): Promise<DirectMessage>;

  // Search
  searchMessages(workspaceId: string, query: string): Promise<Array<Message & { user: User; channel: Channel }>>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workspaces: Map<string, Workspace>;
  private workspaceMembers: Map<string, WorkspaceMember>;
  private channels: Map<string, Channel>;
  private messages: Map<string, Message>;
  private directMessages: Map<string, DirectMessage>;

  constructor() {
    this.users = new Map();
    this.workspaces = new Map();
    this.workspaceMembers = new Map();
    this.channels = new Map();
    this.messages = new Map();
    this.directMessages = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const avatarColors = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    
    const user: User = {
      ...insertUser,
      id,
      avatarColor,
      customStatus: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Workspace operations
  async getWorkspace(id: string): Promise<Workspace | undefined> {
    return this.workspaces.get(id);
  }

  async getWorkspacesByUserId(userId: string): Promise<Workspace[]> {
    const memberWorkspaceIds = Array.from(this.workspaceMembers.values())
      .filter((member) => member.userId === userId)
      .map((member) => member.workspaceId);

    return Array.from(this.workspaces.values()).filter((workspace) =>
      memberWorkspaceIds.includes(workspace.id) || workspace.ownerId === userId
    );
  }

  async createWorkspace(insertWorkspace: InsertWorkspace, ownerId: string): Promise<Workspace> {
    const id = randomUUID();
    const workspace: Workspace = {
      ...insertWorkspace,
      id,
      ownerId,
      createdAt: new Date(),
    };
    this.workspaces.set(id, workspace);

    // Add owner as member
    await this.addWorkspaceMember(id, ownerId);

    return workspace;
  }

  async addWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember> {
    const id = randomUUID();
    const member: WorkspaceMember = {
      id,
      workspaceId,
      userId,
      joinedAt: new Date(),
    };
    this.workspaceMembers.set(id, member);
    return member;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<User[]> {
    const memberUserIds = Array.from(this.workspaceMembers.values())
      .filter((member) => member.workspaceId === workspaceId)
      .map((member) => member.userId);

    return Array.from(this.users.values()).filter((user) =>
      memberUserIds.includes(user.id)
    );
  }

  // Channel operations
  async getChannel(id: string): Promise<Channel | undefined> {
    return this.channels.get(id);
  }

  async getChannelsByWorkspaceId(workspaceId: string): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter(
      (channel) => channel.workspaceId === workspaceId
    );
  }

  async createChannel(insertChannel: InsertChannel, createdBy: string): Promise<Channel> {
    const id = randomUUID();
    const channel: Channel = {
      ...insertChannel,
      id,
      createdBy,
      createdAt: new Date(),
    };
    this.channels.set(id, channel);
    return channel;
  }

  // Message operations
  async getMessagesByChannelId(channelId: string): Promise<Array<Message & { user: User }>> {
    const messages = Array.from(this.messages.values())
      .filter((message) => message.channelId === channelId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return messages.map((message) => ({
      ...message,
      user: this.users.get(message.userId)!,
    }));
  }

  async createMessage(insertMessage: InsertMessage, userId: string): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      userId,
      createdAt: new Date(),
      updatedAt: null,
    };
    this.messages.set(id, message);
    return message;
  }

  // Direct message operations
  async getDirectMessages(userId1: string, userId2: string): Promise<Array<DirectMessage & { sender: User; receiver: User }>> {
    const dms = Array.from(this.directMessages.values())
      .filter(
        (dm) =>
          (dm.senderId === userId1 && dm.receiverId === userId2) ||
          (dm.senderId === userId2 && dm.receiverId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return dms.map((dm) => ({
      ...dm,
      sender: this.users.get(dm.senderId)!,
      receiver: this.users.get(dm.receiverId)!,
    }));
  }

  async createDirectMessage(insertDm: InsertDirectMessage, senderId: string): Promise<DirectMessage> {
    const id = randomUUID();
    const dm: DirectMessage = {
      ...insertDm,
      id,
      senderId,
      createdAt: new Date(),
    };
    this.directMessages.set(id, dm);
    return dm;
  }

  // Search
  async searchMessages(workspaceId: string, query: string): Promise<Array<Message & { user: User; channel: Channel }>> {
    const workspaceChannels = await this.getChannelsByWorkspaceId(workspaceId);
    const channelIds = workspaceChannels.map((c) => c.id);

    const messages = Array.from(this.messages.values())
      .filter(
        (message) =>
          channelIds.includes(message.channelId) &&
          message.content.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);

    return messages.map((message) => ({
      ...message,
      user: this.users.get(message.userId)!,
      channel: this.channels.get(message.channelId)!,
    }));
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const avatarColors = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        avatarColor,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Workspace operations
  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace || undefined;
  }

  async getWorkspacesByUserId(userId: string): Promise<Workspace[]> {
    const memberWorkspaces = await db
      .select({ workspace: workspaces })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId));

    const ownedWorkspaces = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, userId));

    const allWorkspaces = [...memberWorkspaces.map(w => w.workspace), ...ownedWorkspaces];
    const uniqueWorkspaces = Array.from(
      new Map(allWorkspaces.map(w => [w.id, w])).values()
    );

    return uniqueWorkspaces;
  }

  async createWorkspace(insertWorkspace: InsertWorkspace, ownerId: string): Promise<Workspace> {
    return await db.transaction(async (tx) => {
      const [workspace] = await tx
        .insert(workspaces)
        .values({
          ...insertWorkspace,
          ownerId,
        })
        .returning();

      await tx
        .insert(workspaceMembers)
        .values({
          workspaceId: workspace.id,
          userId: ownerId,
        });

      return workspace;
    });
  }

  async addWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember> {
    const [member] = await db
      .insert(workspaceMembers)
      .values({
        workspaceId,
        userId,
      })
      .returning();
    return member;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<User[]> {
    const members = await db
      .select({ user: users })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    return members.map(m => m.user);
  }

  // Channel operations
  async getChannel(id: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel || undefined;
  }

  async getChannelsByWorkspaceId(workspaceId: string): Promise<Channel[]> {
    return await db
      .select()
      .from(channels)
      .where(eq(channels.workspaceId, workspaceId));
  }

  async createChannel(insertChannel: InsertChannel, createdBy: string): Promise<Channel> {
    const [channel] = await db
      .insert(channels)
      .values({
        ...insertChannel,
        createdBy,
      })
      .returning();
    return channel;
  }

  // Message operations
  async getMessagesByChannelId(channelId: string): Promise<Array<Message & { user: User }>> {
    const results = await db
      .select({
        message: messages,
        user: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.channelId, channelId))
      .orderBy(messages.createdAt);

    return results.map(r => ({ ...r.message, user: r.user }));
  }

  async createMessage(insertMessage: InsertMessage, userId: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        userId,
      })
      .returning();
    return message;
  }

  // Direct message operations
  async getDirectMessages(userId1: string, userId2: string): Promise<Array<DirectMessage & { sender: User; receiver: User }>> {
    const senderAlias = users;
    const receiverAlias = { ...users, name: 'receiver' } as typeof users;
    
    const results = await db
      .select({
        dm: directMessages,
        sender: senderAlias,
        receiver: receiverAlias,
      })
      .from(directMessages)
      .innerJoin(senderAlias, eq(directMessages.senderId, senderAlias.id))
      .innerJoin(receiverAlias, eq(directMessages.receiverId, receiverAlias.id))
      .where(
        or(
          and(eq(directMessages.senderId, userId1), eq(directMessages.receiverId, userId2)),
          and(eq(directMessages.senderId, userId2), eq(directMessages.receiverId, userId1))
        )
      )
      .orderBy(directMessages.createdAt);

    return results.map(r => ({ ...r.dm, sender: r.sender, receiver: r.receiver }));
  }

  async createDirectMessage(insertDm: InsertDirectMessage, senderId: string): Promise<DirectMessage> {
    const [dm] = await db
      .insert(directMessages)
      .values({
        ...insertDm,
        senderId,
      })
      .returning();
    return dm;
  }

  // Search
  async searchMessages(workspaceId: string, query: string): Promise<Array<Message & { user: User; channel: Channel }>> {
    const workspaceChannels = await this.getChannelsByWorkspaceId(workspaceId);
    const channelIds = workspaceChannels.map(c => c.id);

    if (channelIds.length === 0) {
      return [];
    }

    const results = await db
      .select({
        message: messages,
        user: users,
        channel: channels,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .innerJoin(channels, eq(messages.channelId, channels.id))
      .where(
        and(
          inArray(messages.channelId, channelIds),
          like(messages.content, `%${query}%`)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(50);

    return results.map(r => ({ ...r.message, user: r.user, channel: r.channel }));
  }
}

export const storage = new DatabaseStorage();
