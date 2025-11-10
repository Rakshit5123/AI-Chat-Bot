import { MessageSquare, Plus, Settings, Trash2, Edit2, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "./theme-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import type { Session } from "@shared/schema";
import { MoreVertical } from "lucide-react";

interface AppSidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onExportSession: (sessionId: string) => void;
  onSettingsOpen: () => void;
}

export function AppSidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onExportSession,
  onSettingsOpen,
}: AppSidebarProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const handleRenameClick = (session: Session) => {
    setRenamingSessionId(session.id);
    setNewTitle(session.title);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = () => {
    if (renamingSessionId && newTitle.trim()) {
      onRenameSession(renamingSessionId, newTitle.trim());
      setRenameDialogOpen(false);
      setRenamingSessionId(null);
      setNewTitle("");
    }
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-semibold text-base">AI Chat</span>
            </div>
            <ThemeToggle />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <div className="px-3 py-2">
              <Button
                onClick={onNewChat}
                variant="default"
                className="w-full justify-start gap-2"
                data-testid="button-new-chat"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>

            <SidebarGroupLabel className="px-3">Recent Conversations</SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="h-[calc(100vh-240px)]">
                <SidebarMenu>
                  {sessions.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      No conversations yet
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <SidebarMenuItem key={session.id}>
                        <div className="group relative">
                          <SidebarMenuButton
                            onClick={() => onSessionSelect(session.id)}
                            isActive={session.id === activeSessionId}
                            className="w-full pr-10"
                            data-testid={`button-session-${session.id}`}
                          >
                            <div className="flex-1 overflow-hidden">
                              <div className="truncate text-sm font-medium">
                                {session.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(session.lastMessageAt), {
                                  addSuffix: true,
                                })}
                              </div>
                            </div>
                          </SidebarMenuButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`button-session-menu-${session.id}`}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleRenameClick(session)}
                                data-testid={`button-rename-session-${session.id}`}
                              >
                                <Edit2 className="h-3.5 w-3.5 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onExportSession(session.id)}
                                data-testid={`button-export-session-${session.id}`}
                              >
                                <Download className="h-3.5 w-3.5 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDeleteSession(session.id)}
                                className="text-destructive"
                                data-testid={`button-delete-session-${session.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-3">
          <Button
            variant="ghost"
            onClick={onSettingsOpen}
            className="w-full justify-start gap-2"
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent data-testid="dialog-rename-session">
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>
              Enter a new title for this conversation
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="session-title">Title</Label>
            <Input
              id="session-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameSubmit();
                }
              }}
              placeholder="Enter conversation title"
              className="mt-2"
              data-testid="input-session-title"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit} data-testid="button-confirm-rename">
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
