# Plano de implementação

Cada etapa gera algo que dá para ver funcionando no navegador.

1. **Base** — `index.html`, `style.css`, `js/util.js` (texturas de texto, caixas).
2. **Personagens** — `js/personagens.js`: os 6 bonecos montados com cubos, animação de
   corrida, retratos (imagens) para os cartões e para o HUD.
3. **Corredor** — `js/corredor.js`: segmentos de 16 m (piso, faixas, armários, portas
   numeradas, murais, plantas, luzes) reciclados para parecer infinito.
4. **Itens** — `js/itens.js`: livros das disciplinas, obstáculos, colisão e a porta do auditório.
5. **HUD** — `js/hud.js`: painéis de vidas, pontos e progresso.
6. **Auditório** — `js/auditorio.js`: palco, plateia, reitor, entrega do diploma, confete.
7. **Jogo** — `js/main.js`: estados (seleção → jogando → transição → auditório / fim),
   controles de teclado e toque, câmera.
8. **Teste** — jogar no navegador: seleção, troca de faixa, pulo, colisão, 15 disciplinas,
   porta, formatura, game over e "jogar de novo".
