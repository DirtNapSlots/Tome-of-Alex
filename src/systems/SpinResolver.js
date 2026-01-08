// SpinResolver.js
// Wires BoardSystem + SymbolSystem + SigilSystem + BookSystem into a core loop.
//
// IMPORTANT:
// - No cascades.
// - No gravity drops.
// - Symbols either ABSORB (meaningful) or DISSOLVE (irrelevant).
//
// This is a logic-only resolver you can later connect to Phaser visuals.

import SymbolSystem, { SYMBOL_TIERS } from "./SymbolSystem.js";
import SigilSystem, { SIGILS } from "./SigilSystem.js";
import BookSystem, { BOOK_STATES } from "./BookSystem.js";
import BoardSystem from "./BoardSystem.js";

/**
 * Simple helper: pick a random element from an array.
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Placeholder symbol catalog.
 * You will replace these with your real symbol IDs later.
 */
const CATALOG = {
  low: ["mark", "measure", "seal"],
  mid: ["key", "diagram", "instrument"],
  high: ["emblem", "crest", "relic"] // emblem exists as a high-tier symbol too
};

/**
 * Placeholder: build a random tier respecting a simple distribution.
 * (We will tune this later.)
 */
function rollTier() {
  const r = Math.random();
  if (r < 0.55) return SYMBOL_TIERS.LOW;
  if (r < 0.88) return SYMBOL_TIERS.MID;
  return SYMBOL_TIERS.HIGH;
}

function rollSymbolId(tier) {
  if (tier === SYMBOL_TIERS.LOW) return pick(CATALOG.low);
  if (tier === SYMBOL_TIERS.MID) return pick(CATALOG.mid);
  return pick(CATALOG.high);
}

/**
 * Placeholder connection finder:
 * For now, we simulate "one connection sometimes" to exercise the pipeline.
 * Later, we will implement TRUE cluster logic (4+ cluster detection).
 *
 * Returns an array of positions belonging to a single connection.
 */
function findConnectionPlaceholder(board, getSymbolAt) {
  // 40% chance to create a fake connection of 4 symbols in a row
  if (Math.random() > 0.4) return [];

  const row = Math.floor(Math.random() * board.rows);
  const startCol = Math.floor(Math.random() * (board.cols - 3));

  const positions = [];
  for (let c = startCol; c < startCol + 4; c++) {
    const s = getSymbolAt(row, c);
    if (s) positions.push({ row, col: c });
  }
  return positions;
}

export default class SpinResolver {
  constructor() {
    this.board = new BoardSystem(5, 5);
    this.symbolSystem = new SymbolSystem();
    this.sigilSystem = new SigilSystem();
    this.bookSystem = new BookSystem();

    // Base spin count rules (you said: start with 4, can earn up to 8)
    this.baseSpinsDefault = 4;
    this.baseSpinsTotal = this.baseSpinsDefault;
  }

  resetAll() {
    this.board.initBoard();
    this.board.deactivate();
    this.symbolSystem.clearAll();
    this.sigilSystem.resetPhase();
    this.bookSystem.reset();
    this.baseSpinsTotal = this.baseSpinsDefault;
  }

  /**
   * Place a full 5x5 grid of symbols (resolve-in).
   * This is where reels "appear" logically.
   */
  dealGrid() {
    this.board.activate();

    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const tier = rollTier();
        const id = rollSymbolId(tier);

        const sym = this.symbolSystem.createSymbol({ id, tier, row: r, col: c });
        this.symbolSystem.setSymbol(sym);
        this.board.placeSymbol(r, c, sym);
      }
    }
  }

  /**
   * Core: resolve one spin cycle.
   * Returns a debug object you can print or inspect.
   */
  resolveSpin() {
    // Reset flags for this spin resolution pass
    this.symbolSystem.resetFlags();

    // 1) Deal symbols (in visuals: resolve-in)
    this.dealGrid();

    const getSymbolAt = (r, c) => this.symbolSystem.getSymbol(r, c);

    // 2) Find connections (placeholder for now)
    const connectionPositions = findConnectionPlaceholder(this.board, getSymbolAt);

    // Mark connected symbols
    if (connectionPositions.length > 0) {
      this.symbolSystem.markConnected(connectionPositions);
    }

    // 3) Decide if a sigil triggers based on current collected
    const nextSigil = this.sigilSystem.getNextTrigger();

    let sigilEffect = null;
    if (nextSigil) {
      // Book opens the moment the system begins work
      this.bookSystem.openIfNeeded();

      // Compute effect positions (placeholder models)
      sigilEffect = this.sigilSystem.computeEffect(nextSigil, this.board, getSymbolAt);

      // Mark affected symbols (unless Path)
      if (sigilEffect?.affectedPositions?.length) {
        this.symbolSystem.markAffected(sigilEffect.affectedPositions);
      }

      // Record sigil into book (language captured)
      this.bookSystem.recordSigil(nextSigil);

      // Mark executed
      this.sigilSystem.markExecuted(nextSigil);

      // If PATH confirmed, this is a phase transition hook
      if (nextSigil === SIGILS.PATH) {
        // In the real game: board absorbs meaningful states and enters Bonus 1
        // Here we just note the event
      }
    }

    // 4) Resolve fates: absorb vs dissolve
    const { absorb, dissolve } = this.symbolSystem.resolveFates();

    // 5) Intake absorption into systems
    this.bookSystem.intakeAbsorption(absorb.length);
    this.sigilSystem.addCollected(absorb.length);

    // 6) Apply extra spins rule after 36+
    const earned = this.sigilSystem.getExtraSpinsEarned();
    // Total spins can be 4 + up to 4 extras = 8
    this.baseSpinsTotal = this.baseSpinsDefault + earned;

    // 7) Purge the board model after animations would complete
    this.symbolSystem.purgeResolved();
    this.board.initBoard(); // board becomes empty logically between spins (no cascading)

    // If no sigils in progress / not active, you may close the book (rule: if 2nd word doesn’t get spoken, book closes)
    // We'll enforce this later with a more explicit "attempt window." For now, we keep it open once work begins.

    const debug = {
      bookState: this.bookSystem.getState(),
      emblemRevealed: this.bookSystem.isEmblemRevealed(),
      collected: this.sigilSystem.collected,
      nextSigilTriggered: nextSigil || null,
      sigilMeta: sigilEffect?.meta || null,
      absorbedCount: absorb.length,
      dissolvedCount: dissolve.length,
      connectionCount: connectionPositions.length,
      baseSpinsTotal: this.baseSpinsTotal
    };

    return debug;
  }
}
