import type { DidResolutionResult, ParsedDid, DidResolver, AgentContext } from "@aries-framework/core"
import { JsonTransformer, DidDocument } from "@aries-framework/core"

export class IndyVdrProxyDidResolver implements DidResolver {
  public readonly supportedMethods = ["sov", "indy"]

  private proxyBaseUrl: string

  public constructor(proxyBaseUrl: string) {
    this.proxyBaseUrl = proxyBaseUrl
  }

  public async resolve(agentContext: AgentContext, did: string, _parsed: ParsedDid): Promise<DidResolutionResult> {
    const didDocumentMetadata = {}

    try {
      const response = await agentContext.config.agentDependencies.fetch(
        `${this.proxyBaseUrl}/did/${encodeURIComponent(did)}`
      )
      if (!response.ok) {
        return {
          didDocument: null,
          didDocumentMetadata,
          didResolutionMetadata: {
            error: "failed",
            message: `resolver_error: Unable to resolve did '${did}': server status ${response.status}`,
          },
        }
      }
      
      const respJson = (await response.json()) as DidResolutionResult

      let didDocument = null
      if (respJson.didDocument) {
        didDocument = JsonTransformer.fromJSON(respJson.didDocument, DidDocument)
      }
      
      return {
        ...respJson,
        didDocument
      }
      
    } catch (error) {
      return {
        didDocument: null,
        didDocumentMetadata,
        didResolutionMetadata: {
          error: "notFound",
          message: `resolver_error: Unable to resolve did '${did}': ${error}`,
        },
      }
    }
  }
}
