import path from "node:path";
import { readdir } from "node:fs/promises";
import { FlowEngine } from "./runner/engine.js";
import type { FlowDefinition, ActionHandler } from "./runner/types.js";

interface FlowModule {
  default: FlowDefinition;
  actions?: Record<string, ActionHandler>;
}

async function main() {
  const args = process.argv.slice(2);

  // Parse --flow and --role flags
  let flowFilter: string | undefined;
  let roleFilter: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--flow" && args[i + 1]) flowFilter = args[++i];
    if (args[i] === "--role" && args[i + 1]) roleFilter = args[++i];
  }

  // Discover flow files
  const flowsDir = path.resolve(import.meta.dirname, "flows");
  const files = await readdir(flowsDir);
  const flowFiles = files
    .filter((f) => f.endsWith(".flow.ts"))
    .filter((f) => !flowFilter || f.includes(flowFilter))
    .sort();

  if (flowFiles.length === 0) {
    console.error(`No flow files found${flowFilter ? ` matching "${flowFilter}"` : ""}`);
    process.exit(1);
  }

  console.log(`\n🎬 Demo Recorder — ${flowFiles.length} flow(s) to record\n`);

  const engine = new FlowEngine();

  for (const file of flowFiles) {
    const modulePath = path.join(flowsDir, file);
    const mod = (await import(modulePath)) as FlowModule;
    const flow = mod.default;

    // Register any custom actions exported by the flow
    if (mod.actions) {
      for (const [name, handler] of Object.entries(mod.actions)) {
        engine.defineAction(name, handler);
      }
    }

    console.log(`📹 ${flow.name}: ${flow.description}`);

    const results = await engine.run(flow, { filterRole: roleFilter });

    console.log(`   ✅ ${results.length} recording(s)\n`);
  }

  console.log("🎬 Done!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
