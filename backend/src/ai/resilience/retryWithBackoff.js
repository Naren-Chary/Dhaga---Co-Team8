/**
 * Phase 10: Resilient AI Invocation & JSON Repair Utilities
 * Implements exponential backoff, timeout abort controllers, and robust JSON auto-repair.
 */

/**
 * Robust JSON parser with multi-strategy auto-repair
 */
export function safeParseJson(rawText, fallback = null) {
  if (!rawText || typeof rawText !== 'string') {
    if (fallback !== null) return fallback;
    throw new Error('safeParseJson: Input must be a non-empty string');
  }

  // Strategy 1: Direct JSON.parse
  try {
    return JSON.parse(rawText.trim());
  } catch (e1) {
    // Strategy 2: Strip Markdown code fences and whitespace
    try {
      const stripped = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(stripped);
    } catch (e2) {
      // Strategy 3: Regex extract the outermost { ... } or [ ... ]
      try {
        const jsonMatch = stripped || rawText;
        const firstBrace = jsonMatch.indexOf('{');
        const lastBrace = jsonMatch.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const candidate = jsonMatch.substring(firstBrace, lastBrace + 1);
          return JSON.parse(candidate);
        }
      } catch (e3) {
        // Strategy 4: Common syntax repairs (trailing commas, unquoted keys)
        try {
          const firstBrace = rawText.indexOf('{');
          const lastBrace = rawText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            let candidate = rawText.substring(firstBrace, lastBrace + 1);
            // Remove trailing commas before } or ]
            candidate = candidate.replace(/,\s*([}\]])/g, '$1');
            return JSON.parse(candidate);
          }
        } catch (e4) {
          // If all strategies fail
          if (fallback !== null) return fallback;
          throw new Error(`JSON Repair failed. Error: ${e1.message}. Snippet: ${rawText.substring(0, 120)}...`);
        }
      }
    }
  }

  if (fallback !== null) return fallback;
  throw new Error(`Failed to extract valid JSON from response: ${rawText.substring(0, 100)}...`);
}

/**
 * Execute an asynchronous AI task with timeout and exponential backoff retry.
 * 
 * @param {Function} taskFn - () => Promise<any>
 * @param {Object} options
 * @param {number} options.maxRetries - Maximum retry attempts (default 2)
 * @param {number} options.initialDelayMs - Initial delay before retry in ms (default 500)
 * @param {number} options.backoffFactor - Multiplier for delay (default 2.0)
 * @param {number} options.timeoutMs - Timeout per attempt in ms (default 12000)
 * @param {string} options.taskName - Human-readable label for logging
 * @param {Function} options.fallbackFn - (error) => fallbackResult if all retries fail
 */
export async function executeWithResilience(taskFn, options = {}) {
  const {
    maxRetries = 2,
    initialDelayMs = 500,
    backoffFactor = 2,
    timeoutMs = 12000,
    taskName = 'AI_TASK',
    fallbackFn = null,
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;
  let lastError = null;

  while (attempt <= maxRetries) {
    attempt++;
    const startTime = Date.now();

    try {
      // Execute with timeout promise race
      const result = await Promise.race([
        taskFn(attempt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);

      return {
        success: true,
        result,
        attempts: attempt,
        latencyMs: Date.now() - startTime,
        isFallback: false,
      };
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt > maxRetries;

      console.warn(
        `[Resilience] ${taskName} attempt ${attempt}/${maxRetries + 1} failed: ${err.message}.` +
        (isLastAttempt ? ' Exceeded max retries.' : ` Retrying in ${delay}ms...`)
      );

      if (!isLastAttempt) {
        // Sleep with jitter
        const jitter = Math.random() * 100;
        await new Promise((res) => setTimeout(res, delay + jitter));
        delay = Math.round(delay * backoffFactor);
      }
    }
  }

  // If all attempts failed and fallback is provided, trigger fallback
  if (fallbackFn) {
    console.info(`[Resilience] Triggering safe deterministic fallback for ${taskName}`);
    try {
      const fallbackResult = await fallbackFn(lastError);
      return {
        success: true,
        result: fallbackResult,
        attempts: attempt,
        isFallback: true,
        fallbackReason: lastError.message,
      };
    } catch (fbErr) {
      console.error(`[Resilience] Fallback function itself failed:`, fbErr);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: attempt,
    isFallback: false,
  };
}
