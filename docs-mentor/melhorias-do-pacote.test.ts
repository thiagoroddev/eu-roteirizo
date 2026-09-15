/**
 * Testes das correcoes feitas no `.mentor/` deste projeto, registradas em
 * `melhorias-do-pacote.md` (TASK-CHORE-025).
 *
 * Cada teste protege uma correcao local: se uma atualizacao do mentor-agent sobrescrever a
 * correcao antes de ela chegar ao pacote oficial, o teste falha e avisa.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MARCA_PLANO_NO_TITULO } from "../.mentor/scripts/tipos.ts";

const RAIZ = resolve(__dirname, "..");

describe("marca (plano) no titulo do PR de planejamento", () => {
  it("o exemplo de PR de planejamento do entrega.md passa na marca (plano)", () => {
    const entrega = readFileSync(join(RAIZ, ".mentor", "processos", "entrega.md"), "utf8");
    const exemplo = entrega.match(/PR de planejamento[^\n]*\(ex\.: `([^`]+)`\)/)?.[1];

    expect(exemplo).toBeDefined();
    expect(MARCA_PLANO_NO_TITULO.test(exemplo ?? "")).toBe(true);
  });
});

/** Mesma pasta com as letras trocadas acima do projeto. So existe em sistema que ignora maiusculas. */
const comOutraCaixaAcima = (pasta: string) => dirname(pasta).toUpperCase() + sep + basename(pasta);
const IGNORA_MAIUSCULAS = tmpdir() !== tmpdir().toUpperCase() && existsSync(tmpdir().toUpperCase());

describe.skipIf(!IGNORA_MAIUSCULAS)("verificar com o projeto aberto por outra caixa", () => {
  let projeto = "";
  let saida = "";

  beforeAll(() => {
    projeto = mkdtempSync(join(tmpdir(), "mentor-caixa-"));
    const mentor = (raiz: string, comando: string) => {
      const r = spawnSync(process.execPath, [join(RAIZ, "mentor.mjs"), comando], {
        cwd: RAIZ,
        encoding: "utf8",
        env: { ...process.env, MENTOR_RAIZ: raiz },
      });
      return `${r.stdout ?? ""}${r.stderr ?? ""}`;
    };
    mentor(projeto, "init");
    writeFileSync(join(projeto, "docs-mentor", "alvo.md"), "# Alvo\n");
    writeFileSync(join(projeto, "docs-mentor", "nota.md"), "[certo](alvo.md) e [errado](ALVO.md)\n");
    saida = mentor(comOutraCaixaAcima(projeto), "verificar");
  }, 60_000);

  afterAll(() => {
    if (projeto) rmSync(projeto, { recursive: true, force: true });
  });

  it("caixa diferente acima da raiz do projeto nao reprova link certo", () => {
    expect(saida).not.toContain('link "alvo.md"');
  });

  it("caixa errada dentro do projeto continua acusada", () => {
    expect(saida).toContain('link "ALVO.md" so resolve porque este sistema de arquivos ignora maiusculas');
  });
});
