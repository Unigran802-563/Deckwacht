const GameLogic = require('./gameLogic');
const { DEFAULT_DECK, CARDS } = require('./cards');

class GameState {
  constructor(player1Id, player2Id) {
    this.player1Id = player1Id;
    this.player2Id = player2Id;
    
    // Baralhos
    this.decks = {
      player1: [...DEFAULT_DECK],
      player2: [...DEFAULT_DECK]
    };
    
    // Mãos dos jogadores
    this.hands = {
      player1: [],
      player2: []
    };

    // Descartes dos jogadores
    this.discards = {
      player1: [],
      player2: []
    };
    
    // Pontuação das rodadas
    this.roundsWon = {
      player1: 0,
      player2: 0
    };
    
    // Estrelas (em vez de dano)
    this.stars = {
      player1: 0,
      player2: 0
    };
    
    // Estado do jogo
    this.currentRound = 1;
    this.gameLogic = new GameLogic();
    this.gameOver = false;
    this.winner = null;
    this.passedPlayers = [];
    
    // Sistema de turnos
    this.currentTurn = 'player1';
    this.lastAbilityEffect = null;
    this.lastToast = null;
    
    // Inicializar
    this.initializeGame();
  }

  initializeGame() {
    this.drawCards('player1', 10);
    this.drawCards('player2', 10);
  }

  drawCards(playerSide, count) {
    const deck = this.decks[playerSide];
    const hand = this.hands[playerSide];
    
    for (let i = 0; i < count; i++) {
      if (deck.length === 0) break;
      
      const cardId = deck.shift();
      const cardData = CARDS.find(c => c.id === cardId);
      
      if (cardData) {
        hand.push({
          ...cardData,
          instanceId: Math.random().toString(36).substring(7)
        });
      }
    }
  }

  playCard(playerSide, cardId) {
    const hand = this.hands[playerSide];
    const cardIndex = hand.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) return false;
    
    const card = hand[cardIndex];
    const row = card.row;
    
    // Jogar carta no campo
    const success = this.gameLogic.playCard(playerSide, card);
    
    if (success) {
      // Remover da mão
      hand.splice(cardIndex, 1);
      
      // Adicionar ao descarte
      this.discards[playerSide].push(card);
      
      // Aplicar habilidade
      this.gameLogic.applyAbility(playerSide, card, row);
      this.lastAbilityEffect = this.gameLogic.lastAbilityEffect;
      
      // Gerar toast
      this.lastToast = {
        type: 'ability',
        text: `◆ ${card.ability?.name?.toUpperCase() || 'HABILIDADE'} ATIVADA`,
        row: row
      };
      
      // Recalcular estrelas
      this.recalculateStars();
      
      // Desenhar nova carta
      this.drawCards(playerSide, 1);
      
      return true;
    }
    
    return false;
  }

  recalculateStars() {
    this.stars.player1 = this.gameLogic.calculateTotalStars('player1');
    this.stars.player2 = this.gameLogic.calculateTotalStars('player2');
  }

  passRound(playerSide) {
    if (!this.passedPlayers.includes(playerSide)) {
      this.passedPlayers.push(playerSide);
    }
  }

  shouldEndRound() {
    return this.passedPlayers.length === 2;
  }

  endRound() {
    // Determinar vencedor da rodada
    if (this.stars.player1 > this.stars.player2) {
      this.roundsWon.player1++;
    } else if (this.stars.player2 > this.stars.player1) {
      this.roundsWon.player2++;
    }
    
    // Verificar se jogo terminou
    if (this.roundsWon.player1 === 2) {
      this.gameOver = true;
      this.winner = 'player1';
    } else if (this.roundsWon.player2 === 2) {
      this.gameOver = true;
      this.winner = 'player2';
    } else {
      // Próxima rodada
      this.currentRound++;
      this.gameLogic.clearField();
      this.passedPlayers = [];
      this.stars = { player1: 0, player2: 0 };
      this.currentTurn = 'player1';
      this.drawCards('player1', 1);
      this.drawCards('player2', 1);
    }
  }

  nextTurn() {
    this.currentTurn = this.currentTurn === 'player1' ? 'player2' : 'player1';
  }

  getState() {
    const field = this.gameLogic.getField();
    
    // Preparar field para envio (remover funções)
    const cleanField = {
      melee: {
        player1: field.melee.player1.map(c => ({
          id: c.id,
          name: c.name,
          tier: c.tier,
          baseStars: c.baseStars,
          totalStars: c.totalStars,
          modifiers: c.modifiers
        })),
        player2: field.melee.player2.map(c => ({
          id: c.id,
          name: c.name,
          tier: c.tier,
          baseStars: c.baseStars,
          totalStars: c.totalStars,
          modifiers: c.modifiers
        }))
      },
      ranged: {
        player1: field.ranged.player1.map(c => ({
          id: c.id,
          name: c.name,
          tier: c.tier,
          baseStars: c.baseStars,
          totalStars: c.totalStars,
          modifiers: c.modifiers
        })),
        player2: field.ranged.player2.map(c => ({
          id: c.id,
          name: c.name,
          tier: c.tier,
          baseStars: c.baseStars,
          totalStars: c.totalStars,
          modifiers: c.modifiers
        }))
      },
      siege: {
        player1: field.siege.player1.map(c => ({
          id: c.id,
          name: c.name,
          tier: c.tier,
          baseStars: c.baseStars,
          totalStars: c.totalStars,
          modifiers: c.modifiers
        })),
        player2: field.siege.player2.map(c => ({
          id: c.id,
          name: c.name,
          tier: c.tier,
          baseStars: c.baseStars,
          totalStars: c.totalStars,
          modifiers: c.modifiers
        }))
      }
    };

    return {
      player1Id: this.player1Id,
      player2Id: this.player2Id,
      currentRound: this.currentRound,
      roundsWon: this.roundsWon,
      stars: this.stars,
      field: cleanField,
      gameOver: this.gameOver,
      winner: this.winner,
      passedPlayers: this.passedPlayers,
      currentTurn: this.currentTurn,
      lastToast: this.lastToast
    };
  }

  getHand(playerSide) {
    return this.hands[playerSide];
  }

  isGameOver() {
    return this.gameOver;
  }

  getWinner() {
    return this.winner;
  }
}

module.exports = GameState;
