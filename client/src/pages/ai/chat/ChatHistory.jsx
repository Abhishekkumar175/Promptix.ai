import { MessageSquare, Plus, MessagesSquare, Trash2 } from "lucide-react";

export default function ChatHistory({
  chats,
  activeChatId,
  onSelect,
  onNewChat,
  onDelete,
  isLoading,
}) {
  return (
    <div className="h-full flex flex-col pt-4 overflow-hidden">

      {/* NEW CHAT BUTTON */}
      <div className="px-4 pb-4">
        <button
          onClick={onNewChat}
          className="w-full relative group overflow-hidden rounded-xl bg-[#11182A] border border-white/10 hover:border-violet-500/50 transition-all duration-300 p-[1px] shadow-sm hover:shadow-violet-600/10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center gap-2 bg-[#0B101A] w-full py-2.5 rounded-[10px] text-sm font-medium text-white group-hover:bg-transparent transition-colors duration-300">
            <Plus size={16} className="text-violet-400 group-hover:scale-125 transition-transform" />
            New Chat
          </div>
        </button>
      </div>

      <div className="px-4 pb-2">
        <h3 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2 px-1 flex items-center gap-1.5">
          <MessagesSquare size={12} className="text-gray-400" />
          Recent Threads
        </h3>
      </div>

      {/* HISTORY LIST */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1 pb-4">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-2 px-1 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-9 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <p className="text-xs text-gray-600 text-center pt-6">No chats yet. Start a new one!</p>
        ) : (
          chats.map((chat) => {
            const isActive = activeChatId === chat.id;
            return (
              <div
                key={chat.id}
                onClick={() => onSelect(chat.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 group
                  ${isActive
                    ? "bg-violet-600/10 text-white shadow-[inset_0_0_10px_rgba(139,92,246,0.1)] border border-violet-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }
                `}
              >
                <MessageSquare
                  size={16}
                  className={`shrink-0 ${isActive ? "text-violet-400" : "text-gray-500 group-hover:text-gray-300"}`}
                />
                <span className={`text-sm truncate flex-1 tracking-wide ${isActive ? "font-medium" : "font-normal"}`}>
                  {chat.title}
                </span>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(chat.id);
                  }}
                  className={`p-1.5 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 ${isActive ? "opacity-100 text-gray-400" : ""}`}
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
