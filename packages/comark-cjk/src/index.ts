import { defineComarkPlugin } from "comark";
import markdownItCjkFriendlyPlugin from "markdown-it-cjk-friendly";

export default defineComarkPlugin<never>(() => ({
  name: "cjk-friendly",
  markdownItPlugins: [markdownItCjkFriendlyPlugin],
}));
