import SpinResolver from "./src/systems/SpinResolver.js";

const game = new SpinResolver();

// Fresh start
game.resetAll();

// Simulate a series of spins so we can watch progression
const TOTAL_TEST_SPINS = 25;

console.log("=== Alex’s Tome: Logic Test Run ===");

for (let i = 1; i <= TOTAL_TEST_SPINS; i++) {
  const result = game.resolveSpin();

  console.log(
    `Spin ${i}: ` +
      `Absorb=${result.absorbedCount}, ` +
      `Dissolve=${result.dissolvedCount}, ` +
      `Connected=${result.connectionCount > 0 ? "yes" : "no"}, ` +
      `Triggered=${result.nextSigilTriggered || "-"}, ` +
      `Collected=${result.collected}, ` +
      `Emblem=${result.emblemRevealed ? "revealed" : "hidden"}, ` +
      `SpinsTotal=${result.baseSpinsTotal}`
  );
}

console.log("=== End Test Run ===");
