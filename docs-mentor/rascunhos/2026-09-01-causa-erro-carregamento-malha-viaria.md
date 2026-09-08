qual era a causa do problema e qual era a solução se não fosse essa?

A resposta curta, e desconfortável

A causa raiz nunca foi provada. O que foi provado é onde a falha acontecia, não por quê. E isso importa: se você fechar essa tarefa achando que sabe a causa, vai tomar a próxima decisão em cima de um chute.

Vou separar em três camadas: o que a evidência prova, o que ela sugere, e o que ela descarta.

1. O que está provado
POST https://overpass-api.de/api/interpreter net::ERR_CONNECTION_TIMED_OUT

Isso diz uma coisa só, mas diz com certeza: a conexão TCP não completou. O navegador mandou o pacote SYN e nunca recebeu resposta. Não houve handshake, não houve TLS, não houve requisição HTTP, não houve resposta. Morreu na etapa 2 das cinco.

Tem um detalhe numérico que reforça e que passou meio despercebido no registro: as tentativas no Wi-Fi duravam ~21,3 s. Esse número não é aleatório nem é o seu timeout de 30 s. É o orçamento padrão de retransmissão de SYN do sistema operacional — no Windows, três tentativas em 0 s, 3 s e 9 s, desistindo por volta de 21 s. Ou seja: o valor bate exatamente com "o SO tentou abrir a conexão e desistiu", o que confirma independentemente a leitura do Console.

2. As hipóteses que sobraram (e como decidir entre elas)

Nenhuma foi testada. Ordeno por plausibilidade dada a evidência:

A) Bloqueio de IP no lado do Overpass — a mais forte

Um firewall configurado para DROP (descartar em silêncio) produz exatamente ERR_CONNECTION_TIMED_OUT. Um REJECT produziria ERR_CONNECTION_REFUSED, que não foi o que apareceu. E há um motivo para você estar na lista: até o reteste, o osm.ts fazia 3 tentativas automáticas, inclusive em 429 — e o aviso do operador de 11/08/2026 que você mesmo registrou diz que insistência gera bloqueio.

Como confirmar: curl -v https://overpass-api.de/api/status do Wi-Fi de casa. Se travar em ~21 s e do celular em dados móveis responder, é bloqueio por IP. Esse teste nunca foi feito — você testou /api/status só em dados móveis.

B) Rota de rede quebrada entre a sua operadora e a Alemanha

Blackhole em algum salto do caminho, ou IPv6 anunciado pelo roteador sem conectividade real. Produz o mesmo sintoma.

Como confirmar: tracert overpass-api.de do Wi-Fi. Se morre num salto intermediário, é rota. E curl -4 vs curl -6 separa o caso do IPv6.

C) Algo local do cliente

O Console tinha avisos de service worker e runtime.lastError na mesma sessão. Você fez certo em não presumir nexo causal — mas também não excluiu.

Como confirmar: janela anônima, com extensões desligadas, service worker desregistrado.

⚠️ A incoerência que ninguém explicou

Em dados móveis, /api/status respondeu (2 slots livres), mas o POST do app falhou em 276–1034 ms. Uma falha em 276 ms não é um timeout de conexão — é rápida demais. Ou seja: naquele teste, o modo de falha era outro, e nunca foi capturado no Console.

Só que os dois testes também não eram comparáveis: um era um GET digitado na barra de endereços; o outro, um POST cross-origin disparado por uma página. Diferem em método, em origem e possivelmente em rota.

É bem possível que existissem dois problemas distintos sendo tratados como um. Isso continua em aberto.

3. O que está descartado
Hipótese	Por que caiu
CORS	Requisição era simples (sem preflight) e o Overpass manda ACAO: *. Além disso, bloqueio de CORS exige que a resposta tenha chegado — e nenhuma chegou.
Fila / 429	429 é uma resposta. Não houve resposta nenhuma.
Payload grande	ADR-010 já tinha medido: 149 KB, e o totalMs ≈ networkMs.
Bug no buildGraph	Nunca chegou a rodar.
4. Se não fosse o proxy, quais eram as opções

Da mais barata à mais estrutural:

Rotação de espelhos no cliente

A mesma lista (lz4, z, kumi.systems) percorrida pelo próprio osm.ts, sem infraestrutura nenhuma. Seu plano previa isso e desativou de propósito — "sem rotação automática de endpoints" — para não mascarar o diagnóstico.

✅ Custo zero, resolve hipótese A (bloqueio no host específico)
❌ Não resolve B se a rota Brasil→Europa for o problema
❌ Não muda o IP de saída: se o bloqueio for da rede do OSM inteira, todos os espelhos oficiais caem junto
Mudar a forma da requisição

GET com ?data= em vez de POST. Cinco minutos de trabalho, e teria sido um teste valioso: se GET funcionasse e POST não, isso apontaria para inspeção de tráfego no caminho.

✅ Trivial de testar
❌ Aposta baixa, e limita o tamanho da query
Instância própria do Overpass

Você mesmo hospeda o serviço.

✅ Sem rate limit, sem depender de terceiro
❌ Precisa de servidor 24/7, importação de horas, gigabytes de disco — contradiz a RNF-13 e o "sem backend" do projeto. Descartável de imediato.
A resposta da ADR-010: tileset próprio em PMTiles no R2

Que é o que já estava decidido antes do incidente. Muda a natureza do problema: em vez de consultar um banco ao vivo, você baixa arquivo estático por range request de uma CDN.

✅ Elimina fila, 429, timeout de servidor e dependência de terceiro
✅ Custo previsível (centavos/mês), dentro do free tier
❌ Pipeline de build para manter, e ainda precisa do Worker para servir — ou seja, "sem proxy" não é uma opção de verdade nesse caminho
As não-soluções

Aumentar o timeout e melhorar mensagens de erro. Seus próprios critérios de aceite já dizem: "Apenas mensagens melhores ou aumento de timeout não satisfazem a tarefa."

O ponto que eu levaria da tarefa inteira

O proxy funcionou porque muda todas as variáveis de uma vez: IP de saída, rota, servidor de destino e política de retry. Ele é imune ao diagnóstico — resolve A, B e boa parte de C sem precisar saber qual era.

Isso é uma virtude sob pressão (o app estava quebrado) e um defeito depois: você tem um app funcionando e zero conhecimento novo sobre por que ele quebrou. Se a causa era bloqueio por insistência, ela vai se repetir quando o Worker acumular tráfego de vários usuários sob um único IP de saída — e aí o bloqueio pega todo mundo de uma vez, não um usuário.

Os três curl da seção 2 custam dez minutos e ainda podem ser rodados. Se quiser, adiciono essa análise como um módulo 07-Causa-Raiz-em-Aberto.md na pasta.