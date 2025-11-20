import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDirectMessageSchema, type InsertDirectMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send } from "lucide-react";

interface DirectMessageInputProps {
  receiverId: string;
}

export function DirectMessageInput({ receiverId }: DirectMessageInputProps) {
  const { toast } = useToast();

  const form = useForm<InsertDirectMessage>({
    resolver: zodResolver(insertDirectMessageSchema),
    defaultValues: {
      receiverId,
      content: "",
    },
  });

  const sendDmMutation = useMutation({
    mutationFn: async (data: InsertDirectMessage) => {
      return await apiRequest("POST", "/api/dm", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm", receiverId] });
      form.reset({ receiverId, content: "" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error.message || "Something went wrong. Please try again.",
      });
    },
  });

  const onSubmit = (data: InsertDirectMessage) => {
    if (!data.content.trim()) return;
    sendDmMutation.mutate(data);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="border-t border-border p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Type a message..."
                    className="min-h-[60px] max-h-[200px] resize-none"
                    disabled={sendDmMutation.isPending}
                    onKeyDown={handleKeyDown}
                    data-testid="input-dm"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sendDmMutation.isPending || !form.watch("content")?.trim()}
            data-testid="button-send-dm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Form>
      <p className="text-xs text-muted-foreground mt-2">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}
