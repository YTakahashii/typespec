// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public record VariableExpression(CSharpType Type, CodeWriterDeclaration Declaration, bool IsRef = false) : ValueExpression
    {
        public VariableExpression(CSharpType type, string name, bool isRef = false) : this(type, new CodeWriterDeclaration(name), isRef) { }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("ref ", IsRef);
            writer.Append(Declaration);
        }
    }
}
