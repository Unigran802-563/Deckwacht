// Tipos de cartas
const CARD_TYPES = {
  UNIT: 'unit',
  SPELL: 'spell',
  LEADER: 'leader'
};

// Linhas do campo de batalha
const CARD_ROWS = {
  MELEE: 'melee',
  RANGED: 'ranged',
  SIEGE: 'siege'
};

// Funções dos heróis
const HERO_ROLES = {
  TANK: 'tank',
  DAMAGE: 'damage',
  SUPPORT: 'support'
};

// Todas as cartas do jogo com KITS COMPLETOS
const CARDS = [
  // TANKS
  {
    id: 1,
    name: 'Reinhardt',
    tier: 3,
    role: HERO_ROLES.TANK,
    row: CARD_ROWS.MELEE,
    emoji: '🛡️',
    advantage: { text: '+1★ se houver Support na lane', value: 1, condition: 'has_support' },
    disadvantage: { text: '-1★ se jogado sozinho', value: -1, condition: 'alone' },
    ability: { name: 'Barreira', text: 'Próxima carta inimiga vale 0★', effect: 'barrier' }
  },
  {
    id: 2,
    name: 'Zarya',
    tier: 2,
    role: HERO_ROLES.TANK,
    row: CARD_ROWS.MELEE,
    emoji: '⚡',
    advantage: { text: '+1★ quando inimigo joga Damage', value: 1, condition: 'enemy_damage' },
    disadvantage: null,
    ability: { name: 'Graviton', text: 'Agrupa 2 cartas inimigas (somam metade)', effect: 'graviton' }
  },
  {
    id: 3,
    name: 'D.Va',
    tier: 2,
    role: HERO_ROLES.TANK,
    row: CARD_ROWS.MELEE,
    emoji: '🤖',
    advantage: { text: '+1★ por cada Damage aliado', value: 1, condition: 'count_damage' },
    disadvantage: null,
    ability: { name: 'Ejeção', text: 'Remove 1 carta inimiga aleatória', effect: 'eject' }
  },
  {
    id: 4,
    name: 'Sigma',
    tier: 1,
    role: HERO_ROLES.TANK,
    row: CARD_ROWS.MELEE,
    emoji: '🌀',
    advantage: null,
    disadvantage: { text: '-1★ contra Damages', value: -1, condition: 'vs_damage' },
    ability: { name: 'Absorção', text: 'Copia +1★ do inimigo mais forte', effect: 'absorb' }
  },

  // DAMAGES
  {
    id: 5,
    name: 'Tracer',
    tier: 2,
    role: HERO_ROLES.DAMAGE,
    row: CARD_ROWS.RANGED,
    emoji: '⏱️',
    advantage: { text: 'Pode ser jogada em qualquer lane', value: 0, condition: 'flexible_lane' },
    disadvantage: { text: '-1★ se for única na lane', value: -1, condition: 'alone' },
    ability: { name: 'Recall', text: 'Volta para a mão após a rodada', effect: 'recall' }
  },
  {
    id: 6,
    name: 'Widowmaker',
    tier: 3,
    role: HERO_ROLES.DAMAGE,
    row: CARD_ROWS.RANGED,
    emoji: '🎯',
    advantage: { text: '+1★ se inimigo tem 3+ cartas', value: 1, condition: 'enemy_many_cards' },
    disadvantage: null,
    ability: { name: 'Tiro de Precisão', text: '-2★ no inimigo mais forte', effect: 'snipe' }
  },
  {
    id: 7,
    name: 'Soldier 76',
    tier: 2,
    role: HERO_ROLES.DAMAGE,
    row: CARD_ROWS.RANGED,
    emoji: '🔫',
    advantage: { text: '+1★ se houver outro Damage', value: 1, condition: 'has_damage' },
    disadvantage: null,
    ability: { name: 'Helix', text: '-1★ no inimigo mais forte', effect: 'helix' }
  },
  {
    id: 8,
    name: 'Genji',
    tier: 2,
    role: HERO_ROLES.DAMAGE,
    row: CARD_ROWS.RANGED,
    emoji: '⚔️',
    advantage: { text: 'Reflete habilidade do alvo', value: 0, condition: 'reflect' },
    disadvantage: { text: '-1★ contra Tanks', value: -1, condition: 'vs_tank' },
    ability: { name: 'Deflect', text: 'Anula próxima habilidade inimiga', effect: 'deflect' }
  },

  // SUPPORTS
  {
    id: 9,
    name: 'Mercy',
    tier: 1,
    role: HERO_ROLES.SUPPORT,
    row: CARD_ROWS.SIEGE,
    emoji: '😇',
    advantage: { text: 'Dobra estrelas do aliado vizinho', value: 0, condition: 'double_neighbor' },
    disadvantage: { text: 'Vale 0★ se jogada sozinha', value: -1, condition: 'alone' },
    ability: { name: 'Ressuscitar', text: 'Traz última carta descartada', effect: 'resurrect' }
  },
  {
    id: 10,
    name: 'Lúcio',
    tier: 2,
    role: HERO_ROLES.SUPPORT,
    row: CARD_ROWS.SIEGE,
    emoji: '🎵',
    advantage: { text: '+1★ para cada Support aliado', value: 1, condition: 'count_support' },
    disadvantage: null,
    ability: { name: 'Amplificador', text: '+1★ para todos aliados', effect: 'amplify' }
  },
  {
    id: 11,
    name: 'Zenyatta',
    tier: 3,
    role: HERO_ROLES.SUPPORT,
    row: CARD_ROWS.SIEGE,
    emoji: '☮️',
    advantage: { text: '+2★ se lane vazia', value: 2, condition: 'empty_lane' },
    disadvantage: null,
    ability: { name: 'Transcendência', text: '+1★ para todos aliados, -1★ inimigos', effect: 'transcendence' }
  },
  {
    id: 12,
    name: 'Ana',
    tier: 2,
    role: HERO_ROLES.SUPPORT,
    row: CARD_ROWS.SIEGE,
    emoji: '💉',
    advantage: { text: '+1★ por cada Support aliado', value: 1, condition: 'count_support' },
    disadvantage: { text: '-1★ contra Tracer/Genji', value: -1, condition: 'vs_mobile' },
    ability: { name: 'Nano', text: '+2★ a um aliado escolhido', effect: 'nano' }
  }
];

// Baralho padrão (16 cartas)
const DEFAULT_DECK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 5, 9, 6];

module.exports = { CARDS, DEFAULT_DECK, CARD_TYPES, CARD_ROWS, HERO_ROLES };
