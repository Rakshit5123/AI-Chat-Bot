import { MessageSquare, Sparkles, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onSuggestedPrompt: (prompt: string) => void;
}

const suggestedPrompts = [
  {
    icon: Sparkles,
    title: "Creative Writing",
    prompt: "Help me write a creative short story about time travel",
  },
  {
    icon: Brain,
    title: "Problem Solving",
    prompt: "Explain how neural networks work in simple terms",
  },
  {
    icon: Zap,
    title: "Quick Tips",
    prompt: "Give me 5 productivity tips for remote work",
  },
];

export function EmptyState({ onSuggestedPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center" data-testid="empty-state">
      <div className="mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Start a Conversation</h2>
        <p className="text-muted-foreground max-w-md">
          Ask me anything! I'm here to help with questions, creative tasks, problem-solving, and more.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground mb-4">Try these prompts:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestedPrompts.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => onSuggestedPrompt(item.prompt)}
              className="h-auto p-4 flex flex-col items-start gap-2 hover-elevate"
              data-testid={`button-suggested-prompt-${index}`}
            >
              <item.icon className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium text-sm mb-1">{item.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {item.prompt}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
