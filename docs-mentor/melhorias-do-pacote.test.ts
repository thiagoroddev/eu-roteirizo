/**
 * Testes das correcoes feitas no `.mentor/` deste projeto, registradas em
 * `melhorias-do-pacote.md` (TASK-CHORE-025, TASK-CHORE-026 e TASK-CHORE-027).
 *
 * Cada teste protege uma correcao local: se uma atualizacao do mentor-agent sobrescrever a
 * correcao antes de ela chegar ao pacote oficial, o teste falha e avisa.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MARCA_PLANO_NO_TITULO } from "../.mentor/scripts/tipos.ts";

const RAIZ = resolve(__dirname, "..");

/** Roda o mentor deste projeto sobre outra pasta de projeto, sem tocar no projeto real. */
const mentor = (raiz: string, ...comando: string[]) => {
  const r = spawnSync(process.execPath, [join(RAIZ, "mentor.mjs"), ...comando], {
    cwd: RAIZ,
    encoding: "utf8",
    env: { ...process.env, MENTOR_RAIZ: raiz },
  });
  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
};

const git = (raiz: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd: raiz, encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(" ")} falhou:\n${r.stdout ?? ""}${r.stderr ?? ""}`);
  }
};

describe("marca (plano) no titulo do PR de planejamento", () => {
  it("o exemplo de PR de planejamento do entrega.md passa na marca (plano)", () => {
    const entrega = readFileSync(join(RAIZ, ".mentor", "processos", "entrega.md"), "utf8");
    const exemplo = entrega.match(/PR de planejamento[^\n]*\(ex\.: `([^`]+)`\)/)?.[1];

    expect(exemplo).toBeDefined();
    expect(MARCA_PLANO_NO_TITULO.test(exemplo ?? "")).toBe(true);
  });
});

describe("triagem de auditoria em PR de planejamento", () => {
  let projeto = "";
  let saidaPlano = "";
  let saidaLight = "";
  let saidaTarefaAberta = "";

  beforeAll(() => {
    projeto = mkdtempSync(join(tmpdir(), "mentor-plano-auditoria-"));
    mentor(projeto, "init");
    git(projeto, "init", "-b", "main");
    git(projeto, "config", "user.name", "Teste Mentor");
    git(projeto, "config", "user.email", "teste@mentor.invalid");
    git(projeto, "add", ".");
    git(projeto, "commit", "-m", "docs: estado inicial");
    git(projeto, "switch", "-c", "plan/triagem-auditoria");

    mkdirSync(join(projeto, "docs-mentor", "auditorias"), { recursive: true });
    mkdirSync(join(projeto, "docs-mentor", "dividas"), { recursive: true });
    mkdirSync(join(projeto, "docs-mentor", "tarefas", "abertas"), { recursive: true });
    writeFileSync(join(projeto, "docs-mentor", "auditorias", "AUD-004.json"), '{"id":"AUD-004"}\n');
    writeFileSync(join(projeto, "docs-mentor", "dividas", "dividas.json"), "[]\n");
    writeFileSync(join(projeto, "docs-mentor", "tarefas", "abertas", "TASK-DOC-011.json"), '{"id":"TASK-DOC-011","estado":"aberta"}\n');
    writeFileSync(join(projeto, "docs-mentor", "tarefas", "reserva.md"), "# Reserva\n\nTASK-DOC-011\n");
    git(projeto, "add", ".");
    git(projeto, "commit", "-m", "docs(plano): triar auditoria");

    saidaPlano = mentor(projeto, "pronto-para-merge", "--titulo", "docs(plano): registrar a AUD-004 e criar a TASK-DOC-011 e a DT-012", "--base", "main");
    saidaLight = mentor(projeto, "pronto-para-merge", "--titulo", "docs(light): registrar e triar a AUD-004, criar a TASK-DOC-011 e a DT-012 e anotar melhorias do pacote", "--base", "main");

    writeFileSync(join(projeto, "docs-mentor", "tarefas", "abertas", "TASK-CHORE-999.json"), '{"id":"TASK-CHORE-999","estado":"aberta"}\n');
    saidaTarefaAberta = mentor(projeto, "pronto-para-merge", "--titulo", "fix(TASK-CHORE-999): corrigir o gate", "--base", "main");
  }, 60_000);

  afterAll(() => {
    if (projeto) rmSync(projeto, { recursive: true, force: true });
  });

  it("escopos explicitos prevalecem sobre IDs citados no assunto", () => {
    expect(saidaPlano).toContain("Pronto para merge: PR de planejamento (plano) validado.");
    expect(saidaPlano).not.toContain('TASK-DOC-011 esta "aberta"');
    expect(saidaLight).toContain("Pronto para merge: PR Light, sem tarefa.");
    expect(saidaLight).not.toContain('TASK-DOC-011 esta "aberta"');
  });

  it("PR de planejamento aceita os registros produzidos pela triagem de auditoria", () => {
    expect(saidaPlano).not.toContain("docs-mentor/auditorias/AUD-004.json");
    expect(saidaPlano).not.toContain("docs-mentor/dividas/dividas.json");
    expect(saidaPlano).toContain("Pronto para merge: PR de planejamento (plano) validado.");
  });

  it("PR de entrega continua exigindo a tarefa concluida", () => {
    expect(saidaTarefaAberta).toContain('TASK-CHORE-999 esta "aberta"');
    expect(saidaTarefaAberta).not.toContain("Pronto para merge:");
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

describe("contexto.json sem regravacao automatica", () => {
  let projeto = "";
  let depoisDoPrimeiroGerar = "";
  let depoisDoSegundoGerar = "";
  let saidaDoDoctor = "";
  let depoisDoPrimeiroDoctor = "";
  let depoisDoSegundoDoctor = "";

  beforeAll(() => {
    projeto = mkdtempSync(join(tmpdir(), "mentor-contexto-"));
    const contexto = () => readFileSync(join(projeto, "docs-mentor", "contexto.json"), "utf8");
    mentor(projeto, "init");
    mentor(projeto, "gerar");
    depoisDoPrimeiroGerar = contexto();
    mentor(projeto, "gerar");
    depoisDoSegundoGerar = contexto();
    saidaDoDoctor = mentor(projeto, "doctor");
    depoisDoPrimeiroDoctor = contexto();
    mentor(projeto, "doctor");
    depoisDoSegundoDoctor = contexto();
  }, 90_000);

  afterAll(() => {
    if (projeto) rmSync(projeto, { recursive: true, force: true });
  });

  it("gerar duas vezes sem mudanca real nao muda o contexto.json", () => {
    expect(depoisDoSegundoGerar).toBe(depoisDoPrimeiroGerar);
  });

  it("doctor duas vezes nao muda o contexto.json", () => {
    expect(depoisDoSegundoDoctor).toBe(depoisDoPrimeiroDoctor);
  });

  it("doctor mostra lembretes sem grava-los no contexto.json", () => {
    expect(saidaDoDoctor).toContain("⚠");
    expect(JSON.parse(depoisDoPrimeiroDoctor).lembretes).toEqual([]);
  });
});
