"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { navigateToAuth } from "@/app/hooks/useTauri";
import {
  Download,
  Terminal,
  ShieldCheck,
  FileText,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { RiftLogo } from "@/components/icons/rift-logo";

interface HeaderProps {
  chatTitle?: string;
  hideDownload?: boolean;
}

const NAV_ITEMS: { label: string; icon: LucideIcon }[] = [
  { label: "Product", icon: Terminal },
  { label: "Security", icon: ShieldCheck },
  { label: "Docs", icon: FileText },
  { label: "Pricing", icon: Tag },
];

const Header: React.FC<HeaderProps> = ({ chatTitle, hideDownload = false }) => {
  const { user, loading } = useAuth();

  const goToSignup = () =>
    navigateToAuth("/signup", { preferSignInForReturningUser: true });

  return (
    <header className="w-full px-6 max-sm:px-4 flex-shrink-0 terminal-header terminal-border">
      {/* Desktop header */}
      <div className="relative py-[10px] flex items-center justify-between max-md:hidden">
        <div className="flex items-center gap-2">
          <RiftLogo size={26} className="text-terminal-green" />
          <span className="display-emphasis text-2xl leading-none text-foreground">
            rift
          </span>
        </div>

        {chatTitle ? (
          <div className="absolute left-1/2 -translate-x-1/2 max-w-[40%] text-center">
            <span className="text-foreground text-lg font-medium truncate">
              [{chatTitle}]
            </span>
          </div>
        ) : (
          !loading &&
          !user && (
            <nav className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-7">
              {NAV_ITEMS.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={goToSignup}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </nav>
          )
        )}

        <div className="flex items-center">
          {!loading && !user && (
            <div className="flex gap-2 items-center">
              {!hideDownload && (
                <Button
                  asChild
                  variant="ghost"
                  size="default"
                  className="rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Link href="/download">
                    <Download className="h-4 w-4 mr-1.5" />
                    Download
                  </Link>
                </Button>
              )}
              <Button
                data-testid="sign-in-button"
                onClick={() => navigateToAuth("/login")}
                variant="outline"
                size="default"
                className="min-w-[74px] rounded-lg border-border bg-secondary/40 text-foreground hover:bg-secondary/70"
              >
                Log in
              </Button>
              <Button
                data-testid="sign-up-button"
                onClick={() =>
                  navigateToAuth("/signup", {
                    preferSignInForReturningUser: true,
                  })
                }
                variant="default"
                size="default"
                className="min-w-16 rounded-lg bg-terminal-green text-black hover:bg-terminal-green/90"
              >
                Get started
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile header */}
      <div className="py-3 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <RiftLogo size={22} className="text-terminal-green" />
          <span className="display-emphasis text-xl leading-none text-foreground">
            rift
          </span>
        </div>
        {!loading && !user && (
          <div className="flex items-center gap-2">
            <Button
              data-testid="sign-in-button-mobile"
              onClick={() => navigateToAuth("/login")}
              variant="outline"
              size="sm"
              className="rounded-lg border-border bg-secondary/40 text-foreground hover:bg-secondary/70"
            >
              Log in
            </Button>
            <Button
              data-testid="sign-up-button-mobile"
              onClick={() =>
                navigateToAuth("/signup", {
                  preferSignInForReturningUser: true,
                })
              }
              variant="default"
              size="sm"
              className="rounded-lg bg-terminal-green text-black hover:bg-terminal-green/90"
            >
              Get started
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
