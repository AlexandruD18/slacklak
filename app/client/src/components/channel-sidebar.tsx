import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hash, Plus, ChevronDown, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateChannelDialog } from "./create-channel-dialog";
import type { Channel, Workspace, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "./user-avatar";

interface ChannelSidebarProps {
  workspace: Workspace | null;
  selectedChannelId: string | null;
  selectedDmUserId: string | null;
  onSelectChannel: (channelId: string) => void;
  onSelectDm: (userId: string) => void;
  currentUserId: string;
}

export function ChannelSidebar({
  workspace,
  selectedChannelId,
  selectedDmUserId,
  onSelectChannel,
  onSelectDm,
  currentUserId,
}: ChannelSidebarProps) {
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);

  const { data: channels, isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels", workspace?.id],
    enabled: !!workspace,
  });

  const { data: members, isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/workspaces", workspace?.id, "members"],
    enabled: !!workspace,
  });

  const otherMembers = members?.filter(m => m.id !== currentUserId) || [];

  if (!workspace) {
    return (
      <div className="w-60 border-r border-border bg-background flex items-center justify-center p-4 text-center">
        <p className="text-sm text-muted-foreground">Select a workspace to get started</p>
      </div>
    );
  }

  return (
    <div className="w-60 border-r border-border bg-background flex flex-col">
      {/* Workspace Header */}
      <div className="h-12 border-b border-border px-4 flex items-center justify-between">
        <h2 className="font-semibold truncate text-sm" data-testid="text-workspace-name">
          {workspace.name}
        </h2>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="pl-9 h-9"
            data-testid="input-search"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 pb-3 space-y-4">
          {/* Channels Section */}
          <Collapsible open={channelsOpen} onOpenChange={setChannelsOpen}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-1 px-2 h-7">
                  <ChevronDown className={`h-3 w-3 transition-transform ${channelsOpen ? '' : '-rotate-90'}`} />
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Channels</span>
                </Button>
              </CollapsibleTrigger>
              <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-add-channel">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a channel</DialogTitle>
                    <DialogDescription>
                      Channels are where conversations happen around a topic.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateChannelDialog
                    workspaceId={workspace.id}
                    onSuccess={() => setShowCreateChannel(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <CollapsibleContent className="space-y-0.5 mt-1">
              {channelsLoading ? (
                <>
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-7 w-full" />
                </>
              ) : channels && channels.length > 0 ? (
                channels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant={selectedChannelId === channel.id ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2 px-3 h-7 font-normal"
                    onClick={() => onSelectChannel(channel.id)}
                    data-testid={`button-channel-${channel.id}`}
                  >
                    <Hash className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-sm">{channel.name}</span>
                  </Button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground px-3 py-2">No channels yet</p>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Direct Messages Section */}
          <Collapsible open={dmsOpen} onOpenChange={setDmsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-1 px-2 h-7">
                <ChevronDown className={`h-3 w-3 transition-transform ${dmsOpen ? '' : '-rotate-90'}`} />
                <span className="text-xs font-semibold uppercase text-muted-foreground">Direct Messages</span>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-0.5 mt-1">
              {membersLoading ? (
                <>
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-7 w-full" />
                </>
              ) : otherMembers.length > 0 ? (
                otherMembers.map((member) => (
                  <Button
                    key={member.id}
                    variant={selectedDmUserId === member.id ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2 px-3 h-7 font-normal"
                    onClick={() => onSelectDm(member.id)}
                    data-testid={`button-dm-${member.id}`}
                  >
                    <UserAvatar user={member} size="sm" showOnline />
                    <span className="truncate text-sm">{member.name}</span>
                  </Button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground px-3 py-2">No team members yet</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}
