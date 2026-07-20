import { UI_LABELS } from "../../constants/uiLabels";

/** Um segmento do fluxo: rótulo, valor bruto e a cor (classe de fundo). */
export interface FlowSegment {
  key: string;
  label: string;
  /** Valor bruto (min ou km) — a largura é a fração dele no total. */
  value: number;
  className: string;
}

interface Props {
  title: string;
  segments: FlowSegment[];
  total: number;
  /** Formata valor bruto → texto ("~12 min", "657 m"). */
  format: (value: number) => string;
}

/**
 * FlowBar - barra segmentada "de que é feito este total" (TASK-REF-017).
 *
 * Nasceu para o TEMPO (veículo / a pé / entregas — o split da RF-007.1) e foi
 * generalizada no smoke 19/07 para servir também a DISTÂNCIA (veículo / a pé):
 * o mesmo desenho responde "como o total se reparte", que é a pergunta em ambos.
 *
 * Segmento zerado some (da barra e da legenda); sem total a barra não renderiza —
 * uma barra vazia não informa nada. A barra é decorativa (`aria-hidden`): a
 * legenda abaixo carrega o mesmo dado em texto.
 */
export const FlowBar = ({ title, segments, total, format }: Props) => {
  const visible = segments.filter((segment) => segment.value > 0);
  if (total <= 0 || visible.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="text-xs font-semibold tabular-nums">{UI_LABELS.ROTEIRO_INFO.FLOW_TOTAL(format(total))}</p>
      </div>

      <div aria-hidden className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-muted">
        {visible.map((segment) => (
          <span key={segment.key} className={segment.className} style={{ width: `${(segment.value / total) * 100}%` }} />
        ))}
      </div>

      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {visible.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${segment.className}`} />
            {segment.label} <span className="font-medium tabular-nums text-foreground">{format(segment.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
