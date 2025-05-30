import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http",
  diagnostics: {
    "http-verb-duplicate": {
      severity: "error",
      messages: {
        default: paramMessage`HTTP verb already applied to ${"entityName"}`,
      },
    },
    "missing-uri-param": {
      severity: "error",
      messages: {
        default: paramMessage`Route reference parameter '${"param"}' but wasn't found in operation parameters`,
      },
    },
    "incompatible-uri-param": {
      severity: "error",
      messages: {
        default: paramMessage`Parameter '${"param"}' is defined in the uri as a ${"uriKind"} but is annotated as a ${"annotationKind"}.`,
      },
    },
    "use-uri-template": {
      severity: "error",
      messages: {
        default: paramMessage`Parameter '${"param"}' is already defined in the uri template. Explode, style and allowReserved property must be defined in the uri template as described by RFC 6570.`,
      },
    },

    "optional-needs-path-expansion": {
      severity: "error",
      messages: {
        default: paramMessage`Optional path parameter '${"paramName"}' must be declared with a leading '/' in the corresponding route path variable. For example, use '{/${"paramName"}}' instead of '{${"paramName"}}'.`,
      },
    },
    "missing-server-param": {
      severity: "error",
      messages: {
        default: paramMessage`Server url contains parameter '${"param"}' but wasn't found in given parameters`,
      },
    },
    "duplicate-body": {
      severity: "error",
      messages: {
        default: "Operation has multiple @body parameters declared",
        duplicateUnannotated:
          "Operation has multiple unannotated parameters. There can only be one representing the body",
        bodyAndUnannotated:
          "Operation has a @body and an unannotated parameter. There can only be one representing the body",
      },
    },
    "duplicate-route-decorator": {
      severity: "error",
      messages: {
        namespace: "@route was defined twice on this namespace and has different values.",
      },
    },
    "operation-param-duplicate-type": {
      severity: "error",
      messages: {
        default: paramMessage`Param ${"paramName"} has multiple types: [${"types"}]`,
      },
    },
    "duplicate-operation": {
      severity: "error",
      messages: {
        default: paramMessage`Duplicate operation "${"operationName"}" routed at "${"verb"} ${"path"}".`,
      },
    },
    "multiple-status-codes": {
      severity: "error",
      messages: {
        default: "Multiple `@statusCode` decorators defined for this operation response.",
      },
    },
    "status-code-invalid": {
      severity: "error",
      messages: {
        default:
          "statusCode value must be a numeric or string literal or union of numeric or string literals",
        value: "statusCode value must be a three digit code between 100 and 599",
      },
    },
    "content-type-string": {
      severity: "error",
      messages: {
        default: "contentType parameter must be a string literal or union of string literals",
      },
    },
    "content-type-ignored": {
      severity: "warning",
      messages: {
        default: "`Content-Type` header ignored because there is no body.",
      },
    },
    "metadata-ignored": {
      severity: "warning",
      messages: {
        default: paramMessage`${"kind"} property will be ignored as it is inside of a @body property. Use @bodyRoot instead if wanting to mix.`,
      },
    },
    "response-cookie-not-supported": {
      severity: "warning",
      messages: {
        default: paramMessage`@cookie on response is not supported. Property '${"propName"}' will be ignored in the body. If you need 'Set-Cookie', use @header instead.`,
      },
    },
    "no-service-found": {
      severity: "warning",
      messages: {
        default: paramMessage`No namespace with '@service' was found, but Namespace '${"namespace"}' contains routes. Did you mean to annotate this with '@service'?`,
      },
    },
    "invalid-type-for-auth": {
      severity: "error",
      messages: {
        default: paramMessage`@useAuth ${"kind"} only accept Auth model, Tuple of auth model or union of auth model.`,
      },
    },
    "shared-inconsistency": {
      severity: "error",
      messages: {
        default: paramMessage`Each operation routed at "${"verb"} ${"path"}" needs to have the @sharedRoute decorator.`,
      },
    },
    "multipart-invalid-content-type": {
      severity: "error",
      messages: {
        default: paramMessage`Content type '${"contentType"}' is not a multipart content type. Supported content types are: ${"supportedContentTypes"}.`,
      },
    },
    "multipart-model": {
      severity: "error",
      messages: {
        default: "Multipart request body must be a model or a tuple of http parts.",
      },
    },
    "no-implicit-multipart": {
      severity: "error",
      messages: {
        default:
          "Using multipart payloads requires the use of @multipartBody and HttpPart<T> models.",
      },
    },
    "multipart-part": {
      severity: "error",
      messages: {
        default: "Expect item to be an HttpPart model.",
      },
    },
    "multipart-nested": {
      severity: "error",
      messages: {
        default: "Cannot use @multipartBody inside of an HttpPart",
      },
    },
    "http-file-extra-property": {
      severity: "error",
      messages: {
        default: paramMessage`File model cannot define extra properties. Found '${"propName"}'.`,
      },
    },
    "http-file-disallowed-metadata": {
      severity: "error",
      messages: {
        default: paramMessage`File model cannot define HTTP metadata type '${"metadataType"}' on property '${"propName"}'.`,
      },
    },
    "formdata-no-part-name": {
      severity: "error",
      messages: {
        default: "Part used in multipart/form-data must have a name.",
      },
    },
    "http-file-structured": {
      severity: "warning",
      messages: {
        default: paramMessage`HTTP File body is serialized as a structured model in '${"contentTypes"}' instead of being treated as the contents of a file because an explicit Content-Type header is defined. Override the \`contentType\` property of the file model to declare the internal media type of the file's contents, or suppress this warning if you intend to serialize the File as a model.`,
        union:
          "An HTTP File in a union is serialized as a structured model instead of being treated as the contents of a file. Declare a separate operation using `@sharedRoute` that has only the File model as the body type to treat it as a file, or suppress this warning if you intend to serialize the File as a model.",
      },
    },
    "http-file-content-type-not-string": {
      severity: "error",
      messages: {
        default: paramMessage`The 'contentType' property of the file model must be 'TypeSpec.string', a string literal, or a union of string literals. Found '${"type"}'.`,
      },
    },
    "http-file-contents-not-scalar": {
      severity: "error",
      messages: {
        default: paramMessage`The 'contents' property of the file model must be a scalar type that extends 'string' or 'bytes'. Found '${"type"}'.`,
      },
    },
  },
  state: {
    authentication: { description: "State for the @auth decorator" },
    header: { description: "State for the @header decorator" },
    cookie: { description: "State for the @cookie decorator" },
    query: { description: "State for the @query decorator" },
    path: { description: "State for the @path decorator" },
    body: { description: "State for the @body decorator" },
    bodyRoot: { description: "State for the @bodyRoot decorator" },
    bodyIgnore: { description: "State for the @bodyIgnore decorator" },
    multipartBody: { description: "State for the @bodyIgnore decorator" },
    statusCode: { description: "State for the @statusCode decorator" },
    verbs: { description: "State for the verb decorators (@get, @post, @put, etc.)" },
    patchOptions: { description: "State for the options of the @patch decorator" },
    servers: { description: "State for the @server decorator" },
    includeInapplicableMetadataInPayload: {
      description: "State for the @includeInapplicableMetadataInPayload decorator",
    },

    // route.ts
    externalInterfaces: {},
    routeProducer: {},
    routes: {},
    sharedRoutes: { description: "State for the @sharedRoute decorator" },
    routeOptions: {},

    // private
    file: { description: "State for the @Private.file decorator" },
    httpPart: { description: "State for the @Private.httpPart decorator" },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: HttpStateKeys } = $lib;
