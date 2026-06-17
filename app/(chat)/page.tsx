"use client";

import React from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { Chat } from "../components/chat";
import { LandingPage } from "../components/landing/LandingPage";

const AuthenticatedContent = () => {
  return <Chat autoResume={false} />;
};

export default function Page() {
  return (
    <>
      <Authenticated>
        <AuthenticatedContent />
      </Authenticated>
      <Unauthenticated>
        <div className="h-full overflow-y-auto">
          <LandingPage />
        </div>
      </Unauthenticated>
    </>
  );
}
