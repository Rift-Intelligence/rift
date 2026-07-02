import { ArtifactsGallery } from "@/app/components/ArtifactsGallery";

/**
 * Full-page Artifacts gallery — every image the user has sent or received.
 * Renders inside the shared (chat) layout so the sidebar stays mounted.
 */
export default function ArtifactsPage() {
  return <ArtifactsGallery />;
}
