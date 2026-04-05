import { Routes, Route } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useAuth,
} from "@clerk/clerk-react";

import Landing from "./pages/Landing";
import AILayout from "./pages/ai/AILayout";
import Dashboard from "./pages/ai/dashboard/DashBoard";
import Page from "./pages/ai/resume-review/page.jsx";
import GenerateImages from "./pages/ai/GenerateImages";
import WriteArticle from "./pages/ai/WriteArticle";
import PromptTemplates from "./pages/ai/PromptTemplates";
import ChatWithPDF from "./pages/ai/ChatWithPDF";
import MockInterview from "./pages/ai/MockInterview";
import ChatPage from "./pages/ai/chat/ChatPage";
import CommunityPage from "./pages/ai/community/CommunityPage.jsx";
import { useEffect } from "react";

export default function App() {
  const {getToken} = useAuth();
  useEffect(()=> {
    getToken().then((token)=> console.log(token));
  },[])
  
  return (
    <Routes>
      {/* PUBLIC ROUTE */}
      <Route path="/" element={<Landing />} />

      {/* PROTECTED AI ROUTES */}
      <Route
        path="/ai/*"
        element={
          <>
            <SignedIn>
              <AILayout />
            </SignedIn>

            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="review" element={<Page />} />
        <Route path="image" element={<GenerateImages />} />
        <Route path="article" element={<WriteArticle />} />
        <Route path="pdf" element={<ChatWithPDF />} />
        <Route path="templates" element={<PromptTemplates />} />
        <Route path="interview" element={<MockInterview />} />
        <Route path="community" element={<CommunityPage />} />
      </Route>
    </Routes>
  );
}
