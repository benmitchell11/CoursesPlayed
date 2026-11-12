// A small OpenRouter client with the same shape the parsers already use with the
// Anthropic SDK: client.messages.parse({ model, system, messages, output_config })
// returns { parsed_output, usage }. That way the parsers don't care which provider is
// behind them, and tests keep using the same fake client.
//
// OpenRouter speaks the OpenAI chat-completions format, so this translates the
// request, asks for strict JSON-schema output, and validates the reply with the same
// zod schema the parsers already define. No retries: a slow or failed call fails visibly.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

class ProviderError extends Error {
  constructor (message, status = 502) {
    super(message)
    this.name = 'ProviderError'
    this.status = status
  }
}

// Anthropic-style messages -> OpenAI-style messages (text and base64 images).
function toOpenAiMessages (system, messages) {
  const out = []
  if (system) out.push({ role: 'system', content: system })
  for (const message of messages) {
    if (typeof message.content === 'string') {
      out.push({ role: message.role, content: message.content })
      continue
    }
    out.push({
      role: message.role,
      content: message.content.map((part) => (
        part.type === 'image'
          ? { type: 'image_url', image_url: { url: `data:${part.source.media_type};base64,${part.source.data}` } }
          : { type: 'text', text: part.text }
      ))
    })
  }
  return out
}

// Some models wrap JSON in a markdown fence even when asked not to.
function stripFence (text) {
  const match = /^\s*```(?:json)?\s*([\s\S]*?)\s*```\s*$/i.exec(text)
  return match ? match[1] : text
}

function createOpenRouterClient ({ apiKey, fetchImpl = fetch, timeoutMs = 20000, appTitle = 'Courses Played' }) {
  if (!apiKey) throw new Error('createOpenRouterClient needs an apiKey')

  return {
    messages: {
      async parse (request) {
        const format = request.output_config?.format
        const body = {
          model: request.model,
          messages: toOpenAiMessages(request.system, request.messages),
          max_tokens: request.max_tokens,
          // No temperature: newer Claude models reject it, and with require_parameters that
          // makes OpenRouter answer 404 "no endpoints" instead of ignoring it.
          ...(format && {
            response_format: { type: 'json_schema', json_schema: { name: 'extraction', strict: true, schema: format.schema } }
          }),
          // Only route to providers that honour the JSON schema, and not to any that
          // keep or train on the request: a scorecard photo has a name and member number on it.
          provider: { require_parameters: true, data_collection: 'deny' }
        }

        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)
        let response
        try {
          response = await fetchImpl(OPENROUTER_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'X-Title': appTitle
            },
            body: JSON.stringify(body),
            signal: controller.signal
          })
        } catch (err) {
          if (err.name === 'AbortError') throw new ProviderError('OpenRouter request timed out', 504)
          throw new ProviderError('OpenRouter request failed', 502)
        } finally {
          clearTimeout(timer)
        }

        if (!response.ok) {
          let detail = ''
          try {
            detail = (await response.json())?.error?.message || ''
          } catch {
            // the body is only for the server log
          }
          throw new ProviderError(`OpenRouter returned HTTP ${response.status}${detail ? `: ${String(detail).slice(0, 200)}` : ''}`, response.status)
        }

        const data = await response.json()
        if (data?.choices?.[0]?.finish_reason === 'length') {
          throw new ProviderError('OpenRouter reply was cut off at max_tokens', 502)
        }
        const content = data?.choices?.[0]?.message?.content
        let parsed = null
        if (typeof content === 'string' && content.trim()) {
          try {
            parsed = format ? format.parse(stripFence(content)) : content
          } catch {
            parsed = null // not valid JSON for the schema: the caller reports it as unreadable
          }
        }

        return {
          parsed_output: parsed,
          usage: { input_tokens: data?.usage?.prompt_tokens ?? 0, output_tokens: data?.usage?.completion_tokens ?? 0 }
        }
      }
    }
  }
}

module.exports = { createOpenRouterClient, ProviderError, toOpenAiMessages, OPENROUTER_URL }
