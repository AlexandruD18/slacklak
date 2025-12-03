import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { 
  Hash, 
  Lock, 
  Plus, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight,
  Settings,
  LogOut,
  Users,
  Loader2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWorkspace } from "@/lib/workspace";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Channel, User } from "@shared/schema";

const createChannelSchema = z.object({
  name: z.string().min(2, "Channel name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
  isPrivate: z.boolean().default(false),
});

type CreateChannelInput = z.infer<typeof createChannelSchema>;

interface ChatSidebarProps {
  channels: Channel[];
  onChannelSelect: (channel: Channel) => void;
  onDMSelect: (user: User) => void;
  isCollapsed: boolean;
  selectedDMUser: User | null;
}

export function ChatSidebar({
  channels,
  onChannelSelect,
  onDMSelect,
  isCollapsed,
  selectedDMUser,
}: ChatSidebarProps) {
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const { currentWorkspace, currentChannel, setCurrentWorkspace, setCurrentChannel } = useWorkspace();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const { data: workspaceMembers } = useQuery<{ user: User }[]>({
    queryKey: ["/api/workspaces", currentWorkspace?.id, "members"],
    enabled: !!currentWorkspace,
  });

  const form = useForm<CreateChannelInput>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: { name: "", description: "", isPrivate: false },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: CreateChannelInput) => {
      const response = await apiRequest("POST", `/api/workspaces/${currentWorkspace?.id}/channels`, data);
      return response;
    },
    onSuccess: (channel: Channel) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", currentWorkspace?.id, "channels"] });
      setCreateChannelOpen(false);
      form.reset();
      onChannelSelect(channel);
      toast({ title: "Channel created", description: `#${channel.name} is ready to use.` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create channel", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: CreateChannelInput) => {
    createChannelMutation.mutate(data);
  };

  const handleLogout = () => {
    setCurrentWorkspace(null);
    setCurrentChannel(null);
    logout();
  };

  const otherMembers = workspaceMembers?.filter((m) => m.user.id !== user?.id) || [];

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 gap-4">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1" />
        <Avatar className="w-8 h-8">
          <AvatarImage src={user?.avatar || undefined} />
          <AvatarFallback className="text-xs">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 w-full hover-elevate rounded-md p-2 -m-2"
              data-testid="button-workspace-menu"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold truncate flex-1 text-left">
                {currentWorkspace?.name}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => setCurrentWorkspace(null)} data-testid="menu-item-switch-workspace">
              <Users className="w-4 h-4 mr-2" />
              Switch workspace
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-item-settings">
              <Settings className="w-4 h-4 mr-2" />
              Workspace settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} data-testid="menu-item-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          <Collapsible open={channelsOpen} onOpenChange={setChannelsOpen}>
            <div className="flex items-center gap-1 px-2 py-1">
              <CollapsibleTrigger asChild>
                <button className="hover-elevate rounded p-1 -m-1">
                  {channelsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </CollapsibleTrigger>
              <span className="text-sm font-medium text-sidebar-foreground/70 flex-1">
                Channels
              </span>
              <Dialog open={createChannelOpen} onOpenChange={setCreateChannelOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-6 h-6" data-testid="button-add-channel">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a channel</DialogTitle>
                    <DialogDescription>
                      Channels are where your team communicates. They're best when organized around a topic.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g. marketing"
                                data-testid="input-channel-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="What's this channel about?"
                                data-testid="input-channel-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isPrivate"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Make private</FormLabel>
                              <FormDescription className="text-xs">
                                Only specific members can access this channel
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-channel-private"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreateChannelOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createChannelMutation.isPending}
                          data-testid="button-create-channel"
                        >
                          {createChannelMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Create"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            <CollapsibleContent>
              <div className="space-y-0.5 mt-1">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => onChannelSelect(channel)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground/80 hover-elevate",
                      currentChannel?.id === channel.id && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                    data-testid={`button-channel-${channel.id}`}
                  >
                    {channel.isPrivate ? (
                      <Lock className="w-4 h-4 shrink-0" />
                    ) : (
                      <Hash className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
                {channels.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No channels yet
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={dmsOpen} onOpenChange={setDmsOpen} className="mt-4">
            <div className="flex items-center gap-1 px-2 py-1">
              <CollapsibleTrigger asChild>
                <button className="hover-elevate rounded p-1 -m-1">
                  {dmsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </CollapsibleTrigger>
              <span className="text-sm font-medium text-sidebar-foreground/70 flex-1">
                Direct Messages
              </span>
            </div>
            <CollapsibleContent>
              <div className="space-y-0.5 mt-1">
                {otherMembers.map(({ user: member }) => (
                  <button
                    key={member.id}
                    onClick={() => onDMSelect(member)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground/80 hover-elevate",
                      selectedDMUser?.id === member.id && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                    data-testid={`button-dm-${member.id}`}
                  >
                    <div className="relative">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {member.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-sidebar",
                          member.status === "online" ? "bg-status-online" : "bg-status-offline"
                        )}
                      />
                    </div>
                    <span className="truncate">{member.name}</span>
                  </button>
                ))}
                {otherMembers.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No team members yet
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover-elevate">
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sidebar",
                user?.status === "online" ? "bg-status-online" : "bg-status-offline"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.statusMessage || "Active"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
