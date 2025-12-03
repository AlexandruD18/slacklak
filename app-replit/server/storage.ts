import { 
  users, 
  workspaces, 
  workspaceMembers, 
  channels, 
  channelMembers, 
  messages, 
  directMessages,
  userPresence,
  type User, 
  type InsertUser,
  type Workspace,
  type InsertWorkspace,
  type WorkspaceMember,
  type InsertWorkspaceMember,
  type Channel,
  type InsertChannel,
  type ChannelMember,
  type InsertChannelMember,
  type Message,
  type InsertMessage,
  type DirectMessage,
  type InsertDirectMessage,
  type MessageWithSender,
  type DirectMessageWithUsers,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  // Workspaces
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspacesByUser(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  
  // Workspace Members
  getWorkspaceMembers(workspaceId: string): Promise<{ user: User }[]>;
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean>;
  
  // Channels
  getChannel(id: string): Promise<Channel | undefined>;
  getChannelsByWorkspace(workspaceId: string): Promise<Channel[]>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  
  // Channel Members
  addChannelMember(member: InsertChannelMember): Promise<ChannelMember>;
  isChannelMember(channelId: string, userId: string): Promise<boolean>;
  
  // Messages
  getMessages(channelId: string, limit?: number): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Direct Messages
  getDirectMessages(userId1: string, userId2: string, limit?: number): Promise<DirectMessageWithUsers[]>;
  createDirectMessage(message: InsertDirectMessage): Promise<DirectMessage>;
  
  // Presence
  updatePresence(userId: string, status: string): Promise<void>;
  getPresence(userId: string): Promise<{ status: string } | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Workspaces
  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace || undefined;
  }

  async getWorkspacesByUser(userId: string): Promise<Workspace[]> {
    const memberWorkspaces = await db
      .select({ workspace: workspaces })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId));
    return memberWorkspaces.map(m => m.workspace);
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const [workspace] = await db.insert(workspaces).values(insertWorkspace).returning();
    return workspace;
  }

  // Workspace Members
  async getWorkspaceMembers(workspaceId: string): Promise<{ user: User }[]> {
    const members = await db
      .select({ user: users })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    return members;
  }

  async addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const [workspaceMember] = await db.insert(workspaceMembers).values(member).returning();
    return workspaceMember;
  }

  async isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      ));
    return !!member;
  }

  // Channels
  async getChannel(id: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel || undefined;
  }

  async getChannelsByWorkspace(workspaceId: string): Promise<Channel[]> {
    return db
      .select()
      .from(channels)
      .where(eq(channels.workspaceId, workspaceId))
      .orderBy(asc(channels.createdAt));
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const [channel] = await db.insert(channels).values(insertChannel).returning();
    return channel;
  }

  // Channel Members
  async addChannelMember(member: InsertChannelMember): Promise<ChannelMember> {
    const [channelMember] = await db.insert(channelMembers).values(member).returning();
    return channelMember;
  }

  async isChannelMember(channelId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(channelMembers)
      .where(and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId)
      ));
    return !!member;
  }

  // Messages
  async getMessages(channelId: string, limit = 100): Promise<MessageWithSender[]> {
    const result = await db
      .select({
        id: messages.id,
        channelId: messages.channelId,
        senderId: messages.senderId,
        content: messages.content,
        createdAt: messages.createdAt,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.channelId, channelId))
      .orderBy(asc(messages.createdAt))
      .limit(limit);
    
    return result;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  // Direct Messages
  async getDirectMessages(userId1: string, userId2: string, limit = 100): Promise<DirectMessageWithUsers[]> {
    const result = await db
      .select()
      .from(directMessages)
      .where(
        or(
          and(
            eq(directMessages.senderId, userId1),
            eq(directMessages.receiverId, userId2)
          ),
          and(
            eq(directMessages.senderId, userId2),
            eq(directMessages.receiverId, userId1)
          )
        )
      )
      .orderBy(asc(directMessages.createdAt))
      .limit(limit);
    
    // Fetch users
    const userIds = new Set<string>();
    result.forEach(dm => {
      userIds.add(dm.senderId);
      userIds.add(dm.receiverId);
    });
    
    const usersList = await db.select().from(users).where(
      or(...Array.from(userIds).map(id => eq(users.id, id)))
    );
    
    const usersMap = new Map(usersList.map(u => [u.id, u]));
    
    return result.map(dm => ({
      ...dm,
      sender: usersMap.get(dm.senderId)!,
      receiver: usersMap.get(dm.receiverId)!,
    }));
  }

  async createDirectMessage(insertMessage: InsertDirectMessage): Promise<DirectMessage> {
    const [message] = await db.insert(directMessages).values(insertMessage).returning();
    return message;
  }

  // Presence
  async updatePresence(userId: string, status: string): Promise<void> {
    await db
      .insert(userPresence)
      .values({ userId, status, lastSeen: new Date() })
      .onConflictDoUpdate({
        target: userPresence.userId,
        set: { status, lastSeen: new Date() },
      });
    
    // Also update user status
    await db.update(users).set({ status }).where(eq(users.id, userId));
  }

  async getPresence(userId: string): Promise<{ status: string } | undefined> {
    const [presence] = await db
      .select({ status: userPresence.status })
      .from(userPresence)
      .where(eq(userPresence.userId, userId));
    return presence || undefined;
  }
}

export const storage = new DatabaseStorage();
