import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Session, Message } from "@shared/schema";
import { MessageGroup } from "@/components/message-group";
import { ChatInput } from "@/components/chat-input";
import { TypingIndicator } from "@/components/typing-indicator";
import { EmptyState } from "@/components/empty-state";
import { MessageSkeleton } from "@/components/message-skeleton";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatPageProps {
  sessionId: string | null;
  model: string;
  provider: string;
  systemPrompt: string;
}

export default function ChatPage({ sessionId, model, provider, systemPrompt }: ChatPageProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages?sessionId=${sessionId}`],
    enabled: !!sessionId,
  });

  const groupedMessages = useMemo(() => {
    const groups: Message[][] = [];
    let currentGroup: Message[] = [];
    let currentRole: string | null = null;

    for (const message of messages) {
      if (message.role !== currentRole) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [message];
        currentRole = message.role;
      } else {
        currentGroup.push(message);
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!sessionId) throw new Error("No session selected");

      abortControllerRef.current = new AbortController();
      setIsStreaming(true);
      setStreamingMessage("");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content, model, provider, systemPrompt }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to send message");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setIsStreaming(false);
                await queryClient.invalidateQueries({ queryKey: [`/api/messages?sessionId=${sessionId}`] });
                await queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullMessage += parsed.content;
                  setStreamingMessage(fullMessage);
                  scrollToBottom();
                }
              } catch (e) {
                console.error("Failed to parse SSE data:", e);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Stream aborted by user");
        } else {
          throw error;
        }
      } finally {
        setIsStreaming(false);
        setStreamingMessage("");
      }
    },
    onError: (error: Error) => {
      setIsStreaming(false);
      setStreamingMessage("");
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const clearMessagesMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) return;
      await apiRequest("DELETE", `/api/sessions/${sessionId}/messages`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages?sessionId=${sessionId}`] });
      toast({ description: "Conversation cleared" });
      setClearDialogOpen(false);
    },
  });

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  if (!sessionId) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center">
          <EmptyState onSuggestedPrompt={handleSendMessage} />
        </div>
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
          disabled={true}
          placeholder="Create a new chat to get started..."
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen">
        <header className="border-b px-6 py-4 flex items-center justify-between bg-background">
          <h1 className="text-lg font-semibold">Chat Assistant</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            data-testid="button-clear-chat"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        </header>

        <ScrollArea
          className="flex-1"
          onScrollCapture={handleScroll}
          ref={scrollAreaRef}
        >
          <div className="max-w-3xl mx-auto px-6 py-8">
            {isLoading ? (
              <MessageSkeleton />
            ) : messages.length === 0 && !isStreaming ? (
              <EmptyState onSuggestedPrompt={handleSendMessage} />
            ) : (
              <>
                {groupedMessages.map((group, index) => (
                  <MessageGroup
                    key={`group-${group[0].id}`}
                    messages={group}
                  />
                ))}
                {isStreaming && streamingMessage && (
                  <MessageGroup
                    messages={[{
                      id: "streaming",
                      sessionId,
                      role: "assistant",
                      content: streamingMessage,
                      createdAt: new Date(),
                      tokenCount: null,
                    }]}
                    isStreaming={true}
                  />
                )}
                {isStreaming && !streamingMessage && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {showScrollButton && (
          <div className="absolute bottom-24 right-8">
            <Button
              size="icon"
              onClick={scrollToBottom}
              className="rounded-full shadow-lg"
              data-testid="button-scroll-bottom"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
          disabled={isLoading}
        />
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages in this conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearMessagesMutation.mutate()}
              data-testid="button-confirm-clear"
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
