/* Game metadata — single source of truth for cards, filters, and game pages.
   Icons are hand-built inline SVG (duotone, brand palette) instead of emoji,
   so thumbnails render identically everywhere and read as a matched set. */

const ICONS = {
  tetris: `<svg viewBox="0 0 64 64" fill="none"><rect x="7" y="30" width="16" height="16" rx="3.5" fill="#46dbe8"/><rect x="23" y="30" width="16" height="16" rx="3.5" fill="#2bb8c4"/><rect x="23" y="14" width="16" height="16" rx="3.5" fill="#ffc24b"/><rect x="39" y="14" width="16" height="16" rx="3.5" fill="#e0a53c"/></svg>`,
  tictactoe: `<svg viewBox="0 0 64 64" fill="none"><g stroke="#7d84a3" stroke-width="2.5" stroke-linecap="round"><line x1="23" y1="9" x2="23" y2="55"/><line x1="41" y1="9" x2="41" y2="55"/><line x1="9" y1="23" x2="55" y2="23"/><line x1="9" y1="41" x2="55" y2="41"/></g><g stroke="#46dbe8" stroke-width="4.5" stroke-linecap="round"><line x1="11" y1="11" x2="19" y2="19"/><line x1="19" y1="11" x2="11" y2="19"/></g><circle cx="49" cy="15" r="6.5" fill="none" stroke="#ffc24b" stroke-width="4.2"/><g stroke="#46dbe8" stroke-width="4.5" stroke-linecap="round"><line x1="45" y1="45" x2="53" y2="53"/><line x1="53" y1="45" x2="45" y2="53"/></g></svg>`,
  snake: `<svg viewBox="0 0 64 64" fill="none"><path d="M9 47 h10 v-11 h10 v-11 h10 v-11 h11" stroke="#4ade80" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="50" cy="14" r="6" fill="#c8ffde"/><circle cx="52.5" cy="12" r="1.3" fill="#0a0c12"/><circle cx="14" cy="51" r="3.2" fill="#ffc24b"/></svg>`,
  blockpuzzle: `<svg viewBox="0 0 64 64" fill="none"><rect x="7" y="35" width="15" height="15" rx="3.5" fill="#8b6bff"/><rect x="23" y="35" width="15" height="15" rx="3.5" fill="#8b6bff"/><rect x="23" y="19" width="15" height="15" rx="3.5" fill="#a893ff"/><rect x="41" y="11" width="15" height="15" rx="3.5" fill="#46dbe8"/><rect x="41" y="27" width="15" height="15" rx="3.5" fill="#2bb8c4"/></svg>`,
  chess: `<svg viewBox="0 0 64 64" fill="none"><g fill="#eef1f6"><rect x="16" y="9" width="6" height="8"/><rect x="29" y="9" width="6" height="8"/><rect x="42" y="9" width="6" height="8"/><rect x="16" y="9" width="32" height="5.5"/><path d="M19 17 L45 17 L39 33 L25 33 Z"/><rect x="23" y="33" width="18" height="8"/><path d="M17 50 L47 50 L42 42 L22 42 Z"/><rect x="12" y="50" width="40" height="6" rx="2"/></g></svg>`,
  checkers: `<svg viewBox="0 0 64 64" fill="none"><ellipse cx="32" cy="46" rx="19" ry="6.5" fill="#0a0c12" opacity="0.4"/><circle cx="32" cy="35" r="18" fill="#ffc24b"/><circle cx="32" cy="35" r="18" fill="none" stroke="#c98f1c" stroke-width="2.2"/><circle cx="32" cy="35" r="11.5" fill="none" stroke="#c98f1c" stroke-width="1.6"/><path d="M32 26 l2.6 6.3 6.7.6-5.1 4.5 1.6 6.6-5.8-3.7-5.8 3.7 1.6-6.6-5.1-4.5 6.7-.6z" fill="#171c38"/></svg>`,
  minesweeper: `<svg viewBox="0 0 64 64" fill="none"><circle cx="30" cy="39" r="17" fill="#171c38" stroke="#fb5d5d" stroke-width="2.2"/><rect x="27" y="13" width="6" height="11" rx="2" fill="#9aa1c4"/><circle cx="30" cy="11" r="4.2" fill="#fb5d5d"/><g stroke="#fb5d5d" stroke-width="2.4" stroke-linecap="round"><line x1="4" y1="39" x2="11" y2="39"/><line x1="49" y1="39" x2="56" y2="39"/><line x1="30" y1="58" x2="30" y2="65"/></g><circle cx="24" cy="33" r="3.2" fill="#eef1f6" opacity="0.55"/></svg>`,
  connect4: `<svg viewBox="0 0 64 64" fill="none"><rect x="5" y="9" width="54" height="46" rx="7" fill="#12193a"/><circle cx="19" cy="23" r="7.2" fill="#ffc24b"/><circle cx="36" cy="23" r="7.2" fill="#0a0c12"/><circle cx="19" cy="41" r="7.2" fill="#0a0c12"/><circle cx="36" cy="41" r="7.2" fill="#46dbe8"/><circle cx="53" cy="23" r="7.2" fill="#0a0c12"/><circle cx="53" cy="41" r="7.2" fill="#0a0c12"/></svg>`,
  brickbreaker: `<svg viewBox="0 0 64 64" fill="none"><rect x="9" y="11" width="13" height="7.5" rx="2" fill="#ff6b45"/><rect x="24" y="11" width="13" height="7.5" rx="2" fill="#ff8a63"/><rect x="39" y="11" width="13" height="7.5" rx="2" fill="#ff6b45"/><rect x="9" y="20.5" width="13" height="7.5" rx="2" fill="#ffc24b"/><rect x="24" y="20.5" width="13" height="7.5" rx="2" fill="#ff8a63"/><rect x="39" y="20.5" width="13" height="7.5" rx="2" fill="#ffc24b"/><circle cx="32" cy="42" r="5" fill="#eef1f6"/><rect x="19" y="52" width="26" height="6.5" rx="3.2" fill="#46dbe8"/></svg>`,
  galaxydefender: `<svg viewBox="0 0 64 64" fill="none"><g fill="#ff6b45"><rect x="8" y="11" width="9.5" height="9.5" rx="2.2"/><rect x="22" y="11" width="9.5" height="9.5" rx="2.2"/><rect x="36" y="11" width="9.5" height="9.5" rx="2.2"/><rect x="50" y="11" width="7" height="9.5" rx="2.2"/></g><g fill="#ff8a63"><rect x="15" y="24" width="9.5" height="9.5" rx="2.2"/><rect x="29" y="24" width="9.5" height="9.5" rx="2.2"/><rect x="43" y="24" width="9.5" height="9.5" rx="2.2"/></g><path d="M32 37 L45 55 L32 50.5 L19 55 Z" fill="#46dbe8"/><rect x="28.5" y="33" width="7" height="9" rx="2.4" fill="#46dbe8"/></svg>`,
  paddleduel: `<svg viewBox="0 0 64 64" fill="none"><line x1="32" y1="7" x2="32" y2="57" stroke="#2a3150" stroke-width="3" stroke-dasharray="4.5 5.5"/><rect x="7" y="19" width="6.5" height="19" rx="3.2" fill="#46dbe8"/><rect x="50.5" y="27" width="6.5" height="19" rx="3.2" fill="#ff6b45"/><circle cx="35" cy="29" r="4.6" fill="#eef1f6"/></svg>`
};

const GAMES_DATA = [
  {
    id: "tetris",
    title: "Tetris",
    icon: ICONS.tetris,
    thumbGradient: "linear-gradient(135deg, #23315e, #10152a)",
    category: "arcade",
    categoryLabel: "Arcade",
    players: "1 Player",
    description: "Stack falling blocks, clear lines, and race the speed curve.",
    longDescription: "The classic block-stacking arcade game. Rotate and drop tetrominoes to clear full rows before the stack reaches the top.",
    hasDifficulty: true,
    difficultyLabel: "Start speed",
    difficultyOptions: [
      { value: "slow", label: "Slow" },
      { value: "normal", label: "Normal" },
      { value: "fast", label: "Fast" }
    ],
    defaultDifficulty: "normal",
    scoreLabel: "Score",
    keyboard: [
      ["← / →", "Move"],
      ["↑", "Rotate"],
      ["↓", "Soft drop"],
      ["Space", "Hard drop"],
      ["P", "Pause"]
    ],
    touch: true,
    instructions: [
      "Pieces fall from the top of the board — move and rotate them to fit together.",
      "Complete a full horizontal line to clear it and score points.",
      "The game speeds up the higher your level climbs. It ends when blocks stack to the top."
    ]
  },
  {
    id: "tictactoe",
    title: "Tic-Tac-Toe",
    icon: ICONS.tictactoe,
    thumbGradient: "linear-gradient(135deg, #1c3d40, #10152a)",
    category: "classic",
    categoryLabel: "Classic",
    players: "1–2 Players",
    description: "The pocket-sized original. Play a friend or challenge the CPU.",
    longDescription: "Take turns marking a 3×3 grid. Line up three in a row — across, down, or diagonally — before your opponent does.",
    hasDifficulty: true,
    difficultyLabel: "Opponent",
    difficultyOptions: [
      { value: "friend", label: "2 Player" },
      { value: "easy", label: "CPU Easy" },
      { value: "hard", label: "CPU Hard" }
    ],
    defaultDifficulty: "friend",
    scoreLabel: "Wins",
    keyboard: [["1–9", "Place mark in matching cell"], ["R", "Restart round"]],
    touch: true,
    instructions: [
      "Choose to play against a friend on the same device, or the computer.",
      "Tap a cell to place your mark. Get three in a row to win the round.",
      "A full board with no winner is a draw."
    ]
  },
  {
    id: "snake",
    title: "Snake",
    icon: ICONS.snake,
    thumbGradient: "linear-gradient(135deg, #144229, #10152a)",
    category: "arcade",
    categoryLabel: "Arcade",
    players: "1 Player",
    description: "Guide the snake, eat, and grow — don't hit the walls or yourself.",
    longDescription: "Steer a constantly-moving snake around the board to eat food and grow longer, without colliding with the walls or your own tail.",
    hasDifficulty: true,
    difficultyLabel: "Speed",
    difficultyOptions: [
      { value: "slow", label: "Slow" },
      { value: "normal", label: "Normal" },
      { value: "fast", label: "Fast" }
    ],
    defaultDifficulty: "normal",
    scoreLabel: "Score",
    keyboard: [["Arrow keys / WASD", "Steer"], ["P", "Pause"]],
    touch: true,
    instructions: [
      "The snake moves continuously in the direction you last chose.",
      "Eat the glowing food to grow and score points — each bite speeds things up slightly.",
      "Avoid running into the walls or your own body."
    ]
  },
  {
    id: "blockpuzzle",
    title: "Block Puzzle",
    icon: ICONS.blockpuzzle,
    thumbGradient: "linear-gradient(135deg, #2e2263, #10152a)",
    category: "puzzle",
    categoryLabel: "Puzzle",
    players: "1 Player",
    description: "Drag pieces onto the grid to clear full rows and columns.",
    longDescription: "A calm, no-timer puzzle. Drag the offered pieces onto the 8×8 board — filling a full row or column clears it and scores points.",
    hasDifficulty: false,
    scoreLabel: "Score",
    keyboard: [["Click", "Select a piece, then click a board cell to place it"], ["R", "Restart"]],
    touch: true,
    instructions: [
      "Tap any of the three pieces in the tray to select it, then tap a spot on the board to place it.",
      "Filling an entire row or column clears it and adds to your score.",
      "The game ends when none of your three pieces can fit anywhere on the board."
    ]
  },
  {
    id: "chess",
    title: "Chess",
    icon: ICONS.chess,
    thumbGradient: "linear-gradient(135deg, #212c5c, #10152a)",
    category: "strategy",
    categoryLabel: "Strategy",
    players: "1–2 Players",
    description: "Play a friend or challenge the CPU, with full check and checkmate detection.",
    longDescription: "A complete game of chess with legal-move enforcement, check and checkmate detection, and captured-piece tracking — play locally against a friend or the built-in CPU.",
    hasDifficulty: true,
    difficultyLabel: "Opponent",
    difficultyOptions: [
      { value: "friend", label: "2 Player" },
      { value: "easy", label: "CPU Easy" },
      { value: "hard", label: "CPU Hard" }
    ],
    defaultDifficulty: "friend",
    scoreLabel: "Captures",
    keyboard: [["Click", "Select a piece, then a highlighted square to move"]],
    touch: true,
    instructions: [
      "White moves first. Tap a piece to see its legal moves highlighted, then tap a highlighted square to move.",
      "Against the CPU, you always play White — the computer replies automatically as Black.",
      "Check is shown with a red glow on the king in danger. Checkmate ends the game.",
      "This build covers standard piece movement and check/checkmate — castling and en passant are not yet included."
    ]
  },
  {
    id: "checkers",
    title: "Checkers",
    icon: ICONS.checkers,
    thumbGradient: "linear-gradient(135deg, #3d2a12, #10152a)",
    category: "strategy",
    categoryLabel: "Strategy",
    players: "2 Players",
    description: "Classic draughts with forced captures and kinging.",
    longDescription: "Two-player checkers on one device. Capture diagonally over an opponent's piece, and reach the far row to crown a king.",
    hasDifficulty: false,
    scoreLabel: "Captures",
    keyboard: [["Click", "Select a piece, then a highlighted square to move"]],
    touch: true,
    instructions: [
      "Pieces move and capture diagonally. If a capture is available, you must take it.",
      "Reach the opposite end of the board to crown your piece as a king, which can move diagonally in any direction.",
      "The game ends when a player has no pieces or no legal moves left."
    ]
  },
  {
    id: "minesweeper",
    title: "Minesweeper",
    icon: ICONS.minesweeper,
    thumbGradient: "linear-gradient(135deg, #451c1c, #10152a)",
    category: "brain",
    categoryLabel: "Brain",
    players: "1 Player",
    description: "Clear the field using number clues — don't detonate a mine.",
    longDescription: "Reveal every safe tile on the grid. Numbers tell you how many mines are hiding in the neighboring cells — flag the ones you suspect.",
    hasDifficulty: true,
    difficultyLabel: "Field size",
    difficultyOptions: [
      { value: "easy", label: "9×9" },
      { value: "normal", label: "12×12" },
      { value: "hard", label: "16×16" }
    ],
    defaultDifficulty: "easy",
    scoreLabel: "Time",
    keyboard: [["Click", "Reveal a tile"], ["Right-click / long-press", "Flag a tile"]],
    touch: true,
    instructions: [
      "Click a tile to reveal it. A number shows how many mines touch that tile.",
      "Right-click (or long-press on mobile) to flag a tile you believe hides a mine.",
      "Reveal every non-mine tile to win. Revealing a mine ends the game."
    ]
  },
  {
    id: "connect4",
    title: "Connect Four",
    icon: ICONS.connect4,
    thumbGradient: "linear-gradient(135deg, #163656, #10152a)",
    category: "multiplayer",
    categoryLabel: "Multiplayer",
    players: "1–2 Players",
    description: "Drop discs and connect four in a row — play a friend or the CPU.",
    longDescription: "Take turns dropping discs into a 7×6 grid. Gravity pulls each disc to the lowest open slot — connect four in any direction to win, against a friend or the built-in CPU.",
    hasDifficulty: true,
    difficultyLabel: "Opponent",
    difficultyOptions: [
      { value: "friend", label: "2 Player" },
      { value: "easy", label: "CPU Easy" },
      { value: "hard", label: "CPU Hard" }
    ],
    defaultDifficulty: "friend",
    scoreLabel: "Wins",
    keyboard: [["1–7", "Drop into matching column"], ["R", "Restart"]],
    touch: true,
    instructions: [
      "Players alternate turns dropping a disc into any column.",
      "Against the CPU, you always play the gold discs — the computer replies automatically.",
      "Connect four discs of your color in a row — horizontally, vertically, or diagonally — to win.",
      "The game ends in a draw if the board fills with no winner."
    ]
  },
  {
    id: "brickbreaker",
    title: "Brick Breaker",
    icon: ICONS.brickbreaker,
    thumbGradient: "linear-gradient(135deg, #5a2a1c, #10152a)",
    category: "arcade",
    categoryLabel: "Arcade",
    players: "1 Player",
    isNew: true,
    description: "Bounce the ball, smash every brick, don't let it fall.",
    longDescription: "Steer the paddle to keep the ball alive and clear every brick from the field. Clear the whole wall to advance to a faster, tougher layout.",
    hasDifficulty: true,
    difficultyLabel: "Ball speed",
    difficultyOptions: [
      { value: "slow", label: "Slow" },
      { value: "normal", label: "Normal" },
      { value: "fast", label: "Fast" }
    ],
    defaultDifficulty: "normal",
    scoreLabel: "Score",
    keyboard: [["← / →", "Move paddle"], ["Space", "Launch ball"], ["P", "Pause"]],
    touch: true,
    instructions: [
      "Drag anywhere on the board (or use the arrow keys) to slide the paddle left and right.",
      "Tap or press Space to launch the ball, then keep it alive by bouncing it off the paddle.",
      "Clear every brick to advance. You have 3 balls — lose them all and it's game over."
    ]
  },
  {
    id: "galaxydefender",
    title: "Galaxy Defender",
    icon: ICONS.galaxydefender,
    thumbGradient: "linear-gradient(135deg, #1c3350, #10152a)",
    category: "arcade",
    categoryLabel: "Arcade",
    players: "1 Player",
    isNew: true,
    description: "Hold the line against a descending alien squadron.",
    longDescription: "Slide side to side and fire on a squadron of descending invaders before they reach the ground. Clear a wave and the next one comes in faster.",
    hasDifficulty: true,
    difficultyLabel: "Squadron speed",
    difficultyOptions: [
      { value: "slow", label: "Slow" },
      { value: "normal", label: "Normal" },
      { value: "fast", label: "Fast" }
    ],
    defaultDifficulty: "normal",
    scoreLabel: "Score",
    keyboard: [["← / →", "Move ship"], ["Space", "Fire"], ["P", "Pause"]],
    touch: true,
    instructions: [
      "Use the on-screen arrows to move and the fire button to shoot — or the arrow keys and Space on desktop.",
      "Clear an entire wave of invaders to advance to the next, faster one.",
      "You have 3 lives. Getting hit — or letting the squadron reach the bottom — costs one."
    ]
  },
  {
    id: "paddleduel",
    title: "Paddle Duel",
    icon: ICONS.paddleduel,
    thumbGradient: "linear-gradient(135deg, #163656, #10152a)",
    category: "multiplayer",
    categoryLabel: "Multiplayer",
    players: "1–2 Players",
    isNew: true,
    description: "The original arcade classic — first to 7 points wins.",
    longDescription: "Fast-paced two-paddle ball duel. Play a friend on the same keyboard, or take on the CPU. First to 7 points takes the match.",
    hasDifficulty: true,
    difficultyLabel: "Opponent",
    difficultyOptions: [
      { value: "friend", label: "2 Player" },
      { value: "easy", label: "CPU Easy" },
      { value: "hard", label: "CPU Hard" }
    ],
    defaultDifficulty: "easy",
    scoreLabel: "Score",
    keyboard: [["W / S", "Left paddle"], ["↑ / ↓", "Right paddle (2P only)"], ["P", "Pause"]],
    touch: true,
    instructions: [
      "You always control the left paddle — drag on the left half of the board, or use W / S.",
      "In 2 Player mode, the second player controls the right paddle with the ↑ / ↓ keys or the right half of the board.",
      "The ball speeds up with every rally. First player to reach 7 points wins the match."
    ]
  }
];

const CATEGORY_META = {
  all: { label: "All Games", icon: "🎮" },
  puzzle: { label: "Puzzle", icon: "🧩" },
  strategy: { label: "Strategy", icon: "♟️" },
  arcade: { label: "Arcade", icon: "🎮" },
  brain: { label: "Brain Games", icon: "🧠" },
  classic: { label: "Classic Games", icon: "🎲" },
  multiplayer: { label: "Multiplayer", icon: "👥" }
};

function getGameById(id){
  return GAMES_DATA.find(g => g.id === id);
}
