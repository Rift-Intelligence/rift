import type { FC } from "react";
import { RiftLogo } from "./rift-logo";

interface RiftPixelMarkProps {
  size?: number;
  className?: string;
}

/**
 * RIFT app mark. Now renders the layered-squircle {@link RiftLogo} — the export
 * name is kept so every existing call site (headers, sidebar, auth, share, …)
 * picks up the new brand logo with no further changes.
 */
export const RiftPixelMark: FC<RiftPixelMarkProps> = ({
  size = 32,
  className,
}) => <RiftLogo size={size} className={className} />;
