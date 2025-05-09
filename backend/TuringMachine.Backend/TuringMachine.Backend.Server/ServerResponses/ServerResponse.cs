using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json.Serialization;
using TuringMachine.Backend.Server.Models.Misc;

namespace TuringMachine.Backend.Server.ServerResponses
{
    internal record ServerResponse
    {
        public DateTime Time => DateTime.Now;

        public ResponseStatus Status { get; set; }

        /// <remarks>
        ///     Description of the response. Only use for root error. <br/><br/>
        ///     Immutable.
        /// </remarks>
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Description { get; init; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ResponseStackTraces{
            get
            {
                if (_responseStackTraces is null)
                    return null;

                StringBuilder builder = new StringBuilder("Stack trace (Oldest on top):");
                foreach (ResponseInfo info in _responseStackTraces!)
                    builder.AppendLine($"Method: {info.MethodName} | Status: {info.Status}");
                return builder.ToString();
            }
        }
        private List<ResponseInfo>? _responseStackTraces;



        #region Constructor
        public ServerResponse() { }

        public ServerResponse(ResponseStatus status) { Status = status; }

        /// <remarks> Only use when error arise. </remarks>
        public ServerResponse(string methodName , ResponseStatus status , string description)
        {
            Status      = status;
            Description = description;
            WithThisTraceInfo(methodName , status);
        }

        /// <remarks> Only use when error arise. </remarks>
        public ServerResponse(string methodName , ResponseStatus status)
        {
            Status = status;
            WithThisTraceInfo(methodName , status);
        }
        #endregion

        #region Stack Trace Related
        /// <summary> Start a new stack trace. </summary>
        /// <remarks> Only use this method during non-success situation. </remarks>
        /// <returns> Return self. </returns>
        public static ServerResponse<T> StartTracing<T>(string methodName , ResponseStatus status) => StartTracing<T>(new ResponseInfo { MethodName = methodName , Status = status });

        /// <summary> Start a new stack trace. </summary>
        /// <remarks> Only use this method during non-success situation. </remarks>
        /// <returns> Return self. </returns>
        public static ServerResponse<T> StartTracing<T>(ResponseInfo info)
        {
            return new ServerResponse<T>
            {
                Status               = info.Status ,
                _responseStackTraces = new List<ResponseInfo> { info }
            };
        }

        /// <summary> Start a new stack trace. </summary>
        /// <remarks> Only use this method during non-success situation. </remarks>
        /// <returns> Return self. </returns>
        public static ServerResponse StartTracing(string methodName, ResponseStatus status) => StartTracing(new ResponseInfo { MethodName = methodName , Status = status });

        /// <summary> Start a new stack trace. </summary>
        /// <remarks> Only use this method during non-success situation. </remarks>
        /// <returns> Return self. </returns>
        public static ServerResponse StartTracing(ResponseInfo info)
        {
            ServerResponse response = new ServerResponse
            {
                Status = info.Status ,
                _responseStackTraces = new List<ResponseInfo> { info }
            };
            return response;
        }


        /// <summary> Append new info on the top of the stack trace. </summary>
        /// <remarks> Only use this method during non-success situation. </remarks>
        /// <returns> Return self. </returns>
        public ServerResponse<T> WithThisTraceInfo<T>(string methodName , ResponseStatus status) => WithThisTraceInfo<T>(new ResponseInfo { MethodName = methodName , Status = status });

        /// <summary> Append new info on the top of the stack trace. </summary>
        /// <remarks> Only use this method during non-success situation. </remarks>
        /// <returns> Return self. </returns>
        public ServerResponse<T> WithThisTraceInfo<T>(ResponseInfo info)
        {
            WithThisTraceInfo(info);
            List<ResponseInfo>? stackTrace = _responseStackTraces;
            return new ServerResponse<T>
            {
                _responseStackTraces = stackTrace ,
                Status               = Status ,
                Description          = Description ,
            };
        }

        /// <summary> Append new info on the top of the stack trace. </summary>
        /// <remarks> Only use this method during non-success situation. </remarks>
        /// <returns> Return self. </returns>
        public ServerResponse WithThisTraceInfo(string methodName , ResponseStatus status) => WithThisTraceInfo(new ResponseInfo { MethodName = methodName , Status = status });

        /// <summary> Append new info on the top of the stack trace. </summary>
        /// <remarks> Only use this method during non-success situation. </remarks>
        /// <returns> Return self. </returns>
        public ServerResponse WithThisTraceInfo(ResponseInfo info)
        {
            if (_responseStackTraces is null)
                throw new InvalidOperationException("Start tracing first before adding new info.");

            Status = info.Status;
            _responseStackTraces.Add(info);
            return this;
        }
        #endregion
    }

    internal record ServerResponse<T> : ServerResponse
    {
        public DateTime Time => DateTime.Now;


        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public T? Result { get; set; }


        #region Constructor
        public ServerResponse() { }

        public ServerResponse(ResponseStatus status) { Status = status; }

        public ServerResponse(ResponseStatus status , T? result)
        {
            Status = status;
            Result   = result;
        }

        public ServerResponse((ResponseStatus Status, T? Data) taskResponse)
        {
            Status = taskResponse.Status;
            Result   = taskResponse.Data;
        }

        /// <remarks> Only use when error arise. </remarks>
        public ServerResponse(string methodName , ResponseStatus status , string description)
        {
            Status      = status;
            Description = description;
            WithThisTraceInfo(methodName , status);
        }
        #endregion

        #region Stack Trace Related
        /// <remarks> Only use when error arise. </remarks>
        public ServerResponse(string methodName , ResponseStatus status)
        {
            Status = status;
            WithThisTraceInfo(methodName , status);
        }

        public ServerResponse(ResponseStatus status , T? result , string description)
        {
            Status      = status;
            Result        = result;
            Description = description;
        }
        #endregion


        public (ResponseStatus , T?) ToTuple() => (Status , Result);
    }
}
