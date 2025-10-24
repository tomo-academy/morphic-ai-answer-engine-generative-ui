"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, Suspense } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { IconLogo } from "./ui/icons"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AudioLines, Edit, Image, Menu, Plus, RefreshCw, Search, SquarePen, Star, Trash, UserCircle } from "lucide-react"

// Types
interface Conversation {
  conversation_id: string
  alias: string
  created_at: string
  updated_at: string
  starred: boolean
  starred_at?: string
  type: "chat" | "image"
  isLoading?: boolean
}

interface User {
  id: string
  name: string
  email: string
  billing: number
  admin: boolean
}

// Toast notification component (inline replacement for use-toast)
function Toast({ title, description, variant, isVisible, onClose }: {
  title: string
  description?: string
  variant?: "default" | "destructive"
  isVisible: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 max-w-sm",
      variant === "destructive" ? "bg-destructive text-destructive-foreground" : "bg-background border"
    )}>
      <div className="font-semibold">{title}</div>
      {description && <div className="text-sm mt-1">{description}</div>}
    </div>
  );
}

// Contexts
const ConversationsContext = createContext<{
  conversations: Conversation[]
  isLoading: boolean
  deleteConversation: (id: string) => void
  deleteAllConversations: () => void
  updateConversation: (id: string, alias: string) => void
  toggleStarConversation: (id: string, starred: boolean) => void
  refreshConversations: () => Promise<void>
} | undefined>(undefined);

const AuthContext = createContext<{
  user: User | null
  isLoading: boolean
  refreshUser: () => Promise<void>
} | undefined>(undefined);

// Providers
function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const refreshConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refreshConversations();
  }, []);
  
  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.conversation_id !== id));
  };
  
  const deleteAllConversations = () => {
    setConversations([]);
  };
  
  const updateConversation = (id: string, alias: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.conversation_id === id ? { ...conv, alias } : conv
      )
    );
  };
  
  const toggleStarConversation = (id: string, starred: boolean) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.conversation_id === id 
          ? { ...conv, starred, starred_at: starred ? new Date().toISOString() : undefined } 
          : conv
      )
    );
  };
  
  return (
    <ConversationsContext.Provider value={{
      conversations,
      isLoading,
      deleteConversation,
      deleteAllConversations,
      updateConversation,
      toggleStarConversation,
      refreshConversations
    }}>
      {children}
    </ConversationsContext.Provider>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refreshUser();
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hooks
function useConversations() {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error("useConversations must be used within a ConversationsProvider");
  }
  return context;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Inline Components
function ConversationItem({
  conv,
  currentConversationId,
  renamingConversationId,
  renameInputValue,
  setRenameInputValue,
  handleRename,
  setRenamingConversationId,
  handleNavigate,
  handleConversationContextMenu,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  toggleStar
}: {
  conv: Conversation
  currentConversationId: string | null
  renamingConversationId: string | null
  renameInputValue: string
  setRenameInputValue: (value: string) => void
  handleRename: (id: string, value: string) => void
  setRenamingConversationId: (id: string | null) => void
  handleNavigate: (id: string) => void
  handleConversationContextMenu: (e: React.MouseEvent, id: string) => void
  handleTouchStart: (e: React.TouchEvent, id: string) => void
  handleTouchEnd: (e: React.TouchEvent, id: string) => void
  handleTouchMove: (e: React.TouchEvent) => void
  toggleStar: (id: string, e?: React.MouseEvent) => void
}) {
  const isRenaming = renamingConversationId === conv.conversation_id;
  const isActive = currentConversationId === conv.conversation_id;
  
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-md cursor-pointer group",
        isActive && "bg-accent",
        "hover:bg-accent/50 transition-colors"
      )}
      onClick={() => !isRenaming && handleNavigate(conv.conversation_id)}
      onContextMenu={(e) => handleConversationContextMenu(e, conv.conversation_id)}
      onTouchStart={(e) => handleTouchStart(e, conv.conversation_id)}
      onTouchEnd={(e) => handleTouchEnd(e, conv.conversation_id)}
      onTouchMove={handleTouchMove}
    >
      {isRenaming ? (
        <Input
          value={renameInputValue}
          onChange={(e) => setRenameInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleRename(conv.conversation_id, renameInputValue);
            } else if (e.key === "Escape") {
              setRenamingConversationId(null);
              setRenameInputValue("");
            }
          }}
          onBlur={() => {
            if (renameInputValue.trim()) {
              handleRename(conv.conversation_id, renameInputValue);
            } else {
              setRenamingConversationId(null);
              setRenameInputValue("");
            }
          }}
          autoFocus
          className="h-8"
        />
      ) : (
        <>
          <div className="flex-1 truncate">
            {conv.isLoading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              <span className="truncate">{conv.alias}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
              conv.starred && "opacity-100 text-yellow-500"
            )}
            onClick={(e) => toggleStar(conv.conversation_id, e)}
          >
            <Star className={cn("h-4 w-4", conv.starred && "fill-current")} />
          </Button>
        </>
      )}
    </div>
  );
}

function ContextMenu({
  visible,
  x,
  y,
  selectedConversationId,
  conversations,
  onAction,
  onClose
}: {
  visible: boolean
  x: number
  y: number
  selectedConversationId: string | null
  conversations: Conversation[]
  onAction: (action: string) => void
  onClose: () => void
}) {
  useEffect(() => {
    if (visible) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [visible, onClose]);
  
  if (!visible || !selectedConversationId) return null;
  
  const conversation = conversations.find(c => c.conversation_id === selectedConversationId);
  if (!conversation) return null;
  
  return (
    <div
      className={cn(
        "fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95"
      )}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="grid gap-1">
        <button
          className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          onClick={() => onAction("star")}
        >
          <Star className="mr-2 h-4 w-4" />
          <span>{conversation.starred ? "Unstar" : "Star"}</span>
        </button>
        <button
          className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          onClick={() => onAction("rename")}
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </button>
        <button
          className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-red-600"
          onClick={() => onAction("delete")}
        >
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

function SearchModal({
  isOpen,
  onClose,
  conversations,
  onSelectConversation
}: {
  isOpen: boolean
  onClose: () => void
  conversations: Conversation[]
  onSelectConversation: (id: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.alias.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);
  
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Conversations</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>
        </div>
        <div className="h-[300px] mt-4 overflow-y-auto">
          <div className="space-y-1">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv.conversation_id}
                  className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent/50"
                  onClick={() => {
                    onSelectConversation(conv.conversation_id);
                    onClose();
                  }}
                >
                  <div className="flex-1 truncate">
                    <span className="truncate">{conv.alias}</span>
                  </div>
                  {conv.starred && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground p-4">
                No conversations found.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Sidebar Component
function MainSidebarContent() {
  const router = useRouter()
  const pathname = usePathname()
  const [toast, setToast] = useState<{
    title: string
    description?: string
    variant?: "default" | "destructive"
    isVisible: boolean
  }>({
    title: "",
    isVisible: false
  });
  
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
  
  const showToast = useCallback((title: string, description?: string, variant?: "default" | "destructive") => {
    setToast({
      title,
      description,
      variant,
      isVisible: true
    });
  }, []);
  
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
      showToast("Error", "Conversation does not exist.", "destructive");
      return;
    }
    
    const targetPath = conv.type === 'image' ? `/image/${conversation_id}` : `/chat/${conversation_id}`;
    router.push(targetPath);
  }, [conversations, router, showToast]);
  
  const toggleStar = useCallback(async (conversation_id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const conversation = conversations.find(c => c.conversation_id === conversation_id);
      if (!conversation) return;

      toggleStarConversation(conversation_id, !conversation.starred);
      
      const response = await fetch(`/api/conversations/${conversation_id}/star`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !conversation.starred })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle star');
      }
    } catch (error) {
      showToast("Error", "Failed to toggle star.", "destructive");
      const conversation = conversations.find(c => c.conversation_id === conversation_id);
      if (conversation) {
        toggleStarConversation(conversation_id, conversation.starred);
      }
    }
  }, [conversations, toggleStarConversation, showToast]);
  
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
      
      const response = await fetch(`/api/conversations/${conversation_id}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: newAlias })
      });
      
      if (!response.ok) {
        throw new Error('Failed to rename conversation');
      }
    } catch (error) {
      showToast("Error", "Failed to rename conversation.", "destructive");
    }
  }, [updateConversation, showToast]);
  
  const handleDelete = useCallback(async (conversation_id: string) => {
    try {
      deleteConversation(conversation_id);
      if (currentConversationId === conversation_id) {
        router.push("/");
      }
      
      const response = await fetch(`/api/conversations/${conversation_id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
    } catch (error) {
      showToast("Error", "Failed to delete conversation.", "destructive");
    }
  }, [deleteConversation, currentConversationId, router, showToast]);
  
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
        
        const response = await fetch("/api/conversations/all", {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete conversations');
        }
      } catch (error) {
        showToast("Error", "Failed to delete conversations.", "destructive");
      }
    } else if (modalAction === "logout") {
      try {
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
        showToast("Error", "Failed to logout.", "destructive");
      }
    }
    setModalOpen(false);
    setModalAction(null);
  }, [modalAction, deleteAllConversations, router, showToast]);
  
  const handleNewConversation = useCallback(() => {
    router.push("/");
  }, [router]);
  
  const handleRealtimeConversation = useCallback(() => {
    router.push("/realtime");
  }, [router]);
  
  const handleImageGeneration = useCallback(() => {
    router.push("/image");
  }, [router]);
  
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
  
  return (
    <>
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="flex flex-row justify-between items-center">
          <Link href="/" className="flex items-center gap-3 px-2 py-3 group hover:bg-accent/50 rounded-lg transition-all duration-300">
            <IconLogo className={cn('size-6')} alt="TOMO AI BUDDY Logo" />
            <span className="font-bold text-sm bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 transition-all duration-300 tracking-wide">
              TOMO AI BUDDY
            </span>
          </Link>
          <SidebarTrigger />
        </SidebarHeader>
        
        <SidebarContent className="flex flex-col px-2 py-4 h-full">
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
            <div className="h-full overflow-y-auto">
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
            </div>
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
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      
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
      
      <Toast
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </>
  );
}

// Main Export with Providers
export default function AppSidebar() {
  return (
    <AuthProvider>
      <ConversationsProvider>
        <MainSidebarContent />
      </ConversationsProvider>
    </AuthProvider>
  );
}
