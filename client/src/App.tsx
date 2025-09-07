import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGuard from "@/components/auth-guard";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import Dashboard from "@/pages/dashboard";
import AddBalance from "@/pages/add-balance";
import Withdraw from "@/pages/withdraw";
import DepositToCard from "@/pages/withdraw-card";
import ACH from "@/pages/ach";
import NotFound from "@/pages/not-found";

function AppContent() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MobileNav />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/add-balance" component={AddBalance} />
          <Route path="/withdraw" component={Withdraw} />
          <Route path="/deposit-to-card" component={DepositToCard} />
          <Route path="/ach" component={ACH} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </AuthGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
