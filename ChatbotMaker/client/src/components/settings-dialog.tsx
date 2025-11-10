import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: string;
  provider: string;
  systemPrompt: string;
  onModelChange: (model: string) => void;
  onProviderChange: (provider: string) => void;
  onSystemPromptChange: (prompt: string) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  model,
  provider,
  systemPrompt,
  onModelChange,
  onProviderChange,
  onSystemPromptChange,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-settings">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Chat Settings</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-settings"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Configure your AI chat preferences and behavior
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select value={provider} onValueChange={onProviderChange}>
              <SelectTrigger id="provider" data-testid="select-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cohere">Cohere</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={onModelChange}>
              <SelectTrigger id="model" data-testid="select-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="command-a-03-2025">Command A (Latest)</SelectItem>
                <SelectItem value="command-r7b-12-2024">Command R7B</SelectItem>
                <SelectItem value="command-r-plus-08-2024">Command R+ (Aug 2024)</SelectItem>
                <SelectItem value="command-r-08-2024">Command R (Aug 2024)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt (Optional)</Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              placeholder="You are a helpful assistant..."
              className="min-h-[120px]"
              data-testid="input-system-prompt"
            />
            <p className="text-xs text-muted-foreground">
              Define the AI's personality and behavior for this conversation
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
