// SymbolSystem.js
// Enforces the core rule: symbols either ABSORB (meaningful) or DISSOLVE (irrelevant).
// No gravity drops, no cascades, no refill logic exists here by design.

export const SYMBOL_TIERS = {
  LOW: "low",
  MID: "mid",
  HIGH: "high",
  SPECIAL: "special"
};

export const SYMBOL_FATE = {
  ABSORB: "absorb",
  DISSOLVE: "dissolve"
};

export default class SymbolSystem {
  constructor() {
    // Track symbols by board cell key: `${row}:${col}`
    this.symbolsByCell = new Map();
  }

  cellKey(row, col) {
    return `${row}:${col}`;
  }

  /**
   * Create a symbol instance for the board.
   * @param {Object} opts
   * @param {string} opts.id - symbol id ("mark", "key", "emblem", etc.)
   * @param {string} opts.tier - "low" | "mid" | "high" | "special"
   * @param {number} opts.row
   * @param {number} opts.col
   */
  createSymbol({ id, tier, row, col }) {
    return {
      id,
      tier,
      row,
      col,
      // These flags are set during resolution:
      connected: false,
      affected: false,
      // Fate decided at resolution end:
      fate: null
    };
  }

  /**
   * Place a symbol in a board cell (reel resolves-in).
   * IMPORTANT: this does not animate; it only sets model state.
   */
  setSymbol(symbol) {
    const key = this.cellKey(symbol.row, symbol.col);
    this.symbolsByCell.set(key, symbol);
  }

  getSymbol(row, col) {
    return this.symbolsByCell.get(this.cellKey(row, col)) || null;
  }

  getAllSymbols() {
    return Array.from(this.symbolsByCell.values());
  }

  /**
   * Clear all symbols from the board model.
   * Used for phase transitions (e.g., Path -> absorb all meaningful states).
   */
  clearAll() {
    this.symbolsByCell.clear();
  }

  /**
   * Mark symbols involved in a connection as meaningful (absorbed).
   * @param {Array<{row:number,col:number}>} positions
   */
  markConnected(positions) {
    for (const { row, col } of positions) {
      const sym = this.getSymbol(row, col);
      if (sym) sym.connected = true;
    }
  }

  /**
   * Mark symbols affected by a command effect as meaningful (absorbed).
   * @param {Array<{row:number,col:number}>} positions
   */
  markAffected(positions) {
    for (const { row, col } of positions) {
      const sym = this.getSymbol(row, col);
      if (sym) sym.affected = true;
    }
  }

  /**
   * Decide the fate of every symbol using the FINAL rules:
   * - If connected OR affected => ABSORB
   * - Else => DISSOLVE
   *
   * Returns two arrays of symbols: { absorb: [], dissolve: [] }
   */
  resolveFates() {
    const absorb = [];
    const dissolve = [];

    for (const sym of this.getAllSymbols()) {
      const meaningful = sym.connected || sym.affected;

      sym.fate = meaningful ? SYMBOL_FATE.ABSORB : SYMBOL_FATE.DISSOLVE;

      if (sym.fate === SYMBOL_FATE.ABSORB) absorb.push(sym);
      else dissolve.push(sym);
    }

    return { absorb, dissolve };
  }

  /**
   * After animations complete, remove symbols from the board model.
   * You call this AFTER absorb/dissolve visual sequences are finished.
   */
  purgeResolved() {
    for (const sym of this.getAllSymbols()) {
      if (sym.fate === SYMBOL_FATE.ABSORB || sym.fate === SYMBOL_FATE.DISSOLVE) {
        this.symbolsByCell.delete(this.cellKey(sym.row, sym.col));
      }
    }
  }

  /**
   * Reset per-spin flags without removing symbols.
   * Call this before a new resolution pass if needed.
   */
  resetFlags() {
    for (const sym of this.getAllSymbols()) {
      sym.connected = false;
      sym.affected = false;
      sym.fate = null;
    }
  }
}
