/**
 * Estimate token count using chars/4 heuristic.
 * Accurate within ~15% for English technical documentation.
 */
export function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

/**
 * Format token count for display (e.g. "~12.5K tokens")
 */
export function formatTokens(count: number): string {
  if (count >= 1000) {
    return `~${(count / 1000).toFixed(1)}K tokens`;
  }
  return `~${count} tokens`;
}
