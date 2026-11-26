import { Outlet } from "react-router-dom";
import Sidebar from "./dashboard/Sidebar";
import { ChatProvider } from "../../context/ChatContext";

export default function AILayout() {
  return (
    <ChatProvider>
      <div className="h-screen flex bg-[#020617] print:h-auto print:overflow-visible print:bg-white">
        {/* Sidebar */}
        <Sidebar />

        {/* Right Section */}
        <div className="flex flex-col flex-1 h-full overflow-hidden print:h-auto print:overflow-visible">
          {/* Content Container */}
          <main className="flex-1 flex flex-col h-full min-h-0 overflow-hidden w-full relative print:h-auto print:overflow-visible">
            <Outlet />
          </main>
        </div>
      </div>
    </ChatProvider>
  );
}
