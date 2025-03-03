
using System.Data.Common;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using TuringMachine.Backend.Server.Models.ServerResponses;

namespace TuringMachine.Backend.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            RSA rsa = RSA.Create();

            WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddAuthorization();

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            WebApplication app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            #region Register API
            #region Server API
            app.MapGet("/api/try-get-response" , (HttpContext httpContext) => new ServerResponse("Server responded."))
               .WithName("TryGetServerResponse")
               .WithOpenApi();

            app.MapGet("/api/get-rsa-key" , (HttpContext httpContext) => new ServerResponse((object)rsa.ExportRSAPublicKeyPem()))
               .WithName("GetRsaKey")
               .WithOpenApi();
            #endregion

            #endregion

            app.Run();
        }
    }
}
