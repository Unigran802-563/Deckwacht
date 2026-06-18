// Variáveis globais
let ws = null;
let playerId = null;
let roomCode = null;
let yourSide = null;
let gameState = null;
let hand = [];
let selectedCard = null;

// Mapa de cartas para referência rápida
const CARDS_MAP = {
  1: { name: 'Reinhardt', tier: 3, role: 'tank', emoji: '🛡️', color: '#d32f2f' },
  2: { name: 'Zarya', tier: 2, role: 'tank', emoji: '⚡', color: '#ff6f00' },
  3: { name: 'D.Va', tier: 2, role: 'tank', emoji: '🤖', color: '#7b1fa2' },
  4: { name: 'Sigma', tier: 1, role: 'tank', emoji: '🌀', color: '#0288d1' },
  5: { name: 'Tracer', tier: 2, role: 'damage', emoji: '⏱️', color: '#fbc02d' },
  6: { name: 'Widowmaker', tier: 3, role: 'damage', emoji: '🎯', color: '#6a1b9a' },
  7: { name: 'Soldier 76', tier: 2, role: 'damage', emoji: '🔫', color: '#1976d2' },
  8: { name: 'Genji', tier: 2, role: 'damage', emoji: '⚔️', color: '#00897b' },
  9: { name: 'Mercy', tier: 1, role: 'support', emoji: '😇', color: '#f57c00' },
  10: { name: 'Lúcio', tier: 2, role: 'support', emoji: '🎵', color: '#00bcd4' },
  11: { name: 'Zenyatta', tier: 3, role: 'support', emoji: '☮️', color: '#fdd835' },
  12: { name: 'Ana', tier: 2, role: 'support', emoji: '💉', color: '#5e35b1' }
};

// Descrições dos kits
const CARD_KITS = {
  1: {
    advantage: '+1★ se houver Support na lane',
    disadvantage: '-1★ se jogado sozinho',
    ability: 'Barreira: Próxima carta inimiga vale 0★'
  },
  2: {
    advantage: '+1★ quando inimigo joga Damage',
    disadvantage: null,
    ability: 'Graviton: Agrupa 2 cartas inimigas (somam metade)'
  },
  3: {
    advantage: '+1★ por cada Damage aliado',
    disadvantage: null,
    ability: 'Ejeção: Remove 1 carta inimiga aleatória'
  },
  4: {
    advantage: null,
    disadvantage: '-1★ contra Damages',
    ability: 'Absorção: Copia +1★ do inimigo mais forte'
  },
  5: {
    advantage: 'Pode ser jogada em qualquer lane',
    disadvantage: '-1★ se for única na lane',
    ability: 'Recall: Volta para a mão após a rodada'
  },
  6: {
    advantage: '+1★ se inimigo tem 3+ cartas',
    disadvantage: null,
    ability: 'Tiro de Precisão: -2★ no inimigo mais forte'
  },
  7: {
    advantage: '+1★ se houver outro Damage',
    disadvantage: null,
    ability: 'Helix: -1★ no inimigo mais forte'
  },
  8: {
    advantage: 'Reflete habilidade do alvo',
    disadvantage: '-1★ contra Tanks',
    ability: 'Deflect: Anula próxima habilidade inimiga'
  },
  9: {
    advantage: 'Dobra estrelas do aliado vizinho',
    disadvantage: 'Vale 0★ se jogada sozinha',
    ability: 'Ressuscitar: Traz última carta descartada'
  },
  10: {
    advantage: '+1★ por cada Support aliado',
    disadvantage: null,
    ability: 'Amplificador: +1★ para todos aliados'
  },
  11: {
    advantage: '+2★ se lane vazia',
    disadvantage: null,
    ability: 'Transcendência: +1★ aliados, -1★ inimigos'
  },
  12: {
    advantage: '+1★ por cada Support aliado',
    disadvantage: '-1★ contra Tracer/Genji',
    ability: 'Nano: +2★ a um aliado escolhido'
  }
};

console.log('✅ client.js carregado!');

// ===== TELAS =====
function showMenuScreen() {
  document.getElementById('menuScreen').classList.remove('hidden');
  document.getElementById('joinScreen').classList.add('hidden');
  document.getElementById('roomCodeScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
}

function showJoinScreen() {
  const playerName = document.getElementById('playerName').value.trim();
  if (!playerName) {
    alert('Digite um nome!');
    return;
  }
  playerId = playerName;
  document.getElementById('menuScreen').classList.add('hidden');
  document.getElementById('joinScreen').classList.remove('hidden');
}

function backToMenu() {
  document.getElementById('menuScreen').classList.remove('hidden');
  document.getElementById('joinScreen').classList.add('hidden');
  document.getElementById('roomCodeScreen').classList.add('hidden');
}

// ===== CRIAR SALA =====
function createRoom() {
  const playerName = document.getElementById('playerName').value.trim();
  
  if (!playerName) {
    alert('Digite um nome!');
    return;
  }

  playerId = playerName;
  console.log(`Criando sala como: ${playerId}`);
  
  connectWebSocket();
  
  setTimeout(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'createRoom',
        playerId: playerId
      }));
    }
  }, 500);
}

// ===== ENTRAR EM SALA =====
function joinRoom() {
  const code = document.getElementById('roomCode').value.trim().toUpperCase();
  
  if (!code || code.length !== 6) {
    alert('Digite um código válido (6 caracteres)!');
    return;
  }

  playerId = document.getElementById('playerName').value.trim();
  
  if (!playerId) {
    alert('Digite um nome!');
    return;
  }

  console.log(`Entrando na sala ${code} como: ${playerId}`);
  
  connectWebSocket();
  
  setTimeout(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'joinRoom',
        playerId: playerId,
        roomCode: code
      }));
    }
  }, 500);
}

// ===== COPIAR CÓDIGO =====
function copyRoomCode() {
  const code = document.getElementById('roomCodeDisplay').textContent;
  navigator.clipboard.writeText(code).then(() => {
    alert('✅ Código copiado!');
  });
}

// ===== WEBSOCKET =====
function connectWebSocket() {
  console.log('Conectando ao WebSocket...');
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl );
  
  ws.onopen = () => {
    console.log('✅ Conectado ao servidor!');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('📨 Mensagem recebida:', data.type, data);
    
    switch (data.type) {
      case 'roomCreated':
        roomCode = data.roomCode;
        yourSide = 'player1';
        showRoomCodeScreen(roomCode);
        break;

      case 'gameStart':
        roomCode = data.roomCode;
        yourSide = data.yourSide;
        gameState = data.state;
        hand = data.hand;
        showGameScreen();
        break;

      case 'stateUpdate':
        gameState = data.state;
        hand = data.hand;
        updateGameUI();
        break;

      case 'gameEnd':
        showGameOverScreen(data.winner);
        break;

      case 'error':
        alert('❌ Erro: ' + data.message);
        break;
    }
  };
  
  ws.onerror = (error) => {
    console.error('❌ Erro WebSocket:', error);
  };
  
  ws.onclose = () => {
    console.log('🔌 Desconectado do servidor');
  };
}

// ===== TELA DE CÓDIGO DA SALA =====
function showRoomCodeScreen(code) {
  document.getElementById('menuScreen').classList.add('hidden');
  document.getElementById('joinScreen').classList.add('hidden');
  document.getElementById('roomCodeScreen').classList.remove('hidden');
  document.getElementById('roomCodeDisplay').textContent = code;
}

// ===== TELA DE JOGO =====
function showGameScreen() {
  document.getElementById('menuScreen').classList.add('hidden');
  document.getElementById('joinScreen').classList.add('hidden');
  document.getElementById('roomCodeScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');
  updateGameUI();
}

function updateGameUI() {
  if (!gameState) return;

  const gameScreen = document.getElementById('gameScreen');
  
  const isYourTurn = gameState.currentTurn === yourSide;
  const opponentSide = yourSide === 'player1' ? 'player2' : 'player1';
  
  const opponentName = yourSide === 'player1' ? gameState.player2Id : gameState.player1Id;
  const yourName = yourSide === 'player1' ? gameState.player1Id : gameState.player2Id;
  
  const yourStars = gameState.stars[yourSide];
  const opponentStars = gameState.stars[opponentSide];
  
  // Renderizar UI
  gameScreen.innerHTML = `
    <div class="game-container">
      <!-- STATUS BAR -->
      <div class="status-bar">
        <div class="live-indicator">
          <div class="live-led"></div>
          LIVE MATCH
        </div>
        <div class="map-name">DECKWACHT ARENA</div>
        <div class="status-info">
          <span>ROUND ${gameState.currentRound}/3</span>
          <span>PING: 12ms</span>
        </div>
      </div>

      <!-- SCOREPLATE -->
      <div class="scoreplate">
        <div class="team-score enemy-team">
          <div class="team-name">TALON</div>
          <div class="score-value">★ ${opponentStars}</div>
        </div>
        
        <div class="scoreplate-center">
          <div class="match-title">
            <span class="over">OVER</span><span class="strike">STRIKE</span>
          </div>
          <div class="round-info">ROUND ${gameState.currentRound} / 3</div>
          <div class="round-pips">
            ${[1, 2, 3].map(i => `
              <div class="pip ${i <= gameState.roundsWon.player1 ? 'won' : ''}"></div>
            `).join('')}
            <span style="width: 20px;"></span>
            ${[1, 2, 3].map(i => `
              <div class="pip ${i <= gameState.roundsWon.player2 ? 'won' : ''}"></div>
            `).join('')}
          </div>
        </div>
        
        <div class="team-score player-team">
          <div class="team-name">OVERWATCH</div>
          <div class="score-value">★ ${yourStars}</div>
        </div>
      </div>

      <!-- BATTLEFIELD -->
      <div class="battlefield">
        <!-- OPPONENT SIDE -->
        <div class="opponent-side">
          <h3>⚔️ ${opponentName}</h3>
          ${renderLanes(opponentSide, gameState.field, true)}
        </div>

        <!-- DIVIDER -->
        <div class="divider"></div>

        <!-- PLAYER SIDE -->
        <div class="player-side">
          <h3>🛡️ ${yourName}</h3>
          ${renderLanes(yourSide, gameState.field, false)}
        </div>
      </div>

      <!-- PLAYER HAND -->
      <div class="player-hand">
        <div class="hand-header">
          <span>🎴 SUA MÃO (${hand.length})</span>
          <span>${isYourTurn ? '⚡ SUA VEZ' : '⏳ VEZ DO OPONENTE'}</span>
        </div>
        <div class="hand-cards">
          ${hand.map(card => renderHandCard(card, isYourTurn)).join('')}
        </div>
      </div>

      <!-- ACTION BUTTONS -->
      <div class="action-buttons">
        <button 
          onclick="deployCard()" 
          class="btn-primary"
          ${!isYourTurn || !selectedCard ? 'disabled' : ''}
        >
          🚀 DEPLOY ${selectedCard ? `· ${selectedCard.name.toUpperCase()}` : ''}
        </button>
        <button 
          onclick="passRound()" 
          class="btn-secondary"
          ${!isYourTurn ? 'disabled' : ''}
        >
          ⏭️ FALL BACK
        </button>
      </div>

      <!-- TOASTS -->
      ${gameState.lastToast ? `
        <div class="ability-toast" style="position: fixed; top: 100px; left: 50%; transform: translateX(-50%); z-index: 1000;">
          ${gameState.lastToast.text}
        </div>
      ` : ''}
    </div>
  `;
}

function renderLanes(playerSide, field, isOpponent) {
  const lanes = ['melee', 'ranged', 'siege'];
  const laneNames = { melee: 'INFANTARIA', ranged: 'ARQUEIROS', siege: 'CERCO' };
  
  return lanes.map(lane => {
    const cards = field[lane][playerSide] || [];
    const totalStars = cards.reduce((sum, c) => sum + (c.totalStars || 0), 0);
    
    return `
      <div class="lane ${isOpponent ? 'opponent-lane' : 'player-lane'} ${selectedCard && selectedCard.row === lane ? 'selected' : ''}">
        <div class="lane-label">${laneNames[lane]}</div>
        <div class="lane-cards">
          ${cards.length === 0 ? '<span style="color: #888; font-size: 0.8em;">VAZIO</span>' : ''}
          ${cards.map(card => {
            const cardInfo = CARDS_MAP[card.id];
            const bgColor = cardInfo?.color || '#ff8c00';
            return `
              <div class="card-in-lane" style="--card-color: ${bgColor}; --card-color-dark: ${darkenColor(bgColor)};">
                <div class="card-emoji">${cardInfo?.emoji || '🎴'}</div>
                <div class="card-info">
                  <div class="card-name">${card.name}</div>
                  <div class="card-stars">★${card.totalStars}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="lane-power">★ ${totalStars}</div>
      </div>
    `;
  }).join('');
}

function renderHandCard(card, isYourTurn) {
  const isSelected = selectedCard && selectedCard.id === card.id;
  const cardInfo = CARDS_MAP[card.id];
  const bgColor = cardInfo?.color || '#ff8c00';
  
  return `
    <div 
      class="hand-card ${isSelected ? 'selected' : ''} ${!isYourTurn ? 'disabled' : ''}"
      onclick="${isYourTurn ? `selectCard(${card.id})` : ''}"
      onmouseenter="${isYourTurn ? `showCardDetails(${card.id})` : ''}"
      onmouseleave="hideCardDetails()"
      title="${card.name} - ${card.tier} tier"
      style="--card-color: ${bgColor}; --card-color-dark: ${darkenColor(bgColor)};"
    >
      <div class="hand-card-image">
        ${cardInfo?.emoji || '🎴'}
      </div>
      <div class="hand-card-name">${card.name}</div>
      <div class="hand-card-stars">${'★'.repeat(card.tier)}</div>
      <div class="hand-card-ability">${card.ability?.name || 'N/A'}</div>
    </div>
  `;
}

function darkenColor(color) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = 30;
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function showCardDetails(cardId) {
  const kit = CARD_KITS[cardId];
  const cardInfo = CARDS_MAP[cardId];
  
  if (!kit || !cardInfo) return;
  
  // Remover detalhes antigos
  const oldDetails = document.querySelector('.card-details');
  if (oldDetails) oldDetails.remove();
  
  const details = document.createElement('div');
  details.className = 'card-details';
  details.innerHTML = `
    <h4>${cardInfo.name}</h4>
    <p>${cardInfo.emoji} ${cardInfo.role.toUpperCase()}</p>
    
    ${kit.advantage ? `
      <div class="card-trait trait-advantage">
        <div class="card-trait-icon">▲</div>
        <div class="card-trait-text">${kit.advantage}</div>
      </div>
    ` : ''}
    
    ${kit.disadvantage ? `
      <div class="card-trait trait-disadvantage">
        <div class="card-trait-icon">▼</div>
        <div class="card-trait-text">${kit.disadvantage}</div>
      </div>
    ` : ''}
    
    <div class="card-trait trait-ability">
      <div class="card-trait-icon">◆</div>
      <div class="card-trait-text">${kit.ability}</div>
    </div>
  `;
  
  document.body.appendChild(details);
}

function hideCardDetails() {
  const details = document.querySelector('.card-details');
  if (details) details.remove();
}

function selectCard(cardId) {
  if (!gameState || gameState.currentTurn !== yourSide) {
    return;
  }

  const card = hand.find(c => c.id === cardId);
  if (card) {
    selectedCard = card;
    updateGameUI();
  }
}

function deployCard() {
  if (!selectedCard || !gameState || gameState.currentTurn !== yourSide) {
    alert('Não é sua vez!');
    return;
  }

  if (ws && roomCode) {
    ws.send(JSON.stringify({
      type: 'playCard',
      roomCode: roomCode,
      playerSide: yourSide,
      cardId: selectedCard.id
    }));
    selectedCard = null;
  }
}

function passRound() {
  if (!gameState || gameState.currentTurn !== yourSide) {
    alert('Não é sua vez!');
    return;
  }

  if (ws && roomCode) {
    ws.send(JSON.stringify({
      type: 'passRound',
      roomCode: roomCode,
      playerSide: yourSide
    }));
  }
}

function showGameOverScreen(winner) {
  document.getElementById('gameScreen').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.remove('hidden');
  
  const isVictory = winner === yourSide;
  const gameOverScreen = document.getElementById('gameOverScreen');
  
  gameOverScreen.innerHTML = `
    <div class="gameover-container ${isVictory ? 'victory' : 'defeat'}">
      <h1>${isVictory ? '🏆 VICTORY!' : '💀 DEFEAT'}</h1>
      <p>${isVictory ? 'OVERWATCH WINS!' : 'TALON WINS!'}</p>
      <button onclick="location.reload()" class="btn-primary">🔄 PLAY AGAIN</button>
    </div>
  `;
}

console.log('✅ Todas as funções carregadas!');
