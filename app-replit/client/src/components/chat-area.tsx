import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Channel, MessageWithSender } from "@shared/schema";

interface ChatAreaProps {
  channel: Channel;
}

export function ChatArea({ channel }: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { user } = useAuth();
  const { sendMessage: sendSocketMessage, subscribe } = useSocket();

  const { data: messages, isLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/channels", channel.id, "messages"],
    enabled: !!channel,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/channels/${channel.id}/messages`, { content });
      return response;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/channels", channel.id, "messages"] });
    },
  });

  useEffect(() => {
    const unsubscribeMessage = subscribe("message:new", (payload) => {
      if (payload.channelId === channel.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/channels", channel.id, "messages"] });
      }
    });

    const unsubscribeTypingStart = subscribe("typing:start", (payload) => {
      if (payload.channelId === channel.id && payload.userId !== user?.id) {
        setTypingUsers((prev) => [...new Set([...prev, payload.userName])]);
      }
    });

    const unsubscribeTypingStop = subscribe("typing:stop", (payload) => {
      if (payload.channelId === channel.id) {
        setTypingUsers((prev) => prev.filter((name) => name !== payload.userName));
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
    };
  }, [channel.id, subscribe, user?.id]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendSocketMessage("typing:start", { channelId: channel.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendSocketMessage("typing:stop", { channelId: channel.id });
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    sendSocketMessage("typing:stop", { channelId: channel.id });

    sendMutation.mutate(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatMessageDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const groupMessagesByDate = (messages: MessageWithSender[]) => {
    const groups: { date: string; messages: MessageWithSender[] }[] = [];
    let currentDate = "";

    messages.forEach((msg) => {
      const msgDate = formatMessageDate(new Date(msg.createdAt));
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const messageGroups = messages ? groupMessagesByDate(messages) : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="p-4 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full max-w-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages?.length === 0 ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">#</span>
                </div>
                <h3 className="text-lg font-semibold mb-1">Welcome to #{channel.name}</h3>
                <p className="text-muted-foreground text-sm">
                  This is the start of the channel. Send a message to get the conversation going!
                </p>
              </div>
            </div>
          ) : (
            messageGroups.map((group) => (
              <div key={group.date}>
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 border-t" />
                  <span className="text-xs text-muted-foreground font-medium px-2">
                    {group.date}
                  </span>
                  <div className="flex-1 border-t" />
                </div>
                <div className="space-y-1">
                  {group.messages.map((msg, index) => {
                    const prevMsg = group.messages[index - 1];
                    const isSameUser = prevMsg?.senderId === msg.senderId;
                    const timeDiff = prevMsg
                      ? new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()
                      : Infinity;
                    const isConsecutive = isSameUser && timeDiff < 5 * 60 * 1000;

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "group flex gap-3 hover-elevate rounded-md p-2 -mx-2",
                          isConsecutive && "pt-0.5"
                        )}
                        data-testid={`message-${msg.id}`}
                      >
                        {isConsecutive ? (
                          <div className="w-9 shrink-0">
                            <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              {format(new Date(msg.createdAt), "HH:mm")}
                            </span>
                          </div>
                        ) : (
                          <Avatar className="w-9 h-9 shrink-0">
                            <AvatarImage src={msg.sender?.avatar || undefined} />
                            <AvatarFallback>
                              {msg.sender?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1 min-w-0">
                          {!isConsecutive && (
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className="font-semibold text-sm">
                                {msg.sender?.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(msg.createdAt), "h:mm a")}
                              </span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-t bg-background">
        {typingUsers.length > 0 && (
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <span className="animate-pulse">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.slice(0, -1).join(", ")} and ${typingUsers.slice(-1)} are typing...`}
            </span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channel.name}`}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
            data-testid="input-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMutation.isPending}
            data-testid="button-send"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
