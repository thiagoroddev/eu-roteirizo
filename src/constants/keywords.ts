/**
 * Normalized keyword lists for address inference.
 * All entries are lowercased, accent-stripped, trimmed, and deduplicated.
 */

/**
 * Normalizes a string by removing accents, converting to lowercase, and trimming whitespace.
 *
 * @param {string} word - The word to normalize
 * @returns {string} The normalized word
 */
const normalize = (word: string) =>
  word
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * Deduplicates a list of strings after normalizing them.
 *
 * @param {string[]} list - The list of strings to deduplicate
 * @returns {string[]} The deduplicated and normalized list
 */
function dedupeNormalized(list: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of list) {
    const n = normalize(item);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    normalized.push(n);
  }

  return normalized;
}

const residentialRaw = [
  "atras",
  "antes",
  "ao lado",
  "ap",
  "apartamento",
  "apt",
  "apto",
  "aprt",
  "beco",
  "beco do",
  "bl",
  "bloco",
  "c",
  "casa",
  "condominio",
  "cond",
  "cs",
  "cobertura",
  "cb",
  "cbt",
  "do lado",
  "depois",
  "em frente",
  "enfrente",
  "entrar",
  "entrada",
  "fds",
  "frente",
  "fundos",
  "hotel",
  "interfone",
  "interf",
  "lado",
  "perto",
  "portao",
  "portaria",
  "predio",
  "proximo",
  "quarto",
  "residencial",
  "referencia",
  "rua",
  "rua do",
  "sobrado",
  "terreo",
  "travessa",
  "travessa do",
  "vila",
  "vizinho",
];

const commercialRaw = [
  "8h",
  "9h",
  "17h",
  "18:00",
  "18h",
  "18hs",
  "19:00",
  "19h",
  "19hs",
  "academia",
  "advocacia",
  "aguas do rio",
  "armazem",
  "assoc",
  "associacao",
  "assossiacao",
  "atelie",
  "autoescola",
  "autopecas",
  "banca",
  "bacalhau",
  "bar",
  "barbearia",
  "barraca",
  "banco",
  "bazar",
  "bebidas",
  "beleza",
  "biblioteca",
  "boticario",
  "bolos",
  "bolo",
  "box",
  "bufe",
  "buffet",
  "brecho",
  "capotaria",
  "cafe",
  "cafeteria",
  "carteiro",
  "cartorio",
  "centro",
  "cedae",
  "chaveiro",
  "china",
  "clinica",
  "colegio",
  "comercial",
  "comercio",
  "comunitario",
  "consultorio",
  "concessionaria",
  "construcao",
  "conveniencia",
  "confeitaria",
  "confeccoes",
  "conserto",
  "clube",
  "creche",
  "cultural",
  "deposito",
  "departamento",
  "despachante",
  "design",
  "doceria",
  "distribuidora",
  "domingo",
  "drogaria",
  "empresa",
  "ensino",
  "estacao",
  "estacionamento",
  "escola",
  "farmacia",
  "farma",
  "farmalife",
  "fabrica",
  "firma",
  "financeiro",
  "financeira",
  "fogoes",
  "funcionario",
  "galeria",
  "galpao",
  "gasolina",
  "grafica",
  "hort",
  "hortfrut",
  "hortifruti",
  "igreja",
  "ime",
  "imobiliaria",
  "imobiliarias",
  "instituto",
  "industria",
  "informatica",
  "japa",
  "japones",
  "jp fogoes",
  "kiosque",
  "laboratorio",
  "lanchonete",
  "lava",
  "lj",
  "loja",
  "lojas",
  "lojao",
  "loteria",
  "material",
  "marcenaria",
  "mecanico",
  "mercado",
  "mercadinho",
  "mercearia",
  "metro",
  "moradores",
  "moto taxi",
  "mototaxi",
  "oficina",
  "otica",
  "odontologia",
  "odontologico",
  "odonto",
  "padaria",
  "pacheco",
  "panificacao",
  "papelaria",
  "pet",
  "petz",
  "pizzaria",
  "piso",
  "pneu",
  "pneus",
  "posto",
  "posto de saude",
  "policlinica",
  "quiosque",
  "restaurante",
  "refrigeracao",
  "sacolao",
  "sala",
  "sl",
  "sla",
  "salao",
  "salon",
  "saude",
  "secretaria",
  "segunda",
  "sexta",
  "seg",
  "sex",
  "setor",
  "shopping",
  "shop",
  "solucoes",
  "sorveteira",
  "sorveteria",
  "sony",
  "stand",
  "supermercado",
  "sushi",
  "tabacaria",
  "tijolinhos",
  "trailer",
  "upa",
  "veterinaria",
  "vidraceiro",
  "vidracaria",
  "vila olimpica",
  "xerox",
  "zig zag",
];

export const RESIDENTIAL_KEYWORDS = dedupeNormalized(residentialRaw);
export const COMMERCIAL_KEYWORDS = dedupeNormalized(commercialRaw);

export type KeywordList = typeof RESIDENTIAL_KEYWORDS | typeof COMMERCIAL_KEYWORDS;

/**
 * Normalizes a keyword using the same logic as the keyword lists.
 *
 * @param {string} word - The keyword to normalize
 * @returns {string} The normalized keyword
 */
export const normalizeKeyword = normalize;
