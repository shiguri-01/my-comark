import solidRolldown from "unplugin-solid/rolldown";
import solidVite from "unplugin-solid/vite";
import { defineConfig } from "vite-plus";

const solidOptions = {
  hot: false,
  solid: {
    moduleName: "@solidjs/web",
  },
};

export default defineConfig({
  plugins: [solidVite(solidOptions)],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest-setup.ts"],
  },
  pack: {
    platform: "neutral",
    plugins: [solidRolldown(solidOptions)],
    dts: {
      tsgo: true,
    },
    exports: true,
  },

  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
