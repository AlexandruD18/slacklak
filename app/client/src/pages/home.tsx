import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { WorkspaceSelector } from "@/components/workspace-selector";
import { ChannelSidebar } from "@/components/channel-sidebar";
import { MessageFeed } from "@/components/message-feed";
import { MessageInput } from "@/components/message-input";
import { DirectMessageFeed } from "@/components/direct-message-feed";
import { DirectMessageInput } from "@/components/direct-message-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Hash, LogOut, Users } from "lucide-react";
import type { Workspace, Channel, User } from "@shared/schema";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedDmUserId, setSelectedDmUserId] = useState<string | null>(null);

  const { data: workspaces } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: isAuthenticated,
  });

  const { data: channels } = useQuery<Channel[]>({
    queryKey: ["/api/channels", selectedWorkspaceId],
    enabled: !!selectedWorkspaceId,
  });

  const { data: dmUser } = useQuery<User>({
    queryKey: ["/api/users", selectedDmUserId],
    enabled: !!selectedDmUserId,
  });

  const selectedWorkspace = workspaces?.find(w => w.id === selectedWorkspaceId) || null;
  const selectedChannel = channels?.find(c => c.id === selectedChannelId) || null;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannelId && !selectedDmUserId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId, selectedDmUserId]);

  const handleSelectWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setSelectedChannelId(null);
    setSelectedDmUserId(null);
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    setSelectedDmUserId(null);
  };

  const handleSelectDm = (userId: string) => {
    setSelectedDmUserId(userId);
    setSelectedChannelId(null);
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Workspace Selector Sidebar */}
      <WorkspaceSelector
        selectedWorkspaceId={selectedWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
      />

      {/* Channel Sidebar */}
      <ChannelSidebar
        workspace={selectedWorkspace}
        selectedChannelId={selectedChannelId}
        selectedDmUserId={selectedDmUserId}
        onSelectChannel={handleSelectChannel}
        onSelectDm={handleSelectDm}
        currentUserId={user.id}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 border-b border-border px-4 flex items-center justify-between bg-background">
          <div className="flex items-center gap-2">
            {selectedChannel ? (
              <>
                <Hash className="h-5 w-5 text-muted-foreground" />
                <h1 className="font-semibold" data-testid="text-channel-name">
                  {selectedChannel.name}
                </h1>
                {selectedChannel.description && (
                  <>
                    <span className="text-muted-foreground">|</span>
                    <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
                  </>
                )}
              </>
            ) : selectedDmUserId && dmUser ? (
              <>
                <UserAvatar user={dmUser} size="sm" showOnline />
                <h1 className="font-semibold" data-testid="text-dm-name">
                  {dmUser.name}
                </h1>
              </>
            ) : (
              <h1 className="font-semibold text-muted-foreground">Select a channel or conversation</h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <UserAvatar user={user} size="md" />
          </div>
        </div>

        {/* Messages Area */}
        {selectedChannelId ? (
          <>
            <MessageFeed channelId={selectedChannelId} />
            <MessageInput channelId={selectedChannelId} />
          </>
        ) : selectedDmUserId ? (
          <>
            <DirectMessageFeed userId={selectedDmUserId} currentUserId={user.id} />
            <DirectMessageInput receiverId={selectedDmUserId} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">Welcome to {selectedWorkspace?.name || "Slacklak"}</h2>
              <p className="text-muted-foreground">Select a channel or start a direct message to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
