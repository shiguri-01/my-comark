import { defineConfig } from "vite-plus";
import solid from "unplugin-solid/rolldown";

export default defineConfig({
  pack: {
    platform: "neutral",
    plugins: [solid()],
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
