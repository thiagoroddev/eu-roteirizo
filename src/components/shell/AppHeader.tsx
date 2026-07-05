import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { ThemeToggle } from "../ThemeToggle";
import { UI_LABELS } from "../../constants/uiLabels";

interface Props {
  /** Show the back arrow (focus screens — RF-38 "voltar quando aplicável"). */
  showBack?: boolean;
}

/**
 * AppHeader - fixed top bar of the app shell (ADR-003).
 * Present on every screen (tabbed and focus layouts alike). Carries the app
 * title and global controls; the route-settings gear ships disabled until the
 * settings panel exists (TASK-RF-007).
 */
export const AppHeader = ({ showBack = false }: Props) => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-input bg-background px-4">
      <div className="flex items-center gap-1">
        {showBack && (
          <Button variant="ghost" size="icon" aria-label={UI_LABELS.SHELL.BACK_ARIA} title={UI_LABELS.SHELL.BACK_ARIA} onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
        )}
        <h1 className="text-lg font-bold">{UI_LABELS.SHELL.APP_TITLE}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" size="icon" disabled aria-label={UI_LABELS.SHELL.SETTINGS_ARIA} title={UI_LABELS.SHELL.SETTINGS_ARIA}>
          <Settings />
        </Button>
      </div>
    </header>
  );
};
