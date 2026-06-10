// Side-effect env loader. Import this FIRST in any marketing script whose other
// imports read process.env at module scope (src/lib/notify-slack.ts freezes its
// webhook map on import). ES module imports are hoisted, so a config() call in
// the script body runs too late — but imports evaluate in source order, so this
// module runs before the modules imported after it.
import { config } from "dotenv"

config({ path: ".env.local" })
