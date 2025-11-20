import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@shared/schema";

interface UserAvatarProps {
  user: Pick<User, "name" | "avatarColor"> | null;
  size?: "sm" | "md" | "lg";
  showOnline?: boolean;
  isOnline?: boolean;
}

export function UserAvatar({ user, size = "md", showOnline = false, isOnline = false }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      <Avatar className={sizeClasses[size]} data-testid="avatar-user">
        <AvatarFallback
          style={{ backgroundColor: user?.avatarColor || "#8B5CF6" }}
          className="text-white font-semibold"
        >
          {user ? getInitials(user.name) : "?"}
        </AvatarFallback>
      </Avatar>
      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-background ${
            isOnline ? "bg-status-online" : "bg-status-offline"
          }`}
          data-testid="indicator-online"
        />
      )}
    </div>
  );
}
