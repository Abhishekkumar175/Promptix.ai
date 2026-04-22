import { Outlet } from "react-router-dom";
import Sidebar from "./dashboard/Sidebar";

export default function AILayout() {
  return (
    <div className="h-screen flex bg-[#020617]">
      {/* Sidebar */}
      <Sidebar />

      {/* Right Section */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Scrollable Content */}
        <main className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto w-full relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
