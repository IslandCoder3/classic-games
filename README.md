# Classic Games

A growing online arcade of timeless browser games — Tetris, Chess, Snake, Minesweeper, and more — playable instantly with no download or account.

**Category:** Game Dev

**Live site:** https://islandcoder3.github.io/classic-games/

**Built with:** HTML, CSS, JavaScript

## About

Classic Games is a small arcade built around a shared game library and a single game-page template, rather than a one-off page per game. A homepage grid lists every game with search, category filters, and a "recently played" strip, while each game itself opens through one reusable `game.html` that reads which title to load and renders its board, controls, and instructions accordingly. Everything — theme, favorites, high scores, and recently-played history — is saved to the browser's local storage, so there's no account or backend involved.

The library currently spans Arcade, Classic, Puzzle, Strategy, Brain, and Multiplayer categories, including Tetris, Tic-Tac-Toe, Snake, Block Puzzle, Chess, Checkers, Minesweeper, Connect Four, Brick Breaker, Galaxy Defender, and Paddle Duel. Several support both a 2-player mode and a built-in CPU opponent (Tic-Tac-Toe, Chess, Connect Four, Paddle Duel), and every game is playable on touch as well as keyboard/mouse.

## Features

- A growing library of playable games across 6 categories, each with its own rules, controls, and difficulty options
- Shared game-page template — one `game.html` renders any game by ID
- Search and category-chip filtering on the homepage library
- Favorites, high scores, and recently-played history saved locally per device
- CPU opponents with adjustable difficulty for head-to-head games
- Dark/light theme toggle and a "random game" shortcut
- Fully touch-compatible controls alongside keyboard support

## Tech Stack

Vanilla HTML, CSS, and JavaScript — no frameworks, build tools, or backend required to run it.
