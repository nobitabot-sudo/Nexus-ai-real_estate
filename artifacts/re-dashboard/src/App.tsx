import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useGetAuthMe } from "@workspace/api-client-react";

import { AppLayout } from "@/components/layout/AppLayout";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Calls from "@/pages/Calls";
import CallDetail from "@/pages/CallDetail";
import Onboard from "@/pages/Onboard";
import Admin from "@/pages/Admin";
import AdminClientForm from "@/pages/AdminClientForm";
import MyLeads from "@/pages/MyLeads";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
  },
  variables: {
    colorPrimary: "hsl(38 92% 50%)",
    colorForeground: "hsl(222 47% 11%)",
    colorMutedForeground: "hsl(215 16% 47%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(222 47% 11%)",
    colorNeutral: "hsl(214 32% 91%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-semibold",
    footerActionLink: "text-primary font-bold hover:underline",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground text-sm",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-destructive font-medium",
    logoBox: "flex justify-center mb-4",
    socialButtonsBlockButton: "border-border hover:bg-muted/50",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10",
    formFieldInput: "border-input bg-background text-foreground focus:ring-2 focus:ring-primary rounded-md h-10",
    footerAction: "flex items-center justify-center gap-1",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border border-destructive/20 text-destructive",
    otpCodeFieldInput: "border-input bg-background focus:ring-primary text-foreground",
    formFieldRow: "mb-4",
    main: "flex flex-col gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function AuthRouter() {
  const { isLoaded, isSignedIn } = useUser();
  const { data: authMe, isLoading: authMeLoading } = useGetAuthMe({
    query: { enabled: isSignedIn, retry: false },
  });

  if (!isLoaded || (isSignedIn && authMeLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  // Routing logic based on role
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      
      {/* Protected Routes Wrapper */}
      <Route path="*">
        <Show when="signed-out">
          <Redirect to="/" />
        </Show>
        <Show when="signed-in">
          {authMe?.role === "admin" ? (
             <AppLayout role="admin">
                <Switch>
                  <Route path="/admin" component={Admin} />
                  <Route path="/admin/clients/new" component={AdminClientForm} />
                  <Route path="/admin/clients/:id/edit" component={AdminClientForm} />
                  <Route>
                    <Redirect to="/admin" />
                  </Route>
                </Switch>
             </AppLayout>
          ) : authMe?.role === "client" ? (
             <Switch>
               <Route path="/onboard" component={Onboard} />
               <Route path="*">
                 <AppLayout role="client">
                   <Switch>
                     <Route path="/dashboard" component={Dashboard} />
                     <Route path="/calls" component={Calls} />
                     <Route path="/calls/:id" component={CallDetail} />
                     <Route path="/leads" component={MyLeads} />
                     <Route component={NotFound} />
                   </Switch>
                 </AppLayout>
               </Route>
             </Switch>
          ) : (
             <div className="p-8 text-center text-muted-foreground">Initializing account...</div>
          )}
        </Show>
      </Route>
    </Switch>
  );
}

const queryClient = new QueryClient();

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <AuthRouter />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;