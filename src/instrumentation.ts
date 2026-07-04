/**
 * Next.js instrumentation hook — runs ONCE per server boot.
 * Starts the 24/7 server-side trading engine (real-money bots keep running
 * with the browser closed, as long as this server process is alive).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startServerEngine } = await import('@/server/engine/runner');
    startServerEngine();
  }
}
