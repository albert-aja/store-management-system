# ------------------------------------------------------------------------------
# SMS Authoritative Backend Dockerfile (Modular Monolith - Spring Boot 4.1 / Java 21)
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Cache Maven dependencies
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B || true

# Build production JAR
COPY src src
RUN ./mvnw clean package -DskipTests -B

# Runtime Image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add unprivileged user for security
RUN addgroup -S smsgroup && adduser -S smsuser -G smsgroup
USER smsuser:smsgroup

COPY --from=builder /workspace/target/*.jar app.jar

ENV SERVER_PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
