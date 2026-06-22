"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { Chat } from "@/app/components/chat";
import { LandingPage } from "@/app/components/landing/LandingPage";

export default function StudioAppPage() {
  return (
    <>
      <Authenticated>
        <Chat autoResume={false} />
      </Authenticated>
      <Unauthenticated>
        <div className="h-full overflow-y-auto">
          <LandingPage />
        </div>
      </Unauthenticated>
    </>
  );
}
