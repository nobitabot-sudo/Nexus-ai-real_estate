import { useState } from "react";
import { useLocation, Redirect } from "wouter";
import { useOnboardClient, useGetMyClient } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Onboard() {
  const [, setLocation] = useLocation();
  const [clientCode, setClientCode] = useState("");
  
  const { data: myClient, isLoading: isLoadingClient } = useGetMyClient({
    query: { retry: false }
  });
  
  const onboardMutation = useOnboardClient({
    mutation: {
      onSuccess: () => {
        toast.success("Account successfully linked!");
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast.error(error.error || "Failed to link account. Please check your code.");
      }
    }
  });

  if (isLoadingClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  // If already linked, skip onboard
  if (myClient?.isLinked) {
    return <Redirect to="/dashboard" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientCode.trim()) return;
    onboardMutation.mutate({ data: { clientCode: clientCode.trim() } });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex h-20 items-center px-6 md:px-12 border-b bg-card">
        <div className="flex items-center gap-2 text-primary font-bold text-2xl">
          <Building2 className="h-8 w-8 text-sidebar-primary" />
          <span>NexusAI</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 bg-muted/20">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mb-2">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Link Your Account</CardTitle>
            <CardDescription className="text-base">
              Enter the unique client code provided by your administrator to access your dashboard.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientCode">Client Code</Label>
                  <Input
                    id="clientCode"
                    placeholder="e.g. AGENT-12345"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value)}
                    className="font-mono uppercase h-12 text-lg"
                    disabled={onboardMutation.isPending}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold"
                disabled={!clientCode.trim() || onboardMutation.isPending}
              >
                {onboardMutation.isPending ? "Linking..." : "Access Dashboard"}
                {!onboardMutation.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}