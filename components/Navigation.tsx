"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Gamepad2, User, Bell, Menu, X, PlaySquare, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { useAuth } from "@/components/AuthProvider";
import AuthModal from "@/components/AuthModal";
import VerificationBanner from "@/components/VerificationBanner";
import { supabase } from "@/lib/supabase";

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [hasLiveAdminMatch, setHasLiveAdminMatch] = useState(false);
  const { user, profile, wallet, signOut } = useAuth();
  
  useEffect(() => {
    async function checkLiveMatches() {
      try {
        const { count } = await supabase
          .from("matches")
          .select("id", { count: "exact", head: true })
          .eq("is_admin_match", true)
          .in("state", ["OPEN", "IN_PROGRESS", "ADMIN_SCHEDULED"]);

        setHasLiveAdminMatch(Boolean(count && count > 0));
      } catch {
        // Non-fatal check
      }
    }
    checkLiveMatches();
  }, [pathname]);

  const isAdmin = Boolean(
    profile?.role === "admin" ||
    profile?.is_admin === true ||
    user?.user_metadata?.role === "admin" ||
    user?.app_metadata?.role === "admin"
  );

  const desktopLinks = [
    { href: "/matches", label: "Matches", icon: Gamepad2 },
    { href: "/markets", label: "Markets", icon: PlaySquare, hasLive: hasLiveAdminMatch },
    { href: "/rankings", label: "Rankings", icon: Trophy },
    { href: "/profile", label: "Players", icon: User },
  ];

  const mobileLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/matches", label: "Matches", icon: Gamepad2 },
    { href: "/markets", label: "Markets", icon: PlaySquare, hasLive: hasLiveAdminMatch },
    { href: "/rankings", label: "Rankings", icon: Trophy },
    { href: user ? "/profile" : "/login", label: user ? "Profile" : "Login", icon: User },
  ];

  return (
    <>
      <nav className={clsx(
        "sticky top-0 z-50 w-full border-b bg-pp-bg/90 backdrop-blur transition-colors",
        isAdmin ? "border-amber-500/30" : "border-pp-border"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2.5">
                {/* Logo: dark rounded square with neon green border + bold P */}
                <div className="w-9 h-9 rounded-xl bg-pp-bg border-2 border-pp-primary flex items-center justify-center shadow-[0_0_10px_rgba(57,255,20,0.3)] flex-shrink-0">
                  <span className="text-pp-primary font-black text-lg leading-none">P</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-white">PREDICTPLAY</span>
              </Link>
              <div className="hidden md:flex ml-10 space-x-1">
                {desktopLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || (pathname === '/' && link.href === '/');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={clsx(
                        "px-3 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 uppercase tracking-wide relative",
                        isActive
                          ? "bg-pp-surface text-pp-primary"
                          : "text-pp-text-muted hover:bg-pp-surface hover:text-white"
                      )}
                    >
                      <Icon size={16} />
                      <span>{link.label}</span>
                      {link.hasLive && (
                        <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-black tracking-widest uppercase flex items-center gap-1 shadow-[0_0_6px_rgba(239,68,68,0.6)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          LIVE
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              {isAdmin && (
                <Link
                  href="/admin/verifications"
                  className="px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Admin Panel
                </Link>
              )}
              <Link href="/matches/create" className="px-4 py-2 rounded-md bg-pp-surface border border-pp-primary/50 text-pp-primary font-bold text-sm hover:bg-pp-primary hover:text-black transition-colors">
                POST CHALLENGE
              </Link>
              <button className="p-2 text-pp-text-muted hover:text-white transition-colors">
                <Bell size={20} />
              </button>
              
              {user ? (
                <div className="flex items-center gap-3 pl-2 border-l border-pp-border">
                  <div className="flex items-center gap-2 bg-pp-primary/10 border border-pp-primary/30 px-3 py-1.5 rounded-full">
                    <span className="text-xs font-bold text-pp-primary uppercase">PTS</span>
                    <span className="text-sm font-black font-mono text-white">{wallet?.balance ?? 0}</span>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 text-sm font-medium hover:text-white transition-colors">
                    <div className={clsx(
                      "w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold transition-all",
                      isAdmin 
                        ? "border-2 border-amber-400 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
                        : "border border-pp-border bg-pp-surface text-pp-text-muted"
                    )}>
                      {user.email?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>{user.email?.split('@')[0]}</span>
                      {isAdmin && (
                        <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded shadow-sm">
                          ADMIN
                        </span>
                      )}
                    </div>
                  </Link>
                  <button onClick={() => signOut()} className="text-pp-text-muted hover:text-red-500 transition-colors">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pl-2 border-l border-pp-border">
                  <button onClick={() => setAuthModalOpen(true)} className="px-4 py-2 text-sm font-bold bg-pp-primary text-black rounded hover:bg-pp-primary-dark transition-colors">REGISTER</button>
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center gap-2">
              {isAdmin && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full">
                  ADMIN
                </span>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-pp-text-muted hover:text-white p-2"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-pp-surface border-b border-pp-border">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {user && (
                <div className="flex justify-between items-center mb-4 px-3 py-2.5 bg-pp-bg rounded-md border border-pp-primary/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{user.email?.split('@')[0]}</span>
                    {isAdmin && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-pp-primary uppercase">PTS</span>
                    <span className="text-sm font-black font-mono text-white">{wallet?.balance ?? 0}</span>
                  </div>
                </div>
              )}
              {!user && (
                <button
                  onClick={() => { setMobileMenuOpen(false); setAuthModalOpen(true); }}
                  className="block w-full px-3 py-2 text-center rounded-md bg-pp-primary text-black font-bold mb-4"
                >
                  REGISTER
                </button>
              )}
              <Link href="/matches/create" className="block px-3 py-2 text-center rounded-md bg-pp-primary text-black font-bold mb-4">
                POST CHALLENGE
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/verifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-center rounded-md bg-pp-surface border border-amber-500/40 text-amber-400 font-bold mb-4"
                >
                  ADMIN PANEL
                </Link>
              )}
              {mobileLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 uppercase",
                      isActive
                        ? "bg-pp-bg text-pp-primary"
                        : "text-pp-text-muted hover:bg-pp-bg hover:text-white"
                    )}
                  >
                    <Icon size={20} />
                    {link.label}
                  </Link>
                );
              })}
              {user && (
                <button onClick={() => signOut()} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-pp-bg flex items-center gap-3 uppercase">
                  <LogOut size={20} />
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
      
      <VerificationBanner />
      
      {/* Bottom mobile nav for quick access */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-pp-bg border-t border-pp-border pb-safe">
        <div className="flex justify-around items-center h-16">
          {mobileLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex flex-col items-center justify-center w-full h-full space-y-1",
                  isActive ? "text-pp-primary" : "text-pp-text-muted hover:text-white"
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-bold uppercase">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
