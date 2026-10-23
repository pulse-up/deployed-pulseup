FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml ./
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests clean package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN groupadd --system pulseup \
    && useradd --system --gid pulseup --home-dir /app pulseup

COPY --from=build /workspace/target/pulseup-api.jar /app/pulseup-api.jar
RUN chown pulseup:pulseup /app/pulseup-api.jar

USER pulseup
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar /app/pulseup-api.jar"]
