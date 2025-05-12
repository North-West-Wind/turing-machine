using System.Data.Common;
using System.Diagnostics;
using System.Reflection.Metadata.Ecma335;
using System.Security.Cryptography;
using System.Text;
using Azure;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TuringMachine.Backend.Server.Database;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.ServerResponses;

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
            builder.Services.AddDbContext<DataContext>(
                options =>
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
            #region Server
            app
                .MapGet("/API/Server/GetPublicKey" , (_) => throw new NotImplementedException())
                .WithName("GetPublicKey")
                .WithOpenApi();

            app
                .MapGet("/API/Server/GetResponse" , () =>  new ServerResponse(ResponseStatus.SUCCESS))
                .WithName("GetResponse")
                .WithOpenApi();
            #endregion

            #region Progress
            app
                .MapPost("/API/Progress/Create" , (_) => throw new NotImplementedException())
                .WithName("CreateProgress")
                .WithOpenApi();

            app
                .MapGet("/API/Progress/Get" , (_) => throw new NotImplementedException())
                .WithName("GetProgress")
                .WithOpenApi();

            app
                .MapGet("/API/Progress/GetAll" , (_) => throw new NotImplementedException())
                .WithName("GetAllProgress")
                .WithOpenApi();

            app
                .MapPost("/API/Progress/Update" , (_) => throw new NotImplementedException())
                .WithName("PostProgress")
                .WithOpenApi();
            #endregion

            #region User
            app
                .MapPost("/API/User/Register" , (_) => throw new NotImplementedException())
                .WithName("RegisterUser")
                .WithOpenApi();

            app
                .MapPost("/API/User/Login" , (_) => throw new NotImplementedException())
                .WithName("LoginUser")
                .WithOpenApi();

            app
                .MapPost("/API/User/IncludeDesign" , (_) => throw new NotImplementedException())
                .WithName("IncludeUserDesign")
                .WithOpenApi();

            app
                .MapGet("/API/User/ValidateToken" , (_) => throw new NotImplementedException())
                .WithName("ValidateUserToken")
                .WithOpenApi();
            #endregion

            #region Level Template
            app
                .MapGet("/API/LevelTemplate/Get" , (_) => throw new NotImplementedException())
                .WithName("GetLevelTemplate")
                .WithOpenApi();

            app
                .MapGet("/API/LevelTemplate/GetAll" , (_) => throw new NotImplementedException())
                .WithName("GetAllLevelTemplates")
                .WithOpenApi();
            #endregion

            #region License Key
            app
                .MapPost("/API/LicenseKey/Create" , (_) => throw new NotImplementedException())
                .WithName("CreateLicenseKey")
                .WithOpenApi();
            #endregion

            #region Machine Design
            app
                .MapPost("/API/MachineDesign/Create" , (_) => throw new NotImplementedException())
                .WithName("CreateMachineDesign")
                .WithOpenApi();

            app
                .MapPost("/API/MachineDesign/Update" , (_) => throw new NotImplementedException())
                .WithName("UpdateMachineDesign")
                .WithOpenApi();

            app
                .MapDelete("/API/MachineDesign/Delete" , (_) => throw new NotImplementedException())
                .WithName("DeleteMachineDesign")
                .WithOpenApi();

            app
                .MapGet("/API/MachineDesign/Get" , (_) => throw new NotImplementedException())
                .WithName("GetMachineDesign")
                .WithOpenApi();
            #endregion
            #endregion

            app.Run();
        }
    }
}
