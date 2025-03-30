using System.Data.Common;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Data;
using TuringMachine.Backend.Server.Data.SqlDataModel.Progress;
using TuringMachine.Backend.Server.Data.SqlDataModel.UserManagement;
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
            builder.Services.AddDbContext<DataContext>(options =>
                {
                    options.UseSqlServer(builder.Configuration["ConnectionStrings:DatabaseConnection"]);
                }
            );

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
            #region Landing
            app.MapGet("/api/try-get-response" , (HttpContext httpContext) => new ServerResponse<string>("Server responded."))
               .WithName("TryGetServerResponse")
               .WithOpenApi();

            app.MapGet("/api/validate" , async (string accessToken , DataContext db) =>
                   {
                        // @formatter:off
                        return db.Users.Any(u => u.AccessToken == accessToken) ? new ServerResponse<string>("Success")
                                                                               : new ServerResponse<string>("Invalid access token.");
                       // @formatter:on
                   }
               )
               .WithName("GetValidation")
               .WithOpenApi();
            #endregion

            #region Login
            app.MapGet("/api/get-rsa-key" , () => new ServerResponse<string>("Success" , rsa.ExportRSAPublicKeyPem()))
               .WithName("GetRsaKey")
               .WithOpenApi();
            #endregion
            #endregion

            #endregion

            app.Run();
        }
    }
}
