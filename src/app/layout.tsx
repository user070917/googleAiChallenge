import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/components/SidebarContext";
import { UploadProvider } from "@/components/UploadContext";

export const metadata: Metadata = {
  title: "AI 사수 - 퇴사자 자동 인수인계 대시보드",
  description: "퇴사자가 남긴 문서와 데이터로부터 AI 기반 자동 인수인계 대시보드를 생성합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans relative overflow-x-hidden selection:bg-teal-500/30 transition-colors duration-500">
        <ThemeProvider>
          <SidebarProvider>
            <UploadProvider>
              
              {/* Glassmorphism Background Orbs */}
              <div className="fixed top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-teal-300/50 dark:bg-teal-600/20 blur-[100px] dark:blur-[120px] pointer-events-none -z-10 transition-all duration-700"></div>
              <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-300/50 dark:bg-purple-600/20 blur-[100px] dark:blur-[120px] pointer-events-none -z-10 transition-all duration-700"></div>
              <div className="fixed top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-blue-300/40 dark:bg-blue-600/10 blur-[80px] dark:blur-[100px] pointer-events-none -z-10 transition-all duration-700"></div>

              <Sidebar />
              <div className="flex-1 flex flex-col min-h-screen min-w-0">
                {children}
              </div>

            </UploadProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
