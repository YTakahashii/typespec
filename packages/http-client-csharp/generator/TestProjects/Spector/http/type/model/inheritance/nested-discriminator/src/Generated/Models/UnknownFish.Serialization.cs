// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Model.Inheritance.NestedDiscriminator
{
    internal partial class UnknownFish : IJsonModel<Fish>
    {
        void IJsonModel<Fish>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected override void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        Fish IJsonModel<Fish>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected override Fish JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<Fish>.Write(ModelReaderWriterOptions options) => throw null;

        protected override BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        Fish IPersistableModel<Fish>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected override Fish PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<Fish>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;
    }
}
