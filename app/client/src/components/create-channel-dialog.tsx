import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChannelSchema, type InsertChannel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface CreateChannelDialogProps {
  workspaceId: string;
  onSuccess: () => void;
}

export function CreateChannelDialog({ workspaceId, onSuccess }: CreateChannelDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertChannel>({
    resolver: zodResolver(insertChannelSchema),
    defaultValues: {
      workspaceId,
      name: "",
      description: "",
      isPrivate: false,
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: InsertChannel) => {
      return await apiRequest("POST", "/api/channels", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels", workspaceId] });
      toast({
        title: "Channel created",
        description: "Your new channel is ready to use.",
      });
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create channel",
        description: error.message || "Something went wrong. Please try again.",
      });
    },
  });

  const onSubmit = (data: InsertChannel) => {
    createChannelMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., general, marketing, dev-team"
                  disabled={createChannelMutation.isPending}
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
                <Textarea
                  {...field}
                  placeholder="What's this channel about?"
                  disabled={createChannelMutation.isPending}
                  value={field.value || ""}
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
                <FormLabel>Private Channel</FormLabel>
                <FormDescription className="text-xs">
                  Only invited members can see this channel
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={createChannelMutation.isPending}
                  data-testid="switch-private"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={createChannelMutation.isPending}
            data-testid="button-create-channel-submit"
          >
            {createChannelMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Channel"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
