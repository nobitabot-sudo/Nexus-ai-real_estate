import * as React from "react"
import { Link, useLocation } from "wouter"
import { LayoutDashboard, Phone, Settings, LogOut, Building, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const [location] = useLocation()
  
  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "All Calls", href: "/calls", icon: Phone },
  ]
  
  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-[100dvh] flex-shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
          <Building size={18} />
        </div>
        <span className="font-bold text-lg tracking-tight">Nexus RE</span>
      </div>
      
      <div className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
        Menu
      </div>
      
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer group",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon size={18} className={cn(
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                )} />
                {item.name}
              </div>
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <UserCircle size={32} className="text-sidebar-foreground/50" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Agent Jane</span>
            <span className="text-xs text-sidebar-foreground/50">jane@nexusre.com</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
        {children}
      </main>
    </div>
  )
}
