import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "../hooks/useTheme";

/**
 * ThemeToggle - cicla o tema: sistema → claro → escuro → sistema.
 * Controle **provisório**; ganha lugar definitivo e rótulos via UI_LABELS no app shell (RF-011).
 */
const ICON = { light: Sun, dark: Moon, system: Monitor } as const;
const LABEL = { light: "Tema: claro", dark: "Tema: escuro", system: "Tema: automático" } as const;

export const ThemeToggle = () => {
  const { mode, cycle } = useTheme();
  const Icon = ICON[mode];
  return (
    <Button variant="outline" size="icon" onClick={cycle} aria-label={LABEL[mode]} title={LABEL[mode]}>
      <Icon />
    </Button>
  );
};
