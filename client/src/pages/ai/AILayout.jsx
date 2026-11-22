import { Outlet } from "react-router-dom";
import Sidebar from "./dashboard/Sidebar";
import { ChatProvider } from "../../context/ChatContext";

export default function AILayout() {
  return (
    <ChatProvider>
      <div className="h-screen flex bg-[#020617]">
        {/* Sidebar */}
        <Sidebar />

        {/* Right Section */}
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* Content Container */}
          <main className="flex-1 flex flex-col h-full min-h-0 overflow-hidden w-full relative">
            <Outlet />
          </main>
        </div>
      </div>
    </ChatProvider>
  );
}
