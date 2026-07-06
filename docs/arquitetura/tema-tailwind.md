# Tema & Identidade Visual (Tailwind / shadcn)

> Fonte da verdade dos **design tokens**. Consumidos por [`src/styles/theme.css`](../../src/styles/theme.css) + [`tailwind.config.js`](../../tailwind.config.js). Implementação via shadcn/ui ([ADR-004](./ADR/ADR-004.md) + [ADR-006](./ADR/ADR-006.md)).
>
> **Status:** ✅ **Revisada (05/07/26, TASK-REF-012)** — identidade **"Neon Flux"** (`prototipos/telas-media-fidelidade/neonflux.md`): **DARK é o PADRÃO** (decisão do humano; claro segue no toggle p/ uso ao sol), marca **verde `#00FF9D` → azul `#00D1FF`** (gradiente `bg-brand-gradient`), destructive coral `#FF2E63` no escuro. **Cores provisórias por design: personalizar a paleta = editar apenas `src/styles/theme.css`** (todo o chrome via tokens; `accent2` incluído). As tabelas §2 abaixo descrevem a identidade Cyanide anterior — **os valores vigentes são os do `theme.css`** (fonte da verdade executável); atualizar as tabelas quando a paleta estabilizar. Paleta funcional do mapa (§3/ADR-008) **intocada**.
>
> *(Anterior: ✅ Aceita 24/06/26 — "Cyanide Precision", ciano `#0DC2D6`, claro padrão — ADR-006 original.)*

---

## 0. Relação com a ADR-004

A [ADR-004](./ADR/ADR-004.md) fixou shadcn/ui + `--primary` laranja (provisório). Esta identidade troca a **cor/identidade** para **ciano "Cyanide Precision"** — registrada na **[ADR-006](./ADR/ADR-006.md)** (supersede parcial: só cor/identidade; shadcn/ui permanece).

**Cascata implementada:** `theme.css` (tokens claro+escuro), `tailwind.config.js` (Hanken Grotesk + `accent2` + `--radius` via CSS), `button.tsx` (pill), `index.html` (anti-flash + fonte), `themeService`/`useTheme`/`ThemeToggle` (troca), `setupTests` (mock matchMedia), `prompt-prototipacao-ui.md` §2.

---

## 1. Identidade

**Cyanide Precision · Precision Minimalism.** Técnico, frio, alto contraste, denso. **Escuro** (slate/navy) é o visual preferido, para pouca luz/noite; **claro** existe para **uso ao sol** (campo) — tema escuro lava sob luz forte. Marca **ciano** vibrante; formato **arredondado/pill** (contraponto amigável ao escuro técnico).

---

## 2. Cores — chrome do app (tokens shadcn)

Em `src/styles/theme.css`. **HSL** (formato shadcn) + hex ref. Ciano é a marca nos dois temas; o **texto do botão é escuro** (`--primary-foreground`).

| Token | Claro (`:root`) | Escuro (`.dark`) | Uso |
|---|---|---|---|
| `--background` | `210 40% 99%` | `222 55% 10%` (`#0B1326`) | fundo da app |
| `--foreground` | `222 47% 11%` | `226 90% 92%` (`#DAE2FD`) | texto principal |
| `--card` / `--popover` | `0 0% 100%` | `223 38% 15%` (`#171F33`) | cards/painéis |
| `--primary` | `186 88% 44%` | `186 88% 44%` (`#0DC2D6`) | **CTA/marca (ciano)** |
| `--primary-foreground` | `187 100% 12%` | `187 100% 12%` (`#00363D`) | **texto escuro** sobre o ciano |
| `--secondary` | `210 24% 94%` | `222 28% 19%` | botão secundário |
| `--muted` | `210 30% 96%` | `222 41% 13%` | fundos sutis |
| `--muted-foreground` | `215 16% 40%` | `200 12% 72%` | metadados |
| `--accent` | `210 24% 94%` | `224 24% 23%` | hover/realce |
| `--destructive` | `0 75% 42%` | `0 75% 55%` | erro/destrutivo |
| `--warning` *(extensão)* | `45 100% 50%` | `45 100% 55%` | aviso (casa com o badge do mapa) |
| `--border` / `--input` | `214 25% 88%` | `222 20% 24%` | bordas 1px |
| `--ring` | `186 88% 44%` | `186 88% 44%` | anel de foco (ciano) |
| `--radius` | `1rem` | (herda) | **pill/arredondado** |

**Acento secundário** ciano vivo `#0DC2D6` → cor Tailwind **`accent2`** (chips/status), uso parcimonioso.

---

## 3. Cores — paleta funcional do **mapa** (independente da marca)

O sistema de marcadores (`prompt-prototipacao-ui.md` §3 / `fluxo-roteirizacao.md` §3) é **funcional** e **não muda** com a marca nem com o tema. Cada **Parada** recebe **uma** cor de uma paleta **categórica**; há semânticas **fixas**.

**Categórica das Paradas** (cicla): Teal `#0F6E56` · Roxo `#6A2C9E` · Coral `#C0392B` · Âmbar `#D98324` · Magenta `#C2185B` · Índigo `#3D348B` · Oliva `#6B7A0A` · Marrom `#8D5524`.

**Semânticas fixas:** Início `#2E9E4F` (verde) · Livre `#9AA0AA` (cinza) · Badge `#F5B400` (amarelo) · Âncora = cor da parada **+ borda grossa** · linhas veículo (contínua) / a pé (tracejada) / sugestão (tracejada).

> **Reservados** (não usar como cor de parada): ciano-marca, verde-início, cinza-livre, amarelo-badge.

---

## 4. Tipografia — **Hanken Grotesk** (Google Fonts)

| Estilo | Tam/Linha | Peso | Tracking |
|---|---|---|---|
| `headline-xl` | 48/56 | 700 | -0.02em |
| `headline-lg` | 32/40 | 600 | -0.01em |
| `headline-lg-mobile` | 24/32 | 600 | — |
| `title-md` | 20/28 | 600 | — |
| `body-lg` / `body-md` | 18/28 · 16/24 | 400 | — |
| `label-md` / `label-sm` | 14/20 · 12/16 | 600/500 | 0.02em |

---

## 5. Raio, espaçamento, elevação

- **Raio (pill):** `--radius` = **1rem**; **botões `rounded-full`** (pill); cards `rounded-lg` (1rem); pills `rounded-full`.
- **Espaçamento:** base 4–8px; progressão 8/16/24/48.
- **Elevação (flat):** camadas tonais + borda 1px (`--border`); foco = borda/anel 2px ciano. No escuro, "subir" = ficar mais claro; opcional **glow** ciano sutil em elementos primários.

---

## 6. Componentes (resumo)

- **Botões:** primário = ciano sólido + **texto escuro**; pill. Secundário = `outline` (borda/texto). 
- **Inputs:** borda 1px → 2px ciano no foco; label persistente.
- **Chips:** `accent2` (ciano) 10% bg + ciano texto, pill.
- **Cards:** sem sombra; profundidade por borda 1px; no escuro, `#171F33`.

---

## 6.5 Troca de tema (claro / escuro / automático)

- **Padrão = automático** (segue `prefers-color-scheme`); override manual persistido em `localStorage` (`theme`).
- **Anti-flash:** script inline no `index.html` aplica `data-theme` no 1º paint.
- **Código:** `services/themeService.ts` (storage/DOM, defensivo) · `hooks/useTheme.ts` · `components/ThemeToggle.tsx` (toggle **provisório** — ganha lugar definitivo no app shell, RF-011/RF-038).

---

## 7. Pendências / a confirmar

- [x] Marca **ciano `#0DC2D6`** + claro/escuro auto + pill — implementado (ADR-006, REF-009).
- [ ] **Self-host** da fonte Hanken Grotesk (offline pleno do PWA).
- [ ] Validar a **paleta categórica do mapa** (§3) ao sol com ≥ 8 paradas.
- [ ] Toggle de tema no **app shell** (lugar/rótulos via `UI_LABELS`).
- [ ] Conferir contraste AA do ciano `#0DC2D6` + texto escuro em tamanhos pequenos.

---

## Última Atualização
- **Data:** 24/06/26
- **Por:** identidade **"Cyanide Precision"** (ciano, claro+escuro automático, pill) implementada — ADR-006 / TASK-REF-009. Paleta funcional do mapa preservada.
