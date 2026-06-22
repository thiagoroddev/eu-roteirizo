# Protótipo — roteamento local (Ipanema)

> ⚠️ **Descartável e isolado do projeto.** Não faz parte do app. Existe só pra validar a viabilidade do Nível B (traçar a rua respeitando mão de direção, sem API de roteirização) antes de mexer no código de verdade.

## O que ele prova

Que dá pra, **100% no navegador, sem API paga de rota**:

1. baixar a malha viária de Ipanema do OpenStreetMap (Overpass);
2. montar um grafo direcionado que respeita a mão única;
3. achar o menor caminho com A* escrito do zero;
4. mostrar a quilometragem percorrendo as ruas e quais ruas você passaria;
5. trocar o destino e ver o trajeto recalcular na hora.

## Como rodar

Abra o `index.html` no navegador (duplo clique costuma bastar). Ele baixa as ruas sozinho ao abrir.

Se o navegador bloquear a requisição por estar em `file://`, rode um servidor local na pasta:

```bash
npx serve .
# ou
python -m http.server
```

e acesse o endereço que aparecer.

## Como testar a mão de direção (o teste que importa)

1. Defina a **partida** (1º clique) numa esquina.
2. Clique num **destino** do outro lado de uma rua de mão única.
3. Repare: o traço **contorna** — ele não corta na contramão. Compare clicando destinos em sentidos opostos na mesma rua e veja a quilometragem mudar.

Ipanema tem várias transversais de mão única alternada entre a Visconde de Pirajá e a praia — bom lugar pra conferir a olho.

## Limites conhecidos (é protótipo)

- A* didático (varredura linear da fronteira). Para o app, trocar por fila de prioridade (heap) deixa mais rápido.
- Sem cache: rebaixa a malha a cada abertura. No app, guardar no IndexedDB resolve (e habilita offline).
- Map matching simples (nó mais próximo). Suficiente pra validar; refinável depois.
- Velocidade/tempo de entrega ainda não entram aqui — o foco é só provar o traçado + distância.
