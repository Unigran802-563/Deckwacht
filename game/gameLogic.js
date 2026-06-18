const { CARDS, HERO_ROLES } = require('./cards');

class GameLogic {
  constructor() {
    this.field = {
      melee: { player1: [], player2: [] },
      ranged: { player1: [], player2: [] },
      siege: { player1: [], player2: [] }
    };
    this.lastAbilityEffect = null;
  }

  playCard(playerSide, card) {
    if (this.field[card.row] && this.field[card.row][playerSide]) {
      this.field[card.row][playerSide].push({
        ...card,
        baseStars: card.tier,
        modifiers: [],
        totalStars: card.tier
      });
      return true;
    }
    return false;
  }

  // Calcular modificadores de vantagem
  applyAdvantage(playerSide, card, row) {
    if (!card.advantage) return 0;

    const condition = card.advantage.condition;
    let modifier = 0;

    switch (condition) {
      case 'has_support':
        // +1★ se houver Support na lane
        const hasSupportInLane = this.field[row][playerSide].some(c => c.role === HERO_ROLES.SUPPORT);
        if (hasSupportInLane) modifier = card.advantage.value;
        break;

      case 'has_damage':
        // +1★ se houver outro Damage
        const hasDamageInLane = this.field[row][playerSide].some(c => c.role === HERO_ROLES.DAMAGE && c.id !== card.id);
        if (hasDamageInLane) modifier = card.advantage.value;
        break;

      case 'count_support':
        // +1★ por cada Support aliado
        const supportCount = this.field[row][playerSide].filter(c => c.role === HERO_ROLES.SUPPORT).length;
        modifier = supportCount * card.advantage.value;
        break;

      case 'count_damage':
        // +1★ por cada Damage aliado
        const damageCount = this.field[row][playerSide].filter(c => c.role === HERO_ROLES.DAMAGE).length;
        modifier = damageCount * card.advantage.value;
        break;

      case 'empty_lane':
        // +2★ se lane vazia
        if (this.field[row][playerSide].length === 1) modifier = card.advantage.value;
        break;

      case 'enemy_many_cards':
        // +1★ se inimigo tem 3+ cartas
        const opponentSide = playerSide === 'player1' ? 'player2' : 'player1';
        const enemyCardCount = this.field[row][opponentSide].length;
        if (enemyCardCount >= 3) modifier = card.advantage.value;
        break;

      case 'flexible_lane':
        // Tracer pode ser jogada em qualquer lane (sem modificador aqui)
        modifier = 0;
        break;
    }

    return modifier;
  }

  // Calcular modificadores de desvantagem
  applyDisadvantage(playerSide, card, row) {
    if (!card.disadvantage) return 0;

    const condition = card.disadvantage.condition;
    let modifier = 0;
    const opponentSide = playerSide === 'player1' ? 'player2' : 'player1';

    switch (condition) {
      case 'alone':
        // -1★ se for única na lane
        if (this.field[row][playerSide].length === 1) modifier = card.disadvantage.value;
        break;

      case 'vs_tank':
        // -1★ contra Tanks
        const hasEnemyTank = this.field[row][opponentSide].some(c => c.role === HERO_ROLES.TANK);
        if (hasEnemyTank) modifier = card.disadvantage.value;
        break;

      case 'vs_damage':
        // -1★ contra Damages
        const hasEnemyDamage = this.field[row][opponentSide].some(c => c.role === HERO_ROLES.DAMAGE);
        if (hasEnemyDamage) modifier = card.disadvantage.value;
        break;

      case 'vs_mobile':
        // -1★ contra Tracer/Genji
        const hasMobileEnemy = this.field[row][opponentSide].some(c => c.id === 5 || c.id === 8);
        if (hasMobileEnemy) modifier = card.disadvantage.value;
        break;

      case 'enemy_damage':
        // +1★ quando inimigo joga Damage (Zarya)
        const enemyDamageCount = this.field[row][opponentSide].filter(c => c.role === HERO_ROLES.DAMAGE).length;
        if (enemyDamageCount > 0) modifier = card.disadvantage.value; // Na verdade é vantagem para Zarya
        break;
    }

    return modifier;
  }

  // Aplicar habilidade especial
  applyAbility(playerSide, card, row) {
    const opponentSide = playerSide === 'player1' ? 'player2' : 'player1';
    const effect = card.ability?.effect;

    switch (effect) {
      case 'barrier':
        // Próxima carta inimiga vale 0★
        this.lastAbilityEffect = { type: 'barrier', playerSide: opponentSide, row: row };
        break;

      case 'graviton':
        // Agrupa 2 cartas inimigas (somam metade)
        const enemyCards = this.field[row][opponentSide];
        if (enemyCards.length >= 2) {
          enemyCards[0].modifiers.push({ type: 'graviton', value: -Math.floor(enemyCards[0].totalStars / 2) });
          enemyCards[1].modifiers.push({ type: 'graviton', value: -Math.floor(enemyCards[1].totalStars / 2) });
        }
        break;

      case 'eject':
        // Remove 1 carta inimiga aleatória
        const ejectCards = this.field[row][opponentSide];
        if (ejectCards.length > 0) {
          const randomIndex = Math.floor(Math.random() * ejectCards.length);
          ejectCards.splice(randomIndex, 1);
        }
        break;

      case 'snipe':
        // -2★ no inimigo mais forte
        const strongestCard = this.getStrongestCard(opponentSide, row);
        if (strongestCard) {
          strongestCard.modifiers.push({ type: 'snipe', value: -2 });
        }
        break;

      case 'helix':
        // -1★ no inimigo mais forte
        const helix = this.getStrongestCard(opponentSide, row);
        if (helix) {
          helix.modifiers.push({ type: 'helix', value: -1 });
        }
        break;

      case 'recall':
        // Tracer volta para a mão após a rodada
        this.lastAbilityEffect = { type: 'recall', card: card };
        break;

      case 'amplify':
        // +1★ para todos aliados
        for (const rowKey in this.field) {
          this.field[rowKey][playerSide].forEach(c => {
            if (c.id !== card.id) {
              c.modifiers.push({ type: 'amplify', value: 1 });
            }
          });
        }
        break;

      case 'transcendence':
        // +1★ para todos aliados, -1★ inimigos
        for (const rowKey in this.field) {
          this.field[rowKey][playerSide].forEach(c => {
            if (c.id !== card.id) {
              c.modifiers.push({ type: 'transcendence_ally', value: 1 });
            }
          });
          this.field[rowKey][opponentSide].forEach(c => {
            c.modifiers.push({ type: 'transcendence_enemy', value: -1 });
          });
        }
        break;

      case 'nano':
        // +2★ a um aliado escolhido (será escolhido no frontend)
        this.lastAbilityEffect = { type: 'nano', playerSide: playerSide, row: row };
        break;

      case 'absorb':
        // Copia +1★ do inimigo mais forte
        const absorbTarget = this.getStrongestCard(opponentSide, row);
        if (absorbTarget) {
          card.modifiers.push({ type: 'absorb', value: 1 });
        }
        break;

      case 'double_neighbor':
        // Mercy dobra estrelas do aliado vizinho
        const mercyIndex = this.field[row][playerSide].indexOf(card);
        if (mercyIndex > 0) {
          const neighbor = this.field[row][playerSide][mercyIndex - 1];
          neighbor.modifiers.push({ type: 'double', value: neighbor.totalStars });
        }
        break;

      case 'resurrect':
        // Traz última carta descartada (será gerenciado no gameState)
        this.lastAbilityEffect = { type: 'resurrect', playerSide: playerSide };
        break;

      case 'deflect':
        // Anula próxima habilidade inimiga
        this.lastAbilityEffect = { type: 'deflect', playerSide: playerSide };
        break;
    }
  }

  // Encontrar carta mais forte
  getStrongestCard(playerSide, row) {
    const cards = this.field[row][playerSide];
    if (cards.length === 0) return null;
    return cards.reduce((strongest, card) => {
      return (card.totalStars || 0) > (strongest.totalStars || 0) ? card : strongest;
    });
  }

  // Recalcular todas as estrelas de uma lane
  recalculateLaneStars(playerSide, row) {
    const cards = this.field[row][playerSide];
    cards.forEach(card => {
      card.totalStars = card.baseStars;

      // Aplicar vantagem
      card.totalStars += this.applyAdvantage(playerSide, card, row);

      // Aplicar desvantagem
      card.totalStars += this.applyDisadvantage(playerSide, card, row);

      // Aplicar modificadores
      card.modifiers.forEach(mod => {
        card.totalStars += mod.value;
      });

      // Mínimo de 0
      card.totalStars = Math.max(0, card.totalStars);
    });
  }

  // Calcular total de estrelas de uma lane
  calculateLaneStars(playerSide, row) {
    this.recalculateLaneStars(playerSide, row);
    const cards = this.field[row][playerSide];
    return cards.reduce((total, card) => total + (card.totalStars || 0), 0);
  }

  // Calcular total de estrelas de um jogador
  calculateTotalStars(playerSide) {
    let total = 0;
    for (const row in this.field) {
      total += this.calculateLaneStars(playerSide, row);
    }
    return total;
  }

  getField() {
    return this.field;
  }

  clearField() {
    this.field = {
      melee: { player1: [], player2: [] },
      ranged: { player1: [], player2: [] },
      siege: { player1: [], player2: [] }
    };
    this.lastAbilityEffect = null;
  }
}

module.exports = GameLogic;
