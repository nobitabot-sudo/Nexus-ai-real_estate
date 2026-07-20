import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  Phone,
  Users,
  LogOut,
  Building2,
  Menu,
  Contact,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGetMyClient } from "@workspace/api-client-react";

export function AppLayout({
  children,
  role,
}: {
  children: ReactNode;
  role: "admin" | "client";
}) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { data: myClient } = useGetMyClient({ query: { enabled: role === "client" } });

  const adminNav = [
    { name: "Clients", href: "/admin", icon: Users },
  ];

  const clientNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];
  
  if (myClient && (myClient.planType === "outbound" || myClient.planType === "combo")) {
    clientNav.push({ name: "My Leads", href: "/leads", icon: Users });
  }

  clientNav.push({ name: "Calls", href: "/calls", icon: Phone });

  const navItems = role === "admin" ? adminNav : clientNav;

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href || location.startsWith(item.href + "/");
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background md:flex-row">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <div className="flex items-center gap-2 font-bold text-primary text-lg">
          <Building2 className="h-5 w-5" />
          <span>Nexus AI</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground border-r-sidebar-border">
            <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-6 font-bold text-sidebar-primary text-lg">
              <Building2 className="h-6 w-6" />
              <span>Nexus AI</span>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              <NavLinks />
            </nav>
            <div className="border-t border-sidebar-border p-4">
              <div className="mb-4 flex items-center gap-3 px-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-semibold">
                  {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none">{user?.fullName || "User"}</span>
                  <span className="text-xs text-sidebar-foreground/70">{role === "admin" ? "Administrator" : "Client"}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6 font-bold text-sidebar-primary text-xl">
          <Building2 className="h-6 w-6" />
          <span>Nexus AI</span>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          <NavLinks />
        </nav>
        
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-4 flex items-center gap-3 px-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-semibold">
              {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0].toUpperCase() || "U"}
            </div>
            <div className="flex flex-col truncate">
              <span className="truncate text-sm font-medium text-sidebar-foreground leading-none mb-1">
                {user?.fullName || user?.emailAddresses[0]?.emailAddress || "User"}
              </span>
              <span className="text-xs text-sidebar-foreground/70 capitalize">{role}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}