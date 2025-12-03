import { createContext, useContext, useState, type ReactNode } from "react";
import type { Workspace, Channel } from "@shared/schema";

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  currentChannel: Channel | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentChannel: (channel: Channel | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

  return (
    <WorkspaceContext.Provider 
      value={{ 
        currentWorkspace, 
        currentChannel, 
        setCurrentWorkspace, 
        setCurrentChannel 
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
