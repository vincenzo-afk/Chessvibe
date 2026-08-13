/* ══════════════════════════════════════════════════════
   ChessVibe — script.js
   Complete Chess Game Engine
   Modes: Local 2P · vs Stockfish · Online P2P
══════════════════════════════════════════════════════ */
'use strict';

// ────────────────────────────────────────────────────
//  CONSTANTS
// ────────────────────────────────────────────────────
const FILES = ['a','b','c','d','e','f','g','h'];

const PIECE_SVG_LOCAL = {
  wp: 'assets/pieces/wp.svg', wn: 'assets/pieces/wn.svg', wb: 'assets/pieces/wb.svg',
  wr: 'assets/pieces/wr.svg', wq: 'assets/pieces/wq.svg', wk: 'assets/pieces/wk.svg',
  bp: 'assets/pieces/bp.svg', bn: 'assets/pieces/bn.svg', bb: 'assets/pieces/bb.svg',
  br: 'assets/pieces/br.svg', bq: 'assets/pieces/bq.svg', bk: 'assets/pieces/bk.svg',
};

const PIECE_SVG_URLS = {
  wp: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  wn: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  wb: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  wr: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  wq: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  wk: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  bp: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  bn: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  bb: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  br: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  bq: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  bk: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
};

const PIECE_UNICODE = {
  wk:'♔', wq:'♕', wr:'♖', wb:'♗', wn:'♘', wp:'♙',
  bk:'♚', bq:'♛', br:'♜', bb:'♝', bn:'♞', bp:'♟',
};

const PIECE_VALUES  = { p:1, n:3, b:3, r:5, q:9, k:0 };

const STOCKFISH_URL = 'https://stockfish.online/api/s/v2.php';

// Chess Openings Database (minimal ECO)
const OPENINGS = {
  // Sicilian Defense
  "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR": "Sicilian Defense",
  "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R": "Sicilian Defense, Najdorf Variation",
  "rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R": "Sicilian Defense, Scheveningen Variation",
  "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R": "Sicilian Defense, Closed",
  "rnbqkbnr/pp1p1ppp/4p3/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R": "Sicilian Defense, Alapin Variation",

  // French Defense
  "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR": "French Defense",
  "rnbqkbnr/pppp1ppp/4p3/8/4P3/5N2/PPPP1PPP/RNBQKB1R": "French Defense, Exchange Variation",
  "rnbqk1nr/pppp1ppp/4p3/8/1b2P3/5N2/PPPP1PPP/RNBQKB1R": "French Defense, Winawer Variation",

  // Caro-Kann Defense
  "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR": "Caro-Kann Defense",
  "rnbqkbnr/pp1ppppp/2p5/8/4P3/2N5/PPPP1PPP/R1BQKBNR": "Caro-Kann Defense, Advance Variation",

  // King's Indian Defense
  "rnbqkb1r/pppppp1p/5np1/8/4P3/8/PPPP1PPP/RNBQKBNR": "King's Indian Defense",

  // Queen's Gambit
  "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR": "Queen's Gambit Declined",
  "rnbqkbnr/ppp1pppp/8/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR": "Queen's Gambit Accepted",

  // Ruy Lopez
  "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R": "Ruy Lopez, Berlin Defense",

  // Italian Game
  "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R": "Italian Game",

  // English Opening
  "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR": "English Opening",

  // Nimzo-Indian Defense
  "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR": "Nimzo-Indian Defense",

  // Dutch Defense
  "rnbqkbnr/ppppp1pp/8/5p2/4P3/8/PPPP1PPP/RNBQKBNR": "Dutch Defense",

  // Pirc Defense
  "rnbqkb1r/ppp1pppp/3p1n2/8/4P3/5N2/PPPP1PPP/RNBQKB1R": "Pirc Defense",

  // Alekhine's Defense
  "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR": "Alekhine's Defense",

  // Scandinavian Defense
  "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR": "Scandinavian Defense",

  // Petroff Defense
  "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R": "Petroff Defense",

  // Vienna Game
  "rnbqkb1r/pppp1ppp/5n2/4p3/4PP2/8/PPPP2PP/RNBQKBNR": "Vienna Game",

  // London System
  "rnbqkb1r/pppp1ppp/5n2/4p3/2P5/2N3P1/PP1PPP1P/R1BQKBNR": "London System",

  // Catalan Opening
  "rnbqkb1r/pppp1ppp/5n2/4p3/2P5/2N5/PP1PPPPP/R1BQKBNR": "Catalan Opening",

  // Grünfeld Defense
  "rnbqkb1r/ppp1pp1p/5np1/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR": "Grünfeld Defense",

  // Queen's Indian Defense
  "rnbqkb1r/p1pp1ppp/1p2pn2/8/2PP4/2N5/PP2PPPP/R1BQKBNR": "Queen's Indian Defense",

  // King's Gambit
  "rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR": "King's Gambit",

  // King's Gambit Accepted
  "rnbqkbnr/pppp1ppp/8/8/4pP2/8/PPPP2PP/RNBQKBNR": "King's Gambit Accepted",
};

// ────────────────────────────────────────────────────
//  UTILITY FUNCTIONS
// ────────────────────────────────────────────────────
function generatePGN() {
  const today = new Date();
  const date = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`;
  const result = G.game.in_checkmate() ? (G.game.turn() === 'w' ? '0-1' : '1-0') : G.game.in_draw() ? '1/2-1/2' : '*';
  const mode = modeLabel(G.mode);

  const headers = [
    `[Event "ChessVibe Game"]`,
    `[Date "${date}"]`,
    `[White "White"]`,
    `[Black "Black"]`,
    `[Result "${result}"]`,
    `[Mode "${mode}"]`,
    `[TimeControl "${G.timers.w}"]`,
    '',
  ];

  const pgn = headers.join('\n') + G.game.pgn();
  return pgn;
}

function encodePGN(pgn) {
  return btoa(encodeURIComponent(pgn));
}

function decodePGN(encoded) {
  return decodeURIComponent(atob(encoded));
}

function shareGame() {
  const pgn = generatePGN();
  const encoded = encodePGN(pgn);
  const url = `${location.origin}${location.pathname}?pgn=${encoded}`;

  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('btn-share-pgn');
    if (btn) {
      btn.textContent = 'Link Copied!';
      setTimeout(() => btn.textContent = 'Share Game', 2000);
    }
  });
}

function downloadPGN() {
  const pgn = generatePGN();
  const blob = new Blob([pgn], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chessvibe-game-${new Date().toISOString().split('T')[0]}.pgn`;
  a.click();
  URL.revokeObjectURL(url);
}

// ────────────────────────────────────────────────────
//  THEMES & PIECE SETS
// ────────────────────────────────────────────────────
const THEMES = {
  wiki:     { light: '#ebecd0', dark: '#779556' }, // Wikipedia classic green/cream
  classic:  { light: '#f0ede6', dark: '#2d2d2d' }, // B&W
};

const PIECE_SETS = {
  wiki:    PIECE_SVG_LOCAL, // Wikipedia-style classic pieces (default)
  modern:  PIECE_SVG_URLS,
  unicode: {
    wk:'♔', wq:'♕', wr:'♖', wb:'♗', wn:'♘', wp:'♙',
    bk:'♚', bq:'♛', br:'♜', bb:'♝', bn:'♞', bp:'♟',
  },
  letters: {
    wk:'K', wq:'Q', wr:'R', wb:'B', wn:'N', wp:'P',
    bk:'k', bq:'q', br:'r', bb:'b', bn:'n', bp:'p',
  }
};

// ────────────────────────────────────────────────────
//  GAME STATE
// ────────────────────────────────────────────────────
const G = {
  /* Core */
  game:       null,   // chess.js instance (live game)
  mode:       null,   // 'local' | 'bot' | 'online'
  playerColor:'w',    // human's color (bot/online)
  flipped:    false,  // board orientation
  inited:     false,

  /* Selection */
  selected:   null,   // algebraic square string
  legalMoves: [],     // array of target squares
  lastMove:   null,   // { from, to }
  inCheck:    false,

  /* Bot */
  botDepth:   12,
  botBusy:    false,

  /* Online (PeerJS) */
  peer:       null,
  conn:       null,
  spectators:  [],     // array of spectator connections
  roomCode:   null,
  isHost:     false,
  onlineReady:false,
  isSpectator:false,  // true if user joined as spectator
  moveCounter:0,      // authoritative online move sequence counter (host)

  /* Hint */
  hint: { active:false, from:null, to:null, timeout:null },

  /* Game Report */
  gameReport: { w:null, b:null, done:false },

  /* Opening */
  currentOpening: null,

  /* Chess960 */
  chess960: false,

  /* Bullet Mode */
  bulletMode: false,

  /* Gauntlet */
  gauntlet: { active:false, stage:1, wins:0, losses:0,
    depths:[2,4,6,10,15], stageName:['Rookie','Casual','Club','Master','Expert'],
    completed:false },

  /* Blindfold */
  blindfold: false,

  /* Session Stats */
  sessionStats: { local:{wins:0,losses:0,draws:0},
    bot:{wins:0,losses:0,draws:0}, online:{wins:0,losses:0,draws:0},
    gauntlet:{stagesCleared:0,attempts:0} },

  /* Move Times */
  moveTimes: [],
  moveStartTime: null,

  /* Light Mode */
  lightMode: false,

  /* Replay */
  replayGame: null,   // Chess instance for replay
  replayIdx:  -1,
  replaying:  false,

  /* Promotion */
  pendingPromo: null, // { from, to }

    /* Timer */
    timerOn:    false,
    timers:     { w:600, b:600, paused: false },
    activeClk:  null,
    clkInterval:null,

  /* Captures */
  captured:   { w:[], b:[] }, // pieces taken BY that color

   /* Audio */
   audioCtx:   null,
   muted:      false,

   /* UI */
   theme:      'classic',
   pieceSet:   'unicode',
   coords:     true,
   autoQueen:  false,
   increment:  0,

   /* Pre-move */
   preMove:    null, // { from, to }

   /* Annotations */
   annotations: {}, // moveIdx -> annotation
};

// ────────────────────────────────────────────────────
//  AUDIO ENGINE
// ────────────────────────────────────────────────────
function initAudio() {
  try {
    G.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(_) {}
}

function resumeAudio() {
  if (G.audioCtx && G.audioCtx.state === 'suspended') G.audioCtx.resume();
}

function playSound(type) {
  if (!G.audioCtx || G.muted) return;
  const ctx = G.audioCtx;

  const play = (freq, type_, dur, vol, delay = 0) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type_;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.01);
  };

  switch(type) {
    case 'move':    play(520, 'square',   0.07, 0.10); break;
    case 'capture': play(220, 'sawtooth', 0.12, 0.20); break;
    case 'castle':  play(440, 'square',   0.07, 0.10);
                    play(660, 'square',   0.07, 0.10, 0.09); break;
    case 'check':   play(880, 'sine',     0.25, 0.22); break;
    case 'start':   play(330, 'sine',     0.18, 0.15);
                    play(440, 'sine',     0.18, 0.15, 0.18); break;
    case 'win': {
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((f, i) => play(f, 'sine', 0.6, 0.14, i * 0.12));
      break;
    }
    case 'promote': play(660, 'sine', 0.25, 0.20);
                    play(880, 'sine', 0.25, 0.20, 0.18); break;
  }
}

// ────────────────────────────────────────────────────
//  BOARD RENDERING
// ────────────────────────────────────────────────────
/**
 * chess.js .board() layout:
 *   board[0] = rank 8 (top), board[7] = rank 1 (bottom)
 *   board[r][c]: c=0 → file a, c=7 → file h
 *   Square name: FILES[c] + (8-r)
 */
function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  const activeGame = G.replaying && G.replayGame ? G.replayGame : G.game;
  const position   = activeGame.board();

  // King square if in check
  let checkKingSq = null;
  if (activeGame.in_check()) {
    checkKingSq = findKingSq(activeGame, activeGame.turn());
  }

  for (let dRow = 0; dRow < 8; dRow++) {
    for (let dCol = 0; dCol < 8; dCol++) {
      // Map display row/col → board array indices and square name
      const bRow = G.flipped ? 7 - dRow : dRow;       // board array row
      const bCol = G.flipped ? 7 - dCol : dCol;       // board array col
      const file = bCol;                               // 0 = a … 7 = h
      const rank = 8 - bRow;                          // 1 … 8
      const sq   = FILES[file] + rank;
      const isLight = (file + rank) % 2 !== 0;

      const cell = document.createElement('div');
      cell.className = `square ${isLight ? 'light' : 'dark'}`;
      cell.dataset.square = sq;

      // Highlight layers
      if (G.selected === sq) cell.classList.add('selected');
      if (G.lastMove && (G.lastMove.from === sq || G.lastMove.to === sq))
        cell.classList.add('last-move');
      if (checkKingSq === sq) cell.classList.add('in-check');
      if (G.legalMoves.includes(sq)) cell.classList.add('legal-target');

      // Coordinate labels
      if (G.coords) {
        if (dCol === 0) {
          const lbl = document.createElement('span');
          lbl.className = 'coord-rank';
          lbl.textContent = rank;
          cell.appendChild(lbl);
        }
        if (dRow === 7) {
          const lbl = document.createElement('span');
          lbl.className = 'coord-file';
          lbl.textContent = FILES[file];
          cell.appendChild(lbl);
        }
      }

      // Piece
      const piece = position[bRow][bCol];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = `piece piece-${piece.color}`;
        
        const glyph = PIECE_SETS[G.pieceSet][piece.color + piece.type];
        if (glyph && glyph.includes('.svg')) {
          const img = document.createElement('img');
          img.src = glyph;
          img.alt = piece.color + piece.type;
          img.className = 'piece-img';
          pieceEl.appendChild(img);
        } else {
          pieceEl.textContent = glyph;
        }
        
        pieceEl.dataset.square = sq;
        pieceEl.draggable = false;
        cell.appendChild(pieceEl);
      }

      // Legal move indicator
      if (G.legalMoves.includes(sq)) {
        const dot = document.createElement('div');
        dot.className = `legal-dot${piece ? ' capture-ring' : ''}`;
        cell.appendChild(dot);
      }

      boardEl.appendChild(cell);
    }
  }

   updateCapturedStrips();
   updateTurnIndicator();
   updatePlayerBarHighlight();
}

function applyTheme() {
  const theme = THEMES[G.theme];
  if (!theme) return;

  // Remove previous theme class
  document.body.className = document.body.className.replace(/theme-\w+/g, '');

  // Add new theme class
  document.body.classList.add(`theme-${G.theme}`);

  document.documentElement.style.setProperty('--sq-light', theme.light);
  document.documentElement.style.setProperty('--sq-dark', theme.dark);

  // Apply light mode if set
  document.body.classList.toggle('light-mode', G.lightMode);

  // Save to localStorage
  localStorage.setItem('chessvibe_theme', G.theme);
}

function getPieceColor(isWhite, theme) {
  const themeColors = {
    classic:  { w: '#ffffff', b: '#0a0a0a' },
    forest:   { w: '#2d5a1c', b: '#ffffff' },
    ocean:    { w: '#1a4d5a', b: '#ffffff' },
    candy:    { w: '#8b1a5a', b: '#ffffff' },
    midnight: { w: '#ffffff', b: '#e8eaf6' },
  };
  return themeColors[theme || G.theme][isWhite ? 'w' : 'b'];
}

function applyPieceSet() {
  // Re-render board to apply new piece set and theme-based colors
  renderBoard();

  // Save to localStorage
  localStorage.setItem('chessvibe_pieceSet', G.pieceSet);
}

function highlightPreMove() {
  if (!G.preMove) return;
  const fromEl = document.querySelector(`[data-square="${G.preMove.from}"]`);
  const toEl = document.querySelector(`[data-square="${G.preMove.to}"]`);
  if (fromEl) fromEl.classList.add('pre-move-from');
  if (toEl) toEl.classList.add('pre-move-to');
}

function cancelPreMove() {
  G.preMove = null;
  document.querySelectorAll('.pre-move-from, .pre-move-to').forEach(el => {
    el.classList.remove('pre-move-from', 'pre-move-to');
  });
  renderBoard();
}

function showAnnotationMenu(e, moveIdx) {
  e.preventDefault();
  const menu = document.getElementById('context-menu');
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';
  menu.classList.remove('hidden');

  // Store the move index for the menu items
  menu.dataset.moveIdx = moveIdx;

  // Hide menu when clicking elsewhere
  const hideMenu = () => {
    menu.classList.add('hidden');
    document.removeEventListener('click', hideMenu);
  };
  setTimeout(() => document.addEventListener('click', hideMenu), 10);
}

function setAnnotation(moveIdx, annotation) {
  G.annotations[moveIdx] = annotation;
  updateMoveHistory();
}

function evaluateMoveForAnnotation(moveIdx) {
  if (G.mode !== 'bot' || !G.game) return;

  const history = G.game.history({ verbose: true });
  if (moveIdx >= history.length) return;

  const move = history[moveIdx];
  if (!move.captured) return; // Only annotate captures for simplicity

  const pieceValue = PIECE_VALUES[move.captured] || 0;
  let annotation = '';

  if (pieceValue >= 3) { // Queen or Rook
    annotation = '!!';
  } else if (pieceValue >= 1) { // Any capture
    annotation = '!';
  }

  if (annotation && !G.annotations[moveIdx]) {
    G.annotations[moveIdx] = annotation;
  }
}

function updateBreadcrumb() {
  const bar = document.getElementById('breadcrumb-moves');
  if (!bar) return;

  const history = G.game.history({ verbose: true });
  if (history.length === 0) {
    bar.innerHTML = '';
    return;
  }

  const startIdx = Math.max(0, history.length - 5);
  const moves = history.slice(startIdx);

  bar.innerHTML = '';
  moves.forEach((move, idx) => {
    const moveEl = document.createElement('div');
    moveEl.className = 'breadcrumb-move';
    moveEl.textContent = move.san;
    moveEl.addEventListener('click', () => jumpToMove(startIdx + idx));
    bar.appendChild(moveEl);
  });
}

function findKingSq(gameInst, color) {
  const board = gameInst.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === color) {
        return FILES[c] + (8 - r);
      }
    }
  }
  return null;
}

function updateTurnIndicator() {
  if (G.replaying) return;
  const turn    = G.game.turn();
  const dot     = document.getElementById('turn-dot');
  const txt     = document.getElementById('turn-text');
  const isWhite = turn === 'w';

  if (dot) {
    dot.className = `turn-dot ${isWhite ? 'white-turn' : 'black-turn'}`;
  }
  if (txt) {
    if (G.game.game_over()) {
      txt.textContent = 'Game Over';
    } else if (G.mode === 'bot' && turn !== G.playerColor) {
      txt.textContent = 'Bot is thinking…';
    } else {
      txt.textContent = isWhite ? "White's Turn" : "Black's Turn";
    }
  }
}

function updatePlayerBarHighlight() {
  const turn = G.game.turn();
  const topBar = document.getElementById('player-bar-top');
  const botBar = document.getElementById('player-bar-bottom');
  if (!topBar || !botBar) return;

  // Which player is on bottom? White by default, black if flipped
  const bottomColor = G.flipped ? 'b' : 'w';
  const topColor    = G.flipped ? 'w' : 'b';

  topBar.classList.toggle('active-turn', turn === topColor && !G.game.game_over());
  botBar.classList.toggle('active-turn', turn === bottomColor && !G.game.game_over());

  // Timer pill active state
  const timerWhite = document.getElementById('timer-white');
  const timerBlack = document.getElementById('timer-black');
  if (timerWhite) timerWhite.classList.toggle('timer-pill-active', G.activeClk === 'w');
  if (timerBlack) timerBlack.classList.toggle('timer-pill-active', G.activeClk === 'b');
}

// ────────────────────────────────────────────────────
//  MOVE HANDLING
// ────────────────────────────────────────────────────
function handleSquareClick(sq) {
  if (G.isSpectator) return; // Spectators can't interact
  resumeAudio();
  if (G.replaying)    { return exitReplay(); }
  if (G.botBusy)      { return; }
  if (G.game.game_over()) { return; }

  // Handle pre-move during opponent's turn
  if (!canMove() && (G.mode === 'local' || G.mode === 'online')) {
    if (G.selected) {
      if (G.legalMoves.includes(sq)) {
        // Set pre-move
        G.preMove = { from: G.selected, to: sq };
        clearSelection();
        renderBoard();
        // Highlight pre-move squares
        highlightPreMove();
        return;
      } else {
        clearSelection();
        trySelect(sq);
      }
    } else {
      trySelect(sq);
    }
    return;
  }

  // Cancel pre-move on right-click or tap
  if (sq === G.preMove?.from || sq === G.preMove?.to) {
    cancelPreMove();
    return;
  }

  if (!canMove()) return;

  if (G.selected) {
    if (G.legalMoves.includes(sq)) {
      attemptMove(G.selected, sq);
    } else {
      // Try re-select
      clearSelection();
      trySelect(sq);
    }
  } else {
    trySelect(sq);
  }
}

function trySelect(sq) {
  const piece = G.game.get(sq);
  if (!piece) { clearSelection(); return; }
  if (piece.color !== G.game.turn()) { clearSelection(); return; }
  // In bot/online mode, only allow moving own color
  if ((G.mode === 'bot' || G.mode === 'online') && piece.color !== G.playerColor) {
    clearSelection(); return;
  }

  G.selected   = sq;
  G.legalMoves = G.game.moves({ square: sq, verbose: true }).map(m => m.to);
  renderBoard();
}

function clearSelection() {
  G.selected   = null;
  G.legalMoves = [];
}

function canMove() {
  if (G.isSpectator) return false; // Spectators can't move
  if (G.mode === 'local') return true;
  return G.game.turn() === G.playerColor;
}

function attemptMove(from, to) {
  // Check for pawn promotion
  const piece   = G.game.get(from);
  const toRank  = parseInt(to[1]);
  if (piece && piece.type === 'p') {
    if ((piece.color === 'w' && toRank === 8) || (piece.color === 'b' && toRank === 1)) {
      if (G.autoQueen) {
        executeMove(from, to, 'q');
        return;
      } else {
        G.pendingPromo = { from, to };
        showPromotionModal(piece.color);
        return;
      }
    }
  }
  executeMove(from, to, null);
}

function executeMove(from, to, promotion) {
  // Start move timer if not already
  if (!G.moveStartTime && G.timerOn) {
    G.moveStartTime = Date.now();
  }

  const moveArgs = { from, to };
  if (promotion) moveArgs.promotion = promotion;

  const move = G.game.move(moveArgs);
  if (!move) return false;

  // Track captures
  if (move.captured) {
    // The piece that was captured belongs to the opponent
    const capturedColor = move.color === 'w' ? 'b' : 'w';
    G.captured[capturedColor].push(move.captured);
  }

  // Track move time
  if (G.moveStartTime) {
    const moveTime = Date.now() - G.moveStartTime;
    G.moveTimes.push({ color: move.color, ms: moveTime });
    G.moveStartTime = null;
  }

  G.lastMove  = { from, to };
  G.selected  = null;
  G.legalMoves = [];

  // Sound
  if (move.flags.includes('k') || move.flags.includes('q')) {
    playSound('castle');
  } else if (move.captured) {
    playSound('capture');
  } else if (promotion) {
    playSound('promote');
  } else {
    playSound('move');
  }
  if (G.game.in_check()) playSound('check');

  // Animate piece
  renderBoard();
  updateMoveHistory();

  const toEl = document.querySelector(`[data-square="${to}"] .piece`);
  if (toEl) toEl.classList.add('piece-just-moved');

  // Auto-flip board in local mode
  if (G.mode === 'local') {
    G.flipped = !G.flipped;
    renderBoard(); // Logical flip is handled inside renderBoard using G.flipped
  }

  // Clear hint
  clearHint();

  // Timer increment for the player who just moved
  if (G.timerOn && G.increment > 0) {
    G.timers[move.color] += G.increment;
    renderTimers();
  }

  // Timer switch
  if (G.timerOn) switchClock();

  // Evaluate move for automatic annotation
  evaluateMoveForAnnotation(G.game.history().length - 1);

  // Online sync — host assigns an authoritative sequence number so both
  // clients can detect and repair out-of-order / missed moves.
  if (G.mode === 'online' && G.onlineReady) {
    G.moveCounter = (G.moveCounter || 0) + 1;
    const payload = { type:'move', from, to, promotion: promotion || null, seq: G.moveCounter };
    if (G.isHost && G.conn) {
      G.conn.send(payload);
    } else if (!G.isHost && G.conn) {
      G.conn.send(payload);
    }
    // Broadcast to spectators
    broadcastToSpectators(payload);
  }

  // Check game end
  if (checkGameOver()) return true;

  // Execute pre-move if it's now the player's turn
  if (G.preMove && canMove()) {
    const { from, to } = G.preMove;
    cancelPreMove();
    if (G.game.moves({ square: from, verbose: true }).some(m => m.to === to)) {
      attemptMove(from, to);
      return true;
    }
  }

  // Update eval bar
  if (G.mode === 'local' || G.mode === 'bot') {
    updateEvalBar();
  }

  // Bot response
  if (G.mode === 'bot' && G.game.turn() !== G.playerColor) {
    setTimeout(doBotMove, 350);
  }

  // Detect opening
  detectOpening();

  return true;
}

function detectOpening() {
  const fen = G.game.fen().split(' ').slice(0, 4).join(' '); // Remove halfmove, fullmove, en passant
  for (const key in OPENINGS) {
    if (fen.startsWith(key)) {
      G.currentOpening = OPENINGS[key];
      updateOpeningDisplay();
      return;
    }
  }
  if (G.currentOpening) {
    G.currentOpening = null;
    updateOpeningDisplay();
  }
}

function updateOpeningDisplay() {
  const el = document.getElementById('opening-name');
  if (el) {
    el.textContent = G.currentOpening ? `[ ${G.currentOpening} ]` : '';
  }
}

async function updateEvalBar() {
  if (G.mode !== 'local' && G.mode !== 'bot') return;

  try {
    const fen = encodeURIComponent(G.game.fen());
    const url = `${STOCKFISH_URL}?fen=${fen}&depth=6`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success && data.evaluation) {
      const evalData = data.evaluation;
      let score = 0;
      let mate = null;
      if (evalData.type === 'cp') {
        score = evalData.value / 100; // to pawns
      } else if (evalData.type === 'mate') {
        mate = evalData.value;
        score = mate > 0 ? 10 : -10;
      }

      G.currentEval.score = score;
      G.currentEval.mate = mate;

      const fillEl = document.getElementById('eval-fill');
      const textEl = document.getElementById('eval-text');
      if (fillEl && textEl) {
        const height = Math.min(100, Math.max(0, 50 + score * 5)); // Cap at ±10
        fillEl.style.height = `${height}%`;
        fillEl.style.background = score > 0 ? '#4a90e2' : '#d32f2f';
        fillEl.style.bottom = score > 0 ? '50%' : '0';
        fillEl.style.top = score < 0 ? '50%' : 'auto';

        if (mate) {
          textEl.textContent = mate > 0 ? `#${mate}` : `#${-mate}`;
        } else {
          textEl.textContent = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
        }
      }
    }
  } catch(e) {
    console.warn('Eval update failed:', e);
  }
}

// ────────────────────────────────────────────────────
//  PROMOTION
// ────────────────────────────────────────────────────
function showPromotionModal(color) {
  const grid   = document.getElementById('promo-grid');
  grid.innerHTML = '';
  const pieces = [
    { type:'q', name:'Queen'  },
    { type:'r', name:'Rook'   },
    { type:'b', name:'Bishop' },
    { type:'n', name:'Knight' },
  ];
  pieces.forEach(({ type, name }) => {
    const btn = document.createElement('button');
    btn.className = 'promo-btn';
    btn.innerHTML = `
      <span class="promo-glyph color-${color}">${PIECE_UNICODE[color + type]}</span>
      <span class="promo-name">${name}</span>
    `;
    btn.addEventListener('click', () => {
      hideModal('modal-promotion');
      const { from, to } = G.pendingPromo;
      G.pendingPromo = null;
      executeMove(from, to, type);
    });
    grid.appendChild(btn);
  });
  showModal('modal-promotion');
}

// ────────────────────────────────────────────────────
//  BOT (STOCKFISH API)
// ────────────────────────────────────────────────────
async function doBotMove() {
  if (G.game.game_over()) return;
  G.botBusy = true;
  setBotThinking(true);
  updateTurnIndicator();

  const fen = encodeURIComponent(G.game.fen());
  const url = `${STOCKFISH_URL}?fen=${fen}&depth=${G.botDepth}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();

    if (data.success && data.bestmove) {
      const raw = String(data.bestmove || '').trim();
      const match = raw.match(/[a-h][1-8][a-h][1-8][qrbn]?/i);
      const bm = match ? match[0] : null;
      if (!bm) return fallbackRandomMove();

      const from  = bm.substring(0, 2);
      const to    = bm.substring(2, 4);
      const promo = bm[4] || null;

      await sleep(200);
      if (!G.game.game_over()) {
        executeMove(from, to, promo);
      }
    } else {
      fallbackRandomMove();
    }
  } catch(err) {
    console.warn('Stockfish API unavailable, using random move:', err);
    fallbackRandomMove();
  } finally {
    G.botBusy = false;
    setBotThinking(false);
  }
}

// ────────────────────────────────────────────────────
//  TOGGLES
// ────────────────────────────────────────────────────
function toggleBlindfold() {
  G.blindfold = !G.blindfold;
  document.body.classList.toggle('blindfold-mode', G.blindfold);
  document.getElementById('blindfold-banner').classList.toggle('visible', G.blindfold);
  localStorage.setItem('chessvibe_blindfold', G.blindfold);
}

function toggleCoords() {
  G.coords = !G.coords;
  renderBoard();
  localStorage.setItem('chessvibe_coords', G.coords);
}

function toggleSound() {
  G.muted = !G.muted;
  document.getElementById('btn-sound').textContent = G.muted ? '🔇' : '🔊';
  localStorage.setItem('chessvibe_muted', G.muted);
}

function toggleLightMode() {
  G.lightMode = !G.lightMode;
  document.body.classList.toggle('light-mode', G.lightMode);
  document.getElementById('btn-theme-toggle').textContent = G.lightMode ? '🌙' : '☀';
  localStorage.setItem('chessvibe_light', G.lightMode);
  applyTheme();
  applyPieceSet();
}

function fallbackRandomMove() {
  const moves = G.game.moves({ verbose: true });
  if (moves.length === 0) return;
  const m = moves[Math.floor(Math.random() * moves.length)];
  executeMove(m.from, m.to, m.promotion || null);
}

function setBotThinking(on) {
  document.getElementById('bot-thinking')?.classList.toggle('visible', on);
}

// ────────────────────────────────────────────────────
//  GAUNTLET
// ────────────────────────────────────────────────────
function startGauntlet() {
  G.gauntlet.active = true;
  G.gauntlet.stage = 1;
  G.gauntlet.wins = 0;
  G.gauntlet.losses = 0;
  hideModal('modal-gauntlet');
  updateGauntletStages();
  startGame('bot');
}

function updateGauntletProgress() {
  if (!G.gauntlet.active) return;
  if (G.game.game_over()) {
    const winner = G.game.in_checkmate() ? (G.game.turn() === 'w' ? 'b' : 'w') : null;
    if (winner === G.playerColor) {
      G.gauntlet.wins++;
      if (G.gauntlet.stage < 5) {
        // Next stage
        G.gauntlet.stage++;
        showGauntletStageClear();
      } else {
        // Completed
        G.gauntlet.completed = true;
        showGauntletCompleted();
      }
    } else {
      G.gauntlet.losses++;
      showGauntletFailed();
    }
  }
}

function updateGauntletStages() {
  document.querySelectorAll('.gauntlet-stage').forEach(stageEl => {
    const stage = parseInt(stageEl.dataset.stage);
    stageEl.classList.toggle('locked', stage > G.gauntlet.stage + 1);
  });
}

function showGauntletStageClear() {
  // Show modal for stage clear
  const modal = document.getElementById('modal-result');
  const title = document.getElementById('result-title');
  const reason = document.getElementById('result-reason');
  const ftr = document.querySelector('.result-ftr');

  title.textContent = `Stage ${G.gauntlet.stage - 1} Cleared!`;
  reason.textContent = `${G.gauntlet.stageName[G.gauntlet.stage - 2]} Defeated`;
  ftr.innerHTML = `
    <button id="btn-continue-gauntlet" class="btn-primary">Continue to Stage ${G.gauntlet.stage}</button>
    <button id="btn-exit-gauntlet" class="btn-ghost">Exit Gauntlet</button>
  `;
  document.getElementById('btn-continue-gauntlet').addEventListener('click', () => {
    hideModal('modal-result');
    startGame('bot');
  });
  document.getElementById('btn-exit-gauntlet').addEventListener('click', () => {
    G.gauntlet.active = false;
    hideModal('modal-result');
    showScreen('mode-screen');
  });
  showModal('modal-result');
}

function showGauntletCompleted() {
  const modal = document.getElementById('modal-result');
  const title = document.getElementById('result-title');
  const reason = document.getElementById('result-reason');
  const ftr = document.querySelector('.result-ftr');

  title.textContent = '🏆 Gauntlet Champion!';
  reason.textContent = 'You defeated all 5 bot levels!';
  ftr.innerHTML = `<button id="btn-exit-gauntlet" class="btn-ghost">Main Menu</button>`;
  document.getElementById('btn-exit-gauntlet').addEventListener('click', () => {
    G.gauntlet.active = false;
    hideModal('modal-result');
    showScreen('mode-screen');
  });
  showModal('modal-result');
}

function showGauntletFailed() {
  const modal = document.getElementById('modal-result');
  const title = document.getElementById('result-title');
  const reason = document.getElementById('result-reason');
  const ftr = document.querySelector('.result-ftr');

  title.textContent = 'Gauntlet Failed';
  reason.textContent = `Reached Stage ${G.gauntlet.stage}`;
  ftr.innerHTML = `<button id="btn-retry-gauntlet" class="btn-primary">Retry Gauntlet</button><button id="btn-exit-gauntlet" class="btn-ghost">Main Menu</button>`;
  document.getElementById('btn-retry-gauntlet').addEventListener('click', startGauntlet);
  document.getElementById('btn-exit-gauntlet').addEventListener('click', () => {
    G.gauntlet.active = false;
    hideModal('modal-result');
    showScreen('mode-screen');
  });
  showModal('modal-result');
}

// ────────────────────────────────────────────────────
//  GAME OVER
// ────────────────────────────────────────────────────
function checkGameOver() {
  if (!G.game.game_over()) return false;

  let result, reason;
  let winner = null;

  if (G.game.in_checkmate()) {
    winner = G.game.turn() === 'w' ? 'b' : 'w';
    const winnerName = winner === 'w' ? 'White' : 'Black';
    result = `${winnerName} Wins`;
    reason = 'by Checkmate';
    document.querySelector('.board-frame')?.classList.add('game-won');
    playSound('win');
  } else if (G.game.in_stalemate()) {
    result = 'Draw'; reason = 'by Stalemate';
  } else if (G.game.in_threefold_repetition()) {
    result = 'Draw'; reason = 'by Threefold Repetition';
  } else if (G.game.insufficient_material()) {
    result = 'Draw'; reason = '— Insufficient Material';
  } else if (G.game.in_draw()) {
    result = 'Draw'; reason = 'by 50-Move Rule';
  } else {
    result = 'Game Over'; reason = '';
  }

  // Update session stats
  updateSessionStats(winner);

  // Update gauntlet
  updateGauntletProgress();

  stopClock();
  // Analyze game for accuracy
  if (G.mode === 'local' || G.mode === 'bot') {
    setTimeout(() => analyzeGame(), 1000);
  }
  setTimeout(() => showResultModal(result, reason), 900);
  return true;
}

function updateSessionStats(winner) {
  const mode = G.mode === 'online' ? 'online' : G.mode === 'bot' ? 'bot' : 'local';
  if (winner === 'w') {
    G.sessionStats[mode].wins++;
  } else if (winner === 'b') {
    G.sessionStats[mode].losses++;
  } else {
    G.sessionStats[mode].draws++;
  }
  if (G.gauntlet.active) {
    G.sessionStats.gauntlet.attempts++;
  }
  saveSessionStats();
  updateSessionStatsDisplay();
}

async function analyzeGame() {
  if (G.gameReport.done) return;

  const history = G.game.history({ verbose: true });
  const maxMoves = Math.min(history.length, 40);
  const scores = { w: [], b: [] };

  for (let i = 0; i < maxMoves; i++) {
    const game = new Chess();
    for (let j = 0; j < i; j++) {
      game.move(history[j]);
    }

    try {
      const fen = encodeURIComponent(game.fen());
      const url = `${STOCKFISH_URL}?fen=${fen}&depth=6`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.evaluation) {
        const played = history[i];
        const bestMove = data.bestmove;
        let score = 100;

        if (bestMove && !bestMove.includes(played.from + played.to)) {
          // Played move differs from best
          const evalAfter = data.evaluation;
          // Simplified scoring
          if (evalAfter && evalAfter.type === 'cp') {
            const diff = Math.abs(evalAfter.value);
            if (diff > 300) score = 20;
            else if (diff > 100) score = 60;
            else if (diff > 50) score = 80;
            else score = 95;
          } else {
            score = 50; // Mate or something
          }
        }

        scores[played.color].push(score);
      }
    } catch(e) {
      console.warn('Analysis failed for move', i, e);
    }

    // Delay to avoid rate limiting
    await sleep(400);
  }

  G.gameReport.w = scores.w.length > 0 ? Math.round(scores.w.reduce((a,b)=>a+b,0) / scores.w.length) : 0;
  G.gameReport.b = scores.b.length > 0 ? Math.round(scores.b.reduce((a,b)=>a+b,0) / scores.b.length) : 0;
  G.gameReport.done = true;
  updateGameReportDisplay();
}

function updateGameReportDisplay() {
  if (!G.gameReport.done) return;

  const statsEl = document.getElementById('result-stats');
  if (!statsEl) return;

  const wAcc = G.gameReport.w;
  const bAcc = G.gameReport.b;
  const avgThinkW = G.moveTimes.filter(m => m.color === 'w').reduce((a,b)=>a+b.ms,0) / Math.max(1, G.moveTimes.filter(m => m.color === 'w').length) / 1000;
  const avgThinkB = G.moveTimes.filter(m => m.color === 'b').reduce((a,b)=>a+b.ms,0) / Math.max(1, G.moveTimes.filter(m => m.color === 'b').length) / 1000;

  statsEl.innerHTML = `
    <div>Game Report</div>
    <div>White Accuracy: ${wAcc}% <div class="accuracy-bar-track"><div class="accuracy-bar-fill" style="width:${wAcc}%"></div></div></div>
    <div>Black Accuracy: ${bAcc}% <div class="accuracy-bar-track"><div class="accuracy-bar-fill" style="width:${bAcc}%"></div></div></div>
    <div>Avg think time: White ${avgThinkW.toFixed(1)}s · Black ${avgThinkB.toFixed(1)}s</div>
  `;
}

// ────────────────────────────────────────────────────
//  MOVE HISTORY
// ────────────────────────────────────────────────────
function updateMoveHistory() {
  const list    = document.getElementById('move-list');
  const history = G.game.history({ verbose: true });
  if (!list) return;

  list.innerHTML = '';

  if (history.length === 0) {
    list.innerHTML = '<div class="move-list-empty">No moves yet</div>';
    return;
  }

  for (let i = 0; i < history.length; i += 2) {
    const row    = document.createElement('div');
    row.className = 'move-row';

    const numEl = document.createElement('span');
    numEl.className = 'move-num';
    numEl.textContent = (Math.floor(i / 2) + 1) + '.';
    row.appendChild(numEl);

    const wSpan = document.createElement('span');
    wSpan.className = 'move-san';
    let text = history[i].san + (G.annotations[i] || '');
    if (G.moveTimes[i] && G.moveTimes[i].ms > 5000) {
      const secs = Math.round(G.moveTimes[i].ms / 1000);
      const timeBadge = document.createElement('span');
      timeBadge.className = 'move-time-badge' + (G.moveTimes[i].ms > 30000 ? ' slow' : '');
      timeBadge.textContent = secs + 's';
      wSpan.appendChild(document.createTextNode(text));
      wSpan.appendChild(timeBadge);
    } else {
      wSpan.textContent = text;
    }
    wSpan.dataset.moveIdx = i;
    wSpan.addEventListener('click', () => jumpToMove(i));
    wSpan.addEventListener('contextmenu', (e) => showAnnotationMenu(e, i));
    row.appendChild(wSpan);

    if (history[i + 1]) {
      const bSpan = document.createElement('span');
      bSpan.className = 'move-san';
      let text = history[i + 1].san + (G.annotations[i + 1] || '');
      if (G.moveTimes[i + 1] && G.moveTimes[i + 1].ms > 5000) {
        const secs = Math.round(G.moveTimes[i + 1].ms / 1000);
        const timeBadge = document.createElement('span');
        timeBadge.className = 'move-time-badge' + (G.moveTimes[i + 1].ms > 30000 ? ' slow' : '');
        timeBadge.textContent = secs + 's';
        bSpan.appendChild(document.createTextNode(text));
        bSpan.appendChild(timeBadge);
      } else {
        bSpan.textContent = text;
      }
      bSpan.dataset.moveIdx = i + 1;
      bSpan.addEventListener('click', () => jumpToMove(i + 1));
      bSpan.addEventListener('contextmenu', (e) => showAnnotationMenu(e, i + 1));
      row.appendChild(bSpan);
    }

    list.appendChild(row);
  }

  list.scrollTop = list.scrollHeight;
}

// ────────────────────────────────────────────────────
//  REPLAY ENGINE
// ────────────────────────────────────────────────────
function jumpToMove(idx) {
  const history = G.game.history({ verbose: true });
  if (history.length === 0) return;
  idx = Math.max(0, Math.min(idx, history.length - 1));

  G.replaying   = true;
  G.replayIdx   = idx;

  // Rebuild game state up to idx
  G.replayGame  = new Chess();
  for (let i = 0; i <= idx; i++) {
    G.replayGame.move({ from: history[i].from, to: history[i].to, promotion: history[i].promotion });
  }

  const lastM = history[idx];
  G.lastMove  = { from: lastM.from, to: lastM.to };
  G.selected  = null;
  G.legalMoves = [];

  renderBoard();
  highlightActiveMoveInList(idx);
  updateBreadcrumb();
}

function highlightActiveMoveInList(idx) {
  document.querySelectorAll('.move-san').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.moveIdx) === idx);
  });
  // Scroll the active element into view
  const activeEl = document.querySelector('.move-san.active');
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
}

function exitReplay() {
  G.replaying  = false;
  G.replayGame = null;
  G.replayIdx  = -1;
  document.querySelectorAll('.move-san').forEach(el => el.classList.remove('active'));

  // Restore lastMove from actual game
  const hist = G.game.history({ verbose: true });
  const last  = hist[hist.length - 1];
  G.lastMove  = last ? { from: last.from, to: last.to } : null;
  G.selected  = null;
  G.legalMoves = [];
  renderBoard();
}

function replayFirst() {
  const history = G.game.history({ verbose: true });
  if (history.length === 0) return;
  jumpToMove(0);
}

function replayPrev() {
  if (!G.replaying) {
    const history = G.game.history({ verbose: true });
    if (history.length > 0) jumpToMove(history.length - 1);
    return;
  }
  if (G.replayIdx > 0) {
    jumpToMove(G.replayIdx - 1);
  } else {
    // Before first move — show starting position
    G.replaying  = true;
    G.replayIdx  = -1;
    G.replayGame = new Chess();
    G.lastMove   = null;
    G.selected   = null;
    G.legalMoves = [];
    renderBoard();
    document.querySelectorAll('.move-san').forEach(el => el.classList.remove('active'));
  }
}

function replayNext() {
  const history = G.game.history({ verbose: true });
  if (history.length === 0) return;
  if (!G.replaying) return;
  if (G.replayIdx < history.length - 1) {
    jumpToMove(G.replayIdx + 1);
  } else {
    exitReplay();
  }
}

function replayLast() {
  const history = G.game.history({ verbose: true });
  if (history.length === 0) return;
  jumpToMove(history.length - 1);
}

// ────────────────────────────────────────────────────
//  CAPTURED PIECES & MATERIAL
// ────────────────────────────────────────────────────
function updateCapturedStrips() {
  const capturedByWhiteEl = document.getElementById('captured-by-white');
  const capturedByBlackEl = document.getElementById('captured-by-black');

  // Pieces captured BY white = black pieces removed
  // Show as black unicode glyphs in white's strip
  if (capturedByWhiteEl) {
    const sorted = sortCaptured(G.captured.w);
    capturedByWhiteEl.textContent = sorted.map(t => PIECE_UNICODE['b' + t]).join('');
  }
  // Pieces captured BY black = white pieces removed
  if (capturedByBlackEl) {
    const sorted = sortCaptured(G.captured.b);
    capturedByBlackEl.textContent = sorted.map(t => PIECE_UNICODE['w' + t]).join('');
  }

  // Material advantage
  const wScore = G.captured.w.reduce((s, p) => s + (PIECE_VALUES[p] || 0), 0);
  const bScore = G.captured.b.reduce((s, p) => s + (PIECE_VALUES[p] || 0), 0);

  const wAdv = document.getElementById('advantage-white');
  const bAdv = document.getElementById('advantage-black');
  if (wAdv) wAdv.textContent = wScore > bScore ? `+${wScore - bScore}` : '';
  if (bAdv) bAdv.textContent = bScore > wScore ? `+${bScore - wScore}` : '';
}

// ────────────────────────────────────────────────────
//  HINT ARROW
// ────────────────────────────────────────────────────
function drawHintArrow(from, to) {
  const canvas = document.getElementById('hint-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const boardEl = document.getElementById('board');

  const rect = boardEl.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const fromSq = document.querySelector(`[data-square="${from}"]`);
  const toSq = document.querySelector(`[data-square="${to}"]`);
  if (!fromSq || !toSq) return;

  const fromRect = fromSq.getBoundingClientRect();
  const toRect = toSq.getBoundingClientRect();

  const centerX = (fromRect.left + fromRect.right) / 2 - rect.left;
  const centerY = (fromRect.top + fromRect.bottom) / 2 - rect.top;
  const targetX = (toRect.left + toRect.right) / 2 - rect.left;
  const targetY = (toRect.top + toRect.bottom) / 2 - rect.top;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(targetY - centerY, targetX - centerX);
  const headLen = 20;
  ctx.beginPath();
  ctx.moveTo(targetX, targetY);
  ctx.lineTo(targetX - headLen * Math.cos(angle - Math.PI / 6), targetY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(targetX, targetY);
  ctx.lineTo(targetX - headLen * Math.cos(angle + Math.PI / 6), targetY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function clearHint() {
  const canvas = document.getElementById('hint-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  if (G.hint.timeout) {
    clearTimeout(G.hint.timeout);
    G.hint.timeout = null;
  }
  G.hint.active = false;
}

async function requestHint() {
  if (G.mode !== 'local' && G.mode !== 'bot') return;
  if (G.mode === 'bot' && G.game.turn() === G.playerColor) return; // Only during bot's turn
  if (G.hint.active) return;

  const btn = document.getElementById('btn-hint');
  if (btn) {
    btn.textContent = 'thinking...';
    btn.disabled = true;
  }

  try {
    const fen = encodeURIComponent(G.game.fen());
    const url = `${STOCKFISH_URL}?fen=${fen}&depth=8`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success && data.bestmove) {
      const raw = String(data.bestmove || '').trim();
      const match = raw.match(/[a-h][1-8][a-h][1-8]/i);
      if (match) {
        const from = match[0].substring(0, 2);
        const to = match[0].substring(2, 4);
        G.hint.from = from;
        G.hint.to = to;
        G.hint.active = true;
        drawHintArrow(from, to);
        G.hint.timeout = setTimeout(clearHint, 4000);
      }
    }
  } catch(e) {
    console.warn('Hint failed:', e);
  } finally {
    if (btn) {
      btn.textContent = 'Hint';
      btn.disabled = false;
    }
  }
}

function sortCaptured(arr) {
  const order = ['q','r','b','n','p'];
  return [...arr].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

// ────────────────────────────────────────────────────
//  SESSION STATS
// ────────────────────────────────────────────────────
function saveSessionStats() {
  localStorage.setItem('chessvibe_session_stats', JSON.stringify(G.sessionStats));
}

function loadSessionStats() {
  const data = localStorage.getItem('chessvibe_session_stats');
  if (data) {
    try {
      G.sessionStats = { ...G.sessionStats, ...JSON.parse(data) };
    } catch(e) {}
  }
}

function updateSessionStatsDisplay() {
  const el = document.getElementById('session-stats-bar');
  if (!el) return;

  const stats = G.sessionStats;
  const parts = [];
  if (stats.local.wins + stats.local.losses + stats.local.draws > 0) {
    parts.push(`Local: ${stats.local.wins}W ${stats.local.losses}L ${stats.local.draws}D`);
  }
  if (stats.bot.wins + stats.bot.losses + stats.bot.draws > 0) {
    parts.push(`Bot: ${stats.bot.wins}W ${stats.bot.losses}L ${stats.bot.draws}D`);
  }
  if (stats.online.wins + stats.online.losses + stats.online.draws > 0) {
    parts.push(`Online: ${stats.online.wins}W ${stats.online.losses}L ${stats.online.draws}D`);
  }

  el.textContent = parts.length > 0 ? `Session · ${parts.join(' · ')}` : '';
  el.style.display = parts.length > 0 ? 'block' : 'none';
}

function resetSessionStats() {
  G.sessionStats = {
    local: { wins: 0, losses: 0, draws: 0 },
    bot: { wins: 0, losses: 0, draws: 0 },
    online: { wins: 0, losses: 0, draws: 0 },
    gauntlet: { stagesCleared: 0, attempts: 0 }
  };
  saveSessionStats();
  updateSessionStatsDisplay();
}

// ────────────────────────────────────────────────────
//  TIMER
// ────────────────────────────────────────────────────
function startClock() {
  if (!G.timerOn) return;
  clearInterval(G.clkInterval);
  G.activeClk  = G.game.turn();
  G.clkInterval = setInterval(tickClock, 1000);
}

function tickClock() {
  if (!G.activeClk) return;
  G.timers[G.activeClk]--;
  renderTimers();
  if (G.timers[G.activeClk] <= 0) {
    stopClock();
    const loser = G.activeClk;
    const winner = loser === 'w' ? 'Black' : 'White';
    showResultModal(`${winner} Wins`, `Time Out — ${loser === 'w' ? 'White' : 'Black'} ran out of time`);
  }
}

function switchClock() {
  G.activeClk = G.game.turn();
  renderTimers();
}

function stopClock() {
  clearInterval(G.clkInterval);
  G.clkInterval = null;
  G.activeClk   = null;
  renderTimers();
}

function renderTimers() {
  ['w','b'].forEach(color => {
    const id = color === 'w' ? 'timer-white' : 'timer-black';
    const el = document.getElementById(id);
    if (!el) return;
    const t    = G.timers[color];
    const mins = String(Math.floor(t / 60)).padStart(2, '0');
    const secs = String(t % 60).padStart(2, '0');
    el.textContent = `${mins}:${secs}`;
    el.classList.toggle('timer-low', t < 30 && G.timerOn);
    el.classList.toggle('timer-pill-active', G.activeClk === color);
    el.classList.toggle('bullet-mode', G.bulletMode);
  });
}

function togglePause() {
  if (G.mode === 'local' || G.mode === 'bot') {
    G.timers.paused = !G.timers.paused;
    if (G.timers.paused) {
      stopClock();
      document.getElementById('btn-pause').textContent = 'Resume';
      // Show pause overlay
      let overlay = document.getElementById('pause-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pause-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontSize = '2rem';
        overlay.style.color = 'white';
        overlay.style.zIndex = '1000';
        overlay.textContent = 'Paused';
        document.getElementById('board').appendChild(overlay);
      }
      overlay.style.display = 'flex';
    } else {
      startClock();
      document.getElementById('btn-pause').textContent = 'Pause';
      const overlay = document.getElementById('pause-overlay');
      if (overlay) overlay.style.display = 'none';
    }
  }
}

// ────────────────────────────────────────────────────
//  DRAG & DROP
// ────────────────────────────────────────────────────
let drag = {
  active:  false,
  sq:      null,
  ghost:   null,
  moved:   false,
  startX:  0,
  startY:  0,
};

function initDragDrop() {
  const boardEl = document.getElementById('board');

  // Click (for non-drag taps)
  boardEl.addEventListener('click', onBoardClick);

  // Mouse drag
  boardEl.addEventListener('mousedown', onDragStart);
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);

  // Touch drag
  boardEl.addEventListener('touchstart', onTouchStart, { passive: false });
  document.addEventListener('touchmove', onTouchMove,  { passive: false });
  document.addEventListener('touchend', onTouchEnd,    { passive: false });
}

function onBoardClick(e) {
  if (drag.moved) return; // was a drag, not a click
  const sq = e.target.closest('[data-square]')?.dataset.square;
  if (sq) handleSquareClick(sq);
}

function onDragStart(e) {
  const pieceEl = e.target.closest('.piece');
  if (!pieceEl) return;
  const sq = pieceEl.closest('[data-square]')?.dataset.square;
  if (!sq) return;

  // Only initiate drag if it's the current player's turn and their piece
  const piece = G.game.get(sq);
  if (!piece || piece.color !== G.game.turn()) return;
  if ((G.mode === 'bot' || G.mode === 'online') && piece.color !== G.playerColor) return;

  drag.active = true;
  drag.sq     = sq;
  drag.moved  = false;
  drag.startX = e.clientX;
  drag.startY = e.clientY;

  // Ensure the piece is selected when dragging starts
  if (G.selected !== sq) {
    trySelect(sq);
  }

  // Create ghost
  drag.ghost = document.createElement('div');
  drag.ghost.className = 'drag-ghost';
  
  if (G.pieceSet === 'unicode') {
    drag.ghost.textContent = pieceEl.textContent;
    const isWhite = pieceEl.classList.contains('piece-w');
    drag.ghost.style.color = getPieceColor(isWhite, G.theme);
  } else {
    const img = pieceEl.querySelector('img');
    if (img) {
      const gImg = img.cloneNode();
      gImg.style.width = '100%'; gImg.style.height = '100%';
      drag.ghost.appendChild(gImg);
    }
  }

  updateGhostPos(e.clientX, e.clientY);
  document.body.appendChild(drag.ghost);
  
  pieceEl.style.opacity = '0.3';
  pieceEl.style.pointerEvents = 'none';

  e.preventDefault();
}

function onDragMove(e) {
  if (!drag.active) return;
  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;

  updateGhostPos(e.clientX, e.clientY);

  // Highlight target square
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  const el = document.elementFromPoint(e.clientX, e.clientY);
  el?.closest('[data-square]')?.classList.add('drag-over');
}

function onDragEnd(e) {
  if (!drag.active) return;
  const el         = document.elementFromPoint(e.clientX, e.clientY);
  const target     = el?.closest('[data-square]')?.dataset.square;
  const movedWasTrue = drag.moved;
  const sourceSq   = drag.sq; // must capture BEFORE cleanup, which nulls drag.sq
  dragCleanup();
  if (movedWasTrue && target && sourceSq && target !== sourceSq) {
    if (G.legalMoves.includes(target) || G.game.moves({ square: sourceSq, verbose: true }).some(m => m.to === target)) {
      attemptMove(sourceSq, target);
    } else {
      renderBoard();
    }
  } else if (!movedWasTrue && sourceSq) {
    // Treat as click
    handleSquareClick(sourceSq);
  } else {
    renderBoard();
  }
}

function onTouchStart(e) {
  const pieceEl = e.target.closest('.piece');
  if (!pieceEl) return;
  const sq = pieceEl.closest('[data-square]')?.dataset.square;
  if (!sq) return;

  const piece = G.game.get(sq);
  if (!piece || piece.color !== G.game.turn()) return;
  if ((G.mode === 'bot' || G.mode === 'online') && piece.color !== G.playerColor) return;

  const touch = e.touches[0];
  drag.active = true;
  drag.sq     = sq;
  drag.moved  = false;
  drag.startX = touch.clientX;
  drag.startY = touch.clientY;

  // Ensure the piece is selected when dragging starts
  if (G.selected !== sq) {
    trySelect(sq);
  }

  drag.ghost = document.createElement('div');
  drag.ghost.className = 'drag-ghost';
  
  if (G.pieceSet === 'unicode') {
    drag.ghost.textContent = pieceEl.textContent;
    const isWhite = pieceEl.classList.contains('piece-w');
    drag.ghost.style.color = getPieceColor(isWhite, G.theme);
  } else {
    const img = pieceEl.querySelector('img');
    if (img) {
      const gImg = img.cloneNode();
      gImg.style.width = '100%'; gImg.style.height = '100%';
      drag.ghost.appendChild(gImg);
    }
  }

  updateGhostPos(touch.clientX, touch.clientY - 40);
  document.body.appendChild(drag.ghost);
  
  pieceEl.style.opacity = '0.3';
  pieceEl.style.pointerEvents = 'none';

  e.preventDefault();
}

function onTouchMove(e) {
  if (!drag.active) return;
  const touch = e.touches[0];
  const dx = touch.clientX - drag.startX;
  const dy = touch.clientY - drag.startY;
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;

  updateGhostPos(touch.clientX, touch.clientY - 30);

  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  el?.closest('[data-square]')?.classList.add('drag-over');

  e.preventDefault();
}

function onTouchEnd(e) {
  if (!drag.active) return;
  const touch  = e.changedTouches[0];
  const el     = document.elementFromPoint(touch.clientX, touch.clientY);
  const target = el?.closest('[data-square]')?.dataset.square;

  // Preserve drag state BEFORE cleanup resets it
  const movedWasTrue = drag.moved;
  const sourceSq     = drag.sq;
  dragCleanup();

  if (movedWasTrue && target && sourceSq && target !== sourceSq) {
    if (G.selected !== sourceSq) {
      G.selected = null; G.legalMoves = [];
      trySelect(sourceSq);
    }
    if (G.legalMoves.includes(target)) {
      attemptMove(sourceSq, target);
    } else {
      clearSelection();
      renderBoard();
    }
  } else if (!movedWasTrue && sourceSq) {
    handleSquareClick(sourceSq);
  } else {
    renderBoard();
  }
}

function updateGhostPos(x, y) {
  if (!drag.ghost) return;
  drag.ghost.style.left = `${x}px`;
  drag.ghost.style.top  = `${y}px`;
}

function dragCleanup() {
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  if (drag.ghost) { drag.ghost.remove(); drag.ghost = null; }
  
  // Restore piece styles
  document.querySelectorAll('.piece').forEach(el => { 
    el.style.opacity = ''; 
    el.style.pointerEvents = ''; 
  });

  drag.active = false;
  drag.sq = null;
  drag.moved = false;
  drag.startX = 0;
  drag.startY = 0;
}

// ────────────────────────────────────────────────────
//  ONLINE (PeerJS P2P)
// ────────────────────────────────────────────────────
function initPeer(asHost, code, asSpectator = false) {
  // Destroy any existing peer
  if (G.peer) { try { G.peer.destroy(); } catch(_){} G.peer = null; }

  const peerId = 'chessvibe-' + code;
  G.roomCode = code;

  G.peer = new Peer(asHost ? peerId : undefined, {
    host: '0.peerjs.com',
    port: 443,
    secure: true,
    config: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    },
  });

  G.peer.on('error', (err) => {
    console.warn('PeerJS error:', err.type, err);
    if (asSpectator) {
      setOnlineStatus('spectate', `Connection error: ${err.type}`, 'err');
    } else {
      const msg = err.type === 'unavailable-id'
        ? 'Room code taken. Try another.'
        : `Connection error: ${err.type}`;
      setOnlineStatus(asHost ? 'create' : 'join', msg, 'err');
    }
  });

  if (asSpectator) {
    G.isSpectator = true;
    G.peer.on('open', () => {
      setOnlineStatus('spectate', `⏳ Connecting to room ${code}…`, '');
      const conn = G.peer.connect(peerId, { reliable: true });
      G.conn = conn;
      wireConnection(conn);

      let failed = false;
      conn.on('open', () => {
        conn.send({ type:'spectate', name: 'Spectator' });
        setOnlineStatus('spectate', '✓ Connected! Watching game…', 'ok');
      });
      conn.on('error', () => {
        failed = true;
        setOnlineStatus('spectate', '✗ Room not found. Check code.', 'err');
      });
      // Room doesn't exist / host offline → surface an error quickly
      setTimeout(() => {
        if (!failed && !G.onlineReady && G.spectators.length === 0 && G.isSpectator) {
          setOnlineStatus('spectate', '✗ Room not found or empty. Check code.', 'err');
        }
      }, 12000);
    });
  } else if (asHost) {
    G.isHost      = true;
    G.isSpectator = false;
    G.playerColor = 'w';
    G.moveCounter = 0; // authoritative move sequence counter

    G.peer.on('open', (id) => {
      setOnlineStatus('create', '⏳ Waiting for opponent to join…', '');
    });

    // The VERY FIRST incoming data connection becomes the opponent. Any later
    // connection is treated as a spectator. This gives both players a stable,
    // deterministic role assignment.
    let opponentSettled = false;
    G.peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        if (data.type === 'spectate') {
          // Already-identified spectator, or a new spectator after opponent
          G.spectators.push(conn);
          syncSpectatorCount();
          setOnlineStatus('create', `✓ Waiting for opponent + ${G.spectators.length} spectator(s)`, 'ok');
        } else if (data.type === 'join') {
          // First 'join' message marks this connection as THE opponent
          if (!opponentSettled) {
            opponentSettled = true;
            G.conn = conn;
            wireConnection(conn);
            setOnlineStatus('create', '✓ Opponent connected! Starting…', 'ok');
            conn.send({ type:'handshake', color:'b' });
            // Host starts the game immediately (we are White and ready now)
            startGame('online');
          } else {
            // Duplicate join — this peer is a spectator
            G.spectators.push(conn);
            syncSpectatorCount();
            conn.send({ type:'spectator-welcome' });
          }
        }
      });
      conn.on('error', () => {
        if (!opponentSettled) setOnlineStatus('create', '✗ Join failed. Try again.', 'err');
      });
    });

  } else {
    G.isHost      = false;
    G.isSpectator = false;

    G.peer.on('open', () => {
      setOnlineStatus('join', `⏳ Connecting to room ${code}…`, '');
      const conn = G.peer.connect(peerId, { reliable: true });
      G.conn = conn;
      wireConnection(conn);

      let settled = false;
      conn.on('open', () => {
        // Announce ourselves as the opponent joining the room
        conn.send({ type:'join' });
        setOnlineStatus('join', '✓ Connected! Waiting for host…', 'ok');
      });
      conn.on('error', () => {
        if (!settled) setOnlineStatus('join', '✗ Room not found. Check code.', 'err');
      });
      // Give the peerjs negotiation some time, then report timeout
      setTimeout(() => {
        if (!G.onlineReady) {
          setOnlineStatus('join', '✗ Room not found or empty. Check code.', 'err');
        }
      }, 12000);
    });
  }
}

function wireConnection(conn) {
  conn.on('data', handleOnlineData);
  conn.on('close', () => {
    // Remove from spectators if present
    const specIdx = G.spectators.indexOf(conn);
    if (specIdx !== -1) {
      G.spectators.splice(specIdx, 1);
      setOnlineStatus('create', `✓ Opponent + ${G.spectators.length} spectator(s) connected`, 'ok');
    } else if (conn === G.conn) {
      G.onlineReady = false;
      if (!G.game?.game_over()) {
        showResultModal('Opponent Disconnected', '');
      }
    }
  });
}

function broadcastToSpectators(data) {
  G.spectators.forEach(conn => {
    try { conn.send(data); } catch(e) {}
  });
}

function syncSpectatorCount() {
  const el = document.getElementById('spectator-count');
  const num = document.getElementById('spectator-num');
  if (!el || !num) return;
  el.classList.toggle('hidden', G.spectators.length === 0);
  num.textContent = G.spectators.length;
  broadcastToSpectators({ type: 'spectator-count', count: G.spectators.length });
}

function executeTakeback() {
  G.game.undo();
  G.game.undo();
  G.lastMove = null;
  G.flipped = !G.flipped;
  clearHint();
  renderBoard();
  updateMoveHistory();
  updateBreadcrumb();
  // Adjust timers
  if (G.timerOn && G.increment > 0) {
    G.timers.w += G.increment * 2;
    G.timers.b += G.increment * 2;
    renderTimers();
  }
}

function executeUndo() {
  if (G.mode !== 'local' || G.game.history().length === 0) return;
  G.game.undo();
  if (G.game.history().length > 0) G.game.undo();
  G.lastMove = null;
  G.flipped = !G.flipped;
  clearHint();
  renderBoard();
  updateMoveHistory();
  updateBreadcrumb();
  // Adjust timers
  if (G.timerOn && G.increment > 0) {
    G.timers.w += G.increment * 2;
    G.timers.b += G.increment * 2;
    renderTimers();
  }
}

function handleOnlineData(data) {
  switch (data.type) {
    case 'handshake':
      G.playerColor = data.color;
      G.flipped     = data.color === 'b';
      G.onlineReady = true;
      G.moveCounter = 0;
      setNavGameMode('Online — You are ' + (data.color === 'w' ? 'White ♔' : 'Black ♚'));
      hideModal('modal-online');
      startGame('online');
      break;

    case 'move':
      if (!G.onlineReady || !G.game) return;
      if (G.isSpectator) {
        // Spectators just execute the move to watch
        executeMove(data.from, data.to, data.promotion || null);
      } else if (G.game.turn() !== G.playerColor) {
        executeMove(data.from, data.to, data.promotion || null);
      } else {
        // Sequence mismatch: we moved but the opponent shows a different
        // position — ask the host to re-sync so both boards stay identical.
        if (G.isHost && G.conn) {
          G.conn.send({ type:'sync-request' });
        } else if (G.conn) {
          G.conn.send({ type:'sync-request' });
        }
      }
      break;

    case 'sync-request':
      // Host rebuilds the position from its PGN and sends it over so the
      // requester can restore an identical board state.
      if (G.isHost && G.game) {
        G.conn?.send({ type:'sync-state', pgn: G.game.pgn(), moveCounter: G.moveCounter });
      }
      break;

    case 'sync-state':
      if (G.onlineReady && G.game && data.pgn) {
        G.game = new Chess();
        G.game.load_pgn(data.pgn);
        G.moveCounter = data.moveCounter || 0;
        const hist = G.game.history({ verbose: true });
        const last = hist[hist.length - 1];
        G.lastMove = last ? { from: last.from, to: last.to } : null;
        G.selected = null; G.legalMoves = [];
        renderBoard();
        updateMoveHistory();
        updateBreadcrumb();
        checkGameOver();
      }
      break;

    case 'spectator-welcome':
      // We joined as a spectator despite clicking Join — adapt UI
      G.isSpectator = true;
      G.onlineReady = false;
      if (G.conn) G.conn.send({ type:'spectate', name: 'Spectator' });
      document.body.classList.add('spectator-mode');
      showNotification('This room is full — watching as spectator.');
      break;

    case 'spectator-count':
      { const num = document.getElementById('spectator-num');
        const el = document.getElementById('spectator-count');
        if (num) num.textContent = data.count || 0;
        if (el) el.classList.toggle('hidden', !data.count);
      }
      break;

    case 'spectate':
      // Host receives this from spectators
      if (G.isHost) {
        // Connection is already added in initPeer
        setOnlineStatus('create', `✓ Opponent + ${G.spectators.length} spectator(s) connected`, 'ok');
      }
      break;

    case 'draw-offer':
      if (G.isSpectator) return;
      // Use the shared draw modal (with a note that the offer is remote)
      document.getElementById('draw-offer-title').textContent = 'Remote Draw Offer';
      document.getElementById('draw-offer-message').textContent = 'Your opponent offers a draw — Accept or Decline?';
      G.pendingRemoteDraw = true;
      showModal('modal-local-draw');
      break;

    case 'draw-accept':
      if (G.pendingRemoteDraw) {
        G.pendingRemoteDraw = false;
        hideModal('modal-local-draw');
      }
      showResultModal('Draw', 'by Agreement');
      break;

    case 'draw-decline':
      if (G.pendingRemoteDraw) {
        G.pendingRemoteDraw = false;
        hideModal('modal-local-draw');
        showNotification('Opponent declined your draw offer.');
      }
      break;

    case 'takeback-request':
      if (!G.isSpectator) showModal('modal-takeback-request');
      break;

    case 'takeback-accept':
      executeTakeback();
      break;

    case 'takeback-decline':
      showNotification('Takeback declined.');
      break;

    case 'rematch-request':
      if (!G.isSpectator) showModal('modal-rematch-request');
      break;

    case 'rematch-accept':
      hideModal('modal-result');
      startGame('online');
      break;

    case 'rematch-decline':
      showNotification('Rematch declined.');
      break;

    case 'resign': {
      const winner = data.color === 'w' ? 'Black' : 'White';
      showResultModal(`${winner} Wins`, 'by Resignation');
      break;
    }

    case 'chat':
      appendChatMessage(data.name, data.text, false);
      break;
  }
}

function showNotification(msg) {
  const existing = document.getElementById('toast-notification');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.className = 'draw-notification';
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--panel, #1a1a1a);
    border: 1px solid var(--border, #333);
    border-radius: var(--radius, 12px);
    padding: 10px 20px;
    color: var(--text-dim, #aaa);
    font-size: 0.9rem;
    z-index: 2000;
    animation: fade-in-out 2.5s ease forwards;
    pointer-events: none;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function setOnlineStatus(tab, msg, state) {
  const id = `online-status-${tab}`;
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className   = `online-status${state ? ' status-' + state : ''}`;
}

// ────────────────────────────────────────────────────
//  CHAT
// ────────────────────────────────────────────────────
function appendChatMessage(name, text, isSelf) {
  const messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg' + (isSelf ? ' chat-msg-self' : '');
  msgEl.innerHTML = `<span class="chat-name">${name}:</span> ${text}`;
  messagesEl.appendChild(msgEl);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Limit to 50 messages
  while (messagesEl.children.length > 50) {
    messagesEl.removeChild(messagesEl.firstChild);
  }
}

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const name = G.playerColor === 'w' ? 'White' : 'Black';
  if (G.conn) {
    G.conn.send({ type: 'chat', name, text });
  }
  appendChatMessage(name, text, true);
  input.value = '';
}

// ────────────────────────────────────────────────────
//  GAME INITIALIZATION
// ────────────────────────────────────────────────────
function startGame(mode) {
  // Hide all active modals and overlay directly
  document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
  document.getElementById('modal-overlay')?.classList.remove('active');

  document.querySelector('.board-frame')?.classList.remove('game-won');
  G.game = new Chess();
  G.mode       = mode;
  G.selected   = null;
  G.legalMoves = [];
  G.lastMove   = null;
  G.captured   = { w: [], b: [] };
  G.replaying  = false;
  G.replayGame = null;
  G.replayIdx  = -1;
  G.botBusy    = false;
  G.preMove    = null;
  G.annotations = {};
  G.inited     = true;

  // Reset new features
  G.hint = { active: false, from: null, to: null, timeout: null };
  G.gameReport = { w: null, b: null, done: false };
  G.currentEval = { score: 0, mate: null };
  G.currentOpening = null;
  G.chess960 = false;
  G.blindfold = false;
  G.moveTimes = [];
  G.moveStartTime = null;
  clearHint();
  document.body.classList.remove('blindfold-mode');
  document.getElementById('blindfold-banner').classList.remove('visible');

  // Reset board orientation
  if (mode === 'online') {
    G.flipped = (G.playerColor === 'b');
  } else if (mode === 'bot') {
    G.flipped = (G.playerColor === 'b');
  } else {
    G.flipped = false; // Local mode: always start with white at bottom
  }

  // Reset timer
  stopClock();
  let timerSec = 0;
  if (mode === 'local') {
    timerSec = G.timers ? G.timers.w : 600; // Use the selected time from modal
    G.timers = { w: timerSec, b: timerSec };
  } else {
    timerSec = getSelectedTimer(mode);
    G.timers = { w: timerSec, b: timerSec };
  }
  G.timerOn = timerSec > 0;
  G.bulletMode = timerSec <= 60 && timerSec > 0;
  renderTimers();

  // Show game screen
  showScreen('game-screen');
  showNavButtons(true);

  renderBoard();
  updateMoveHistory();
  updateBreadcrumb(); // Will show empty initially
  updatePlayerLabels();
  setNavGameMode(modeLabel(mode));

  // Spectator mode UI adjustments
  if (G.isSpectator) {
    document.body.classList.add('spectator-mode');
    const navStatus = document.getElementById('nav-game-mode');
    if (navStatus) navStatus.textContent = '♟ Watching Game';
    
    // Add spectator badge
    let badge = document.getElementById('spectator-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'spectator-badge';
      badge.className = 'spectator-badge';
      badge.innerHTML = '👁 Watching';
      document.querySelector('.nav-actions')?.prepend(badge);
    }
    badge.style.display = 'inline-flex';
  } else {
    document.body.classList.remove('spectator-mode');
    const badge = document.getElementById('spectator-badge');
    if (badge) badge.style.display = 'none';
  }

  playSound('start');

  // Start clock
  if (G.timerOn) startClock();

  // If bot and player is black, bot plays first
  if (mode === 'bot' && G.playerColor === 'b') {
    setTimeout(doBotMove, 500);
  }

  // If online, mark ready
  if (mode === 'online') {
    G.onlineReady = true;
  }
}

function modeLabel(mode) {
  if (G.isSpectator) return 'Spectate';
  const labels = { local:'Local 2P', bot:'vs Stockfish', online:'Online 1v1' };
  let label = labels[mode] || mode;
  if (G.chess960) label += ' • 960';
  return label;
}

function getSelectedTimer(mode) {
  const id =
    mode === 'bot' ? 'bot-timer-select' :
    mode === 'online' ? 'online-timer-select' :
    'local-timer-select';

  const el = document.getElementById(id);
  // Online modal has no timer picker yet, so fall back to a sensible default.
  if (!el) return 600;
  const secs = parseInt(el.value, 10);
  return isNaN(secs) ? 600 : secs;
}

function updatePlayerLabels() {
  const topName = document.getElementById('player-top-name');
  const botName = document.getElementById('player-bottom-name');
  const topAvt  = document.getElementById('avatar-top');
  const botAvt  = document.getElementById('avatar-bottom');

  // Bottom = white (normal), top = black; reversed when flipped
  const bottomColor = G.flipped ? 'b' : 'w';
  const topColor    = G.flipped ? 'w' : 'b';

  if (G.mode === 'bot') {
    const humanIsBottom = G.playerColor === bottomColor;
    if (topName) topName.textContent = humanIsBottom ? '🤖 Stockfish' : '👤 You';
    if (botName) botName.textContent = humanIsBottom ? '👤 You'       : '🤖 Stockfish';
  } else if (G.mode === 'online') {
    const humanIsBottom = G.playerColor === bottomColor;
    if (topName) topName.textContent = humanIsBottom ? '🌐 Opponent' : '👤 You';
    if (botName) botName.textContent = humanIsBottom ? '👤 You'      : '🌐 Opponent';
  } else {
    if (topName) topName.textContent = G.flipped ? '👤 White' : '👤 Black';
    if (botName) botName.textContent = G.flipped ? '👤 Black' : '👤 White';
  }

  // Avatars
  if (topAvt) topAvt.textContent = topColor === 'w' ? '♔' : '♚';
  if (botAvt) botAvt.textContent = bottomColor === 'w' ? '♔' : '♚';
}

// ────────────────────────────────────────────────────
//  RESULT MODAL & CONFETTI
// ────────────────────────────────────────────────────
function showResultModal(title, reason) {
  stopClock();
  const moves     = G.game.history().length;
  const statsEl   = document.getElementById('result-stats');
  if (statsEl) statsEl.textContent = `${moves} move${moves !== 1 ? 's' : ''} played`;

  document.getElementById('result-title').textContent  = title;
  document.getElementById('result-reason').textContent = reason;

  // Trophy glyph
  const glyph = document.querySelector('.result-glyph');
  if (glyph) {
    if (title.includes('Draw')) glyph.textContent = '🤝';
    else if (title.includes('Disconnected')) glyph.textContent = '🔌';
    else glyph.textContent = '🏆';
  }

  showModal('modal-result');
  if (title.includes('Wins')) launchConfetti();
}

function launchConfetti() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const colors = ['#ffffff','#cccccc','#888888','#444444','#e0e0e0'];
  const particles = Array.from({ length: 100 }, () => ({
    x:   Math.random() * canvas.width,
    y:   -Math.random() * canvas.height * 0.3 - 10,
    vx:  (Math.random() - 0.5) * 4,
    vy:  Math.random() * 5 + 2,
    w:   Math.random() * 10 + 4,
    h:   Math.random() * 6 + 3,
    rot: Math.random() * 360,
    rs:  (Math.random() - 0.5) * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  let raf;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let anyAlive = false;
    particles.forEach(p => {
      if (p.y < canvas.height + 20) {
        anyAlive = true;
        p.x   += p.vx; p.y += p.vy; p.rot += p.rs;
        p.vy  += 0.06; // gravity
        const alpha = Math.max(0, 1 - p.y / canvas.height);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    });
    if (anyAlive) raf = requestAnimationFrame(animate);
    else canvas.style.display = 'none';
  };
  raf = requestAnimationFrame(animate);
}

// ────────────────────────────────────────────────────
//  UI HELPERS
// ────────────────────────────────────────────────────
function showModal(id) {
  document.getElementById(id)?.classList.add('active');
  document.getElementById('modal-overlay')?.classList.add('active');
}

function hideModal(id) {
  document.getElementById(id)?.classList.remove('active');
  const any = document.querySelectorAll('.modal.active').length > 0;
  if (!any) document.getElementById('modal-overlay')?.classList.remove('active');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

function showNavButtons(inGame) {
  const btns = ['theme-select','piece-select','btn-sound','btn-fullscreen','btn-flip','btn-resign','btn-new-game','btn-theme-toggle'];
  btns.forEach(id => document.getElementById(id)?.classList.toggle('hidden', !inGame));

  // Show action buttons based on mode
  const actionBtns = ['btn-hint','btn-takeback','btn-pause','btn-blindfold','btn-undo','btn-offer-draw','btn-coords'];
  actionBtns.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden'); // Hide all first
    if (inGame) {
      if (id === 'btn-hint' && (G.mode === 'local' || G.mode === 'bot')) el.classList.remove('hidden');
      if (id === 'btn-takeback' && G.mode === 'online') el.classList.remove('hidden');
      if (id === 'btn-pause' && (G.mode === 'local' || G.mode === 'bot')) el.classList.remove('hidden');
      if (id === 'btn-blindfold') el.classList.remove('hidden');
      if (id === 'btn-undo' && G.mode === 'local') el.classList.remove('hidden');
      if (id === 'btn-offer-draw') el.classList.remove('hidden');
      if (id === 'btn-coords') el.classList.remove('hidden');
    }
  });

  // Show chat in online mode
  document.getElementById('chat-panel')?.classList.toggle('hidden', !inGame || G.mode !== 'online');
}

function setNavGameMode(label) {
  const el = document.getElementById('nav-game-mode');
  if (el) {
    let text = label ? `♟ ${label}` : '';
    if (G.bulletMode) text = `<span class="bullet-dot"></span>Bullet • ${label}`;
    el.innerHTML = text;
  }
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ────────────────────────────────────────────────────
//  INITIALIZATION
// ────────────────────────────────────────────────────
function init() {
  initAudio();

  // Load settings from localStorage
  G.theme = localStorage.getItem('chessvibe_theme') || 'wiki';
  G.pieceSet = localStorage.getItem('chessvibe_pieceSet') || 'wiki';
  G.muted = localStorage.getItem('chessvibe_muted') === 'true';
  G.coords = localStorage.getItem('chessvibe_coords') !== 'false'; // default true
  G.lightMode = localStorage.getItem('chessvibe_light') === 'true';
  G.blindfold = localStorage.getItem('chessvibe_blindfold') === 'true';
  loadSessionStats();
  if (G.lightMode) document.body.classList.add('light-mode');
  document.getElementById('btn-theme-toggle').textContent = G.lightMode ? '🌙' : '☀';

  // Apply settings
  applyTheme();
  document.getElementById('theme-select').value = G.theme;
  document.getElementById('piece-select').value = G.pieceSet;
  document.getElementById('btn-sound').textContent = G.muted ? '🔇' : '🔊';
  document.getElementById('btn-coords').textContent = G.coords ? 'Coords' : 'Coords';

  // Update fullscreen button on state change
  document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('btn-fullscreen');
    if (btn) btn.textContent = document.fullscreenElement ? '⛶' : '⛶';
  });

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const pgnParam = urlParams.get('pgn');
  const roomParam = urlParams.get('room');

  if (pgnParam) {
    // Load shared game
    try {
      const pgn = decodePGN(pgnParam);
      G.game = new Chess();
      G.game.load_pgn(pgn);
      // Show result modal with game info
      const result = G.game.in_checkmate() ? 'Checkmate' : G.game.in_draw() ? 'Draw' : 'Ongoing';
      showResultModal(result, 'Shared Game');
      // Switch to game screen
      showScreen('game-screen');
      renderBoard();
      updateMoveHistory();
      // Disable interactions for replay
      document.getElementById('btn-new-game').classList.remove('hidden');
      document.getElementById('btn-exit-game').textContent = 'Play Now';
    } catch(e) {
      console.warn('Invalid PGN:', e);
    }
  } else if (roomParam) {
    // Auto-join room
    setTimeout(() => {
      showModal('modal-online');
      document.querySelector('[data-tab="join"]').click();
      document.getElementById('join-code-input').value = roomParam;
      setTimeout(() => document.getElementById('btn-join-room').click(), 500);
    }, 1700);
  } else {
    // Normal load
    setTimeout(() => {
      document.getElementById('loader')?.classList.add('hidden');
      showScreen('mode-screen');
      // Staggered card animation
      document.querySelectorAll('.mode-card').forEach((card, i) => {
        card.style.animationDelay = `${i * 0.12}s`;
        card.classList.add('animate-in');
      });
    }, 1700);
  }

  // ── Mode Card Clicks ──────────────────────────────
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      const mode = card.dataset.mode;
      if (mode === 'local') {
        showModal('modal-local-timer');
      } else if (mode === 'bot') {
        showModal('modal-bot');
      } else if (mode === 'online') {
        showModal('modal-online');
      } else if (mode === 'gauntlet') {
        showModal('modal-gauntlet');
      }
    });
  });

  // ── Modal Close Buttons ───────────────────────────
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.close;
      if (target) hideModal(target);
    });
  });

  // Close modal on overlay click
  document.getElementById('modal-overlay')?.addEventListener('click', () => {
    document.querySelectorAll('.modal.active:not(#modal-promotion):not(#modal-result)').forEach(m => {
      hideModal(m.id);
    });
  });

  // ── Local Timer Modal ─────────────────────────────
  document.querySelectorAll('.time-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      const isCustom = btn.dataset.time === 'custom';
      document.querySelector('.custom-time-group').classList.toggle('hidden', !isCustom);
    });
  });

  document.getElementById('btn-start-local')?.addEventListener('click', () => {
    const selectedBtn = document.querySelector('.time-option.selected');
    let timeSec = 600; // default 10 min

    if (selectedBtn) {
      const timeData = selectedBtn.dataset.time;
      if (timeData === 'custom') {
        const mins = parseInt(document.getElementById('custom-minutes').value) || 10;
        const secs = parseInt(document.getElementById('custom-seconds').value) || 0;
        timeSec = mins * 60 + secs;
      } else {
        timeSec = parseInt(timeData);
      }
    }

    G.timers = { w: timeSec, b: timeSec };
    G.timerOn = timeSec > 0;
    G.increment = parseInt(document.getElementById('local-increment').value) || 0;
    G.autoQueen = document.getElementById('local-auto-queen').checked;
    hideModal('modal-local-timer');
    startGame('local');
  });

  // ── Bot Modal ─────────────────────────────────────
  const diffSlider = document.getElementById('bot-difficulty');
  const diffDisplay = document.getElementById('diff-display');
  if (diffSlider && diffDisplay) {
    const updateDiff = () => {
      const v = parseInt(diffSlider.value);
      diffDisplay.textContent = `Level ${v} (depth ${v})`;
      // Update slider gradient
      const pct = ((v - 1) / 14) * 100;
      diffSlider.style.background =
        `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--border2) ${pct}%)`;
    };
    diffSlider.addEventListener('input', updateDiff);
    updateDiff();
  }

  const botTimerToggle = document.getElementById('bot-timer-toggle');
  const botTimerSelect = document.getElementById('bot-timer-select');
  botTimerToggle?.addEventListener('change', () => {
    if (botTimerSelect) botTimerSelect.disabled = !botTimerToggle.checked;
    G.timerOn = botTimerToggle.checked;
  });

  document.getElementById('btn-start-bot')?.addEventListener('click', () => {
    let colorVal = document.querySelector('input[name="bot-color"]:checked')?.value || 'w';
    if (colorVal === 'random') colorVal = Math.random() < 0.5 ? 'w' : 'b';
    G.playerColor = colorVal;
    G.botDepth    = parseInt(diffSlider?.value || '10');
    G.timerOn     = botTimerToggle?.checked || false;
    G.increment   = parseInt(document.getElementById('bot-increment').value) || 0;
    G.autoQueen   = document.getElementById('bot-auto-queen').checked;
    hideModal('modal-bot');
    startGame('bot');
  });

  // ── Online Modal Tabs ─────────────────────────────
  document.querySelectorAll('.otab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.otab').forEach(t => t.classList.remove('otab-active'));
      tab.classList.add('otab-active');
      const which = tab.dataset.tab;
      document.getElementById('tab-create')?.classList.toggle('hidden', which !== 'create');
      document.getElementById('tab-join')?.classList.toggle('hidden', which !== 'join');
      document.getElementById('tab-spectate')?.classList.toggle('hidden', which !== 'spectate');
    });
  });

  // Create Room
  document.getElementById('btn-create-room')?.addEventListener('click', () => {
    const code = generateRoomCode();
    G.roomCode  = code;
    document.getElementById('rc-value').textContent = code;
    document.getElementById('room-code-box')?.classList.remove('hidden');
    const inviteURL = `${location.origin}${location.pathname}?room=${code}`;
    document.getElementById('invite-url-text').textContent = inviteURL;
    document.getElementById('invite-url-row')?.classList.remove('hidden');
    setOnlineStatus('create', '⏳ Initializing connection…', '');
    initPeer(true, code);
  });

  document.getElementById('btn-copy-code')?.addEventListener('click', () => {
    navigator.clipboard.writeText(G.roomCode || '').then(() => {
      const btn = document.getElementById('btn-copy-code');
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = 'Copy', 2000);
    });
  });

  // Join Room
  document.getElementById('btn-join-room')?.addEventListener('click', () => {
    const raw  = document.getElementById('join-code-input')?.value.trim().toUpperCase();
    if (!raw || raw.length < 3) {
      setOnlineStatus('join', 'Enter a valid room code.', 'err');
      return;
    }
    G.roomCode = raw;
    setOnlineStatus('join', `⏳ Joining room ${raw}…`, '');
    initPeer(false, raw);
  });

  // Spectator Join
  document.getElementById('btn-spectate-join')?.addEventListener('click', () => {
    const raw  = document.getElementById('spectate-code-input')?.value.trim().toUpperCase();
    if (!raw || raw.length < 3) {
      setOnlineStatus('spectate', 'Enter a valid room code.', 'err');
      return;
    }
    G.roomCode = raw;
    setOnlineStatus('spectate', `⏳ Connecting to room ${raw}…`, '');
    initPeer(false, raw, true);
  });

  // Pressing Enter in join input
  document.getElementById('join-code-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-join-room')?.click();
  });

  // Pressing Enter in spectate input
  document.getElementById('spectate-code-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-spectate-join')?.click();
  });

  // ── Replay Buttons ────────────────────────────────
  document.getElementById('btn-replay-first')?.addEventListener('click', replayFirst);
  document.getElementById('btn-replay-prev')?.addEventListener('click', replayPrev);
  document.getElementById('btn-replay-next')?.addEventListener('click', replayNext);
  document.getElementById('btn-replay-last')?.addEventListener('click', replayLast);
  document.getElementById('btn-replay-exit')?.addEventListener('click', exitReplay);

  // Keyboard shortcuts for replay
  document.addEventListener('keydown', (e) => {
    if (!G.inited) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowLeft')  replayPrev();
    if (e.key === 'ArrowRight') { if (G.replaying) replayNext(); }
    if (e.key === 'Home')       replayFirst();
    if (e.key === 'End')        replayLast();
    if (e.key === 'Escape' && G.replaying) exitReplay();
  });

  // ── Nav Buttons ───────────────────────────────────
  document.getElementById('btn-new-game')?.addEventListener('click', () => {
    if (!G.game?.game_over() && G.game?.history().length > 0) {
      if (!confirm('Abandon current game?')) return;
    }
    cleanup();
    showNavButtons(false);
    setNavGameMode('');
    showScreen('mode-screen');
  });

  document.getElementById('btn-flip')?.addEventListener('click', () => {
    G.flipped = !G.flipped;
    renderBoard();
    updatePlayerLabels();
  });

  document.getElementById('btn-resign')?.addEventListener('click', () => {
    const currentTurn = G.game.turn();
    const currentPlayer = currentTurn === 'w' ? 'White' : 'Black';
    const opponent = currentTurn === 'w' ? 'Black' : 'White';

    document.getElementById('resign-confirm-message').textContent =
      `Are you sure you want to resign? ${opponent} will win.`;
    showModal('modal-resign-confirm');
  });

  // ── Result Modal Buttons ──────────────────────────
  document.getElementById('btn-rematch')?.addEventListener('click', () => {
    hideModal('modal-result');
    document.querySelector('.board-frame')?.classList.remove('game-won');
    if (G.mode === 'online' && G.conn) {
      // Request a rematch from the opponent instead of abandoning
      G.conn.send({ type: 'rematch-request' });
      const btn = document.getElementById('btn-rematch');
      if (btn) {
        btn.textContent = 'Requesting…';
        setTimeout(() => { btn.textContent = 'Rematch'; }, 4000);
      }
    } else {
      const mode  = G.mode;
      const color = G.playerColor;
      G.playerColor = color;
      startGame(mode);
    }
  });

  document.getElementById('btn-exit-game')?.addEventListener('click', () => {
    hideModal('modal-result');
    document.querySelector('.board-frame')?.classList.remove('game-won');
    cleanup();
    showNavButtons(false);
    setNavGameMode('');
    showScreen('mode-screen');
  });

  // ── Draw Offer ────────────────────────────────────
  document.getElementById('btn-offer-draw')?.addEventListener('click', () => {
    if (G.mode === 'online' && G.conn && G.onlineReady) {
      G.conn.send({ type:'draw-offer' });
      const btn = document.getElementById('btn-offer-draw');
      btn.textContent = 'Offer Sent…';
      setTimeout(() => { btn.textContent = '½ Offer Draw'; }, 4000);
    } else if (G.mode === 'local') {
      showLocalDrawOffer();
    }
  });

  // ── Local Draw Modal (shared by local + remote offers) ──
  document.getElementById('btn-accept-draw')?.addEventListener('click', () => {
    hideModal('modal-local-draw');
    if (G.pendingRemoteDraw) {
      G.pendingRemoteDraw = false;
      G.conn?.send({ type:'draw-accept' });
    }
    stopClock();
    showResultModal('Draw', 'by Agreement');
  });

  document.getElementById('btn-decline-draw')?.addEventListener('click', () => {
    hideModal('modal-local-draw');
    if (G.pendingRemoteDraw) {
      G.pendingRemoteDraw = false;
      G.conn?.send({ type:'draw-decline' });
      showNotification('Draw offer declined');
    } else {
      showNotification('Draw offer declined');
    }
    // Resume clock after decline
    if (G.timerOn) startClock();
  });

  // ── Resign Modal ───────────────────────────────────
  document.getElementById('btn-cancel-resign')?.addEventListener('click', () => {
    hideModal('modal-resign-confirm');
  });

  document.getElementById('btn-confirm-resign')?.addEventListener('click', () => {
    hideModal('modal-resign-confirm');
    if (G.mode === 'online' && G.conn) {
      // Announce our resignation to the opponent (they decide the winner
      // banner based on our color; we mark the game over locally too).
      G.conn.send({ type: 'resign', color: G.playerColor });
    }
    const loser  = G.mode === 'online' ? G.playerColor : G.game.turn();
    const winner = loser === 'w' ? 'Black' : 'White';
    stopClock();
    showResultModal(`${winner} Wins`, `${loser === 'w' ? 'White' : 'Black'} Resigned`);
  });

  // ── Theme & Piece Selectors ────────────────────────
  document.getElementById('theme-select')?.addEventListener('change', (e) => {
    G.theme = e.target.value;
    applyTheme();
  });

  document.getElementById('piece-select')?.addEventListener('change', (e) => {
    G.pieceSet = e.target.value;
    applyPieceSet();
  });

  // ── Sound Toggle ───────────────────────────────────
  document.getElementById('btn-sound')?.addEventListener('click', () => {
    G.muted = !G.muted;
    const btn = document.getElementById('btn-sound');
    btn.textContent = G.muted ? '🔇' : '🔊';
    localStorage.setItem('chessvibe_muted', G.muted);
  });

  // ── Fullscreen ─────────────────────────────────────
  document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
    const root = document.getElementById('game-screen');
    if (!document.fullscreenElement) {
      (root || document.documentElement).requestFullscreen({ navigationUI: 'hide' }).catch(() => {
        document.documentElement.requestFullscreen().catch(() => {});
      });
    } else {
      document.exitFullscreen();
    }
  });

  // ── Fullscreen change: auto-fit the board & hide chrome ──
  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    document.body.classList.toggle('fullscreen-mode', isFs);
    const fsEl = document.getElementById('btn-fullscreen');
    if (fsEl) fsEl.textContent = isFs ? '\u26F6' : '\u26F6';
  });

  // ── Coordinates Toggle ─────────────────────────────
  document.getElementById('btn-coords')?.addEventListener('click', () => {
    G.coords = !G.coords;
    renderBoard();
    localStorage.setItem('chessvibe_coords', G.coords);
  });

  // ── New Feature Toggles ────────────────────────────
  document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleLightMode);
  document.getElementById('btn-hint')?.addEventListener('click', requestHint);
  document.getElementById('btn-takeback')?.addEventListener('click', () => {
    if (G.mode === 'online' && G.conn && G.onlineReady) {
      G.conn.send({ type:'takeback-request' });
      const btn = document.getElementById('btn-takeback');
      if (btn) {
        btn.textContent = 'Request Sent…';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = 'Takeback';
          btn.disabled = false;
        }, 6000);
      }
    }
  });
  document.getElementById('btn-pause')?.addEventListener('click', togglePause);
  document.getElementById('btn-blindfold')?.addEventListener('click', toggleBlindfold);
  document.getElementById('btn-undo')?.addEventListener('click', executeUndo);

  // ── Chat ───────────────────────────────────────────
  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
  document.getElementById('btn-send-chat')?.addEventListener('click', sendChatMessage);

  // ── Gauntlet ───────────────────────────────────────
  document.getElementById('btn-start-gauntlet')?.addEventListener('click', startGauntlet);

  // ── Takeback Modal ────────────────────────────────
  document.getElementById('btn-accept-takeback')?.addEventListener('click', () => {
    hideModal('modal-takeback-request');
    if (G.mode === 'online' && G.conn) {
      G.conn.send({ type:'takeback-accept' });
    }
    executeTakeback();
  });
  document.getElementById('btn-decline-takeback')?.addEventListener('click', () => {
    hideModal('modal-takeback-request');
    if (G.mode === 'online' && G.conn) {
      G.conn.send({ type:'takeback-decline' });
    }
  });

  // ── Rematch Modal ──────────────────────────────────
  document.getElementById('btn-accept-rematch')?.addEventListener('click', () => {
    hideModal('modal-rematch-request');
    if (G.mode === 'online' && G.conn) {
      G.conn.send({ type:'rematch-accept' });
    }
  });
  document.getElementById('btn-decline-rematch')?.addEventListener('click', () => {
    hideModal('modal-rematch-request');
    if (G.mode === 'online' && G.conn) {
      G.conn.send({ type:'rematch-decline' });
    }
  });

  // ── Share & Download ───────────────────────────────
  document.getElementById('btn-share-pgn')?.addEventListener('click', shareGame);
  document.getElementById('btn-download-pgn')?.addEventListener('click', downloadPGN);

  // ── Copy Invite ────────────────────────────────────
  document.getElementById('btn-copy-invite')?.addEventListener('click', () => {
    const text = document.getElementById('invite-url-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('btn-copy-invite');
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = 'Copy Invite', 2000);
    });
  });

  // ── Session Stats Reset ────────────────────────────
  // Add reset link to session stats bar
  const sessionBar = document.getElementById('session-stats-bar');
  if (sessionBar) {
    const resetLink = document.createElement('a');
    resetLink.href = '#';
    resetLink.textContent = 'Reset';
    resetLink.style.cssText = 'margin-left:8px; color:var(--text-muted); text-decoration:none; font-size:0.7rem;';
    resetLink.addEventListener('click', (e) => {
      e.preventDefault();
      resetSessionStats();
    });
    sessionBar.appendChild(resetLink);
  }

  // ── Context Menu Items ─────────────────────────────
  document.querySelectorAll('.context-item').forEach(item => {
    item.addEventListener('click', () => {
      const annotation = item.dataset.annotation;
      const moveIdx = parseInt(document.getElementById('context-menu').dataset.moveIdx);
      setAnnotation(moveIdx, annotation);
      document.getElementById('context-menu').classList.add('hidden');
    });
  });

  // ── Init Drag & Drop ──────────────────────────────
  // Done after DOM ready, repeated on board re-render
  // (event delegation handles this cleanly on the board element)
  initDragDrop();
}

function showLocalDrawOffer() {
  const offeringPlayer = G.game.turn() === 'w' ? 'White' : 'Black';
  const opponent = G.game.turn() === 'w' ? 'Black' : 'White';

  document.getElementById('draw-offer-title').textContent = 'Draw Offer';
  document.getElementById('draw-offer-message').textContent = `${offeringPlayer} offers a Draw — Accept or Decline?`;

  showModal('modal-local-draw');
}

function cleanup() {
  stopClock();
  G.botBusy    = false;
  G.replaying  = false;
  G.onlineReady = false;
  G.isSpectator = false;
  G.spectators  = [];
  document.body.classList.remove('spectator-mode');
  
  if (G.peer) {
    try { G.peer.destroy(); } catch(_) {}
    G.peer = null;
    G.conn = null;
  }
  G.pendingPromo = null;
  
  // Remove spectator badge
  const badge = document.getElementById('spectator-badge');
  if (badge) badge.remove();
}

// ────────────────────────────────────────────────────
//  BOOT
// ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);