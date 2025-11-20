import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import type { Workspace } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkspaceSelectorProps {
  selectedWorkspaceId: string | null;
  onSelectWorkspace: (workspaceId: string) => void;
}

export function WorkspaceSelector({ selectedWorkspaceId, onSelectWorkspace }: WorkspaceSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
  });

  const getWorkspaceInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-sidebar border-r border-sidebar-border">
      <div className="space-y-2">
        {workspaces?.map((workspace) => (
          <Tooltip key={workspace.id}>
            <TooltipTrigger asChild>
              <Button
                variant={selectedWorkspaceId === workspace.id ? "default" : "ghost"}
                size="icon"
                className="h-12 w-12 rounded-lg"
                onClick={() => onSelectWorkspace(workspace.id)}
                data-testid={`button-workspace-${workspace.id}`}
              >
                <span className="font-semibold text-base">
                  {getWorkspaceInitials(workspace.name)}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{workspace.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-lg border-dashed"
                data-testid="button-create-workspace"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Create workspace</p>
          </TooltipContent>
        </Tooltip>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a workspace</DialogTitle>
            <DialogDescription>
              Workspaces are where your team communicates. Create one to get started.
            </DialogDescription>
          </DialogHeader>
          <CreateWorkspaceDialog onSuccess={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
