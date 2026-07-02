import { PentestNotebook } from "@/app/components/PentestNotebook";

/**
 * Full-page Pentest Notebook — the user's engagement notes, report-style.
 * Renders inside the shared (chat) layout so the sidebar stays mounted.
 */
export default function NotebookPage() {
  return <PentestNotebook />;
}
