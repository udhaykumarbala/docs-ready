import chalk from "chalk";
import ora, { type Ora } from "ora";

export type LogLevel = "quiet" | "normal" | "verbose";

let currentLevel: LogLevel = "normal";

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export const log = {
  info: (msg: string) => {
    if (currentLevel !== "quiet") console.log(chalk.blue("ℹ"), msg);
  },
  success: (msg: string) => {
    if (currentLevel !== "quiet") console.log(chalk.green("✔"), msg);
  },
  warn: (msg: string) => {
    console.log(chalk.yellow("⚠"), msg);
  },
  error: (msg: string) => {
    console.error(chalk.red("✖"), msg);
  },
  dim: (msg: string) => {
    if (currentLevel !== "quiet") console.log(chalk.dim(msg));
  },
  debug: (msg: string) => {
    if (currentLevel === "verbose") console.log(chalk.gray("[debug]"), msg);
  },
};

export function spinner(text: string): Ora {
  if (currentLevel === "quiet") {
    // Return a no-op spinner
    return { start: () => ({} as Ora), stop: () => ({} as Ora), succeed: () => ({} as Ora), fail: () => ({} as Ora) } as unknown as Ora;
  }
  return ora({ text, color: "cyan" });
}
