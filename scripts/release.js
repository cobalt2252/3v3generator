// Run before every publish:  node scripts/release.js
// 1. runs the tests, 2. bumps the service-worker VERSION so phones fetch the new files.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const root = path.join(__dirname, "..");

const t = spawnSync(process.execPath, ["--test", "tests/engine.test.js", "tests/app.test.js"], { cwd: root, stdio: "inherit" });
if (t.status !== 0) { console.error("\nTests failed - version not bumped."); process.exit(1); }

const file = path.join(root, "sw.js");
const src = fs.readFileSync(file, "utf8");
const today = new Date().toISOString().slice(0, 10);
const m = src.match(/const VERSION = "(\d{4}-\d{2}-\d{2})\.(\d+)";/);
const n = m && m[1] === today ? Number(m[2]) + 1 : 1;
const next = `${today}.${n}`;
fs.writeFileSync(file, src.replace(/const VERSION = "[^"]*";/, `const VERSION = "${next}";`));
console.log(`\nsw.js VERSION -> ${next}. Upload the changed files (always including sw.js).`);
