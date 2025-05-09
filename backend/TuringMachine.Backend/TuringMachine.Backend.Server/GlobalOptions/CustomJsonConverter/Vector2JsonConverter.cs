using System.Numerics;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TuringMachine.Backend.Server.GlobalOptions.CustomJsonConverter
{
    public class Vector2JsonConverter : JsonConverter<Vector2>
    {
        private readonly static JsonConverter<DuckVector2> _alternativeConverter = (JsonConverter<DuckVector2>)JsonSerializerOptions.Default.GetConverter(typeof(DuckVector2));

        public override Vector2 Read(ref Utf8JsonReader reader , Type typeToConvert , JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                DuckVector2? duckVector = _alternativeConverter.Read(ref reader , typeof(DuckVector2) , options);

                if (duckVector == null)
                    throw new JsonException("Invalid JSON syntax.");

                return new Vector2(duckVector.X , duckVector.Y);
            }
            throw new JsonException("Expected a JSON object.");
        }

        public override void Write(Utf8JsonWriter writer , Vector2 value , JsonSerializerOptions options)
        {
            DuckVector2 duckVector = new DuckVector2
            {
                X = value.X ,
                Y = value.Y ,
            };
            _alternativeConverter.Write(writer , duckVector , options);
        }

        private class DuckVector2
        {
            public float X { get; set; }
            public float Y { get; set; }
        }
    }
}
