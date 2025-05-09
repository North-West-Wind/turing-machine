using System.Numerics;
using System.Text.Json.Serialization;
using System.Text.Json;

namespace TuringMachine.Backend.Server.GlobalOptions.CustomJsonConverter
{
    public class Vector2IListJsonConverter : JsonConverter<IList<Vector2>>
    {
        private readonly static JsonConverter<IList<DuckVector2>> _alternativeConverter = (JsonConverter<IList<DuckVector2>>)JsonSerializerOptions.Default.GetConverter(typeof(IList<DuckVector2>));

        public override IList<Vector2> Read(ref Utf8JsonReader reader , Type typeToConvert , JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartArray)
            {
                IList<DuckVector2>? duckVector = _alternativeConverter.Read(ref reader , typeof(IList<DuckVector2>) , options);

                if (duckVector == null)
                    throw new JsonException("Invalid JSON syntax.");

                Vector2[] vectors = new Vector2[duckVector.Count];
                for (int i = 0; i < duckVector.Count; i++)
                    vectors[i] = new Vector2(duckVector[i].X , duckVector[i].Y);
                return vectors;
            }
            throw new JsonException("Expected a JSON object.");
        }

        public override void Write(Utf8JsonWriter writer , IList<Vector2> value , JsonSerializerOptions options)
        {
            DuckVector2[] duckVectors = new DuckVector2[value.Count];
            for (int i = 0; i < value.Count; i++)
                duckVectors[i] = new DuckVector2
                {
                    X = value[i].X ,
                    Y = value[i].Y ,
                };

            _alternativeConverter.Write(writer , duckVectors , options);
        }

        private class DuckVector2
        {
            public float X { get; set; }
            public float Y { get; set; }
        }
    }
}
