import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkspaceSchema, type InsertWorkspace } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface CreateWorkspaceDialogProps {
  onSuccess: () => void;
}

export function CreateWorkspaceDialog({ onSuccess }: CreateWorkspaceDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertWorkspace>({
    resolver: zodResolver(insertWorkspaceSchema),
    defaultValues: {
      name: "",
    },
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: InsertWorkspace) => {
      return await apiRequest("POST", "/api/workspaces", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      toast({
        title: "Workspace created",
        description: "Your new workspace is ready to use.",
      });
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create workspace",
        description: error.message || "Something went wrong. Please try again.",
      });
    },
  });

  const onSubmit = (data: InsertWorkspace) => {
    createWorkspaceMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., My Company"
                  disabled={createWorkspaceMutation.isPending}
                  data-testid="input-workspace-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={createWorkspaceMutation.isPending}
            data-testid="button-create-workspace-submit"
          >
            {createWorkspaceMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Workspace"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
