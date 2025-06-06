import type { JSONSchemaType as AjvJSONSchemaType } from "ajv";
import type { ModuleResolutionResult } from "../module-resolver/module-resolver.js";
import type { YamlPathTarget, YamlScript } from "../yaml/types.js";
import type { Numeric } from "./numeric.js";
import type { Program } from "./program.js";
import type { TokenFlags } from "./scanner.js";

// prettier-ignore
export type MarshalledValue<Value>  = 
Value extends StringValue ? string
  : Value extends NumericValue ? number | Numeric
  : Value extends BooleanValue ? boolean
  : Value extends ObjectValue ? Record<string, unknown>
  : Value extends ArrayValue ? unknown[]
  : Value extends EnumValue ? EnumMember
  : Value extends NullValue ? null
  : Value extends ScalarValue ? Value
  : Value

/**
 * Type System types
 */

export type DecoratorArgumentValue = Type | number | string | boolean;

export interface DecoratorArgument {
  value: Type | Value;
  /**
   * Marshalled value for use in Javascript.
   */
  jsValue:
    | Type
    | Value
    | Record<string, unknown>
    | unknown[]
    | string
    | number
    | boolean
    | Numeric
    | null;
  node?: Node;
}

export interface DecoratorApplication {
  definition?: Decorator;
  decorator: DecoratorFunction;
  args: DecoratorArgument[];
  node?: DecoratorExpressionNode | AugmentDecoratorStatementNode;
}

export interface DecoratorFunction {
  (program: DecoratorContext, target: any, ...customArgs: any[]): void;
  namespace?: string;
}

export interface BaseType {
  readonly entityKind: "Type";
  kind: string;
  /** Node used to construct this type. If the node is undefined it means the type was dynamically built. With typekit for example. */
  node?: Node;
  instantiationParameters?: Type[];

  /**
   * Reflect if a type has been finished(Decorators have been called).
   * There is multiple reasons a type might not be finished:
   * - a template declaration will not
   * - a template instance that argument that are still template parameters
   * - a template instance that is only partially instantiated(like a templated operation inside a templated interface)
   */
  isFinished: boolean;
}

export interface DecoratedType {
  decorators: DecoratorApplication[];
}

/**
 * Union of all the types that implement TemplatedTypeBase
 */
export type TemplatedType = Model | Operation | Interface | Union | Scalar;

export interface TypeMapper {
  partial: boolean;
  getMappedType(type: TemplateParameter): Type | Value | IndeterminateEntity;
  args: readonly (Type | Value | IndeterminateEntity)[];
  /** @internal Node used to create this type mapper. */
  readonly source: {
    readonly node: Node;
    readonly mapper: TypeMapper | undefined;
  };
  /** @internal */
  map: Map<TemplateParameter, Type | Value | IndeterminateEntity>;
}

export interface TemplatedTypeBase {
  templateMapper?: TypeMapper;
  templateNode?: Node;
}

/**
 * Represent every single entity that are part of the TypeSpec program. Those are composed of different elements:
 * - Types
 * - Values
 * - Value Constraints
 */
export type Entity = Type | Value | MixedParameterConstraint | IndeterminateEntity;

export type Type =
  | BooleanLiteral
  | Decorator
  | Enum
  | EnumMember
  | FunctionParameter
  | Interface
  | IntrinsicType
  | Model
  | ModelProperty
  | Namespace
  | NumericLiteral
  | Operation
  | Scalar
  | ScalarConstructor
  | StringLiteral
  | StringTemplate
  | StringTemplateSpan
  | TemplateParameter
  | Tuple
  | Union
  | UnionVariant;

export type StdTypes = {
  // Models
  Array: Model;
  Record: Model;
} & Record<IntrinsicScalarName, Scalar>;
export type StdTypeName = keyof StdTypes;

export interface ObjectType extends BaseType {
  kind: "Object";
  properties: Record<string, Type>;
}

export interface MixedParameterConstraint {
  readonly entityKind: "MixedParameterConstraint";
  readonly node?: UnionExpressionNode | Expression;

  /** Type constraints */
  readonly type?: Type;

  /** Expecting value */
  readonly valueType?: Type;
}

/** When an entity that could be used as a type or value has not figured out if it is a value or type yet. */
export interface IndeterminateEntity {
  readonly entityKind: "Indeterminate";
  readonly type:
    | StringLiteral
    | StringTemplate
    | NumericLiteral
    | BooleanLiteral
    | EnumMember
    | UnionVariant
    | NullType;
}

export interface IntrinsicType extends BaseType {
  kind: "Intrinsic";
  name: "ErrorType" | "void" | "never" | "unknown" | "null";
}

export interface ErrorType extends IntrinsicType {
  name: "ErrorType";
}

export interface VoidType extends IntrinsicType {
  name: "void";
}

export interface NeverType extends IntrinsicType {
  name: "never";
}

export interface UnknownType extends IntrinsicType {
  name: "unknown";
}
export interface NullType extends IntrinsicType {
  name: "null";
}

export type IntrinsicScalarName =
  | "bytes"
  | "numeric"
  | "integer"
  | "float"
  | "int64"
  | "int32"
  | "int16"
  | "int8"
  | "uint64"
  | "uint32"
  | "uint16"
  | "uint8"
  | "safeint"
  | "float32"
  | "float64"
  | "decimal"
  | "decimal128"
  | "string"
  | "plainDate"
  | "plainTime"
  | "utcDateTime"
  | "offsetDateTime"
  | "duration"
  | "boolean"
  | "url";

export type NeverIndexer = {
  readonly key: NeverType;
  readonly value: undefined;
};

export type ModelIndexer = {
  readonly key: Scalar;
  readonly value: Type;
};

export interface ArrayModelType extends Model {
  indexer: { key: Scalar; value: Type };
}

export interface RecordModelType extends Model {
  indexer: { key: Scalar; value: Type };
}

export interface Model extends BaseType, DecoratedType, TemplatedTypeBase {
  kind: "Model";
  name: string;
  node?: ModelStatementNode | ModelExpressionNode | IntersectionExpressionNode | ObjectLiteralNode;
  namespace?: Namespace;
  indexer?: ModelIndexer;

  /**
   * The properties of the model.
   *
   * Properties are ordered in the order that they appear in source.
   * Properties obtained via `model is` appear before properties defined in
   * the model body. Properties obtained via `...` are inserted where the
   * spread appears in source.
   *
   * Properties inherited via `model extends` are not included. Use
   * {@link walkPropertiesInherited} to enumerate all properties in the
   * inheritance hierarchy.
   */
  properties: RekeyableMap<string, ModelProperty>;

  /**
   * Model this model extends. This represent inheritance.
   */
  baseModel?: Model;

  /**
   * Direct children. This is the reverse relation of {@link baseModel}
   */
  derivedModels: Model[];

  /**
   * The model that is referenced via `model is`.
   */
  sourceModel?: Model;

  /**
   * Models that were used to build this model. This include any model referenced in `model is`, `...` or when intersecting models.
   */
  sourceModels: SourceModel[];

  /**
   * Late-bound symbol of this model type.
   * @internal
   */
  symbol?: Sym;
}

export interface SourceModel {
  /**
   * How was this model used.
   * - is: `model A is B`
   * - spread: `model A {...B}`
   * - intersection: `alias A = B & C`
   */
  readonly usage: "is" | "spread" | "intersection";
  /** Source model */
  readonly model: Model;
}

export interface ModelProperty extends BaseType, DecoratedType {
  kind: "ModelProperty";
  node?: ModelPropertyNode | ModelSpreadPropertyNode | ObjectLiteralPropertyNode;
  name: string;
  type: Type;
  // when spread or intersection operators make new property types,
  // this tracks the property we copied from.
  sourceProperty?: ModelProperty;
  optional: boolean;
  defaultValue?: Value;
  model?: Model;
}

//#region Values
export type Value =
  | ScalarValue
  | NumericValue
  | StringValue
  | BooleanValue
  | ObjectValue
  | ArrayValue
  | EnumValue
  | NullValue;

interface BaseValue {
  readonly entityKind: "Value";
  readonly valueKind: string;
  /**
   * Represent the storage type of a value.
   * @example
   * ```tsp
   * const a = "hello"; // Type here would be "hello"
   * const b: string = a;  // Type here would be string
   * const c: string | int32 = b; // Type here would be string | int32
   * ```
   */
  type: Type;
}

export interface ObjectValue extends BaseValue {
  valueKind: "ObjectValue";
  node?: ObjectLiteralNode;
  properties: Map<string, ObjectValuePropertyDescriptor>;
}

export interface ObjectValuePropertyDescriptor {
  node?: ObjectLiteralPropertyNode;
  name: string;
  value: Value;
}

export interface ArrayValue extends BaseValue {
  valueKind: "ArrayValue";
  node?: ArrayLiteralNode;
  values: Value[];
}

export interface ScalarValue extends BaseValue {
  valueKind: "ScalarValue";
  scalar: Scalar;
  value: { name: string; args: Value[] };
}

export interface NumericValue extends BaseValue {
  valueKind: "NumericValue";
  scalar: Scalar | undefined;
  value: Numeric;
}
export interface StringValue extends BaseValue {
  valueKind: "StringValue";
  scalar: Scalar | undefined;
  value: string;
}
export interface BooleanValue extends BaseValue {
  valueKind: "BooleanValue";
  scalar: Scalar | undefined;
  value: boolean;
}
export interface EnumValue extends BaseValue {
  valueKind: "EnumValue";
  value: EnumMember;
}
export interface NullValue extends BaseValue {
  valueKind: "NullValue";
  value: null;
}

//#endregion Values

export interface Scalar extends BaseType, DecoratedType, TemplatedTypeBase {
  kind: "Scalar";
  name: string;
  node?: ScalarStatementNode;
  /**
   * Namespace the scalar was defined in.
   */
  namespace?: Namespace;

  /**
   * Scalar this scalar extends.
   */
  baseScalar?: Scalar;

  /**
   * Direct children. This is the reverse relation of @see baseScalar
   */
  derivedScalars: Scalar[];

  constructors: Map<string, ScalarConstructor>;
  /**
   * Late-bound symbol of this scalar type.
   * @internal
   */
  symbol?: Sym;
}

export interface ScalarConstructor extends BaseType {
  kind: "ScalarConstructor";
  node?: ScalarConstructorNode;
  name: string;
  scalar: Scalar;
  parameters: SignatureFunctionParameter[];
}

export interface Interface extends BaseType, DecoratedType, TemplatedTypeBase {
  kind: "Interface";
  name: string;
  node?: InterfaceStatementNode;
  namespace?: Namespace;

  /**
   * The interfaces that provide additional operations via `interface extends`.
   *
   * Note that despite the same `extends` keyword in source form, this is a
   * different semantic relationship than the one from {@link Model} to
   * {@link Model.baseModel}. Operations from extended interfaces are copied
   * into {@link Interface.operations}.
   */
  sourceInterfaces: Interface[];

  /**
   * The operations of the interface.
   *
   * Operations are ordered in the order that they appear in the source.
   * Operations obtained via `interface extends` appear before operations
   * declared in the interface body.
   */
  operations: RekeyableMap<string, Operation>;

  /**
   * Late-bound symbol of this interface type.
   * @internal
   */
  symbol?: Sym;
}

export interface Enum extends BaseType, DecoratedType {
  kind: "Enum";
  name: string;
  node?: EnumStatementNode;
  namespace?: Namespace;

  /**
   * The members of the enum.
   *
   * Members are ordered in the order that they appear in source. Members
   * obtained via `...` are inserted where the spread appears in source.
   */
  members: RekeyableMap<string, EnumMember>;

  /**
   * Late-bound symbol of this enum type.
   * @internal
   */
  symbol?: Sym;
}

export interface EnumMember extends BaseType, DecoratedType {
  kind: "EnumMember";
  name: string;
  enum: Enum;
  node?: EnumMemberNode;
  value?: string | number;
  /**
   * when spread operators make new enum members,
   * this tracks the enum member we copied from.
   */
  sourceMember?: EnumMember;
}

export interface Operation extends BaseType, DecoratedType, TemplatedTypeBase {
  kind: "Operation";
  node?: OperationStatementNode;
  name: string;
  namespace?: Namespace;
  interface?: Interface;
  parameters: Model;
  returnType: Type;

  /**
   * The operation that is referenced via `op is`.
   */
  sourceOperation?: Operation;
}

export interface Namespace extends BaseType, DecoratedType {
  kind: "Namespace";
  name: string;
  namespace?: Namespace;
  node?: NamespaceStatementNode | JsNamespaceDeclarationNode;

  /**
   * The models in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  models: Map<string, Model>;

  /**
   * The scalars in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  scalars: Map<string, Scalar>;

  /**
   * The operations in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  operations: Map<string, Operation>;

  /**
   * The sub-namespaces in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  namespaces: Map<string, Namespace>;

  /**
   * The interfaces in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  interfaces: Map<string, Interface>;

  /**
   * The enums in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  enums: Map<string, Enum>;

  /**
   * The unions in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  unions: Map<string, Union>;

  /**
   * The decorators declared in the namespace.
   *
   * Order is implementation-defined and may change.
   */
  decoratorDeclarations: Map<string, Decorator>;
}

export type LiteralType = StringLiteral | NumericLiteral | BooleanLiteral;

export interface StringLiteral extends BaseType {
  kind: "String";
  node?: StringLiteralNode;
  value: string;
}

export interface NumericLiteral extends BaseType {
  kind: "Number";
  node?: NumericLiteralNode;
  value: number;
  numericValue: Numeric;
  valueAsString: string;
}

export interface BooleanLiteral extends BaseType {
  kind: "Boolean";
  node?: BooleanLiteralNode;
  value: boolean;
}

export interface StringTemplate extends BaseType {
  kind: "StringTemplate";
  /** If the template can be render as as string this is the string value */
  stringValue?: string;
  node?: StringTemplateExpressionNode;
  spans: StringTemplateSpan[];
}

export type StringTemplateSpan = StringTemplateSpanLiteral | StringTemplateSpanValue;

export interface StringTemplateSpanLiteral extends BaseType {
  kind: "StringTemplateSpan";
  node?: StringTemplateHeadNode | StringTemplateMiddleNode | StringTemplateTailNode;
  isInterpolated: false;
  type: StringLiteral;
}

export interface StringTemplateSpanValue extends BaseType {
  kind: "StringTemplateSpan";
  node?: Expression;
  isInterpolated: true;
  type: Type;
}

export interface Tuple extends BaseType {
  kind: "Tuple";
  node?: TupleExpressionNode | ArrayLiteralNode;
  values: Type[];
}

export interface Union extends BaseType, DecoratedType, TemplatedTypeBase {
  kind: "Union";
  name?: string;
  node?: UnionExpressionNode | UnionStatementNode;
  namespace?: Namespace;

  /**
   * The variants of the union.
   *
   * Variants are ordered in order that they appear in source.
   */
  variants: RekeyableMap<string | symbol, UnionVariant>;

  expression: boolean;

  /**
   * Late-bound symbol of this interface type.
   * @internal
   */
  symbol?: Sym;
}

export interface UnionVariant extends BaseType, DecoratedType {
  kind: "UnionVariant";
  name: string | symbol;
  node?: UnionVariantNode | undefined;
  type: Type;
  union: Union;
}

export interface TemplateParameter extends BaseType {
  kind: "TemplateParameter";
  node: TemplateParameterDeclarationNode;
  constraint?: MixedParameterConstraint;
  default?: Type | Value | IndeterminateEntity;
}

export interface Decorator extends BaseType {
  kind: "Decorator";
  node?: DecoratorDeclarationStatementNode;
  name: `@${string}`;
  namespace: Namespace;
  target: MixedFunctionParameter;
  parameters: MixedFunctionParameter[];
  implementation: (...args: unknown[]) => void;
}

export interface FunctionParameterBase extends BaseType {
  kind: "FunctionParameter";
  node?: FunctionParameterNode;
  name: string;
  optional: boolean;
  rest: boolean;
}

/** Represent a function parameter that could accept types or values in the TypeSpec program. */
export interface MixedFunctionParameter extends FunctionParameterBase {
  mixed: true;
  type: MixedParameterConstraint;
}
/** Represent a function parameter that represent the parameter signature(i.e the type would be the type of the value passed) */
export interface SignatureFunctionParameter extends FunctionParameterBase {
  mixed: false;
  type: Type;
}
export type FunctionParameter = MixedFunctionParameter | SignatureFunctionParameter;

export interface Sym {
  readonly flags: SymbolFlags;

  /**
   * Nodes which contribute to this declaration, present if SymbolFlags.Declaration is set.
   */
  readonly declarations: readonly Node[];

  /**
   * Node which resulted in this symbol, present if SymbolFlags.Declaration is not set.
   */
  readonly node: Node;

  /**
   * The name of the symbol
   */
  readonly name: string;

  /**
   * A unique identifier for this symbol. Used to look up the symbol links.
   */
  readonly id?: number;

  /**
   * The symbol containing this symbol, if any. E.g. for things declared in
   * a namespace, this refers to the namespace.
   */
  readonly parent?: Sym;

  /**
   * Externally visible symbols contained inside this symbol. E.g. all declarations
   * in a namespace, or members of an enum.
   */
  readonly exports?: SymbolTable;

  /**
   * Symbols for members of this symbol which must be referenced off the parent symbol
   * and cannot be referenced by other means (i.e. by unqualified lookup of the symbol
   * name).
   */
  readonly members?: SymbolTable;

  /**
   * Symbol table
   */
  readonly metatypeMembers?: SymbolTable;

  /**
   * For using symbols, this is the used symbol.
   */
  readonly symbolSource?: Sym;

  /**
   * For late-bound symbols, this is the type referenced by the symbol.
   */
  readonly type?: Type;

  /**
   * For decorator and function symbols, this is the JS function implementation.
   */
  readonly value?: (...args: any[]) => any;
}

export interface SymbolLinks {
  type?: Type;

  /** For types that can be instanitated this is the type of the declaration */
  declaredType?: Type;
  /** For types that can be instanitated those are the types per instantiation */
  instantiations?: TypeInstantiationMap;

  /** For const statements the value of the const */
  value?: Value | null;

  /**
   * When a symbol contains unknown members, symbol lookup during
   * name resolution should always return unknown if it can't definitely
   * find a member.
   */
  hasUnknownMembers?: boolean;

  /**
   * True if we have completed the early binding of member symbols for this model during
   * the name resolution phase.
   */
  membersBound?: boolean;

  /**
   * The symbol aliased by an alias symbol. When present, guaranteed to be a
   * non-alias symbol. Will not be present when the name resolver could not
   * determine a symbol for the alias, e.g. when it is a computed type.
   */
  aliasedSymbol?: Sym;

  /**
   * The result of resolving the aliased reference. When resolved, aliasedSymbol
   * will contain the resolved symbol. Otherwise, aliasedSymbol may be present
   * if the alias is a type literal with a symbol, otherwise it will be
   * undefined.
   */
  aliasResolutionResult?: ResolutionResultFlags;

  // TODO: any better idea?
  aliasResolutionIsTemplate?: boolean;

  /**
   * The symbol for the constraint of a type parameter. Will not be present when
   * the name resolver could not determine a symbol for the constraint, e.g.
   * when it is a computed type.
   */
  constraintSymbol?: Sym;

  /**
   * The result of resolving the type parameter constraint. When resolved,
   * constraintSymbol will contain the resolved symbol. Otherwise,
   * constraintSymbol may be present if the constraint is a type literal with a
   * symbol, otherwise it will be undefined.
   */
  constraintResolutionResult?: ResolutionResultFlags;
}

export interface ResolutionResult {
  resolutionResult: ResolutionResultFlags;
  isTemplateInstantiation?: boolean;
  resolvedSymbol: Sym | undefined;
  finalSymbol: Sym | undefined;
  ambiguousSymbols?: Sym[];
}

export interface NodeLinks {
  /** the result of type checking this node */
  resolvedType?: Type;

  /**The syntax symbol resolved by this node. */
  resolvedSymbol?: Sym;

  /** If the resolvedSymbol is an alias point to the symbol the alias reference(recursively), otherwise is the same as resolvedSymbol */
  finalSymbol?: Sym | undefined;

  /**
   * If the link involve template argument.
   * Note that this only catch if template arguments are used. If referencing the default instance(e.g Foo for Foo<string = "abc">) this will not be set to true.
   * This is by design as the symbol reference has different meaning depending on the context:
   * - For augment decorator it would reference the template declaration
   * - For type references it would reference the default instance.
   */
  isTemplateInstantiation?: boolean;

  /**
   * The result of resolution of this reference node.
   *
   * When the the result is `Resolved`, `resolvedSymbol` contains the result.
   **/
  resolutionResult?: ResolutionResultFlags;

  /** If the resolution result is Ambiguous list of symbols that are */
  ambiguousSymbols?: Sym[];
}

export enum ResolutionResultFlags {
  None = 0,
  Resolved = 1 << 1,
  Unknown = 1 << 2,
  Ambiguous = 1 << 3,
  NotFound = 1 << 4,

  ResolutionFailed = Unknown | Ambiguous | NotFound,
}

/**
 * @hidden bug in typedoc
 */
export interface SymbolTable extends ReadonlyMap<string, Sym> {
  /**
   * Duplicate
   */
  readonly duplicates: ReadonlyMap<Sym, ReadonlySet<Sym>>;
}

export interface MutableSymbolTable extends SymbolTable {
  set(key: string, value: Sym): void;

  /**
   * Put the symbols in the source table into this table.
   * @param source table to copy
   * @param parentSym Parent symbol that the source symbol should update to.
   */
  include(source: SymbolTable, parentSym?: Sym): void;
}

// prettier-ignore
export const enum SymbolFlags {
  None                  = 0,
  Model                 = 1 << 1,
  Scalar                = 1 << 2,
  Operation             = 1 << 3,
  Enum                  = 1 << 4,
  Interface             = 1 << 5,
  Union                 = 1 << 6,
  Alias                 = 1 << 7,
  Namespace             = 1 << 8,
  Decorator             = 1 << 9,
  TemplateParameter     = 1 << 10,
  Function              = 1 << 11,
  FunctionParameter     = 1 << 12,
  Using                 = 1 << 13,
  DuplicateUsing        = 1 << 14,
  SourceFile            = 1 << 15,
  Member                = 1 << 16,
  Const                 = 1 << 17,


  /**
   * A symbol which represents a declaration. Such symbols will have at least
   * one entry in the `declarations[]` array referring to a node with an `id`.
   * 
   * Symbols which do not represent declarations 
   */
  Declaration           = 1 << 20,

  Implementation        = 1 << 21,
  
  /**
   * A symbol which was late-bound, in which case, the type referred to
   * by this symbol is stored directly in the symbol.
   */
  LateBound = 1 << 22,

  ExportContainer = Namespace | SourceFile,
  /**
   * Symbols whose members will be late bound (and stored on the type)
   */
  MemberContainer = Model | Enum | Union | Interface | Scalar,
}

/**
 * Maps type arguments to instantiated type.
 */
export interface TypeInstantiationMap {
  get(args: readonly (Type | Value | IndeterminateEntity)[]): Type | undefined;
  set(args: readonly (Type | Value | IndeterminateEntity)[], type: Type): void;
}

/**
 * A map where keys can be changed without changing enumeration order.
 * @hidden bug in typedoc
 */
export interface RekeyableMap<K, V> extends Map<K, V> {
  /**
   * Change the given key without impacting enumeration order.
   *
   * @param existingKey Existing key
   * @param newKey New key
   * @returns boolean if updated successfully.
   */
  rekey(existingKey: K, newKey: K): boolean;
}

/**
 * AST types
 */
export enum SyntaxKind {
  TypeSpecScript,
  JsSourceFile,
  ImportStatement,
  Identifier,
  AugmentDecoratorStatement,
  DecoratorExpression,
  DirectiveExpression,
  MemberExpression,
  NamespaceStatement,
  UsingStatement,
  OperationStatement,
  OperationSignatureDeclaration,
  OperationSignatureReference,
  ModelStatement,
  ModelExpression,
  ModelProperty,
  ModelSpreadProperty,
  ScalarStatement,
  InterfaceStatement,
  UnionStatement,
  UnionVariant,
  EnumStatement,
  EnumMember,
  EnumSpreadMember,
  AliasStatement,
  DecoratorDeclarationStatement,
  FunctionDeclarationStatement,
  FunctionParameter,
  UnionExpression,
  IntersectionExpression,
  TupleExpression,
  ArrayExpression,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  StringTemplateExpression,
  StringTemplateHead,
  StringTemplateMiddle,
  StringTemplateTail,
  StringTemplateSpan,
  ExternKeyword,
  VoidKeyword,
  NeverKeyword,
  UnknownKeyword,
  ValueOfExpression,
  TypeReference,
  TemplateParameterDeclaration,
  EmptyStatement,
  InvalidStatement,
  LineComment,
  BlockComment,
  Doc,
  DocText,
  DocParamTag,
  DocPropTag,
  DocReturnsTag,
  DocErrorsTag,
  DocTemplateTag,
  DocUnknownTag,
  Return,
  JsNamespaceDeclaration,
  TemplateArgument,
  TypeOfExpression,
  ObjectLiteral,
  ObjectLiteralProperty,
  ObjectLiteralSpreadProperty,
  ArrayLiteral,
  ConstStatement,
  CallExpression,
  ScalarConstructor,
}

export const enum NodeFlags {
  None = 0,
  /**
   * If this is set, the DescendantHasError bit can be trusted. If this not set,
   * children need to be visited still to see if DescendantHasError should be
   * set.
   *
   * Use the parser's `hasParseError` API instead of using this flag directly.
   */
  DescendantErrorsExamined = 1 << 0,

  /**
   * Indicates that a parse error was associated with this specific node.
   *
   * Use the parser's `hasParseError` API instead of using this flag directly.
   */
  ThisNodeHasError = 1 << 1,

  /**
   * Indicates that a child of this node (or one of its children,
   * transitively) has a parse error.
   *
   * Use the parser's `hasParseError` API instead of using this flag directly.
   */
  DescendantHasError = 1 << 2,

  /**
   * Indicates that a node was created synthetically and therefore may not be parented.
   */
  Synthetic = 1 << 3,
}

export interface BaseNode extends TextRange {
  readonly kind: SyntaxKind;
  readonly parent?: Node;
  readonly directives?: readonly DirectiveExpressionNode[];
  readonly docs?: readonly DocNode[];
  readonly flags: NodeFlags;
  /**
   * Could be undefined but making this optional creates a lot of noise. In practice,
   * you will likely only access symbol in cases where you know the node has a symbol.
   * @internal
   */
  readonly symbol: Sym;
  /** Unique id across the process used to look up NodeLinks */
  _id?: number;
}

export interface TemplateDeclarationNode {
  readonly templateParameters: readonly TemplateParameterDeclarationNode[];
  readonly templateParametersRange: TextRange;
  readonly locals?: SymbolTable;
}

/**
 * owner node and other related information according to the position
 */
export interface PositionDetail {
  readonly node: Node | undefined;
  readonly position: number;
  readonly char: number;
  readonly preChar: number;
  readonly nextChar: number;
  readonly inTrivia: boolean;

  /**
   * if the position is in a trivia, return the start position of the trivia containing the position
   * if the position is not a trivia, return the start position of the trivia before the text(identifier code) containing the position
   *
   * Please be aware that this may not be the pre node in the tree because some non-trivia char is ignored in the tree but will counted here
   *
   * also comments are considered as trivia
   */
  readonly triviaStartPosition: number;
  /**
   * if the position is in a trivia, return the end position (exclude as other 'end' means) of the trivia containing the position
   * if the position is not a trivia, return the end position (exclude as other 'end' means) of the trivia after the node containing the position
   *
   * Please be aware that this may not be the next node in the tree because some non-trivia char is ignored in the tree but will considered here
   *
   * also comments are considered as trivia
   */
  readonly triviaEndPosition: number;
  /** get the PositionDetail of positionBeforeTrivia */
  readonly getPositionDetailBeforeTrivia: () => PositionDetail;
  /** get the PositionDetail of positionAfterTrivia */
  readonly getPositionDetailAfterTrivia: () => PositionDetail;
}

export type Node =
  | TypeSpecScriptNode
  | JsSourceFileNode
  | JsNamespaceDeclarationNode
  | TemplateArgumentNode
  | TemplateParameterDeclarationNode
  | ModelPropertyNode
  | UnionVariantNode
  | OperationStatementNode
  | OperationSignatureDeclarationNode
  | OperationSignatureReferenceNode
  | EnumMemberNode
  | EnumSpreadMemberNode
  | ModelSpreadPropertyNode
  | DecoratorExpressionNode
  | DirectiveExpressionNode
  | Statement
  | Expression
  | FunctionParameterNode
  | StringTemplateSpanNode
  | StringTemplateHeadNode
  | StringTemplateMiddleNode
  | StringTemplateTailNode
  | Modifier
  | DocNode
  | DocContent
  | DocTag
  | ReferenceExpression
  | ObjectLiteralNode
  | ObjectLiteralPropertyNode
  | ObjectLiteralSpreadPropertyNode
  | ScalarConstructorNode
  | ArrayLiteralNode;

/**
 * Node that can be used as template
 */
export type TemplateableNode =
  | ModelStatementNode
  | ScalarStatementNode
  | AliasStatementNode
  | InterfaceStatementNode
  | OperationStatementNode
  | UnionStatementNode;

/**
 * Node types that can have referencable members
 */
export type MemberContainerNode =
  | ModelStatementNode
  | ModelExpressionNode
  | InterfaceStatementNode
  | EnumStatementNode
  | UnionStatementNode
  | IntersectionExpressionNode
  | ScalarStatementNode;

export type MemberNode =
  | ModelPropertyNode
  | EnumMemberNode
  | OperationStatementNode
  | UnionVariantNode
  | ScalarConstructorNode;

export type MemberContainerType = Model | Enum | Interface | Union | Scalar;

/**
 * Type that can be used as members of a container type.
 */
export type MemberType = ModelProperty | EnumMember | Operation | UnionVariant | ScalarConstructor;

export type Comment = LineComment | BlockComment;

export interface LineComment extends TextRange {
  readonly kind: SyntaxKind.LineComment;
}
export interface BlockComment extends TextRange {
  readonly kind: SyntaxKind.BlockComment;
  /** If that comment was parsed as a doc comment. If parserOptions.docs=false this will always be false. */
  readonly parsedAsDocs?: boolean;
}

export interface ParseOptions {
  /** When true, collect comment ranges in {@link TypeSpecScriptNode.comments}. */
  readonly comments?: boolean;
  /** When true, parse doc comments into {@link Node.docs}. */
  readonly docs?: boolean;
}

export interface TypeSpecScriptNode extends DeclarationNode, BaseNode {
  readonly kind: SyntaxKind.TypeSpecScript;
  readonly statements: readonly Statement[];
  readonly file: SourceFile;
  readonly inScopeNamespaces: readonly NamespaceStatementNode[]; // namespaces that declarations in this file belong to
  readonly namespaces: NamespaceStatementNode[]; // list of namespaces in this file (initialized during binding)
  readonly usings: readonly UsingStatementNode[];
  readonly comments: readonly Comment[];
  readonly parseDiagnostics: readonly Diagnostic[];
  readonly printable: boolean; // If this ast tree can safely be printed/formatted.
  readonly locals: SymbolTable;
  readonly parseOptions: ParseOptions; // Options used to parse this file
}

export type Statement =
  | ImportStatementNode
  | ModelStatementNode
  | ScalarStatementNode
  | NamespaceStatementNode
  | InterfaceStatementNode
  | UnionStatementNode
  | UsingStatementNode
  | EnumStatementNode
  | AliasStatementNode
  | OperationStatementNode
  | DecoratorDeclarationStatementNode
  | FunctionDeclarationStatementNode
  | AugmentDecoratorStatementNode
  | ConstStatementNode
  | CallExpressionNode
  | EmptyStatementNode
  | InvalidStatementNode;

export interface DeclarationNode {
  readonly id: IdentifierNode;
}

export type Declaration =
  | ModelStatementNode
  | ScalarStatementNode
  | InterfaceStatementNode
  | UnionStatementNode
  | NamespaceStatementNode
  | OperationStatementNode
  | TemplateParameterDeclarationNode
  | EnumStatementNode
  | AliasStatementNode
  | ConstStatementNode
  | DecoratorDeclarationStatementNode
  | FunctionDeclarationStatementNode;

export type ScopeNode =
  | NamespaceStatementNode
  | ModelStatementNode
  | InterfaceStatementNode
  | AliasStatementNode
  | TypeSpecScriptNode
  | JsSourceFileNode;

export interface ImportStatementNode extends BaseNode {
  readonly kind: SyntaxKind.ImportStatement;
  readonly path: StringLiteralNode;
  readonly parent?: TypeSpecScriptNode;
}

export interface IdentifierNode extends BaseNode {
  readonly kind: SyntaxKind.Identifier;
  readonly sv: string;
}

export interface DecoratorExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.DecoratorExpression;
  readonly target: IdentifierNode | MemberExpressionNode;
  readonly arguments: readonly Expression[];
}

export interface AugmentDecoratorStatementNode extends BaseNode {
  readonly kind: SyntaxKind.AugmentDecoratorStatement;
  readonly target: IdentifierNode | MemberExpressionNode;
  readonly targetType: TypeReferenceNode;
  readonly arguments: readonly Expression[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface DirectiveExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.DirectiveExpression;
  readonly target: IdentifierNode;
  readonly arguments: readonly DirectiveArgument[];
}

export type DirectiveArgument = StringLiteralNode | IdentifierNode;

export type Expression =
  | ArrayExpressionNode
  | MemberExpressionNode
  | ModelExpressionNode
  | ObjectLiteralNode
  | ArrayLiteralNode
  | TupleExpressionNode
  | UnionExpressionNode
  | IntersectionExpressionNode
  | TypeReferenceNode
  | ValueOfExpressionNode
  | TypeOfExpressionNode
  | CallExpressionNode
  | StringLiteralNode
  | NumericLiteralNode
  | BooleanLiteralNode
  | StringTemplateExpressionNode
  | VoidKeywordNode
  | NeverKeywordNode
  | AnyKeywordNode;

export type ReferenceExpression =
  | TypeReferenceNode
  | MemberExpressionNode
  | IdentifierNode
  | VoidKeywordNode
  | NeverKeywordNode;

export interface MemberExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.MemberExpression;
  readonly id: IdentifierNode;
  readonly base: MemberExpressionNode | IdentifierNode;
  readonly selector: "." | "::";
}

export interface NamespaceStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.NamespaceStatement;
  readonly statements?: readonly Statement[] | NamespaceStatementNode;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly locals?: SymbolTable;
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface UsingStatementNode extends BaseNode {
  readonly kind: SyntaxKind.UsingStatement;
  readonly name: IdentifierNode | MemberExpressionNode;
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface OperationSignatureDeclarationNode extends BaseNode {
  readonly kind: SyntaxKind.OperationSignatureDeclaration;
  readonly parameters: ModelExpressionNode;
  readonly returnType: Expression;
}

export interface OperationSignatureReferenceNode extends BaseNode {
  readonly kind: SyntaxKind.OperationSignatureReference;
  readonly baseOperation: TypeReferenceNode;
}

export type OperationSignature =
  | OperationSignatureDeclarationNode
  | OperationSignatureReferenceNode;

export interface OperationStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.OperationStatement;
  readonly signature: OperationSignature;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode | InterfaceStatementNode;
}

export interface ModelStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.ModelStatement;
  readonly properties: readonly (ModelPropertyNode | ModelSpreadPropertyNode)[];
  readonly bodyRange: TextRange;
  readonly extends?: Expression;
  readonly is?: Expression;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface ScalarStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.ScalarStatement;
  readonly extends?: TypeReferenceNode;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly members: readonly ScalarConstructorNode[];
  readonly bodyRange: TextRange;
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface ScalarConstructorNode extends BaseNode {
  readonly kind: SyntaxKind.ScalarConstructor;
  readonly id: IdentifierNode;
  readonly parameters: FunctionParameterNode[];
  readonly parent?: ScalarStatementNode;
}

export interface InterfaceStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.InterfaceStatement;
  readonly operations: readonly OperationStatementNode[];
  readonly bodyRange: TextRange;
  readonly extends: readonly TypeReferenceNode[];
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface UnionStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.UnionStatement;
  readonly options: readonly UnionVariantNode[];
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface UnionVariantNode extends BaseNode {
  readonly kind: SyntaxKind.UnionVariant;
  readonly id?: IdentifierNode;
  readonly value: Expression;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: UnionStatementNode;
}

export interface EnumStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.EnumStatement;
  readonly members: readonly (EnumMemberNode | EnumSpreadMemberNode)[];
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface EnumMemberNode extends BaseNode {
  readonly kind: SyntaxKind.EnumMember;
  readonly id: IdentifierNode;
  readonly value?: StringLiteralNode | NumericLiteralNode;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly parent?: EnumStatementNode;
}

export interface EnumSpreadMemberNode extends BaseNode {
  readonly kind: SyntaxKind.EnumSpreadMember;
  readonly target: TypeReferenceNode;
}

export interface AliasStatementNode extends BaseNode, DeclarationNode, TemplateDeclarationNode {
  readonly kind: SyntaxKind.AliasStatement;
  readonly value: Expression;
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface ConstStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.ConstStatement;
  readonly value: Expression;
  readonly type?: Expression;
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}
export interface CallExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.CallExpression;
  readonly target: MemberExpressionNode | IdentifierNode;
  readonly arguments: Expression[];
}

export interface InvalidStatementNode extends BaseNode {
  readonly kind: SyntaxKind.InvalidStatement;
  readonly decorators: readonly DecoratorExpressionNode[];
}

export interface EmptyStatementNode extends BaseNode {
  readonly kind: SyntaxKind.EmptyStatement;
}

export interface ModelExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ModelExpression;
  readonly properties: (ModelPropertyNode | ModelSpreadPropertyNode)[];
  readonly bodyRange: TextRange;
}

export interface ArrayExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ArrayExpression;
  readonly elementType: Expression;
}
export interface TupleExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.TupleExpression;
  readonly values: readonly Expression[];
}

export interface ModelPropertyNode extends BaseNode {
  readonly kind: SyntaxKind.ModelProperty;
  readonly id: IdentifierNode;
  readonly value: Expression;
  readonly decorators: readonly DecoratorExpressionNode[];
  readonly optional: boolean;
  readonly default?: Expression;
  readonly parent?: ModelStatementNode | ModelExpressionNode;
}

export interface ModelSpreadPropertyNode extends BaseNode {
  readonly kind: SyntaxKind.ModelSpreadProperty;
  readonly target: TypeReferenceNode;
  readonly parent?: ModelStatementNode | ModelExpressionNode;
}

export interface ObjectLiteralNode extends BaseNode {
  readonly kind: SyntaxKind.ObjectLiteral;
  readonly properties: (ObjectLiteralPropertyNode | ObjectLiteralSpreadPropertyNode)[];
  readonly bodyRange: TextRange;
}

export interface ObjectLiteralPropertyNode extends BaseNode {
  readonly kind: SyntaxKind.ObjectLiteralProperty;
  readonly id: IdentifierNode;
  readonly value: Expression;
  readonly parent?: ObjectLiteralNode;
}

export interface ObjectLiteralSpreadPropertyNode extends BaseNode {
  readonly kind: SyntaxKind.ObjectLiteralSpreadProperty;
  readonly target: TypeReferenceNode;
  readonly parent?: ObjectLiteralNode;
}

export interface ArrayLiteralNode extends BaseNode {
  readonly kind: SyntaxKind.ArrayLiteral;
  readonly values: readonly Expression[];
}

export type LiteralNode =
  | StringLiteralNode
  | NumericLiteralNode
  | BooleanLiteralNode
  | StringTemplateHeadNode
  | StringTemplateMiddleNode
  | StringTemplateTailNode;

export interface StringLiteralNode extends BaseNode {
  readonly kind: SyntaxKind.StringLiteral;
  readonly value: string;
}

export interface NumericLiteralNode extends BaseNode {
  readonly kind: SyntaxKind.NumericLiteral;
  readonly value: number;
  readonly valueAsString: string;
}

export interface BooleanLiteralNode extends BaseNode {
  readonly kind: SyntaxKind.BooleanLiteral;
  readonly value: boolean;
}

export interface StringTemplateExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.StringTemplateExpression;
  readonly head: StringTemplateHeadNode;
  readonly spans: readonly StringTemplateSpanNode[];
}

// Each of these corresponds to a substitution expression and a template literal, in that order.
// The template literal must have kind TemplateMiddleLiteral or TemplateTailLiteral.
export interface StringTemplateSpanNode extends BaseNode {
  readonly kind: SyntaxKind.StringTemplateSpan;
  readonly expression: Expression;
  readonly literal: StringTemplateMiddleNode | StringTemplateTailNode;
}

export interface StringTemplateLiteralLikeNode extends BaseNode {
  readonly value: string;

  /** @internal */
  readonly tokenFlags: TokenFlags;
}

export interface StringTemplateHeadNode extends StringTemplateLiteralLikeNode {
  readonly kind: SyntaxKind.StringTemplateHead;
}

export interface StringTemplateMiddleNode extends StringTemplateLiteralLikeNode {
  readonly kind: SyntaxKind.StringTemplateMiddle;
}

export interface StringTemplateTailNode extends StringTemplateLiteralLikeNode {
  readonly kind: SyntaxKind.StringTemplateTail;
}

export interface ExternKeywordNode extends BaseNode {
  readonly kind: SyntaxKind.ExternKeyword;
}

export interface VoidKeywordNode extends BaseNode {
  readonly kind: SyntaxKind.VoidKeyword;
}

export interface NeverKeywordNode extends BaseNode {
  readonly kind: SyntaxKind.NeverKeyword;
}

export interface AnyKeywordNode extends BaseNode {
  readonly kind: SyntaxKind.UnknownKeyword;
}

export interface UnionExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.UnionExpression;
  readonly options: readonly Expression[];
}

export interface IntersectionExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.IntersectionExpression;
  readonly options: readonly Expression[];
}

export interface ValueOfExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.ValueOfExpression;
  readonly target: Expression;
}

export interface TypeOfExpressionNode extends BaseNode {
  readonly kind: SyntaxKind.TypeOfExpression;
  readonly target: Expression;
}

export interface TypeReferenceNode extends BaseNode {
  readonly kind: SyntaxKind.TypeReference;
  readonly target: MemberExpressionNode | IdentifierNode;
  readonly arguments: readonly TemplateArgumentNode[];
}

export interface TemplateArgumentNode extends BaseNode {
  readonly kind: SyntaxKind.TemplateArgument;
  readonly name?: IdentifierNode;
  readonly argument: Expression;
}

export interface TemplateParameterDeclarationNode extends DeclarationNode, BaseNode {
  readonly kind: SyntaxKind.TemplateParameterDeclaration;
  readonly constraint?: Expression;
  readonly default?: Expression;
  readonly parent?: TemplateableNode;
}

export const enum ModifierFlags {
  None,
  Extern = 1 << 1,
}

export type Modifier = ExternKeywordNode;

/**
 * Represent a decorator declaration
 * @example
 * ```typespec
 * extern dec doc(target: Type, value: valueof string);
 * ```
 */
export interface DecoratorDeclarationStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.DecoratorDeclarationStatement;
  readonly modifiers: readonly Modifier[];
  readonly modifierFlags: ModifierFlags;
  /**
   * Decorator target. First parameter.
   */
  readonly target: FunctionParameterNode;

  /**
   * Additional parameters
   */
  readonly parameters: FunctionParameterNode[];
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface FunctionParameterNode extends BaseNode {
  readonly kind: SyntaxKind.FunctionParameter;
  readonly id: IdentifierNode;
  readonly type?: Expression;

  /**
   * Parameter defined with `?`
   */
  readonly optional: boolean;

  /**
   * Parameter defined with `...` notation.
   */
  readonly rest: boolean;
}

/**
 * Represent a function declaration
 * @example
 * ```typespec
 * extern fn camelCase(value: StringLiteral): StringLiteral;
 * ```
 */
export interface FunctionDeclarationStatementNode extends BaseNode, DeclarationNode {
  readonly kind: SyntaxKind.FunctionDeclarationStatement;
  readonly modifiers: readonly Modifier[];
  readonly modifierFlags: ModifierFlags;
  readonly parameters: FunctionParameterNode[];
  readonly returnType?: Expression;
  readonly parent?: TypeSpecScriptNode | NamespaceStatementNode;
}

export interface IdentifierContext {
  kind: IdentifierKind;
  node: Node;
}

export enum IdentifierKind {
  TypeReference,
  TemplateArgument,
  Decorator,
  Function,
  Using,
  Declaration,
  ModelExpressionProperty,
  ModelStatementProperty,
  ObjectLiteralProperty,
  Other,
}

// Doc-comment related syntax

export interface DocNode extends BaseNode {
  readonly kind: SyntaxKind.Doc;
  readonly content: readonly DocContent[];
  readonly tags: readonly DocTag[];
}

export interface DocTagBaseNode extends BaseNode {
  readonly tagName: IdentifierNode;
  readonly content: readonly DocContent[];
}

export type DocTag =
  | DocReturnsTagNode
  | DocErrorsTagNode
  | DocParamTagNode
  | DocPropTagNode
  | DocTemplateTagNode
  | DocUnknownTagNode;
export type DocContent = DocTextNode;

export interface DocTextNode extends BaseNode {
  readonly kind: SyntaxKind.DocText;
  readonly text: string;
}

export interface DocReturnsTagNode extends DocTagBaseNode {
  readonly kind: SyntaxKind.DocReturnsTag;
}

export interface DocErrorsTagNode extends DocTagBaseNode {
  readonly kind: SyntaxKind.DocErrorsTag;
}

export interface DocParamTagNode extends DocTagBaseNode {
  readonly kind: SyntaxKind.DocParamTag;
  readonly paramName: IdentifierNode;
}

export interface DocPropTagNode extends DocTagBaseNode {
  readonly kind: SyntaxKind.DocPropTag;
  readonly propName: IdentifierNode;
}

export interface DocTemplateTagNode extends DocTagBaseNode {
  readonly kind: SyntaxKind.DocTemplateTag;
  readonly paramName: IdentifierNode;
}

export interface DocUnknownTagNode extends DocTagBaseNode {
  readonly kind: SyntaxKind.DocUnknownTag;
}
////

/**
 * Identifies the position within a source file by line number and offset from
 * beginning of line.
 */
export interface LineAndCharacter {
  /** The line number. 0-based. */
  line: number;

  /**
   * The offset in UTF-16 code units to the character from the beginning of the
   * line. 0-based.
   *
   * NOTE: This is not necessarily the same as what a given text editor might
   * call the "column". Tabs, combining characters, surrogate pairs, and so on
   * can all cause an editor to report the column differently. Indeed, different
   * text editors report different column numbers for the same position in a
   * given document.
   */
  character: number;
}

export interface JsSourceFileNode extends DeclarationNode, BaseNode {
  readonly kind: SyntaxKind.JsSourceFile;

  /* A source file with empty contents to represent the file on disk. */
  readonly file: SourceFile;

  /* The exports object as comes from `import()` */
  readonly esmExports: any;

  /* Any namespaces declared by decorators. */
  /** @internal */
  readonly namespaceSymbols: Sym[];
}

export interface JsNamespaceDeclarationNode extends DeclarationNode, BaseNode {
  readonly kind: SyntaxKind.JsNamespaceDeclaration;
}

export type EmitterFunc = (context: EmitContext) => Promise<void> | void;

export interface SourceFile {
  /** The source code text. */
  readonly text: string;

  /**
   * The source file path.
   *
   * This is used only for diagnostics. The command line compiler will populate
   * it with the actual path from which the file was read, but it can actually
   * be an arbitrary name for other scenarios.
   */
  readonly path: string;

  /**
   * Array of positions in the text where each line begins. There is one entry
   * per line, in order of lines, and each entry represents the offset in UTF-16
   * code units from the start of the document to the beginning of the line.
   */
  getLineStarts(): readonly number[];

  /**
   * Converts a one-dimensional position in the document (measured in UTF-16
   * code units) to line number and offset from line start.
   */
  getLineAndCharacterOfPosition(position: number): LineAndCharacter;
}

/**
 * Represent a location context in the mind of the compiler. This can be:
 * - the user project
 * - a library
 * - the compiler(standard library)
 * - virtual
 */
export type LocationContext =
  | ProjectLocationContext
  | CompilerLocationContext
  | SyntheticLocationContext
  | LibraryLocationContext;

/** Defined in the user project. */
export interface ProjectLocationContext {
  readonly type: "project";
  readonly flags?: PackageFlags;
}

/** Built-in */
export interface CompilerLocationContext {
  readonly type: "compiler";
}

/** Refer to a type that was not declared in a file */
export interface SyntheticLocationContext {
  readonly type: "synthetic";
}

/** Defined in a library. */
export interface LibraryLocationContext {
  readonly type: "library";

  /** Library metadata */
  readonly metadata: ModuleLibraryMetadata;

  /** Module definition */
  readonly flags?: PackageFlags;
}

export interface LibraryInstance {
  module: ModuleResolutionResult;
  entrypoint: JsSourceFileNode;
  metadata: LibraryMetadata;
  definition?: TypeSpecLibrary<any>;
  linter: LinterResolvedDefinition;
}

export type LibraryMetadata = FileLibraryMetadata | ModuleLibraryMetadata;

interface LibraryMetadataBase {
  /** Library homepage. */
  homepage?: string;

  /** Library version */
  version?: string;

  bugs?: {
    /** Url where to file bugs for this library. */
    url?: string;
  };
}

export interface FileLibraryMetadata extends LibraryMetadataBase {
  type: "file";

  /** Library name as specified in the package.json or in exported $lib. */
  name?: string;
}

/** Data for a library. Either loaded via a node_modules package or a standalone js file  */
export interface ModuleLibraryMetadata extends LibraryMetadataBase {
  readonly type: "module";

  /** Library name as specified in the package.json or in exported $lib. */
  readonly name: string;
}

export interface TextRange {
  /**
   * The starting position of the ranger measured in UTF-16 code units from the
   * start of the full string. Inclusive.
   */
  readonly pos: number;

  /**
   * The ending position measured in UTF-16 code units from the start of the
   * full string. Exclusive.
   */
  readonly end: number;
}

export interface SourceLocation extends TextRange {
  file: SourceFile;
  isSynthetic?: boolean;
}

/** Used to explicitly specify that a diagnostic has no target. */
export const NoTarget = Symbol.for("NoTarget");

/** Diagnostic target that can be used when working with TypeSpec types.  */
export type TypeSpecDiagnosticTarget = Node | Entity | Sym | TemplateInstanceTarget;

/** Represent a diagnostic target that happens in a template instance context.  */
export interface TemplateInstanceTarget {
  /** Node target */
  readonly node: Node;
  /** Template mapper used. */
  readonly templateMapper: TypeMapper;
}

export type DiagnosticTarget = TypeSpecDiagnosticTarget | SourceLocation;

export type DiagnosticSeverity = "error" | "warning";

export interface Diagnostic {
  code: string;
  /** @internal Diagnostic documentation url */
  readonly url?: string;
  severity: DiagnosticSeverity;
  message: string;
  target: DiagnosticTarget | typeof NoTarget;
  readonly codefixes?: readonly CodeFix[];
}

export interface CodeFix {
  readonly id: string;
  readonly label: string;
  readonly fix: (fixContext: CodeFixContext) => CodeFixEdit | CodeFixEdit[] | Promise<void> | void;
}

export interface FilePos {
  readonly pos: number;
  readonly file: SourceFile;
}

export interface CodeFixContext {
  /** Add the given text before the range or pos given. */
  readonly prependText: (location: SourceLocation | FilePos, text: string) => InsertTextCodeFixEdit;
  /** Add the given text after the range or pos given. */
  readonly appendText: (location: SourceLocation | FilePos, text: string) => InsertTextCodeFixEdit;
  /** Replace the text at the given range. */
  readonly replaceText: (location: SourceLocation, newText: string) => ReplaceTextCodeFixEdit;
}

export type CodeFixEdit = InsertTextCodeFixEdit | ReplaceTextCodeFixEdit;

export interface InsertTextCodeFixEdit {
  readonly kind: "insert-text";
  readonly text: string;
  readonly pos: number;
  readonly file: SourceFile;
}

export interface ReplaceTextCodeFixEdit extends TextRange {
  readonly kind: "replace-text";
  readonly text: string;
  readonly file: SourceFile;
}

/**
 * Return type of accessor functions in TypeSpec.
 * Tuple composed of:
 * - 0: Actual result of an accessor function
 * - 1: List of diagnostics that were emitted while retrieving the data.
 */
export type DiagnosticResult<T> = [T, readonly Diagnostic[]];

export interface DirectiveBase {
  node: DirectiveExpressionNode;
}

export type Directive = SuppressDirective | DeprecatedDirective;

export interface SuppressDirective extends DirectiveBase {
  name: "suppress";
  code: string;
  message: string;
}

export interface DeprecatedDirective extends DirectiveBase {
  name: "deprecated";
  message: string;
}

export interface RmOptions {
  /**
   * If `true`, perform a recursive directory removal. In
   * recursive mode, errors are not reported if `path` does not exist, and
   * operations are retried on failure.
   * @default false
   */
  recursive?: boolean;
}

export interface SystemHost {
  /** read a file at the given url. */
  readUrl(url: string): Promise<SourceFile>;

  /** read a utf-8 or utf-8 with bom encoded file */
  readFile(path: string): Promise<SourceFile>;

  /**
   * Write the file.
   * @param path Path to the file.
   * @param content Content of the file.
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * Read directory.
   * @param path Path to the directory.
   * @returns list of file/directory in the given directory. Returns the name not the full path.
   */
  readDir(path: string): Promise<string[]>;

  /**
   * Deletes a directory or file.
   * @param path Path to the directory or file.
   */
  rm(path: string, options?: RmOptions): Promise<void>;

  /**
   * create directory recursively.
   * @param path Path to the directory.
   */
  mkdirp(path: string): Promise<string | undefined>;

  // get info about a path
  stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;

  // get the real path of a possibly symlinked path
  realpath(path: string): Promise<string>;
}

export interface CompilerHost extends SystemHost {
  /**
   * Optional cache to reuse the results of parsing and binding across programs.
   */
  parseCache?: WeakMap<SourceFile, TypeSpecScriptNode>;

  // get the directory TypeSpec is executing from
  getExecutionRoot(): string;

  // get the directories we should load standard library files from
  getLibDirs(): string[];

  // get a promise for the ESM module shape of a JS module
  getJsImport(path: string): Promise<Record<string, any>>;

  getSourceFileKind(path: string): SourceFileKind | undefined;

  // convert a file URL to a path in a file system
  fileURLToPath(url: string): string;

  // convert a file system path to a URL
  pathToFileURL(path: string): string;

  logSink: LogSink;
}

/**
 * Type of the source file that can be loaded via typespec
 */
export type SourceFileKind = "typespec" | "js";

type UnionToIntersection<T> = (T extends any ? (k: T) => void : never) extends (k: infer I) => void
  ? I
  : never;

export enum ListenerFlow {
  /**
   * Do not navigate any containing or referenced type.
   */
  NoRecursion = 1,
}

/**
 * Listener function. Can return false to stop recursion.
 */
type TypeListener<T> = (context: T) => ListenerFlow | undefined | void;
type exitListener<T extends string | number | symbol> = T extends string ? `exit${T}` : T;
type ListenerForType<T extends Type> = T extends Type
  ? { [k in Uncapitalize<T["kind"]> | exitListener<T["kind"]>]?: TypeListener<T> }
  : never;

export type TypeListeners = UnionToIntersection<ListenerForType<Type>>;

export type SemanticNodeListener = {
  root?: (context: Program) => void | undefined;
} & TypeListeners;

export type DiagnosticReportWithoutTarget<
  T extends { [code: string]: DiagnosticMessages },
  C extends keyof T,
  M extends keyof T[C] = "default",
> = {
  code: C;
  messageId?: M;
  readonly codefixes?: readonly CodeFix[];
} & DiagnosticFormat<T, C, M>;

export type DiagnosticReport<
  T extends { [code: string]: DiagnosticMessages },
  C extends keyof T,
  M extends keyof T[C] = "default",
> = DiagnosticReportWithoutTarget<T, C, M> & { target: DiagnosticTarget | typeof NoTarget };

export type DiagnosticFormat<
  T extends { [code: string]: DiagnosticMessages },
  C extends keyof T,
  M extends keyof T[C] = "default",
> =
  T[C][M] extends CallableMessage<infer A>
    ? { format: Record<A[number], string> }
    : Record<string, unknown>;

/**
 * Declare a diagnostic that can be reported by the library.
 *
 * @example
 *
 * ```ts
 * unterminated: {
 *   severity: "error",
 *   description: "Unterminated token.",
 *   url: "https://example.com/docs/diags/unterminated",
 *   messages: {
 *     default: paramMessage`Unterminated ${"token"}.`,
 *   },
 * },
 * ```
 */
export interface DiagnosticDefinition<M extends DiagnosticMessages> {
  /**
   * Diagnostic severity.
   * - `warning` - Suppressable, should be used to represent potential issues but not blocking.
   * - `error` - Non-suppressable, should be used to represent failure to move forward.
   */
  readonly severity: "warning" | "error";
  /** Messages that can be reported with the diagnostic. */
  readonly messages: M;
  /** Short description of the diagnostic */
  readonly description?: string;
  /** Specifies the URL at which the full documentation can be accessed. */
  readonly url?: string;
}

export interface DiagnosticMessages {
  readonly [messageId: string]: string | CallableMessage<string[]>;
}

export interface CallableMessage<T extends string[]> {
  keys: T;
  (dict: Record<T[number], string>): string;
}

export type DiagnosticMap<T extends { [code: string]: DiagnosticMessages }> = {
  readonly [code in keyof T]: DiagnosticDefinition<T[code]>;
};

export interface DiagnosticCreator<T extends { [code: string]: DiagnosticMessages }> {
  readonly type: T;
  readonly diagnostics: DiagnosticMap<T>;
  createDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    diag: DiagnosticReport<T, C, M>,
  ): Diagnostic;
  reportDiagnostic<C extends keyof T, M extends keyof T[C] = "default">(
    program: Program,
    diag: DiagnosticReport<T, C, M>,
  ): void;
}

export type TypeOfDiagnostics<T extends DiagnosticMap<any>> =
  T extends DiagnosticMap<infer D> ? D : never;

export type JSONSchemaType<T> = AjvJSONSchemaType<T>;

/**
 * @internal
 */
export interface JSONSchemaValidator {
  /**
   * Validate the configuration against its JSON Schema.
   *
   * @param config Configuration to validate.
   * @param target Source file target to use for diagnostics.
   * @returns Diagnostics produced by schema validation of the configuration.
   */
  validate(
    config: unknown,
    target: YamlScript | YamlPathTarget | SourceFile | typeof NoTarget,
  ): Diagnostic[];
}

export interface StateDef {
  /**
   * Description for this state.
   */
  readonly description?: string;
}

export interface TypeSpecLibraryCapabilities {
  /** Only applicable for emitters. Specify that this emitter will respect the dryRun flag and run, report diagnostic but not write any output.  */
  readonly dryRun?: boolean;
}

export interface TypeSpecLibraryDef<
  T extends { [code: string]: DiagnosticMessages },
  E extends Record<string, any> = Record<string, never>,
  State extends string = never,
> {
  /**
   * Library name. MUST match package.json name.
   */
  readonly name: string;

  /** Optional registration of capabilities the library/emitter provides */
  readonly capabilities?: TypeSpecLibraryCapabilities;

  /**
   * Map of potential diagnostics that can be emitted in this library where the key is the diagnostic code.
   */
  readonly diagnostics: DiagnosticMap<T>;

  /**
   * List of other library that should be imported when this is used as an emitter.
   * Compiler will emit an error if the libraries are not explicitly imported.
   */
  readonly requireImports?: readonly string[];

  /**
   * Emitter configuration if library is an emitter.
   */
  readonly emitter?: {
    options?: JSONSchemaType<E>;
  };

  readonly state?: Record<State, StateDef>;
}

/**
 * Type for the $decorators export from libraries.
 *
 * @example
 * ```
 * export const $decorators = {
 *   "Azure.Core": {
 *     flags: $flags,
 *     "foo-bar": fooBarDecorator
 *   }
 * }
 * ```
 */
export interface DecoratorImplementations {
  readonly [namespace: string]: {
    readonly [name: string]: DecoratorFunction;
  };
}

export interface PackageFlags {}

export interface LinterDefinition {
  rules: LinterRuleDefinition<string, DiagnosticMessages>[];
  ruleSets?: Record<string, LinterRuleSet>;
}

export interface LinterResolvedDefinition {
  readonly rules: LinterRule<string, DiagnosticMessages>[];
  readonly ruleSets: {
    [name: string]: LinterRuleSet;
  };
}

export interface LinterRuleDefinition<N extends string, DM extends DiagnosticMessages> {
  /** Rule name (without the library name) */
  name: N;
  /** Rule default severity. */
  severity: "warning";
  /** Short description of the rule */
  description: string;
  /** Specifies the URL at which the full documentation can be accessed. */
  url?: string;
  /** Messages that can be reported with the diagnostic. */
  messages: DM;
  /** Creator */
  create(context: LinterRuleContext<DM>): SemanticNodeListener;
}

/** Resolved instance of a linter rule that will run. */
export interface LinterRule<N extends string, DM extends DiagnosticMessages>
  extends LinterRuleDefinition<N, DM> {
  /** Expanded rule id in format `<library-name>:<rule-name>` */
  id: string;
}

/** Reference to a rule. In this format `<library name>:<rule/ruleset name>` */
export type RuleRef = `${string}/${string}`;
export interface LinterRuleSet {
  /** Other ruleset this ruleset extends */
  extends?: RuleRef[];

  /** Rules to enable/configure */
  enable?: Record<RuleRef, boolean>;

  /** Rules to disable. A rule CANNOT be in enable and disable map. */
  disable?: Record<RuleRef, string>;
}

export interface LinterRuleContext<DM extends DiagnosticMessages> {
  readonly program: Program;
  reportDiagnostic<M extends keyof DM>(diag: LinterRuleDiagnosticReport<DM, M>): void;
}

export type LinterRuleDiagnosticFormat<
  T extends DiagnosticMessages,
  M extends keyof T = "default",
> =
  T[M] extends CallableMessage<infer A>
    ? { format: Record<A[number], string> }
    : Record<string, unknown>;

export type LinterRuleDiagnosticReportWithoutTarget<
  T extends DiagnosticMessages,
  M extends keyof T = "default",
> = {
  messageId?: M;
  codefixes?: CodeFix[];
} & LinterRuleDiagnosticFormat<T, M>;

export type LinterRuleDiagnosticReport<
  T extends DiagnosticMessages,
  M extends keyof T = "default",
> = LinterRuleDiagnosticReportWithoutTarget<T, M> & { target: DiagnosticTarget | typeof NoTarget };

export interface TypeSpecLibrary<
  T extends { [code: string]: DiagnosticMessages },
  E extends Record<string, any> = Record<string, never>,
  State extends string = never,
> extends TypeSpecLibraryDef<T, E, State> {
  /** Library name */
  readonly name: string;

  /**
   * JSON Schema validator for emitter options
   * @internal
   */
  readonly emitterOptionValidator?: JSONSchemaValidator;

  reportDiagnostic<C extends keyof T, M extends keyof T[C]>(
    program: Program,
    diag: DiagnosticReport<T, C, M>,
  ): void;
  createDiagnostic<C extends keyof T, M extends keyof T[C]>(
    diag: DiagnosticReport<T, C, M>,
  ): Diagnostic;

  /**
   * Get or create a symbol with the given name unique for that library.
   * @param name Symbol name scoped with the library name.
   */
  createStateSymbol(name: string): symbol;

  /**
   * Returns a tracer scopped to the current library.
   * All trace area logged via this tracer will be prefixed with the library name.
   */
  getTracer(program: Program): Tracer;

  readonly stateKeys: Record<State, symbol>;
}

/**
 * Get the options for the onEmit of this library.
 */
export type EmitOptionsFor<C> = C extends TypeSpecLibrary<infer _T, infer E> ? E : never;

export interface DecoratorContext {
  program: Program;

  /**
   * Point to the decorator target
   */
  decoratorTarget: DiagnosticTarget;

  /**
   * Function that can be used to retrieve the target for a parameter at the given index.
   * @param paramIndex Parameter index in the typespec
   * @example @foo("bar", 123) -> $foo(context, target, arg0: string, arg1: number);
   *  getArgumentTarget(0) -> target for arg0
   *  getArgumentTarget(1) -> target for arg1
   */
  getArgumentTarget(paramIndex: number): DiagnosticTarget | undefined;

  /**
   * Helper to call out to another decorator
   * @param decorator Other decorator function
   * @param args Args to pass to other decorator function
   */
  call<T extends Type, A extends any[], R>(
    decorator: (context: DecoratorContext, target: T, ...args: A) => R,
    target: T,
    ...args: A
  ): R;
}

export interface EmitContext<TOptions extends object = Record<string, never>> {
  /**
   * TypeSpec Program.
   */
  program: Program;

  /**
   * Configured output dir for the emitter. Emitter should emit all output under that directory.
   */
  emitterOutputDir: string;

  /**
   * Emitter custom options defined in createTypeSpecLibrary
   */
  options: TOptions;
}

export type LogLevel = "trace" | "warning" | "error";

export interface LogInfo {
  level: LogLevel;
  message: string;
  code?: string;
  target?: DiagnosticTarget | typeof NoTarget;
}

export interface ProcessedLog {
  level: LogLevel;
  message: string;
  code?: string;
  /** Documentation for the error code. */
  url?: string;

  /** Log location */
  sourceLocation?: SourceLocation;

  /** @internal */
  related?: RelatedSourceLocation[];
}

/** @internal */
export interface RelatedSourceLocation {
  readonly message: string;
  readonly location: SourceLocation;
}

/** @internal */
export type TaskStatus = "success" | "failure" | "skipped" | "warn";

/** @internal */
export interface TrackActionTask {
  message: string;
  readonly isStopped: boolean;
  succeed(message?: string): void;
  fail(message?: string): void;
  warn(message?: string): void;
  skip(message?: string): void;
  stop(status: TaskStatus, message?: string): void;
}

export interface LogSink {
  log(log: ProcessedLog): void;

  /** @internal */
  getPath?(path: string): string;

  /**
   * @internal
   */
  trackAction?<T>(
    message: string,
    finalMessage: string,
    asyncAction: (task: TrackActionTask) => Promise<T>,
  ): Promise<T>;
}

export interface Logger {
  trace(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  log(log: LogInfo): void;

  /** @internal */
  trackAction<T>(
    message: string,
    finalMessage: string,
    asyncAction: (task: TrackActionTask) => Promise<T>,
  ): Promise<T>;
}

export interface TracerOptions {
  filter?: string[];
}
export interface Tracer {
  /**
   * Trace
   * @param area
   * @param message
   */
  trace(area: string, message: string, target?: DiagnosticTarget): void;

  /**
   * @param subarea
   */
  sub(subarea: string): Tracer;
}
