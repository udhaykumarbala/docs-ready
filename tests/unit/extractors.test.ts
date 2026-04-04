import { describe, it, expect } from "vitest";
import {
  extractContractAddresses,
  extractCodeBlocks,
  extractTables,
  extractLinks,
  deduplicateBlocks,
} from "../../src/generate/extractors.js";

describe("extractContractAddresses", () => {
  it("extracts valid Ethereum addresses", () => {
    const content = `
Storage: 0x1234567890abcdef1234567890abcdef12345678
Token: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
`;
    const addresses = extractContractAddresses(content);
    expect(addresses).toHaveLength(2);
    expect(addresses[0]).toBe("0x1234567890abcdef1234567890abcdef12345678");
    expect(addresses[1]).toBe("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
  });

  it("rejects invalid strings", () => {
    const content = "Not an address: 0x123 and also 0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ";
    const addresses = extractContractAddresses(content);
    expect(addresses).toHaveLength(0);
  });
});

describe("extractCodeBlocks", () => {
  it("groups by language", () => {
    const content = `
\`\`\`typescript
const x = 1;
\`\`\`

\`\`\`bash
npm install foo
\`\`\`

\`\`\`typescript
const y = 2;
\`\`\`
`;
    const blocks = extractCodeBlocks(content);
    expect(blocks.get("typescript")).toHaveLength(2);
    expect(blocks.get("bash")).toHaveLength(1);
    expect(blocks.get("typescript")![0]).toBe("const x = 1;");
  });
});

describe("extractTables", () => {
  it("preserves markdown table structure", () => {
    const content = `
Some text.

| Name | Value |
|------|-------|
| Foo  | Bar   |

More text.
`;
    const tables = extractTables(content);
    expect(tables).toHaveLength(1);
    expect(tables[0]).toContain("| Name | Value |");
    expect(tables[0]).toContain("| Foo  | Bar   |");
  });
});

describe("extractLinks", () => {
  it("categorizes links as github, npm, or external", () => {
    const content = `
See [GitHub repo](https://github.com/org/repo) for source.
See [npm package](https://www.npmjs.com/package/foo) for releases.
See [docs](https://docs.example.com/guide) for more info.
`;
    const links = extractLinks(content);
    const github = links.filter((l) => l.category === "github");
    const npm = links.filter((l) => l.category === "npm");
    const external = links.filter((l) => l.category === "external");
    expect(github).toHaveLength(1);
    expect(github[0].url).toBe("https://github.com/org/repo");
    expect(npm).toHaveLength(1);
    expect(external).toHaveLength(1);
  });
});

describe("deduplicateBlocks", () => {
  it("removes identical code blocks", () => {
    const blocks = new Map<string, string[]>();
    blocks.set("typescript", ["const x = 1;", "const y = 2;", "const x = 1;"]);
    blocks.set("bash", ["npm install foo"]);
    const deduped = deduplicateBlocks(blocks);
    expect(deduped.get("typescript")).toHaveLength(2);
    expect(deduped.get("bash")).toHaveLength(1);
  });
});
