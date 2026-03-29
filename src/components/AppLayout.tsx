import { NavLink, useLocation } from "react-router-dom";
import { Upload, ShieldCheck, Database, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { to: "/", label: "Upload", icon: Upload },
  { to: "/verify", label: "Verify", icon: ShieldCheck },
  { to: "/records", label: "Records", icon: Database },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-primary">
              <Fingerprint className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">
                ProofDoc <span className="text-primary">AI</span>
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Verifiable Document Trust
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 rounded-xl border border-border bg-secondary/50 p-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-primary/15 border border-primary/30"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <item.icon className={`relative z-10 h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`relative z-10 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-mono text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
              Testnet
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-8">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
