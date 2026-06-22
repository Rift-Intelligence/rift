"use client";

import { Server } from "lucide-react";

const RemoteControlTab = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Server className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">
        Remote sandbox connections are not available.
      </p>
      <p className="text-xs text-muted-foreground">
        RIFT uses a cloud sandbox environment for all agent tasks.
      </p>
    </div>
  );
};

export { RemoteControlTab };
