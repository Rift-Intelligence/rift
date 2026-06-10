import React from "react";
import Header from "./Header";
import Footer from "./Footer";

/**
 * Shared public-page shell. Transparent so the global EyeBackdrop (mounted in
 * the root layout) shows through, with optional header/footer chrome.
 */
export default function ZauthPageShell({
  children,
  header = true,
  footer = false,
  center = false,
  className,
}: {
  children: React.ReactNode;
  header?: boolean;
  footer?: boolean;
  /** vertically + horizontally center the content (auth / error pages) */
  center?: boolean;
  className?: string;
}) {
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-transparent">
      {header && (
        <div className="relative z-10 flex-shrink-0">
          <Header />
        </div>
      )}

      <main
        className={`relative z-10 flex-1 ${
          center ? "flex items-center justify-center px-4 py-12" : ""
        } ${className ?? ""}`}
      >
        {children}
      </main>

      {footer && (
        <div className="relative z-10 flex-shrink-0">
          <Footer />
        </div>
      )}
    </div>
  );
}
