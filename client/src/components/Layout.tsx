import { Outlet } from "react-router-dom"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import { useState, memo } from "react"
import { ModernBackground } from "./ModernBackground"

const LayoutComponent = memo(() => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ModernBackground>
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </ModernBackground>
  )
});

export const Layout = memo(LayoutComponent);