> ⚠️ **DRAFT: requisitos de um produto futuro, NÃO implementados.** Os 25 RFs abaixo ("HubFlow Logistics": IAM, escalas, marketplace, fila virtual, bipagem) descrevem um sistema-alvo hipotético. O código atual implementa apenas: upload de planilha → visualização de rota em mapa + tabelas. Mantido como rascunho de caminhos possíveis. (Origem: REV-001-A01.)

 Especificação de Requisitos: HubFlow Logistics (v2.0)
1. Módulo: Gestão de Identidade e Acesso (IAM)
Responsável por perfis, permissões e segurança.
RF01 - Níveis de Acesso (RBAC):
Admin de HUB: Gestão total de usuários, terminais e parâmetros do sistema.
Analista: Operação diária, cadastro de motoristas, gestão de avisos e bloqueios.
Motorista: Acesso ao app para escalas, fila e marketplace.
Terminal/Bancada: Interface simplificada para chamadas e validação de QR Code.
Segurança (Gate Control): Interface de bipagem para entrada e saída do galpão.
RF02 - Perfil Digital do Motorista: Cadastro via ID SPX (externo), Nome, Placa, Modal (Moto/Normal/Volumoso), Telefone, E-mail e Foto.
RF03 - Sistema de Pontuação (Score): Registro de performance baseado em assiduidade, cumprimento de tempos de pátio e conformidade com os processos (bipagens de entrada/saída).
2. Módulo: Disponibilidade e Escalas
Substitui os formulários manuais e organiza a agenda.
RF04 - Agenda Mensal Informativa: O motorista marca disponibilidade para o mês corrente. Abertura obrigatória todo dia 23 para o mês seguinte.
RF05 - Confirmação de Janela (Obrigatória):
Turno AM: Confirmar entre 16h e 23h do dia anterior.
Turno PM: Confirmar entre 23h do dia anterior e 10h do dia corrente.
RF06 - Aceite de Rota Escalada: O motorista recebe a rota, visualiza o mapa/resumo (conforme projeto original) e deve aceitar ou recusar (justificadamente).
RF07 - Status de Não-Escalado: Exibição clara na tela para motoristas que confirmaram disponibilidade mas não foram selecionados.
3. Módulo: Marketplace de Rotas (No-Show / Sem Aderência)
Leilão inteligente de rotas remanescentes.
RF08 - Mural de Rotas Livres: Listagem de rotas recusadas ou de No-Show (resgatadas via histórico de Planned AT).
RF09 - Algoritmo de Visibilidade:
Mesmo Modal (não escalados).
Outros Modais (não escalados).
Todos os usuários (conforme horário limite do Hub).
RF10 - Candidatura com Delay de Segurança: Ao clicar, o sistema aguarda 60s por outros candidatos antes de atribuir a rota.
RF11 - Trava de Desistência: Motorista que "pescar" no marketplace e desistir fica bloqueado para novas escolhas no mesmo turno.
4. Módulo: Fila Virtual e Gestão de Pátio (Smart Yard)
Organização física através de estados digitais.
RF12 - Check-in Georreferenciado: Botão habilitado apenas em um raio de 500m do Hub.
RF13 - Geofence Reativo de Permanência (Otimizado):
A monitoração de localização inicia apenas após o Check-in.
Se o motorista se afastar mais de 500m do Hub com status "Aguardando", o sistema o remove da fila automaticamente.
Aviso: O app notifica o usuário sobre a remoção e alerta que o retorno implicará em ir para o final da fila.
RF14 - Fila por Modal e Senha: Geração de senhas (ex: M-10, C-05). Exibição da posição e estimativa de tempo.
RF15 - Buffer de Galpão (Staging): O sistema autoriza a subida de "N" veículos (ex: 2 próximos de cada modal) para aguardar dentro do galpão antes da mesa liberar.
RF16 - Distribuição Proporcional de Mesas: Algoritmo de chamada baseado em porcentagem editável (ex: 30% Moto, 40% Normal, 30% Volumoso).
5. Módulo: Fluxo de Bipagem (Gate & Terminal)
Controle de transição e tempos de processo.
RF17 - Gate de Entrada (Segurança): O segurança bipa o QR Code do motorista (validando CNH/Perfil). O status muda para "Em Preparo/No Galpão".
RF18 - Validação de Terminal (Mesa): O motorista apresenta seu QR Code ao bipador. O leitor de mão do terminal bipa o celular para iniciar a carga.
RF19 - Conferência Auxiliar (App): Contador simples no app do motorista para ele conferir a quantidade de pacotes enquanto são entregues pelo bipador.
RF20 - Cronômetro de Arrumação (Packing Timer): Inicia assim que o terminal finaliza a bipagem. Exibição de alerta sonoro/visual para não demorar na vaga.
RF21 - Gate de Saída (Finalização): O segurança bipa o QR Code de saída. Encerra o ciclo da rota e o tempo de pátio.
RF22 - Finalização Manual (Analista): Em caso de esquecimento de bipe de saída, o analista encerra a rota manualmente, gerando perda automática de score para o motorista.
6. Módulo: Comunicação e Status (Hub News)
Central de informações dinâmicas.
RF23 - Status Operacional: Semáforo visual (Aberto/Fechado e previsão de abertura/fechamento).
RF24 - Plantão Ativo: Lista de analistas e responsáveis pelo monitoramento em atividade, com link direto para WhatsApp.
RF25 - Mapa de Risco Colaborativo: Botão SOS para reporte de incidentes (tiroteios/áreas de risco) visível para todos em rota.
⚙️ Máquina de Estados do Motorista (Fluxo de Status)
Para o seu código, o motorista passará por estes estados obrigatoriamente:
DISPONÍVEL (Em casa)
ESCALADO (Confirmou a rota)
NA_FILA_EXTERNA (Fez Check-in / Geofence Ativado)
AUTORIZADO_SUBIR (Notificado para entrar no galpão)
NO_GALPAO (Segurança bipou a entrada)
EM_BIPAGEM (Terminal bipou o celular)
ARRUMANDO_CARGA (Terminal finalizou / Cronômetro correndo)
FINALIZADO (Segurança bipou a saída)
Regra de Negócio: Finalização Tardia Automática
Se o motorista não bipar a saída em até 2 horas após o fim da bipagem, o sistema encerra a rota como "Saída Incompleta".
Consequência: Perda automática de 10 pontos de Score.
Justificativa: Prejuízo à acurácia da fila e ocupação fantasma de vaga no pátio.