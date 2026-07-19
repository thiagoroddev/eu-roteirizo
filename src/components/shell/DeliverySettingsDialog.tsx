import { useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../ui/dialog";
import { useDeliverySettings } from "../../contexts/DeliverySettingsContext";
import { UI_LABELS } from "../../constants/uiLabels";

const S = UI_LABELS.DELIVERY_SETTINGS;

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
