import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../ui/dialog";
import { useDeliverySettings } from "../../contexts/DeliverySettingsContext";
import { clearGraphSamples, readGraphSamples } from "../../services/graphDiagnostics";
import { clearGraphCache } from "../../services/graphCache";
import { UI_LABELS } from "../../constants/uiLabels";

const S = UI_LABELS.DELIVERY_SETTINGS;
const D = UI_LABELS.GRAPH_DIAGNOSTICS;

/**
 * Painel de leitura das medições da malha (TASK-CHORE-006).
 *
 * Fica aqui, e não atrás de `import.meta.env.DEV`, porque o smoke acontece no
 * **build de produção** (site de testes) — é o único lugar onde os números
 * ficam legíveis justo depois de uma carga lenta acontecer. Recolhido por
 * padrão: é ferramenta de diagnóstico, não configuração.
 */
const GraphDiagnostics = () => {
  // Lido uma vez por abertura: o Radix desmonta o conteúdo ao fechar, então
  // cada abertura já remonta com as amostras atuais.
  const [samples, setSamples] = useState(readGraphSamples);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClear = () => {
    clearGraphSamples();
    setSamples([]);
  };

  /** Sem isso não há como PROVOCAR uma carga de rede: o cache dura 7 dias. */
  const handleClearCache = () => {
    void clearGraphCache();
    setCacheCleared(true);
  };

  return (
    <details className="mt-4 border-t border-border pt-3">
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground">{D.TITLE}</summary>
      {samples.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">{D.EMPTY}</p>
      ) : (
        <>
          <ul className="mt-2 space-y-1">
            {samples.map((sample) => (
              <li key={sample.at} className="text-xs tabular-nums text-muted-foreground">
                {D.SAMPLE(sample)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">{D.HINT}</p>
        </>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleClearCache}>
          {D.CLEAR_CACHE}
        </Button>
        {samples.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear}>
            {D.CLEAR}
          </Button>
        )}
      </div>
      {cacheCleared && <p className="mt-2 text-xs text-muted-foreground">{D.CACHE_CLEARED}</p>}
    </details>
  );
};

/** Non-negative seconds from a SECONDS input (empty/invalid → 0). */
const toSeconds = (value: string): number => Math.max(0, Math.round(Number(value) || 0));
/** Non-negative seconds from a MINUTES input (the base time is edited in minutes). */
const minutesToSeconds = (value: string): number => Math.max(0, Math.round((Number(value) || 0) * 60));

/**
 * DeliverySettingsDialog - the ⚙️ panel (RF-007.2): the two user-editable
 * delivery times (base + per-package extra, seconds), a GLOBAL preference
 * applied to every route. Walking/vehicle speeds are NOT here — they stay code
 * defaults. Saving persists via the DeliverySettings context.
 *
 * Inputs are UNCONTROLLED (defaultValue + refs): Radix unmounts the content when
 * the dialog closes, so each open remounts with the current saved values — no
 * effect syncing local state.
 */
export const DeliverySettingsDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const { settings, updateSettings } = useDeliverySettings();
  const baseRef = useRef<HTMLInputElement>(null);
  const perPackageRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateSettings({ deliveryBaseSeconds: minutesToSeconds(baseRef.current?.value ?? ""), deliveryPerPackageSeconds: toSeconds(perPackageRef.current?.value ?? "") });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{S.TITLE}</DialogTitle>
          <DialogDescription>{S.DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">{S.BASE_LABEL}</span>
            <div className="mt-1 flex items-center gap-2">
              <Input ref={baseRef} type="number" min={0} step={0.5} inputMode="decimal" defaultValue={settings.deliveryBaseSeconds / 60} className="w-24" aria-label={S.BASE_LABEL} />
              <span className="text-sm text-muted-foreground">{S.MINUTES}</span>
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium">{S.PER_PACKAGE_LABEL}</span>
            <div className="mt-1 flex items-center gap-2">
              <Input ref={perPackageRef} type="number" min={0} inputMode="numeric" defaultValue={settings.deliveryPerPackageSeconds} className="w-24" aria-label={S.PER_PACKAGE_LABEL} />
              <span className="text-sm text-muted-foreground">{S.SECONDS}</span>
            </div>
          </label>
        </div>
        <GraphDiagnostics />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{S.CANCEL}</Button>
          </DialogClose>
          <Button onClick={handleSave}>{S.SAVE}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
