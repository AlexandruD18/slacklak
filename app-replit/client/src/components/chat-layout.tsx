import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatArea } from "@/components/chat-area";
import { DirectMessageArea } from "@/components/direct-message-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Channel, User } from "@shared/schema";

export function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDMUser, setSelectedDMUser] = useState<User | null>(null);
  const { currentWorkspace, currentChannel, setCurrentChannel } = useWorkspace();

  const { data: channels } = useQuery<Channel[]>({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "channels"],
    enabled: !!currentWorkspace,
  });

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    setSelectedDMUser(null);
    setMobileMenuOpen(false);
  };

  const handleDMSelect = (user: User) => {
    setSelectedDMUser(user);
    setCurrentChannel(null);
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside
        className={cn(
          "fixed lg:relative z-50 h-full bg-sidebar border-r transition-all duration-200",
          sidebarOpen ? "w-64" : "w-0 lg:w-16",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <ChatSidebar
          channels={channels || []}
          onChannelSelect={handleChannelSelect}
          onDMSelect={handleDMSelect}
          isCollapsed={!sidebarOpen}
          selectedDMUser={selectedDMUser}
        />
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-4 bg-background shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="button-toggle-sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="font-semibold truncate" data-testid="text-channel-name">
              {selectedDMUser
                ? `Direct message with ${selectedDMUser.name}`
                : currentChannel
                ? `# ${currentChannel.name}`
                : "Select a channel"}
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {selectedDMUser ? (
            <DirectMessageArea user={selectedDMUser} />
          ) : currentChannel ? (
            <ChatArea channel={currentChannel} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Menu className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No channel selected</h2>
                <p className="text-muted-foreground">
                  Select a channel from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
