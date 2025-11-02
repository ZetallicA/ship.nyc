FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 7000
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["InterShip.Api/InterShip.Api.csproj", "InterShip.Api/"]
COPY ["InterShip.Core/InterShip.Core.csproj", "InterShip.Core/"]
COPY ["InterShip.Infrastructure/InterShip.Infrastructure.csproj", "InterShip.Infrastructure/"]
RUN dotnet restore "InterShip.Api/InterShip.Api.csproj"
COPY . .
WORKDIR "/src/InterShip.Api"
RUN dotnet build "InterShip.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "InterShip.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "InterShip.Api.dll"]






