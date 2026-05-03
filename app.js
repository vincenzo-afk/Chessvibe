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

const PIECE_UNICODE = {
  wk:'♔', wq:'♕', wr:'♖', wb:'♗', wn:'♘', wp:'♙',
  bk:'♚', bq:'♛', br:'♜', bb:'♝', bn:'♞', bp:'♟',
};
const PIECE_VALUES  = { p:1, n:3, b:3, r:5, q:9, k:0 };

const DIFF_DEPTHS = { 1:4, 2:8, 3:12, 4:15 };
const DIFF_LABELS = { 1:'Easy (depth 4)', 2:'Medium (depth 8)', 3:'Hard (depth 12)', 4:'Expert (depth 15)' };

const STOCKFISH_URL = 'https://stockfish.online/api/s/v2.php';

// ────────────────────────────────────────────────────
//  THEMES & PIECE SETS
// ────────────────────────────────────────────────────
const THEMES = {
  classic:  { light: '#f0f0f0', dark: '#1c1c1c' },
  forest:   { light: '#eeeed2', dark: '#769656' },
  ocean:    { light: '#dee3e6', dark: '#8ca2ad' },
  candy:    { light: '#ffd6e7', dark: '#c9005b' },
  midnight: { light: '#b0b7c3', dark: '#22264b' },
};

const PIECE_SETS = {
  unicode: PIECE_UNICODE,
  letters: {
    wk:'K', wq:'Q', wr:'R', wb:'B', wn:'N', wp:'P',
    bk:'k', bq:'q', br:'r', bb:'b', bn:'n', bp:'p',
  },
  filled: PIECE_UNICODE, // same as unicode but we'll style differently
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
  roomCode:   null,
  isHost:     false,
  onlineReady:false,

  /* Replay */
  replayGame: null,   // Chess instance for replay
  replayIdx:  -1,
  replaying:  false,

  /* Promotion */
  pendingPromo: null, // { from, to }

  /* Timer */
  timerOn:    false,
  timers:     { w:600, b:600 },
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
        if (G.pieceSet === 'filled') {
          pieceEl.textContent = PIECE_SETS[G.pieceSet][piece.color + piece.type];
          pieceEl.style.fontWeight = '900';
          pieceEl.style.webkitTextStroke = '0px';
        } else {
          pieceEl.textContent = PIECE_SETS[G.pieceSet][piece.color + piece.type];
        }
        pieceEl.dataset.square = sq;
        pieceEl.draggable = false; // We use custom drag
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

  document.documentElement.style.setProperty('--sq-light', theme.light);
  document.documentElement.style.setProperty('--sq-dark', theme.dark);

  // Save to localStorage
  localStorage.setItem('chessvibe_theme', G.theme);
}

function applyPieceSet() {
  // Re-render board to apply new piece set
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
  const moveArgs = { from, to };
  if (promotion) moveArgs.promotion = promotion;

  const move = G.game.move(moveArgs);
  if (!move) return false;

  // Track captures
  if (move.captured) {
    G.captured[move.color].push(move.captured);
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

  const toEl = document.querySelector(`[data-square="${to}"] .piece`);
  if (toEl) toEl.classList.add('piece-just-moved');

  // Auto-flip board in local mode (with delay after animation)
  if (G.mode === 'local') {
    setTimeout(() => {
      G.flipped = !G.flipped;
      const boardEl = document.getElementById('board');
      if (boardEl) {
        boardEl.classList.toggle('flipped', G.flipped);
      }
    }, 200);
  }

  // Timer increment for the player who just moved
  if (G.timerOn && G.increment > 0) {
    G.timers[move.color] += G.increment;
    renderTimers();
  }

  // Timer switch
  if (G.timerOn) switchClock();

  // Evaluate move for automatic annotation
  evaluateMoveForAnnotation(G.game.history().length - 1);

  // Online sync
  if (G.mode === 'online' && G.conn && G.onlineReady) {
    G.conn.send({ type:'move', from, to, promotion: promotion || null });
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

  // Bot response
  if (G.mode === 'bot' && G.game.turn() !== G.playerColor) {
    setTimeout(doBotMove, 350);
  }

  return true;
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
//  GAME OVER
// ────────────────────────────────────────────────────
function checkGameOver() {
  if (!G.game.game_over()) return false;

  let result, reason;

  if (G.game.in_checkmate()) {
    const winner = G.game.turn() === 'w' ? 'Black' : 'White';
    result = `${winner} Wins`;
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

  stopClock();
  setTimeout(() => showResultModal(result, reason), 900);
  return true;
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
    wSpan.textContent = history[i].san + (G.annotations[i] || '');
    wSpan.dataset.moveIdx = i;
    wSpan.addEventListener('click', () => jumpToMove(i));
    wSpan.addEventListener('contextmenu', (e) => showAnnotationMenu(e, i));
    row.appendChild(wSpan);

    if (history[i + 1]) {
      const bSpan = document.createElement('span');
      bSpan.className = 'move-san';
      bSpan.textContent = history[i + 1].san + (G.annotations[i + 1] || '');
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

function sortCaptured(arr) {
  const order = ['q','r','b','n','p'];
  return [...arr].sort((a, b) => order.indexOf(a) - order.indexOf(b));
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
  });
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

  drag.active = true;
  drag.sq     = sq;
  drag.moved  = false;
  drag.startX = e.clientX;
  drag.startY = e.clientY;

  // Create ghost
  drag.ghost = document.createElement('div');
  drag.ghost.className = 'drag-ghost';
  drag.ghost.textContent = pieceEl.textContent;
  drag.ghost.style.color = pieceEl.classList.contains('piece-w') ? '#f5f0e8' : '#1a1510';
  drag.ghost.style.webkitTextStroke = pieceEl.classList.contains('piece-w') ? '1.5px #8a7050' : '1px #4a3828';
  updateGhostPos(e.clientX, e.clientY);
  document.body.appendChild(drag.ghost);
  pieceEl.style.opacity = '0.25';

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

  const el     = document.elementFromPoint(e.clientX, e.clientY);
  const target = el?.closest('[data-square]')?.dataset.square;

  dragCleanup();

  if (drag.moved && target && drag.sq && target !== drag.sq) {
    // Treat as a move attempt
    if (G.selected !== drag.sq) {
      // Force select the source square
      G.selected   = null;
      G.legalMoves = [];
      trySelect(drag.sq);
    }
    if (G.legalMoves.includes(target)) {
      attemptMove(drag.sq, target);
    } else {
      clearSelection();
      renderBoard();
    }
  }
}

function onTouchStart(e) {
  const pieceEl = e.target.closest('.piece');
  if (!pieceEl) return;
  const sq = pieceEl.closest('[data-square]')?.dataset.square;
  if (!sq) return;

  const touch = e.touches[0];
  drag.active = true;
  drag.sq     = sq;
  drag.moved  = false;
  drag.startX = touch.clientX;
  drag.startY = touch.clientY;

  drag.ghost = document.createElement('div');
  drag.ghost.className = 'drag-ghost';
  drag.ghost.textContent = pieceEl.textContent;
  drag.ghost.style.color = pieceEl.classList.contains('piece-w') ? '#f5f0e8' : '#1a1510';
  drag.ghost.style.webkitTextStroke = pieceEl.classList.contains('piece-w') ? '1.5px #8a7050' : '1px #4a3828';
  updateGhostPos(touch.clientX, touch.clientY - 30);
  document.body.appendChild(drag.ghost);
  pieceEl.style.opacity = '0.25';

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

  dragCleanup();

  if (drag.moved && target && drag.sq && target !== drag.sq) {
    if (G.selected !== drag.sq) {
      G.selected = null; G.legalMoves = [];
      trySelect(drag.sq);
    }
    if (G.legalMoves.includes(target)) {
      attemptMove(drag.sq, target);
    } else {
      clearSelection();
      renderBoard();
    }
  } else if (!drag.moved && drag.sq) {
    handleSquareClick(drag.sq);
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
  // Restore piece opacity
  document.querySelectorAll('.piece').forEach(el => { el.style.opacity = ''; });
  drag.active = false;
  drag.sq = null;
  drag.moved = false;
  drag.startX = 0;
  drag.startY = 0;
}

// ────────────────────────────────────────────────────
//  ONLINE (PeerJS P2P)
// ────────────────────────────────────────────────────
function initPeer(asHost, code) {
  // Destroy any existing peer
  if (G.peer) { try { G.peer.destroy(); } catch(_){} G.peer = null; }

  const peerId = 'chessvibe-' + code;

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
    const msg = err.type === 'unavailable-id'
      ? 'Room code taken. Try another.'
      : `Connection error: ${err.type}`;
    setOnlineStatus(asHost ? 'create' : 'join', msg, 'err');
  });

  if (asHost) {
    G.isHost      = true;
    G.playerColor = 'w';

    G.peer.on('open', (id) => {
      setOnlineStatus('create', '⏳ Waiting for opponent to join…', '');
    });

    G.peer.on('connection', (conn) => {
      G.conn = conn;
      wireConnection(conn);
      conn.on('open', () => {
        setOnlineStatus('create', '✓ Opponent connected! Starting…', 'ok');
        conn.send({ type:'handshake', color:'b', hostReady: true });
        setTimeout(() => startGame('online'), 600);
      });
    });

  } else {
    G.isHost      = false;

    G.peer.on('open', () => {
      setOnlineStatus('join', `⏳ Connecting to room ${code}…`, '');
      const conn = G.peer.connect(peerId, { reliable: true });
      G.conn = conn;
      wireConnection(conn);

      conn.on('open', () => {
        setOnlineStatus('join', '✓ Connected! Waiting for host…', 'ok');
      });
      conn.on('error', () => {
        setOnlineStatus('join', '✗ Room not found. Check code.', 'err');
      });
    });
  }
}

function wireConnection(conn) {
  conn.on('data', handleOnlineData);
  conn.on('close', () => {
    G.onlineReady = false;
    if (!G.game?.game_over()) {
      showResultModal('Opponent Disconnected', '');
    }
  });
}

function handleOnlineData(data) {
  switch (data.type) {
    case 'handshake':
      G.playerColor = data.color;
      G.flipped     = data.color === 'b';
      G.onlineReady = true;
      setNavGameMode('Online — You are ' + (data.color === 'w' ? 'White ♔' : 'Black ♚'));
      startGame('online');
      break;

    case 'move':
      if (!G.onlineReady || !G.game) return;
      if (G.game.turn() !== G.playerColor) {
        executeMove(data.from, data.to, data.promotion || null);
      }
      break;

    case 'resign': {
      const winner = data.color === 'w' ? 'Black' : 'White';
      showResultModal(`${winner} Wins`, 'by Resignation');
      break;
    }
    case 'draw-offer':
      if (confirm('Opponent offers a draw. Accept?')) {
        G.conn?.send({ type:'draw-accept' });
        showResultModal('Draw', 'by Agreement');
      } else {
        G.conn?.send({ type:'draw-decline' });
      }
      break;

    case 'draw-accept':
      showResultModal('Draw', 'by Agreement');
      break;

    case 'draw-decline':
      alert('Draw offer declined.');
      break;
  }
}

function setOnlineStatus(tab, msg, state) {
  const id = `online-status-${tab}`;
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className   = `online-status${state ? ' status-' + state : ''}`;
}

// ────────────────────────────────────────────────────
//  GAME INITIALIZATION
// ────────────────────────────────────────────────────
function startGame(mode) {
  document.querySelector('.board-frame')?.classList.remove('game-won');
  G.game       = new Chess();
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
  renderTimers();

  // Show game screen
  showScreen('game-screen');
  showNavButtons(true);

  renderBoard();
  updateMoveHistory();
  updateBreadcrumb(); // Will show empty initially
  updatePlayerLabels();
  setNavGameMode(modeLabel(mode));

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
  const labels = { local:'Local 2P', bot:'vs Stockfish', online:'Online 1v1' };
  return labels[mode] || mode;
}

function getSelectedTimer(mode) {
  const id =
    mode === 'bot' ? 'bot-timer-select' :
    mode === 'online' ? 'online-timer-select' :
    'local-timer-select';

  const el = document.getElementById(id);
  return el ? parseInt(el.value, 10) : 600;
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

  const colors = ['#00d084','#00e896','#f0d9b5','#ffd700','#ffffff','#b58863'];
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
  const btns = ['theme-select','piece-select','btn-sound','btn-fullscreen','btn-flip','btn-resign','btn-new-game'];
  btns.forEach(id => document.getElementById(id)?.classList.toggle('hidden', !inGame));
}

function setNavGameMode(label) {
  const el = document.getElementById('nav-game-mode');
  if (el) el.textContent = label ? `♟ ${label}` : '';
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
  G.theme = localStorage.getItem('chessvibe_theme') || 'classic';
  G.pieceSet = localStorage.getItem('chessvibe_pieceSet') || 'unicode';
  G.muted = localStorage.getItem('chessvibe_muted') === 'true';
  G.coords = localStorage.getItem('chessvibe_coords') !== 'false'; // default true

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

  // ── Loader → Mode Screen ──────────────────────────
  setTimeout(() => {
    document.getElementById('loader')?.classList.add('hidden');
    showScreen('mode-screen');
    // Staggered card animation
    document.querySelectorAll('.mode-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 0.12}s`;
      card.classList.add('animate-in');
    });
  }, 1700);

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

  // ── Local Draw Modal ───────────────────────────────
  document.getElementById('btn-accept-draw')?.addEventListener('click', () => {
    hideModal('modal-local-draw');
    stopClock();
    showResultModal('Draw', 'by Agreement');
  });

  document.getElementById('btn-decline-draw')?.addEventListener('click', () => {
    hideModal('modal-local-draw');
    // Show brief notification
    const notification = document.createElement('div');
    notification.className = 'draw-notification';
    notification.textContent = 'Draw offer declined';
    notification.style.cssText = `
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 8px 16px;
      color: var(--text-dim);
      font-size: 0.85rem;
      z-index: 1000;
      animation: fade-in-out 2s ease forwards;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  });

  // ── Bot Modal ─────────────────────────────────────
  const diffSlider = document.getElementById('bot-difficulty');
  const diffDisplay = document.getElementById('diff-display');
  if (diffSlider && diffDisplay) {
    const updateDiff = () => {
      const v = parseInt(diffSlider.value);
      diffDisplay.textContent = DIFF_LABELS[v] || '';
      // Update slider gradient
      const pct = ((v - 1) / 3) * 100;
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
    G.botDepth    = DIFF_DEPTHS[parseInt(diffSlider?.value || '3')] || 12;
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
    });
  });

  // Create Room
  document.getElementById('btn-create-room')?.addEventListener('click', () => {
    const code = generateRoomCode();
    G.roomCode  = code;
    document.getElementById('rc-value').textContent = code;
    document.getElementById('room-code-box')?.classList.remove('hidden');
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

  // Pressing Enter in join input
  document.getElementById('join-code-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-join-room')?.click();
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
    if (G.mode === 'online') {
      // Can't easily rematch online; just go to menu
      cleanup();
      showNavButtons(false);
      showScreen('mode-screen');
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

  // ── Local Draw Modal ───────────────────────────────
  document.getElementById('btn-accept-draw')?.addEventListener('click', () => {
    hideModal('modal-local-draw');
    stopClock();
    showResultModal('Draw', 'by Agreement');
  });

  document.getElementById('btn-decline-draw')?.addEventListener('click', () => {
    hideModal('modal-local-draw');
    // Resume clock after decline
    if (G.timerOn) startClock();
    // Show brief notification
    const notification = document.createElement('div');
    notification.className = 'draw-notification';
    notification.textContent = 'Draw offer declined';
    notification.style.cssText = `
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 8px 16px;
      color: var(--text-dim);
      font-size: 0.85rem;
      z-index: 1000;
      animation: fade-in-out 2s ease forwards;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  });

  // ── Resign Modal ───────────────────────────────────
  document.getElementById('btn-cancel-resign')?.addEventListener('click', () => {
    hideModal('modal-resign-confirm');
  });

  document.getElementById('btn-confirm-resign')?.addEventListener('click', () => {
    hideModal('modal-resign-confirm');
    const loser  = G.game.turn();
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
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  // ── Coordinates Toggle ─────────────────────────────
  document.getElementById('btn-coords')?.addEventListener('click', () => {
    G.coords = !G.coords;
    renderBoard();
    localStorage.setItem('chessvibe_coords', G.coords);
  });

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
  if (G.peer) {
    try { G.peer.destroy(); } catch(_) {}
    G.peer = null;
    G.conn = null;
  }
  G.pendingPromo = null;
}

// ────────────────────────────────────────────────────
//  BOOT
// ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);