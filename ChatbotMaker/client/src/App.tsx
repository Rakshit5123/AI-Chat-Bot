import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import ChatPage from "@/pages/chat";
import type { Session, Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/settings-dialog";

function ChatApp() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [model, setModel] = useState("command-r-08-2024");
  const [provider, setProvider] = useState("cohere");
  const [systemPrompt, setSystemPrompt] = useState("");
  const { toast } = useToast();

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const newSession = await apiRequest("POST", "/api/sessions", {
        title: "New Conversation",
        provider,
        model,
        systemPrompt: systemPrompt || undefined,
      });
      return newSession;
    },
    onSuccess: (newSession: Session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setActiveSessionId(newSession.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive",
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await apiRequest("DELETE", `/api/sessions/${sessionId}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      if (activeSessionId === deletedId) {
        setActiveSessionId(null);
      }
      toast({ description: "Conversation deleted" });
    },
  });

  const renameSessionMutation = useMutation({
    mutationFn: async ({ sessionId, newTitle }: { sessionId: string; newTitle: string }) => {
      await apiRequest("PATCH", `/api/sessions/${sessionId}`, { title: newTitle });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ description: "Conversation renamed" });
    },
  });

  const handleNewChat = () => {
    createSessionMutation.mutate();
  };

  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSessionMutation.mutate(sessionId);
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    renameSessionMutation.mutate({ sessionId, newTitle });
  };

  const handleExportSession = async (sessionId: string) => {
    try {
      const messages = await queryClient.fetchQuery<Message[]>({
        queryKey: [`/api/messages?sessionId=${sessionId}`],
      });
      const session = sessions.find((s) => s.id === sessionId);

      const exportData = {
        title: session?.title || "Conversation",
        createdAt: session?.createdAt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${session?.title || "conversation"}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ description: "Conversation exported" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export conversation",
        variant: "destructive",
      });
    }
  };

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onExportSession={handleExportSession}
          onSettingsOpen={() => setSettingsOpen(true)}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-2 border-b lg:hidden">
            <SidebarTrigger data-testid="button-sidebar-toggle">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
          </header>
          <main className="flex-1 overflow-hidden">
            <ChatPage
              sessionId={activeSessionId}
              model={model}
              provider={provider}
              systemPrompt={systemPrompt}
            />
          </main>
        </div>
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        model={model}
        provider={provider}
        systemPrompt={systemPrompt}
        onModelChange={setModel}
        onProviderChange={setProvider}
        onSystemPromptChange={setSystemPrompt}
      />
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <ChatApp />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
