import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, MessageSquare, Users, ArrowRight, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWorkspace } from "@/lib/workspace";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { Workspace } from "@shared/schema";

const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters"),
});

type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
}

export function WorkspaceSelector({ workspaces }: WorkspaceSelectorProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { setCurrentWorkspace } = useWorkspace();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateWorkspaceInput) => {
      const response = await apiRequest("POST", "/api/workspaces", data);
      return response;
    },
    onSuccess: (workspace: Workspace) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setCurrentWorkspace(workspace);
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "Workspace created", description: `${workspace.name} is ready to use.` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create workspace", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: CreateWorkspaceInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">TeamSlack</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={logout} data-testid="button-logout">
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
            <p className="text-muted-foreground">
              Select a workspace to continue or create a new one
            </p>
          </div>

          {workspaces.length > 0 && (
            <div className="grid gap-4 mb-6">
              {workspaces.map((workspace) => (
                <Card
                  key={workspace.id}
                  className="cursor-pointer hover-elevate transition-all"
                  onClick={() => setCurrentWorkspace(workspace)}
                  data-testid={`card-workspace-${workspace.id}`}
                >
                  <CardHeader className="flex flex-row items-center gap-4 py-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{workspace.name}</CardTitle>
                      <CardDescription>
                        Created {new Date(workspace.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer border-dashed hover-elevate" data-testid="card-create-workspace">
                <CardContent className="flex items-center justify-center gap-3 py-8">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Create a new workspace</span>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create workspace</DialogTitle>
                <DialogDescription>
                  Give your workspace a name. You can always change it later.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. My Team"
                            data-testid="input-workspace-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-create-workspace"
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Create workspace"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
