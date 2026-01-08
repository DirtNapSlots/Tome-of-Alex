// BoardSystem.js
// Defines the board as a stable workspace that reveals structure only when active

export default class BoardSystem {
  constructor(rows = 5, cols = 5) {
    this.rows = rows;
    this.cols = cols;
    this.active = false;
    this.symbols = [];

    this.initBoard();
  }

  initBoard() {
    this.symbols = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.symbols.push({
          row,
          col,
          symbol: null
        });
      }
    }
  }

  activate() {
    this.active = true;
    // Grid lines become visible here
  }

  deactivate() {
    this.active = false;
    // Grid lines disappear here
  }

  placeSymbol(row, col, symbol) {
    const cell = this.symbols.find(
      c => c.row === row && c.col === col
    );

    if (cell) {
      cell.symbol = symbol;
    }
  }

  clearSymbol(row, col) {
    const cell = this.symbols.find(
      c => c.row === row && c.col === col
    );

    if (cell) {
      cell.symbol = null;
    }
  }

  getSymbols() {
    return this.symbols;
  }
}
