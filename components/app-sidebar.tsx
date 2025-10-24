// components/sidebar/main-sidebar.tsx
"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  Search, 
  SquarePen, 
  AudioLines, 
  Image, 
  Star, 
  Menu, 
  UserCircle,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { ConversationItem } from "./conversation-item"
import { ContextMenu } from "./context-menu"
import { SearchModal } from "./search-modal"
import { useConversations } from "@/hooks/use-conversations"
import { useAuth } from "@/hooks/use-auth"

export function MainSidebar({ isOpen, onToggle }: { isOpen: boolean, onToggle: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { user } = useAuth()
  const { 
    conversations, 
    isLoading, 
    deleteConversation, 
    deleteAllConversations, 
    updateConversation, 
    toggleStarConversation 
  } = useConversations()
  
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null)
  const [renameInputValue, setRenameInputValue] = useState("")
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState<string | null>(null)
  const [modalMessage, setModalMessage] = useState("")
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const contextMenuProtected = useRef(false)
  
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
      
      if (a.starred && b.starred) {
        if (!a.starred_at) return 1;
        if (!b.starred_at) return -1;
        return new Date(b.starred_at).getTime() - new Date(a.starred_at).getTime();
      }
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [conversations]);
  
  const match = pathname.match(/^\/(?:chat|image)\/([^/]+)/);
  const currentConversationId = match ? match[1] : null;
  
  const handleNavigate = useCallback((conversation_id: string) => {
    const conv = conversations.find(c => c.conversation_id === conversation_id);
    if (!conv) {
      toast({
        title: "Error",
        description: "Conversation does not exist.",
        variant: "destructive"
      });
      return;
    }
    
    const targetPath = conv.type === 'image' ? `/image/${conversation_id}` : `/chat/${conversation_id}`;
    router.push(targetPath);
    onToggle();
  }, [conversations, router, onToggle, toast]);
  
  const toggleStar = useCallback(async (conversation_id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const conversation = conversations.find(c => c.conversation_id === conversation_id);
      if (!conversation) return;

      toggleStarConversation(conversation_id, !conversation.starred);
      
      // API call to toggle star
      const response = await fetch(`/api/conversations/${conversation_id}/star`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !conversation.starred })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle star');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle star.",
        variant: "destructive"
      });
      // Revert the change
      const conversation = conversations.find(c => c.conversation_id === conversation_id);
      if (conversation) {
        toggleStarConversation(conversation_id, conversation.starred);
      }
    }
  }, [conversations, toggleStarConversation, toast]);
  
  const handleTouchStart = useCallback((e: React.TouchEvent, conversation_id: string) => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    
    longPressTimer.current = setTimeout(() => {
      setSelectedConversationId(conversation_id);
      setContextMenu({
        visible: true,
        x: e.touches[0].pageX,
        y: e.touches[0].pageY,
      });
      
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      contextMenuProtected.current = true;
      setTimeout(() => {
        contextMenuProtected.current = false;
      }, 500);
    }, 500);
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent, conversation_id: string) => {
    if (contextMenu.visible) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      
      if (renamingConversationId !== conversation_id) {
        handleNavigate(conversation_id);
      }
    }
  }, [contextMenu.visible, renamingConversationId, handleNavigate]);
  
  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);
  
  const handleRename = useCallback(async (conversation_id: string, newAlias: string) => {
    try {
      updateConversation(conversation_id, newAlias);
      setRenamingConversationId(null);
      setRenameInputValue("");
      
      // API call to rename conversation
      const response = await fetch(`/api/conversations/${conversation_id}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: newAlias })
      });
      
      if (!response.ok) {
        throw new Error('Failed to rename conversation');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename conversation.",
        variant: "destructive"
      });
    }
  }, [updateConversation, toast]);
  
  const handleDelete = useCallback(async (conversation_id: string) => {
    try {
      deleteConversation(conversation_id);
      if (currentConversationId === conversation_id) {
        router.push("/");
      }
      
      // API call to delete conversation
      const response = await fetch(`/api/conversations/${conversation_id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive"
      });
    }
  }, [deleteConversation, currentConversationId, router, toast]);
  
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);
  
  const handleAdminClick = useCallback(() => {
    router.push("/admin");
  }, [router]);
  
  const handleDeleteAll = useCallback(() => {
    setModalMessage("Are you sure you want to delete all conversations?");
    setModalAction("deleteAll");
    setModalOpen(true);
  }, []);
  
  const handleLogoutClick = useCallback(() => {
    setModalMessage("Are you sure you want to logout?");
    setModalAction("logout");
    setModalOpen(true);
  }, []);
  
  const confirmModalAction = useCallback(async () => {
    if (modalAction === "deleteAll") {
      try {
        deleteAllConversations();
        router.push("/");
        
        // API call to delete all conversations
        const response = await fetch("/api/conversations/all", {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete conversations');
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete conversations.",
          variant: "destructive"
        });
      }
    } else if (modalAction === "logout") {
      try {
        // API call to logout
        const response = await fetch("/api/auth/logout", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (!response.ok) {
          throw new Error('Failed to logout');
        }
        
        router.push("/login");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to logout.",
          variant: "destructive"
        });
      }
    }
    setModalOpen(false);
    setModalAction(null);
  }, [modalAction, deleteAllConversations, router, toast]);
  
  const handleNewConversation = useCallback(() => {
    router.push("/");
    onToggle();
  }, [router, onToggle]);
  
  const handleRealtimeConversation = useCallback(() => {
    router.push("/realtime");
    onToggle();
  }, [router, onToggle]);
  
  const handleImageGeneration = useCallback(() => {
    router.push("/image");
    onToggle();
  }, [router, onToggle]);
  
  const handleConversationContextMenu = useCallback((e: React.MouseEvent, conversation_id: string) => {
    e.preventDefault();
    if (renamingConversationId !== null) return;
    
    setSelectedConversationId(conversation_id);
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
    });
  }, [renamingConversationId]);
  
  const handleCustomAction = useCallback((action: string) => {
    if (action === "star") {
      if (selectedConversationId) {
        toggleStar(selectedConversationId);
      }
    } else if (action === "rename") {
      if (selectedConversationId) {
        const conv = conversations.find(c => c.conversation_id === selectedConversationId);
        if (conv) {
          setRenameInputValue(conv.alias);
        }
        setRenamingConversationId(selectedConversationId);
      }
    } else if (action === "delete") {
      if (selectedConversationId) {
        handleDelete(selectedConversationId);
      }
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [selectedConversationId, conversations, toggleStar, handleDelete]);
  
  useEffect(() => {
    const handleClickOutsideContextMenu = () => {
      if (contextMenu.visible && !contextMenuProtected.current) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("click", handleClickOutsideContextMenu);
    return () => document.removeEventListener("click", handleClickOutsideContextMenu);
  }, [contextMenu.visible]);
  
  useEffect(() => {
    setIsSearchOpen(false);
  }, [isOpen]);
  
  return (
    <>
      <div className={cn(
        "flex flex-col h-full bg-background border-r transition-all duration-300",
        isOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AI</span>
            </div>
            <span className="font-bold">AI Chat</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-2 space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2" 
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2" 
            onClick={handleNewConversation}
          >
            <SquarePen className="h-4 w-4" />
            New Chat
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2" 
            onClick={handleRealtimeConversation}
          >
            <AudioLines className="h-4 w-4" />
            Realtime Chat
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2" 
            onClick={handleImageGeneration}
          >
            <Image className="h-4 w-4" />
            Image Generation
          </Button>
        </div>
        
        <Separator />
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2">
              <h3 className="text-sm font-medium mb-2 px-2">Chat History</h3>
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {sortedConversations.length > 0 ? (
                    sortedConversations.map((conv) => (
                      <ConversationItem
                        key={conv.conversation_id}
                        conv={conv}
                        currentConversationId={currentConversationId}
                        renamingConversationId={renamingConversationId}
                        renameInputValue={renameInputValue}
                        setRenameInputValue={setRenameInputValue}
                        handleRename={handleRename}
                        setRenamingConversationId={setRenamingConversationId}
                        handleNavigate={handleNavigate}
                        handleConversationContextMenu={handleConversationContextMenu}
                        handleTouchStart={handleTouchStart}
                        handleTouchEnd={handleTouchEnd}
                        handleTouchMove={handleTouchMove}
                        toggleStar={toggleStar}
                      />
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      {conversations.length === 0 ? "No conversations yet." : "No search results."}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        <Separator />
        
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>
                    <UserCircle className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{user?.name || "User"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-between p-2">
                <span className="text-sm font-medium">Billing</span>
                <span className="text-sm">${user?.billing?.toFixed(2) || "0.00"}</span>
              </div>
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Refresh</span>
              </DropdownMenuItem>
              {user?.admin && (
                <DropdownMenuItem onClick={handleAdminClick}>
                  <span>User Management</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDeleteAll}>
                <span>Delete All Conversations</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogoutClick} className="text-red-600">
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        conversations={sortedConversations}
        onSelectConversation={handleNavigate}
      />
      
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        selectedConversationId={selectedConversationId}
        conversations={conversations}
        onAction={handleCustomAction}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
      />
      
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation</DialogTitle>
            <DialogDescription>
              {modalMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmModalAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
