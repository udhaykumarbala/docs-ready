import { describe, it, expect } from "vitest";
import { cleanMdx } from "../../src/utils/mdx-clean.js";

describe("cleanMdx", () => {
  it("strips import statements", () => {
    const input = `import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";

# Hello

Some content here.`;
    const result = cleanMdx(input);
    expect(result).not.toContain("import ");
    expect(result).toContain("# Hello");
    expect(result).toContain("Some content here.");
  });

  it("strips single-line and multi-line JSX components", () => {
    const input = `# Title

<CustomComponent prop="value" />

Some text between.

<Tabs>
  <TabItem value="js" label="JavaScript">
    console.log("hi")
  </TabItem>
</Tabs>

More text after.`;
    const result = cleanMdx(input);
    expect(result).not.toContain("<CustomComponent");
    expect(result).not.toContain("<Tabs>");
    expect(result).not.toContain("</Tabs>");
    expect(result).not.toContain("<TabItem");
    expect(result).toContain("# Title");
    expect(result).toContain("Some text between.");
    expect(result).toContain("More text after.");
  });

  it("converts admonitions to blockquotes", () => {
    const input = `# Title

:::note
This is a note.
:::

:::tip Custom Title
This is a tip.
:::

Regular paragraph.`;
    const result = cleanMdx(input);
    expect(result).toContain("> **Note:** This is a note.");
    expect(result).toContain("> **Custom Title:** This is a tip.");
    expect(result).not.toContain(":::");
    expect(result).toContain("Regular paragraph.");
  });

  it("strips UTF-8 BOM", () => {
    const input = "\uFEFF# Title\n\nContent.";
    const result = cleanMdx(input);
    expect(result.charCodeAt(0)).not.toBe(0xfeff);
    expect(result).toContain("# Title");
  });
});
