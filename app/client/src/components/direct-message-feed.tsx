import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "./user-avatar";
import type { DirectMessage, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface DirectMessageWithUsers extends DirectMessage {
  sender: User;
  receiver: User;
}

interface DirectMessageFeedProps {
  userId: string;
  currentUserId: string;
}

export function DirectMessageFeed({ userId, currentUserId }: DirectMessageFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<DirectMessageWithUsers[]>({
    queryKey: ["/api/dm", userId],
    enabled: !!userId,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground">Start a conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="p-4 space-y-4">
        {messages.map((message) => {
          const isSender = message.senderId === currentUserId;
          const displayUser = isSender ? message.sender : message.sender;

          return (
            <div key={message.id} className="flex gap-3 hover-elevate rounded-md p-2 -mx-2" data-testid={`dm-${message.id}`}>
              <UserAvatar user={displayUser} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm" data-testid="text-dm-author">
                    {displayUser.name}
                  </span>
                  <span className="text-xs text-muted-foreground" data-testid="text-dm-time">
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mt-1 break-words" data-testid="text-dm-content">
                  {message.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
