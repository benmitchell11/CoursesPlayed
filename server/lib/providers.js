// Chooses which model provider reads rounds and scorecards, from the environment.
//
//   OPENROUTER_API_KEY   use OpenRouter (the course budget). Preferred when both are set.
//   ANTHROPIC_API_KEY    use Anthropic directly.
//   DEMO_MODE=true       with no key at all, answer from canned rules instead (see demoClient.js).
//                        A real key always wins over it. Evals never use it.
//   MODEL_PROVIDER       'openrouter' or 'anthropic' to force one when both keys exist.
//   ROUND_PARSER_MODEL / SCORECARD_PARSER_MODEL   override the model for that job.
//
// Model names differ between the two (OpenRouter's are "anthropic/claude-haiku-4.5",
// Anthropic's own are "claude-haiku-4-5-20251001"), so each provider has its own defaults.
// Both defaults were picked from OpenRouter's model list for image input plus strict
// JSON-schema output; the evals are how to compare cheaper ones.

const { createOpenRouterClient } = require('./openrouterClient')
const { createDemoClient } = require('./demoClient')

const DEFAULT_MODELS = {
  openrouter: { round: 'anthropic/claude-haiku-4.5', scorecard: 'anthropic/claude-sonnet-5', chat: 'anthropic/claude-haiku-4.5' },
  anthropic: { round: 'claude-haiku-4-5-20251001', scorecard: 'claude-sonnet-5', chat: 'claude-haiku-4-5-20251001' }
}

const MODEL_ENV = { round: 'ROUND_PARSER_MODEL', scorecard: 'SCORECARD_PARSER_MODEL', chat: 'CHAT_MODEL' }
const KEY_ENV = { openrouter: 'OPENROUTER_API_KEY', anthropic: 'ANTHROPIC_API_KEY' }

const NOT_CONFIGURED = 'set OPENROUTER_API_KEY or ANTHROPIC_API_KEY, or DEMO_MODE=true for a demo'

function pickProvider (env = process.env) {
  const forced = env.MODEL_PROVIDER
  if (forced && !DEFAULT_MODELS[forced]) return null
  if (forced) return env[KEY_ENV[forced]] ? forced : null
  if (env.OPENROUTER_API_KEY) return 'openrouter'
  if (env.ANTHROPIC_API_KEY) return 'anthropic'
  return null
}

const cache = new Map()

// Returns { provider, client, model } for 'round' or 'scorecard', or null if no
// provider is configured.
function resolveModelClient (task, { env = process.env, timeoutMs, fetchImpl } = {}) {
  const provider = pickProvider(env)
  if (!provider) {
    return env.DEMO_MODE === 'true' ? { provider: 'demo', client: createDemoClient(), model: 'demo' } : null
  }

  const key = `${provider}:${env[KEY_ENV[provider]]}:${timeoutMs}`
  if (!cache.has(key) || fetchImpl) {
    let client
    if (provider === 'openrouter') {
      client = createOpenRouterClient({ apiKey: env.OPENROUTER_API_KEY, timeoutMs, fetchImpl })
    } else {
      const Anthropic = require('@anthropic-ai/sdk')
      // No automatic retries: a failed or slow call should fail visibly, not loop.
      client = new Anthropic({ timeout: timeoutMs, maxRetries: 0 })
    }
    if (fetchImpl) return { provider, client, model: env[MODEL_ENV[task]] || DEFAULT_MODELS[provider][task] }
    cache.set(key, client)
  }

  return { provider, client: cache.get(key), model: env[MODEL_ENV[task]] || DEFAULT_MODELS[provider][task] }
}

module.exports = { resolveModelClient, pickProvider, DEFAULT_MODELS, NOT_CONFIGURED }
