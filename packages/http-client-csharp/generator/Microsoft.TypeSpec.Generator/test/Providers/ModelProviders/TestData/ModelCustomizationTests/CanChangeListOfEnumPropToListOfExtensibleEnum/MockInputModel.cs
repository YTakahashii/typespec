using System;
using System.Collections.Generic;
using SampleTypeSpec;

namespace Sample.Models;

public partial class MockInputModel
{
    [CodeGenMember("Prop1")]
    public IList<MyEnum> Prop1 { get; set; }
}

public partial struct MyEnum
{
}
