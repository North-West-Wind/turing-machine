﻿// ReSharper disable InconsistentNaming
using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Machines.Tapes;

namespace TuringMachine.Backend.Server.Models.Misc
{
    [JsonConverter(typeof(JsonStringEnumConverter<ResponseStatus>))]
    internal enum ResponseStatus
    {
        SUCCESS ,
        FAILURE ,

        TOKEN_EXPIRED ,
        INVALID_TOKEN ,

        INVALID_USERNAME_OR_PASSWORD ,
        INVALID_PASSWORD ,

        NO_SUCH_ITEM ,
        USER_NOT_FOUND ,
        DESIGN_NOT_FOUND ,

        TOO_MANY_REQUEST ,
        BACKEND_ERROR ,

        USER_EXISTED ,

        INVALID_LICENSE ,

        DUPLICATED_USER ,
        DUPLICATED_DESIGN ,
        DUPLICATED_ITEM ,
        DUPLICATED_MACHINE_LABEL ,
    }
}
