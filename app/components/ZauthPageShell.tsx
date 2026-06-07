import React from "react";
import ZauthBackdrop from "./ZauthBackdrop";
import Header from "./Header";
import Footer from "./Footer";

/**
 * Shared public-page shell that drops any page onto the zauth-grade canvas:
 * `#1d1d1d` background, the atmospheric backdrop (conic glow + dot matrix +
 * trace dots + bottom fade), and optional header/footer chrome.
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
    <div className="relative flex min-h-full flex-col overflow-hidden bg-[#1d1d1d]">
      <ZauthBackdrop className="z-0" />

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
