# Futuro Administrador — Especificação (design aprovado em 01/11/2026)

## Objetivo
Jogo 3D de corrida sem fim no navegador. Um aluno de Administração corre pelo corredor
da faculdade, pega as 15 disciplinas, desvia de reprovações, festas e bebidas e, no fim,
entra no auditório para receber o diploma. Serve também para aprender como um jogo é feito.

## Telas
1. **Seleção** — 6 bonecos (low-poly), campo de nome, título "Futuro Administrador <nome>".
2. **Corredor** — corrida em 3 faixas.
3. **Auditório** — cena da formatura com entrega do diploma e confete.
4. **Game over** — "Você trancou o curso", com opção de tentar de novo.

## Personagens
| # | Descrição |
|---|-----------|
| 1 | Homem negro, cabelo preto curto |
| 2 | Homem branco, cabelo preto |
| 3 | Homem branco, cabelo roxo curto |
| 4 | Mulher negra, cabelo preto longo |
| 5 | Mulher branca, cabelo loiro longo |
| 6 | Mulher branca, cabelo azul longo |

## Regras
- Controles: ← → (ou A/D) trocam de faixa; Espaço/↑ (ou W) pula; no celular, deslizar o dedo.
- Disciplina (livro): +100 pontos e marca a disciplina. Só aparecem disciplinas ainda não pegas.
- Obstáculos: Reprovação (placa alta), Festa (caixa de som alta) — desviar; Bebida (baixa) — dá para pular.
- Bater: −1 vida (3 no total) e 1,6 s piscando sem levar dano.
- Velocidade cresce com o tempo; distância também dá pontos.
- 15/15 disciplinas → a porta do Auditório aparece no fim do corredor → formatura.

## Disciplinas (15)
TGA, Marketing, RH, Economia, Valuation, Produtos Financeiros, Matemática Financeira,
Contabilidade, Estatística, Finanças Corporativas, Logística, Direito Empresarial,
Empreendedorismo, Estratégia, Gestão de Projetos.

## Visual
HUD como na imagem de referência: painel esquerdo (rosto, nome, vidas, pontos) e painel
direito (Progresso acadêmico, barra X/15, últimas disciplinas). Estilo low-poly.

## Técnica
HTML + Three.js r128 (CDN, scripts clássicos — abre com duplo clique, sem instalar nada).
Um arquivo por responsabilidade em `js/`.
