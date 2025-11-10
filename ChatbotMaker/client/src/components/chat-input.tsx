import { useState, useRef, KeyboardEvent } from "react";
import { Send, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStopStreaming?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  onStopStreaming,
  isStreaming = false,
  disabled = false,
  placeholder = "Type your message...",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setInput("");

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`;
  };

  return (
    <div className="border-t bg-background/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto p-6">
        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[56px] max-h-[144px] resize-none pr-12 text-base"
              rows={1}
              data-testid="input-message"
            />
            <div className="absolute right-2 bottom-2">
              {isStreaming ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={onStopStreaming}
                  className="h-9 w-9"
                  data-testid="button-stop-streaming"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  onClick={handleSubmit}
                  disabled={!input.trim() || disabled}
                  className="h-9 w-9"
                  data-testid="button-send"
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
        {input.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground text-right">
            {input.length} characters
          </div>
        )}
      </div>
    </div>
  );
}
