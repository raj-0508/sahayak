"use client";

import Link from "next/link";
import { Icons } from "./icons";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (pathname.startsWith('/dashboard')) {
        return null;
    }

    return (
        <nav className="sahayak-nav fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-6 md:px-12">
            {/* Logo — <Sahayak/> style like reference <Raj/> */}
            <Link href="/" className="flex items-center gap-2 font-bold text-lg group">
                <Icons.logo className="h-9 w-9 rounded-lg transition-transform group-hover:scale-110" />
                <span className="notranslate" style={{ color: '#5eead4', fontFamily: 'Quantico, monospace', letterSpacing: '0.04em' }}>
                    &lt;Sahayak/&gt;
                </span>
            </Link>

            {/* Right nav */}
            <div className="flex items-center gap-4">
                <ThemeToggle />
                {user ? (
                    <>
                        <Link href="/dashboard" className="teal-ghost-link text-sm font-medium">
                            Dashboard
                        </Link>
                        <button
                            onClick={logout}
                            className="teal-btn text-sm font-medium px-4 py-1.5"
                            style={{ cursor: 'pointer' }}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="teal-ghost-link text-sm font-medium">
                            Login
                        </Link>
                        <Link href="/signup" className="teal-btn text-sm font-medium px-4 py-1.5">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
