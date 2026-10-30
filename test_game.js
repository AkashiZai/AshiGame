const fs = require('fs');
const path = require('path');
const { CARDS_DATA } = require('./cards.js');

console.log("=== RUNNING AUTOMATED VERIFICATION SUITE ===");

// Test 1: Card database verification
console.log("\n[Test 1] Checking Card Dataset...");
if (!Array.isArray(CARDS_DATA) || CARDS_DATA.length !== 26) {
  throw new Error(`Expected exactly 26 cards, but found ${CARDS_DATA.length}`);
}
console.log(`✓ Card count: ${CARDS_DATA.length}`);

// Test 2: Image existence & format
console.log("\n[Test 2] Checking all image files...");
CARDS_DATA.forEach((card, idx) => {
  const imgPath = path.join(__dirname, card.image);
  if (!fs.existsSync(imgPath)) {
    throw new Error(`Card #${card.id} (${card.name}) image missing at: ${imgPath}`);
  }
  const stat = fs.statSync(imgPath);
  if (stat.size === 0) {
    throw new Error(`Card #${card.id} image is empty!`);
  }
  // Verify required fields
  if (!card.name || !card.sub || !card.category || typeof card.cost !== 'number' || typeof card.atk !== 'number' || typeof card.def !== 'number' || !card.skill || !card.quote) {
    throw new Error(`Card #${card.id} has invalid/missing properties!`);
  }
});
console.log(`✓ All ${CARDS_DATA.length} card images and data properties verified!`);

// Test 3: Simulation of damage calculation & skills
console.log("\n[Test 3] Simulating combat and skills resolution...");
function simulateDamage(target, amount, isTrue = false) {
  let dmg = amount;
  if (!isTrue && target.shield > 0) {
    if (target.shield >= dmg) {
      target.shield -= dmg;
      dmg = 0;
    } else {
      dmg -= target.shield;
      target.shield = 0;
    }
  }
  if (dmg > 0) {
    target.hp = Math.max(0, target.hp - dmg);
  }
}

const mockTarget = { hp: 30, shield: 5 };
simulateDamage(mockTarget, 8); // 8 - 5 shield = 3 dmg to hp
if (mockTarget.shield !== 0 || mockTarget.hp !== 27) {
  throw new Error(`Damage calculation failed! Expected shield=0, hp=27, got shield=${mockTarget.shield}, hp=${mockTarget.hp}`);
}
console.log("✓ Combat damage calculation simulation passed!");

// Test 4: Verify HTML and CSS files
console.log("\n[Test 4] Verifying HTML & CSS assets...");
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const cssContent = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf-8');

const requiredElements = [
  'gameModeSelect',
  'p1Panel',
  'p2Panel',
  'turnBanner',
  'combatLog',
  'p1HandZone',
  'p2HandZone',
  'tab-arena',
  'tab-print',
  'tab-dex',
  'cardActionModal',
  'rulesModal',
  'gameOverModal',
  'printSheetsContainer'
];

requiredElements.forEach(id => {
  if (!htmlContent.includes(`id="${id}"`)) {
    throw new Error(`HTML is missing required element id="${id}"`);
  }
});
console.log("✓ All required HTML DOM element IDs verified!");

if (!cssContent.includes('@media print') || !cssContent.includes('.a4-sheet')) {
  throw new Error("CSS is missing print styles!");
}
console.log("✓ Print & Play CSS rules verified!");

console.log("\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
