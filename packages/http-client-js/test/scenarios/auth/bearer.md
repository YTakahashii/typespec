# Handles a simple bearer authentication scheme

This test validates that the emitter can handle a simple bearer authentication scheme correctly, including the client signature and its initialization

## Typespec

The spec contains a simple service with a Bearer authentication scheme

```tsp
@service(#{ title: "Test Service" })
@useAuth(BearerAuth)
namespace Test;

@route("/valid")
@get
op valid(): NoContentResponse;
```

## TypeScript

### Client

The client signature should include a positional parameter for credential of type BearerTokenCredential. A Bearer token is a token credential that gets put into the Authorization header

```ts src/testClient.ts class TestClient
export class TestClient {
  #context: TestClientContext;

  constructor(endpoint: string, credential: BasicCredential, options?: TestClientOptions) {
    this.#context = createTestClientContext(endpoint, credential, options);
  }
  async valid(options?: ValidOptions) {
    return valid(this.#context, options);
  }
}
```

### ClientContext

The client context should setup the pipeline to use the credential in the Authorization header.

```ts src/api/testClientContext.ts function createTestClientContext
export function createTestClientContext(
  endpoint: string,
  credential: BasicCredential,
  options?: TestClientOptions,
): TestClientContext {
  const params: Record<string, any> = {
    endpoint: endpoint,
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params
      ? String(params[key])
      : (() => {
          throw new Error(`Missing parameter: ${key}`);
        })(),
  );
  return getClient(resolvedEndpoint, {
    ...options,
    credential,
    authSchemes: [
      {
        kind: "http",
        scheme: "bearer",
      },
    ],
  });
}
```
