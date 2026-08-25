"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Gamepad2, User, Bell, Menu, X, PlaySquare, LogOut } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, wallet } = useAuth();

  const desktopLinks = [
    { href: "/matches", label: "Matches", icon: Gamepad2 },
    { href: "/markets", label: "Markets", icon: PlaySquare },
    { href: "/rankings", label: "Rankings", icon: Trophy },
    { href: "/profile", label: "Players", icon: User },
  ];

  const mobileLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/matches", label: "Matches", icon: Gamepad2 },
    { href: "/markets", label: "Markets", icon: PlaySquare },
    { href: "/rankings", label: "Rankings", icon: Trophy },
    { href: user ? "/profile" : "/login", label: user ? "Profile" : "Login", icon: User },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-pp-border bg-pp-bg/90 backdrop-blur">
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
                        "px-3 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 uppercase tracking-wide",
                        isActive
                          ? "bg-pp-surface text-pp-primary"
                          : "text-pp-text-muted hover:bg-pp-surface hover:text-white"
                      )}
                    >
                      <Icon size={16} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/matches/create" className="px-4 py-2 rounded-md bg-pp-surface border border-pp-primary/50 text-pp-primary font-bold text-sm hover:bg-pp-primary hover:text-black transition-colors">
                POST CHALLENGE
              </Link>
              <button className="p-2 text-pp-text-muted hover:text-white transition-colors">
                <Bell size={20} />
              </button>
              
              {user ? (
                <div className="flex items-center gap-4 pl-2 border-l border-pp-border">
                  <div className="flex items-center gap-2 bg-pp-primary/10 border border-pp-primary/30 px-3 py-1.5 rounded-full">
                    <span className="text-xs font-bold text-pp-primary uppercase">PTS</span>
                    <span className="text-sm font-black font-mono text-white">{wallet?.balance ?? 0}</span>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 text-sm font-medium hover:text-white transition-colors">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-pp-border bg-pp-surface flex items-center justify-center text-xs font-bold text-pp-text-muted">
                      {user.email?.slice(0, 2).toUpperCase()}
                    </div>
                    {user.email?.split('@')[0]}
                  </Link>
                  <button onClick={() => signOut(auth)} className="text-pp-text-muted hover:text-red-500 transition-colors">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pl-2 border-l border-pp-border">
                  <Link href="/login" className="px-4 py-2 text-sm font-bold text-white hover:text-pp-primary transition-colors">LOGIN</Link>
                  <Link href="/register" className="px-4 py-2 text-sm font-bold bg-pp-primary text-black rounded hover:bg-pp-primary-dark transition-colors">REGISTER</Link>
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center">
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
                <div className="flex justify-between items-center mb-4 px-3 py-2 bg-pp-bg rounded-md border border-pp-primary/20">
                  <span className="text-xs font-bold text-pp-text-muted uppercase">Balance</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-pp-primary uppercase">PTS</span>
                    <span className="text-sm font-black font-mono text-white">{wallet?.balance ?? 0}</span>
                  </div>
                </div>
              )}
              <Link href="/matches/create" className="block px-3 py-2 text-center rounded-md bg-pp-primary text-black font-bold mb-4">
                POST CHALLENGE
              </Link>
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
                <button onClick={() => signOut(auth)} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-pp-bg flex items-center gap-3 uppercase">
                  <LogOut size={20} />
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
      
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
    </>
  );
}
