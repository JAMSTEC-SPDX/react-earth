import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "esm",
    },
  ],
  plugins: [
    resolve(),
    typescript(),
    postcss({
      extract: true, // génère un fichier CSS
    }),
  ],
  external: (id) => {
    return !id.startsWith(".") && !id.startsWith("/");
  },
};
