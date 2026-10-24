const v8 = require('v8');
const vm = require('vm');

// Mengaktifkan gc() tanpa flag CLI. Dipakai agar objek native better-sqlite3 (Database/Statement)
// dilepas SAAT environment Jest masih hidup. Jika dilepas sesudah environment dibongkar, Node
// berhenti dengan "Assertion failed: (env) != nullptr" (crash native, exit code 134).
v8.setFlagsFromString('--expose-gc');
const gc = vm.runInNewContext('gc');

function collectGarbage() {
  for (let i = 0; i < 3; i += 1) gc();
}

module.exports = { collectGarbage };
