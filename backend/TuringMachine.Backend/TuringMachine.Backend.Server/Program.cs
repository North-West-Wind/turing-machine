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
using TuringMachine.Backend.Server.DbInteraction;
using TuringMachine.Backend.Server.DbInteraction.Level;
using TuringMachine.Backend.Server.DbInteraction.Progress;
using TuringMachine.Backend.Server.DbInteraction.UserManagement;
using TuringMachine.Backend.Server.Models.Machines;
using TuringMachine.Backend.Server.Models.Misc;
using TuringMachine.Backend.Server.Models.UserManagement;
using TuringMachine.Backend.Server.ServerResponses;
using TuringMachine.Backend.Server.ServerResponses.ResponseBody;

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
            #region Landing
            app.MapGet("/api/try-get-response" , () => new ServerResponse<string>(ResponseStatus.SUCCESS , "Server Responded."))
                .WithName("TryGetServerResponse")
                .WithOpenApi();

            app.MapGet(
                    "/api/validate" , async (string accessToken , DataContext db) =>
                        {
                            return (await AccessTokenInteraction.ValidateAccessTokenAsync(accessToken , db)).Status switch
                            {
                                ResponseStatus.SUCCESS         => new ServerResponse<object?>(ResponseStatus.SUCCESS) ,
                                ResponseStatus.TOKEN_EXPIRED   => new ServerResponse<object?>(ResponseStatus.TOKEN_EXPIRED) ,
                                ResponseStatus.USER_NOT_FOUND  => new ServerResponse<object?>(ResponseStatus.INVALID_TOKEN) ,
                                ResponseStatus.DUPLICATED_USER => new ServerResponse<object?>(ResponseStatus.DUPLICATED_USER) ,
                                _                              => throw new UnreachableException("/api/validate") ,
                            };
                        }
                )
                .WithName("GetValidation")
                .WithOpenApi();

            app.MapGet(
                    "/api/progress" , async (string accessToken , DataContext db) =>
                        {
                            (ResponseStatus status , User? user) = (await AccessTokenInteraction.GetAndValidateUserAsync(accessToken , db)).ToTuple();
                            return status switch
                            {
                                ResponseStatus.SUCCESS => await ProgressInteraction.GetLatestProgressAsync(user!.UUID.ToString() , db) ,
                                _                      => new ServerResponse<ProgressResponseBody>(status) ,
                            };
                        }
                )
                .WithName("GetLatestProgress")
                .WithOpenApi();
            #endregion

            #region Login
            app.MapGet("/api/get-rsa-key" , () => new ServerResponse<string>(ResponseStatus.SUCCESS , rsa.ExportRSAPublicKeyPem()))
                .WithName("GetRsaKey")
                .WithOpenApi();

            app.MapPost(
                    "/api/login" , async (string username , string hashedPassword , string salt , DataContext db) =>
                        {
                            return (await UserInteraction.LoginAsync(username , hashedPassword , salt , db)).ToTuple() switch
                            {
// @formatter:off
                                (ResponseStatus.SUCCESS          , { } accessToken) => new ServerResponse<LoginResponseBody?>(ResponseStatus.SUCCESS , new LoginResponseBody { AccessToken = accessToken }) ,
                                (ResponseStatus.USER_NOT_FOUND   ,  _             ) => new ServerResponse<LoginResponseBody?>(ResponseStatus.INVALID_USERNAME_OR_PASSWORD) ,
                                (ResponseStatus.INVALID_PASSWORD ,  _             ) => new ServerResponse<LoginResponseBody?>(ResponseStatus.INVALID_USERNAME_OR_PASSWORD) ,
                                (ResponseStatus.DUPLICATED_USER  ,  _             ) => new ServerResponse<LoginResponseBody?>(ResponseStatus.DUPLICATED_USER) ,
                                (ResponseStatus.BACKEND_ERROR    ,  _             ) => new ServerResponse<LoginResponseBody?>(ResponseStatus.BACKEND_ERROR) ,
                                _                                                   => throw new UnreachableException("/api/login") ,
// @formatter:on
                            };
                        }
                )
                .WithName("GetUserLogin")
                .WithOpenApi();

            app.MapPost(
                    "/api/register" , async (string username , string rsaEncryptedPassword , string licenseKey , DataContext db) =>
                        {
#if RELEASE
                            string password = Encoding.ASCII.GetString(rsa.Decrypt(Convert.FromBase64String(rsaEncryptedPassword) , RSAEncryptionPadding.Pkcs1));    // TODO: Testing with frontend
#else
                            string password = rsaEncryptedPassword;
#endif
                            return await UserInteraction.RegisterAsync(username , password , licenseKey , db);
                        }
                )
                .WithName("PostUserRegister")
                .WithOpenApi();
            #endregion

            #region Level Select
            app.MapGet(
                "/api/levels" , async (string accessToken , DataContext db) =>
                    {
                        return (await AccessTokenInteraction.ValidateAccessTokenAsync(accessToken , db)).Status switch
                        {
                            ResponseStatus.SUCCESS         => await LevelInteraction.GetSimplifiedLevelTemplateInfosAsync(db) ,
                            ResponseStatus.TOKEN_EXPIRED   => new ServerResponse<ICollection<SimplifiedLevelResponseBody>>(ResponseStatus.TOKEN_EXPIRED) ,
                            ResponseStatus.USER_NOT_FOUND  => new ServerResponse<ICollection<SimplifiedLevelResponseBody>>(ResponseStatus.INVALID_TOKEN) ,
                            ResponseStatus.DUPLICATED_USER => new ServerResponse<ICollection<SimplifiedLevelResponseBody>>(ResponseStatus.DUPLICATED_USER) ,
                            _                              => throw new UnreachableException("/api/level") ,
                        };
                    }
            );

            app.MapGet(
                    "/api/level" , async (string accessToken , byte levelID , DataContext db) =>
                        {
                            return (await AccessTokenInteraction.ValidateAccessTokenAsync(accessToken , db)).Status switch
                            {
                                ResponseStatus.SUCCESS         => await LevelInteraction.GetUserLevelInfoAsync(accessToken , levelID , db) ,
                                ResponseStatus.TOKEN_EXPIRED   => new ServerResponse<LevelResponseBody>(ResponseStatus.TOKEN_EXPIRED) ,
                                ResponseStatus.USER_NOT_FOUND  => new ServerResponse<LevelResponseBody>(ResponseStatus.INVALID_TOKEN) ,
                                ResponseStatus.DUPLICATED_USER => new ServerResponse<LevelResponseBody>(ResponseStatus.DUPLICATED_USER) ,
                                _                              => throw new UnreachableException("/api/level") ,
                            };
                        }
                )
                .WithName("GetLevels")
                .WithOpenApi();
            #endregion

            #region Designer
            app.MapPost("/api/level" , (_) => throw new NotImplementedException());

            app.MapPost("/api/save" , (_) => throw new NotImplementedException());

            app.MapPost(
                    "/api/upload" , async (string accessToken , TuringMachineDesign design , DataContext db) =>
                        {
                            return new ServerResponse<TuringMachineDesign>(ResponseStatus.SUCCESS , design);
                        }
                )
                .WithName("PostDesign")
                .WithOpenApi();

            app.MapGet(
                    "/api/import" , async (string accessToken , string designID , DataContext db) =>
                        {
                            return (await AccessTokenInteraction.ValidateAccessTokenAsync(accessToken , db)).Status switch
                            {
                                ResponseStatus.SUCCESS         => MachineInteraction.GetTuringMachineDesign(designID , db) ,
                                ResponseStatus.TOKEN_EXPIRED   => new ServerResponse<TuringMachineDesign>(ResponseStatus.TOKEN_EXPIRED) ,
                                ResponseStatus.USER_NOT_FOUND  => new ServerResponse<TuringMachineDesign>(ResponseStatus.INVALID_TOKEN) ,
                                ResponseStatus.DUPLICATED_USER => new ServerResponse<TuringMachineDesign>(ResponseStatus.DUPLICATED_USER) ,
                                _                              => throw new UnreachableException("/api/import") ,
                            };
                        }
                )
                .WithName("GetTuringMachine")
                .WithOpenApi();
            #endregion
            #endregion

            app.Run();
        }
    }
}
