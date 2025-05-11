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
using TuringMachine.Backend.Server.DbInteraction.Level;
using TuringMachine.Backend.Server.DbInteraction.Machine;
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
            app.MapGet(
                    "/api/try-get-response" ,
                    () => new ServerResponse<string>(ResponseStatus.SUCCESS , "Server Responded.")
                )
                .WithName("TryGetServerResponse")
                .WithOpenApi();

            app.MapGet(
                    "/api/validate" ,
                    async (string accessToken , DataContext db) => await AccessTokenInteraction.ValidateAccessTokenAsync(accessToken , db)
                )
                .WithName("GetValidation")
                .WithOpenApi();

            app.MapGet(
                    "/api/progress" , async (string accessToken , DataContext db) =>
                        {
                            ServerResponse<User> getUserResponse = (await AccessTokenInteraction.GetAndValidateUserAsync(accessToken , db));
                            return getUserResponse.Status switch
                            {
                                ResponseStatus.SUCCESS => await ProgressInteraction.GetLatestProgressAsync(getUserResponse.Result!.UUID.ToString() , db) ,
                                _                      => getUserResponse.WithThisTraceInfo("/api/progress" , ResponseStatus.BACKEND_ERROR),
                            };
                        }
                )
                .WithName("GetLatestProgress")
                .WithOpenApi();
            #endregion

            #region Login
            app.MapGet(
                    "/api/get-rsa-key" ,
                    () => new ServerResponse<string>(ResponseStatus.SUCCESS , rsa.ExportRSAPublicKeyPem())
                )
                .WithName("GetRsaKey")
                .WithOpenApi();

            app.MapPost(
                    "/api/login" , async (string username , string hashedPassword , string salt , DataContext db) =>
                        {
                            ServerResponse<string> getLoginResponse = await UserInteraction.LoginAsync(username , hashedPassword , salt , db);

                            if (getLoginResponse.Status is not ResponseStatus.SUCCESS)
                                return getLoginResponse.WithThisTraceInfo<LoginResponseBody>("/api/login" , getLoginResponse.Status);

                            return new ServerResponse<LoginResponseBody>(
                                ResponseStatus.SUCCESS ,
                                new LoginResponseBody { AccessToken = getLoginResponse.Result! , }
                            );
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
                        ServerResponse validateAccessTokenResponse = await AccessTokenInteraction.ValidateAccessTokenAsync(accessToken , db);
                        if (validateAccessTokenResponse.Status is not ResponseStatus.SUCCESS)
                            return validateAccessTokenResponse.WithThisTraceInfo<ICollection<SimplifiedLevelResponseBody>>("/api/levels" , ResponseStatus.BACKEND_ERROR);

                        ServerResponse<ICollection<SimplifiedLevelResponseBody>> getSimplifiedLevelTemplateResponse = await LevelInteraction.GetSimplifiedLevelTemplateInfosAsync(db);
                        if (getSimplifiedLevelTemplateResponse.Status is not ResponseStatus.SUCCESS)
                            return getSimplifiedLevelTemplateResponse.WithThisTraceInfo<ICollection<SimplifiedLevelResponseBody>>("/api/levels" , ResponseStatus.BACKEND_ERROR);

                        return getSimplifiedLevelTemplateResponse;
                    }
            );

            app.MapGet(
                    "/api/level" , async (string accessToken , byte levelID , DataContext db) =>
                        {
                            ServerResponse<User> getUserResponse = await AccessTokenInteraction.GetAndValidateUserAsync(accessToken , db);
                            if (getUserResponse.Status is not ResponseStatus.SUCCESS)
                                return getUserResponse.WithThisTraceInfo<LevelResponseBody>("/api/level" , ResponseStatus.BACKEND_ERROR);

                            ServerResponse<LevelResponseBody> getUserLevelInfoResponse = LevelInteraction.GetUserLevelInfo(getUserResponse.Result!.UUID.ToString() , levelID , db);
                            if (getUserLevelInfoResponse.Status is not ResponseStatus.SUCCESS)
                                return getUserLevelInfoResponse.WithThisTraceInfo<LevelResponseBody>("/api/level" , ResponseStatus.BACKEND_ERROR);

                            return getUserLevelInfoResponse;
                        }
                )
                .WithName("GetLevels")
                .WithOpenApi();
            #endregion

            #region Designer
            app.MapPost(
                    "/api/level" , async (string accessToken , byte levelID , LevelResponseBody level , DataContext db) =>
                        {
                            ServerResponse<User> getUserResponse = await AccessTokenInteraction.GetAndValidateUserAsync(accessToken , db);
                            if (getUserResponse.Status is not ResponseStatus.SUCCESS)
                                return getUserResponse.WithThisTraceInfo<LevelResponseBody>("/api/level" , ResponseStatus.BACKEND_ERROR);

                            ServerResponse updateProgressResponse = await ProgressInteraction.UpdateProgressAsync(getUserResponse.Result!.UUID.ToString() , levelID , level.Design , level.IsSolved , db);
                            if (updateProgressResponse.Status is not ResponseStatus.SUCCESS)
                                return updateProgressResponse.WithThisTraceInfo<LevelResponseBody>("/api/level" , ResponseStatus.BACKEND_ERROR);

                            return updateProgressResponse;
                        }
                )
                .WithName("PostLevelProgress")
                .WithOpenApi();

            app.MapPost(
                    "/api/save" , async (string accessToken , byte levelID , TuringMachineDesign design , DataContext db) =>
                        {
                            ServerResponse<User> getUserResponse = await AccessTokenInteraction.GetAndValidateUserAsync(accessToken , db);
                            if (getUserResponse.Status is not ResponseStatus.SUCCESS)
                                return getUserResponse.WithThisTraceInfo<LevelResponseBody>("/api/save" , ResponseStatus.BACKEND_ERROR);

                            ServerResponse updateProgressAsync = await ProgressInteraction.UpdateProgressAsync(getUserResponse.Result!.UUID.ToString() , levelID , design , false , db);
                            if (updateProgressAsync.Status is not ResponseStatus.SUCCESS)
                                return updateProgressAsync.WithThisTraceInfo<LevelResponseBody>("/api/save" , ResponseStatus.BACKEND_ERROR);

                            return updateProgressAsync;
                        }
                )
                .WithName("PostLevelDesign")
                .WithOpenApi();

            app.MapPost(
                    "/api/upload" , async (string accessToken , TuringMachineDesign design , DataContext db) =>
                        {
                            ServerResponse validateAccessTokenResponse = await AccessTokenInteraction.ValidateAccessTokenAsync(accessToken , db);
                            if (validateAccessTokenResponse.Status is not ResponseStatus.SUCCESS)
                                return validateAccessTokenResponse.WithThisTraceInfo<string>("/api/upload" , ResponseStatus.BACKEND_ERROR);

                            ServerResponse<string> insertTuringMachineDesignResponse = await MachineInteraction.InsertTuringMachineDesignAsync(design , db);
                            if (insertTuringMachineDesignResponse.Status is not ResponseStatus.SUCCESS)
                                return insertTuringMachineDesignResponse.WithThisTraceInfo<string>("/api/upload" , ResponseStatus.BACKEND_ERROR);

                            return insertTuringMachineDesignResponse;
                        }
                )
                .WithName("PostDesign")
                .WithOpenApi();

            app.MapGet(
                    "/api/import" , async (string accessToken , string designID , DataContext db) =>
                        {
                            ServerResponse validateAccessTokenResponse = await AccessTokenInteraction.ValidateAccessTokenAsync(accessToken , db);
                            if (validateAccessTokenResponse.Status is not ResponseStatus.SUCCESS)
                                return validateAccessTokenResponse.WithThisTraceInfo<TuringMachineDesign>("/api/import" , ResponseStatus.BACKEND_ERROR);

                            ServerResponse<TuringMachineDesign> getTuringMachineDesignResponse = MachineInteraction.GetTuringMachineDesign(designID , db);
                            if (getTuringMachineDesignResponse.Status is not ResponseStatus.SUCCESS)
                                return getTuringMachineDesignResponse.WithThisTraceInfo<TuringMachineDesign>("/api/import" , ResponseStatus.BACKEND_ERROR);

                            return getTuringMachineDesignResponse;
                        }
                )
                .WithName("GetTuringMachine")
                .WithOpenApi();

            app.MapGet(
                    "/api/stat" ,
                    async (string accessToken , byte levelID , DataContext db) =>
                        {
                            var getUserResponse = await AccessTokenInteraction.GetAndValidateUserAsync(accessToken , db);
                            if (getUserResponse.Status is not ResponseStatus.SUCCESS)
                                return getUserResponse.WithThisTraceInfo<RankingResponseBody>("/api/stat" , ResponseStatus.BACKEND_ERROR);

                            ServerResponse<RankingResponseBody> getRankingResponse = await ProgressInteraction.GetRankingAsync(getUserResponse.Result!.UUID.ToString() , levelID , db);
                            if (getRankingResponse.Status is not ResponseStatus.SUCCESS)
                                return getRankingResponse.WithThisTraceInfo<RankingResponseBody>("/api/stat" , ResponseStatus.BACKEND_ERROR);

                            return getRankingResponse;
                        }
                )
                .WithName("GetStatistic")
                .WithOpenApi();
            #endregion

            #region License Key
            app.MapPost(
                    "/api/gen-key" , async (DataContext db) =>
                        {
                            ServerResponse<string> createLicenseResponse = await LicenseKeyInteraction.CreateLicenseAsync(db);
                            if (createLicenseResponse.Status is not ResponseStatus.SUCCESS)
                                return createLicenseResponse.WithThisTraceInfo<string>("/api/gen-key" , ResponseStatus.BACKEND_ERROR);

                            return createLicenseResponse;
                        }
                )
                .WithName("PostGenerateLicenseKey")
                .WithOpenApi();
            #endregion
            #endregion

            app.Run();
        }
    }
}
