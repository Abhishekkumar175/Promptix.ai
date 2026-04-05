import { useState } from "react";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import ChatHistory from "./ChatHistory";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function ChatPage() {
  const [chats, setChats] = useState([
    {
      id: 1,
      title: "First Chat",
      messages: [],
    },
  ]);

  const [activeChatId, setActiveChatId] = useState(1);
  const activeChat = chats.find((c) => c.id === activeChatId);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const sendMessage = (message) => {
    // Optimistic update for User message
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      )
    );

    setIsTyping(true);

    // Fake AI reply loading phase
    setTimeout(() => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { role: "assistant", content: "This is a premium-styled dummy AI response. Try asking me a complex prompt or code snippet! 🤖✨" },
                ],
              }
            : chat
        )
      );
      setIsTyping(false);
    }, 1500);
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  const deleteChat = (id) => {
    const newChats = chats.filter((c) => c.id !== id);
    setChats(newChats);
    if (activeChatId === id && newChats.length > 0) {
      setActiveChatId(newChats[0].id);
    } else if (newChats.length === 0) {
      setActiveChatId(null);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#030712] overflow-hidden text-white relative">
      
      {/* Background ambient glows */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* LEFT SIDEBAR: Chat History */}
      <div className={`${isSidebarOpen ? "w-[260px]" : "w-0"} transition-all duration-300 border-r border-[#1e2434] bg-[#050812] shrink-0 z-20 flex flex-col relative shadow-xl overflow-hidden`}>
        <div className="w-[260px] h-full flex flex-col shrink-0">
          <ChatHistory
            chats={chats}
            activeChatId={activeChatId}
            onSelect={setActiveChatId}
            onNewChat={createNewChat}
            onDelete={deleteChat}
          />
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex flex-col flex-1 relative z-10 transition-all duration-300">
        
        {/* Floating Sidebar Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white bg-[#0B101A] hover:bg-white/5 border border-white/10 rounded-lg transition-all z-30 shadow-md"
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>

        <ChatWindow messages={activeChat?.messages || []} isTyping={isTyping} onSendPrompt={sendMessage} />
        <div className="p-4 md:p-6 w-full max-w-4xl mx-auto">
          <ChatInput onSend={sendMessage} isTyping={isTyping} />
        </div>
      </div>
    </div>
  );
}
