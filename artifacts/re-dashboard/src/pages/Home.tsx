import { Link, Redirect } from "wouter";
import { Building2, ArrowRight, ShieldCheck, PhoneCall, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, Show } from "@clerk/react";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      
      <Show when="signed-out">
        <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
          {/* Header */}
          <header className="flex h-20 items-center justify-between px-6 md:px-12 border-b bg-card">
            <div className="flex items-center gap-2 text-primary font-bold text-2xl">
              <Building2 className="h-8 w-8 text-sidebar-primary" />
              <span>NexusAI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Get Started
              </Link>
            </div>
          </header>

          {/* Hero */}
          <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/50 via-background to-background">
            <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium text-muted-foreground mb-8">
              <span className="flex h-2 w-2 rounded-full bg-sidebar-primary mr-2"></span>
              The premier AI calling infrastructure for real estate
            </div>
            
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-balance">
              Never Miss A <span className="text-primary">Lead</span> Again.
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Equip your real estate brokerage with intelligent AI agents that answer instantly, 
              qualify leads accurately, and book appointments 24/7.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/sign-up" className="inline-flex h-12 items-center justify-center rounded-md bg-sidebar-primary px-8 text-base font-bold text-primary shadow transition-colors hover:bg-sidebar-primary/90 gap-2">
                Create Account <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              To get started, sign up — the first account created is automatically designated as the admin.
            </p>
          </main>

          {/* Features */}
          <section className="bg-card border-t py-24 px-6 md:px-12">
            <div className="mx-auto max-w-6xl grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <PhoneCall className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">24/7 Call Coverage</h3>
                <p className="text-muted-foreground">Our AI agents never sleep, ensuring every inquiry gets a professional, instant response.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Smart Qualification</h3>
                <p className="text-muted-foreground">Instantly gather budget, timeline, and property preferences before you ever speak to the prospect.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Actionable Insights</h3>
                <p className="text-muted-foreground">Deep analytics on call sentiment, common intents, and overall conversion performance.</p>
              </div>
            </div>
          </section>

          <footer className="py-8 text-center text-sm text-muted-foreground border-t">
            © {new Date().getFullYear()} NexusAI. All rights reserved.
          </footer>
        </div>
      </Show>
    </>
  );
}