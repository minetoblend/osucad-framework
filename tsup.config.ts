import { defineConfig } from "tsup";

export default defineConfig({
  target: "esnext",
  dts: true,
  format: ["esm", 'cjs'],
  sourcemap: true,
  clean: true,
  outDir: "dist",
  entry: ["src/index.ts", "src/math.ts"],
});
