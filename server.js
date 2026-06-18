const express = require('express');
const WebSocket = require('ws');
const http = require('http' );
const path = require('path');
const GameState = require('./game/gameState');
const { CARDS } = require('./game/cards');

const app = express();
const server = http.createServer(app );
const wss = new WebSocket.Server({ server });

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Armazenar jogadores e jogos
const players = new Map();
const games = new Map();
const waitingPlayers = [];

// Quando um cliente se conecta
wss.on('connection', (ws) => {
  let playerId = null;
  let gameId = null;

  console.log('🔌 Novo cliente conectado');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Mensagem:', data.type);

      switch (data.type) {
        case 'join':
          playerId = data.playerId;
          players.set(playerId, ws);
          console.log(`👤 ${playerId} entrou`);

          // Se há um jogador esperando, iniciar jogo
          if (waitingPlayers.length > 0) {
            const player1Id = waitingPlayers.pop();
            const player2Id = playerId;
            gameId = `${player1Id}-${player2Id}`;

            const gameState = new GameState(player1Id, player2Id);
            games.set(gameId, gameState);

            console.log(`🎮 Jogo iniciado: ${player1Id} vs ${player2Id}`);

            // Notificar ambos os jogadores
            const player1Ws = players.get(player1Id);
            const player2Ws = players.get(player2Id);

            const gameStartMessage = {
              type: 'gameStart',
              gameId: gameId
            };

            if (player1Ws) {
              player1Ws.send(JSON.stringify({
                ...gameStartMessage,
                yourSide: 'player1',
                state: gameState.getState(),
                hand: gameState.getHand('player1')
              }));
            }
            if (player2Ws) {
              player2Ws.send(JSON.stringify({
                ...gameStartMessage,
                yourSide: 'player2',
                state: gameState.getState(),
                hand: gameState.getHand('player2')
              }));
            }
          } else {
            // Adicionar à fila de espera
            waitingPlayers.push(playerId);
            console.log(`⏳ ${playerId} aguardando oponente...`);
            ws.send(JSON.stringify({ type: 'waiting' }));
          }
          break;

        case 'playCard':
          if (gameId && games.has(gameId)) {
            const gameState = games.get(gameId);
            const cardId = data.cardId;
            const playerSide = data.playerSide;

            // Verificar se é a vez do jogador
            if (gameState.getCurrentTurn() !== playerSide) {
              console.log(`❌ ${playerId} tentou jogar fora de sua vez!`);
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Não é sua vez!' 
              }));
              return;
            }

            // Validar e jogar a carta
            if (gameState.playCard(playerSide, cardId)) {
              console.log(`🎴 ${playerId} jogou carta ${cardId}`);

              // Enviar estado atualizado
              broadcastGameState(gameState);

              // Passar turno automaticamente após jogar
              gameState.nextTurn();
              broadcastGameState(gameState);
            } else {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Não conseguiu jogar essa carta!' 
              }));
            }
          }
          break;

        case 'passRound':
          if (gameId && games.has(gameId)) {
            const gameState = games.get(gameId);
            const playerSide = data.playerSide;

            // Verificar se é a vez do jogador
            if (gameState.getCurrentTurn() !== playerSide) {
              console.log(`❌ ${playerId} tentou passar fora de sua vez!`);
              return;
            }

            gameState.passRound(playerSide);
            console.log(`⏭️  ${playerId} passou a vez`);

            // Verificar se ambos passaram
            if (gameState.shouldEndRound()) {
              console.log('🏁 Rodada finalizada');
              gameState.endRound();

              const player1Ws = players.get(gameState.player1Id);
              const player2Ws = players.get(gameState.player2Id);

              if (gameState.isGameOver()) {
                console.log(`🏆 Jogo finalizado! Vencedor: ${gameState.getWinner()}`);
                
                const gameEndMessage = {
                  type: 'gameEnd',
                  winner: gameState.getWinner(),
                  state: gameState.getState()
                };

                if (player1Ws) player1Ws.send(JSON.stringify(gameEndMessage));
                if (player2Ws) player2Ws.send(JSON.stringify(gameEndMessage));

                games.delete(gameId);
              } else {
                // Próxima rodada
                broadcastGameState(gameState);
              }
            } else {
              // Passar turno para o outro jogador
              gameState.nextTurn();
              broadcastGameState(gameState);
            }
          }
          break;
      }
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  });

  ws.on('close', () => {
    if (playerId) {
      console.log(`🔌 ${playerId} desconectou`);
      players.delete(playerId);
      const index = waitingPlayers.indexOf(playerId);
      if (index !== -1) {
        waitingPlayers.splice(index, 1);
      }
    }
  });
});

// Função para enviar estado do jogo para ambos os jogadores
function broadcastGameState(gameState) {
  const player1Ws = players.get(gameState.player1Id);
  const player2Ws = players.get(gameState.player2Id);

  const stateMessage = {
    type: 'stateUpdate',
    state: gameState.getState()
  };

  if (player1Ws) {
    player1Ws.send(JSON.stringify({
      ...stateMessage,
      hand: gameState.getHand('player1')
    }));
  }
  if (player2Ws) {
    player2Ws.send(JSON.stringify({
      ...stateMessage,
      hand: gameState.getHand('player2')
    }));
  }
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎮 Servidor Deckwacht rodando em http://localhost:${PORT}` );
  console.log(`📡 WebSocket pronto para conexões\n`);
});
