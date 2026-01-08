// SigilSystem.js
// Tracks sigil progression + triggers command effects.
// NOTE: This is pure logic. It does not animate or play audio.

export const SIGILS = {
  RESISTANCE: "resistance",
  INVIGORATE: "invigorate",
  TRANSCENDENCE: "transcendence",
  PATH: "path"
};

export default class SigilSystem {
  constructor() {
    // Total collected symbols across spins for the current phase
    this.collected = 0;

    // Which sigils have already been executed in the current phase
    this.executed = {
      [SIGILS.RESISTANCE]: false,
      [SIGILS.INVIGORATE]: false,
      [SIGILS.TRANSCENDENCE]: false,
      [SIGILS.PATH]: false
    };

    // Extra spins rule after 36+
    this.extraSpinsEarned = 0; // each +4 over 36 grants 1, cap 4
    this.extraSpinsCap = 4;
  }

  resetPhase() {
    this.collected = 0;
    this.executed[SIGILS.RESISTANCE] = false;
    this.executed[SIGILS.INVIGORATE] = false;
    this.executed[SIGILS.TRANSCENDENCE] = false;
    this.executed[SIGILS.PATH] = false;
    this.extraSpinsEarned = 0;
  }

  /**
   * Add newly absorbed/connected symbols to the progression counter.
   * This should be called with the COUNT of symbols that were ABSORBED due to:
   * - connections
   * - sigil effects
   */
  addCollected(count) {
    if (typeof count !== "number" || count < 0) return;

    const before = this.collected;
    this.collected += count;

    // Every +4 after 36 grants 1 extra spin, cap 4
    // Example: collected goes from 36 to 40 => +1
    // 40 to 44 => +1, etc
    if (this.collected > 36) {
      const prevOver = Math.max(0, before - 36);
      const nowOver = this.collected - 36;

      const prevSpins = Math.floor(prevOver / 4);
      const nowSpins = Math.floor(nowOver / 4);

      const delta = nowSpins - prevSpins;
      if (delta > 0) {
        this.extraSpinsEarned = Math.min(
          this.extraSpinsCap,
          this.extraSpinsEarned + delta
        );
      }
    }
  }

  /**
   * Returns the next sigil that should trigger, if any.
   * Sigils trigger once each in order:
   * 8 -> Resistance
   * 16 -> Invigorate
   * 24 -> Transcendence
   * 36 -> Path
   */
  getNextTrigger() {
    if (!this.executed[SIGILS.RESISTANCE] && this.collected >= 8) return SIGILS.RESISTANCE;
    if (!this.executed[SIGILS.INVIGORATE] && this.collected >= 16) return SIGILS.INVIGORATE;
    if (!this.executed[SIGILS.TRANSCENDENCE] && this.collected >= 24) return SIGILS.TRANSCENDENCE;
    if (!this.executed[SIGILS.PATH] && this.collected >= 36) return SIGILS.PATH;
    return null;
  }

  /**
   * Mark a sigil as executed.
   */
  markExecuted(sigil) {
    if (sigil in this.executed) this.executed[sigil] = true;
  }

  /**
   * Returns how many extra spins have been earned after 36+.
   */
  getExtraSpinsEarned() {
    return this.extraSpinsEarned;
  }

  /**
   * Compute which board positions are affected by each sigil.
   * This returns positions only — the Board/Symbol systems decide visuals + absorption.
   *
   * IMPORTANT: These are *placeholder effect models* that match your rules,
   * but we will later implement symbol-tier awareness + actual symbol replacement/upgrades.
   *
   * @param {string} sigil
   * @param {Object} board - should have rows/cols
   * @param {Function} getSymbolAt - (row,col) => symbol or null
   * @returns {Object} effectResult
   *  - affectedPositions: Array<{row,col}>
   *  - meta: effect-specific details (e.g., "upgradeAll": true)
   */
  computeEffect(sigil, board, getSymbolAt) {
    const rows = board.rows;
    const cols = board.cols;

    const affectedPositions = [];
    const meta = {};

    if (sigil === SIGILS.RESISTANCE) {
      // Remove low-tier symbols (affected positions are all lows)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const s = getSymbolAt(r, c);
          if (s && s.tier === "low") affectedPositions.push({ row: r, col: c });
        }
      }
      meta.removeLowTier = true;
    }

    if (sigil === SIGILS.INVIGORATE) {
      // Rearrange to guarantee at least one connection.
      // In code, we'll implement a solver later.
      // For now, we mark "whole board is affected" because the board changes as a system.
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const s = getSymbolAt(r, c);
          if (s) affectedPositions.push({ row: r, col: c });
        }
      }
      meta.ensureConnection = true;
    }

    if (sigil === SIGILS.TRANSCENDENCE) {
      // Upgrade all symbols one tier + respin once
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const s = getSymbolAt(r, c);
          if (s) affectedPositions.push({ row: r, col: c });
        }
      }
      meta.upgradeAll = true;
      meta.respinOnce = true;
    }

    if (sigil === SIGILS.PATH) {
      // Path does not affect symbols directly; it confirms progression.
      meta.confirmPhase = true;
    }

    return { affectedPositions, meta };
  }
}
