import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import { useCurrentUser } from "@/hooks/use-auth";
import { LanguageProvider } from "@/lib/i18n";

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// Requires a logged-in user; guests are sent to /login.
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return <FullScreenLoader />;
  }

  return <Component />;
}

// Requires a logged-in NON-admin (farmer) user. Guests go to /login; admins are
// sent to /admin, since the New Analysis / Field Intelligence page is not
// available to administrators.
function ProtectedFarmerRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
    } else if (user.isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user || user.isAdmin) {
    return <FullScreenLoader />;
  }

  return <Component />;
}

// Requires a logged-in admin user; guests go to /login, non-admins go to /dashboard.
function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
    } else if (!user.isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user || !user.isAdmin) {
    return <FullScreenLoader />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={() => <ProtectedFarmerRoute component={Dashboard} />} />
      <Route path="/admin" component={() => <ProtectedAdminRoute component={Admin} />} />
      <Route path="/login" component={() => <Login adminMode={false} />} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
