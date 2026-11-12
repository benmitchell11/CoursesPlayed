// Optional Langfuse tracing for model calls. Off unless LANGFUSE_PUBLIC_KEY and
// LANGFUSE_SECRET_KEY are both set; with them unset every call passes straight
// through, so tests and local dev need no Langfuse account.
//
// Anything that goes wrong inside tracing is swallowed on purpose: observability
// must never be the reason a golfer's request fails.

let sdk
let processor
let initFailed = false

function enabled () {
  return Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) && !initFailed
}

function init () {
  if (sdk || !enabled()) return
  try {
    const { NodeSDK } = require('@opentelemetry/sdk-node')
    const { LangfuseSpanProcessor } = require('@langfuse/otel')
    processor = new LangfuseSpanProcessor()
    sdk = new NodeSDK({ spanProcessors: [processor] })
    sdk.start()
  } catch (err) {
    initFailed = true
    console.warn('Langfuse tracing disabled:', err.message)
  }
}

function safely (fn) {
  try {
    fn()
  } catch (err) {
    console.warn('Langfuse tracing error:', err.message)
  }
}

// Runs `fn(record)` inside a Langfuse "generation" observation. `record` takes
// { output, usage } once the model has answered; usage is the Anthropic shape
// ({ input_tokens, output_tokens }).
async function traceGeneration ({ name, model, input }, fn) {
  if (!enabled()) return fn(() => {})
  init()
  if (!sdk) return fn(() => {})

  const { startActiveObservation } = require('@langfuse/tracing')
  return startActiveObservation(
    name,
    async (generation) => {
      safely(() => generation.update({ model, input }))
      try {
        return await fn(({ output, usage } = {}) => safely(() => {
          generation.update({
            output,
            ...(usage
              ? { usageDetails: { input: usage.input_tokens, output: usage.output_tokens } }
              : {})
          })
        }))
      } catch (err) {
        safely(() => generation.update({ level: 'ERROR', statusMessage: err.message }))
        throw err
      }
    },
    { asType: 'generation' }
  )
}

async function flush () {
  if (processor) await processor.forceFlush()
}

module.exports = { traceGeneration, flush, enabled }
