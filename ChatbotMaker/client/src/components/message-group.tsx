import { memo } from "react";
import { User, Bot, Copy, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import type { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface MessageGroupProps {
  messages: Message[];
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export const MessageGroup = memo(function MessageGroup({
  messages,
  isStreaming = false,
  onRegenerate,
}: MessageGroupProps) {
  const { toast } = useToast();
  
  if (messages.length === 0) return null;

  const firstMessage = messages[0];
  const isUser = firstMessage.role === "user";

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      description: "Message copied to clipboard",
      duration: 2000,
    });
  };

  if (isUser) {
    return (
      <div className="mb-4">
        <div className="flex justify-end">
          <div className="flex items-start gap-3 max-w-[90%]">
            <div className="flex-1 space-y-2">
              {messages.map((message, index) => (
                <div key={message.id} className="group">
                  <div className="bg-primary text-primary-foreground rounded-2xl p-4">
                    <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                  {index === 0 && (
                    <div className="flex items-center justify-end gap-2 mt-1 px-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCopy(message.content)}
                        data-testid={`button-copy-${message.id}`}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex justify-start">
        <div className="flex items-start gap-3 w-full max-w-full">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            {messages.map((message, index) => (
              <div key={message.id} className="group">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                    {isStreaming && index === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-4 ml-1 bg-foreground animate-pulse" />
                    )}
                  </p>
                </div>
                {index === 0 && (
                  <div className="flex items-center gap-2 mt-1 px-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(message.content)}
                      data-testid={`button-copy-${message.id}`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {onRegenerate && index === messages.length - 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={onRegenerate}
                        data-testid={`button-regenerate-${message.id}`}
                      >
                        <RotateCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
