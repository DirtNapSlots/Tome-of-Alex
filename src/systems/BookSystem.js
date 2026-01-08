// BookSystem.js
// The book is an authored recorder. It does not perform.
// It only changes state when progress is correct.

export const BOOK_STATES = {
  CLOSED: "closed",
  OPEN: "open",
  FULL: "full",
  COMPLETE: "complete"
};

export default class BookSystem {
  constructor() {
    this.state = BOOK_STATES.CLOSED;

    // Sigils recorded into the book during the base phase
    this.recordedSigils = {
      resistance: false,
      invigorate: false,
      transcendence: false,
      path: false
    };

    // Emblem reveal on the cover happens only once all four are recorded
    this.emblemRevealed = false;

    // Track absorption counts for logging / debug / progression
    this.totalAbsorbed = 0;
  }

  reset() {
    this.state = BOOK_STATES.CLOSED;
    this.recordedSigils.resistance = false;
    this.recordedSigils.invigorate = false;
    this.recordedSigils.transcendence = false;
    this.recordedSigils.path = false;
    this.emblemRevealed = false;
    this.totalAbsorbed = 0;
  }

  getState() {
    return this.state;
  }

  isEmblemRevealed() {
    return this.emblemRevealed;
  }

  /**
   * Called when Alex begins work (first sigil attempt / first real progression).
   */
  openIfNeeded() {
    if (this.state === BOOK_STATES.CLOSED) {
      this.state = BOOK_STATES.OPEN;
    }
  }

  /**
   * If progression fails or resets before Path, the book closes.
   */
  close() {
    if (this.state === BOOK_STATES.OPEN) {
      this.state = BOOK_STATES.CLOSED;
    }
  }

  /**
   * Record a sigil into the book.
   * This is a logical event that implies the sigil "enters between pages."
   */
  recordSigil(sigil) {
    if (!sigil) return;

    // Opening the book is a prerequisite for recording
    this.openIfNeeded();

    if (sigil in this.recordedSigils) {
      this.recordedSigils[sigil] = true;
    }

    // If all four are recorded, reveal emblem on cover (but do not complete yet)
    if (
      this.recordedSigils.resistance &&
      this.recordedSigils.invigorate &&
      this.recordedSigils.transcendence &&
      this.recordedSigils.path
    ) {
      this.emblemRevealed = true;
    }
  }

  /**
   * Called when the system confirms Path and transitions into Super Bonus entry.
   * The book becomes FULL: closes firmly and moves to the board (visual handled elsewhere).
   */
  setFull() {
    this.state = BOOK_STATES.FULL;
  }

  /**
   * Called during the final completion sequence.
   * The book opens and pours back into Alex (visual handled elsewhere).
   */
  setComplete() {
    this.state = BOOK_STATES.COMPLETE;
  }

  /**
   * Intake absorbed symbols (meaningful events).
   * This is strictly accounting; visuals handled in scene layer.
   */
  intakeAbsorption(absorbedCount) {
    if (typeof absorbedCount !== "number" || absorbedCount < 0) return;
    this.totalAbsorbed += absorbedCount;
  }

  getTotalAbsorbed() {
    return this.totalAbsorbed;
  }
}
