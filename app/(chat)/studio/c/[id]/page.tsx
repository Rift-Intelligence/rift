"use client";

import { use } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Chat } from "@/app/components/chat";
import Loading from "@/components/ui/loading";

export default function StudioChatPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = use(props.params);
  const chatId = params.id;

  return (
    <>
      <AuthLoading>
        <div className="flex h-full flex-col overflow-hidden bg-background">
          <div className="flex flex-1 items-center justify-center">
            <Loading />
          </div>
        </div>
      </AuthLoading>

      <Authenticated>
        <Chat key={chatId} autoResume={true} />
      </Authenticated>

      <Unauthenticated>
        <div className="flex h-full flex-col overflow-hidden bg-background">
          <div className="flex flex-1 items-center justify-center">
            <Loading />
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}
