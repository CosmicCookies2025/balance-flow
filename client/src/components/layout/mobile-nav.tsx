import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Plus, 
  ArrowRight,
  CreditCard
} from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Add Balance",
      href: "/add-balance",
      icon: Plus,
    },
    {
      name: "Withdraw",
      href: "/withdraw",
      icon: ArrowRight,
    },
    {
      name: "Card Deposit",
      href: "/deposit-to-card", 
      icon: CreditCard,
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <nav className="flex justify-around py-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex flex-col items-center px-3 py-2 text-xs font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`mobile-nav-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon className="w-6 h-6 mb-1" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
