import typescript from "@rollup/plugin-typescript";
export default {
  input: "./src/index.ts",
  output: [
    {
      file: "lib/guide-mini-vue.cjs.js",
      format: "cjs",
    },
    {
      file: "lib/guide-mini-vue.esm.js",
      format: "es",
    },
  ],
  plugins: [typescript()],
};
