import { parseMarkdown, type Node } from "comark";
import { describe, expect, it } from "vite-plus/test";

import cjk from "../src/index";

describe("cjk plugin", () => {
  it("parses strong emphasis around CJK punctuation", async () => {
    const { nodes } = await parseMarkdown("ここを**「強調」**したい", { plugins: [cjk()] });
    const expected: Node = ["strong", {}, "「強調」"];

    expect(JSON.stringify(nodes)).toContain(JSON.stringify(expected));
  });
});
