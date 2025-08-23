# Vercel-like Deployment System (V2)

A scalable, container-based deployment system inspired by Vercel, featuring distributed build processes, S3 storage, and real-time logging with Kafka.

## System Architecture

- **API Server**: Handles project deployments and serves build artifacts
- **Build Server**: Processes build tasks in isolated Docker containers
- **S3 Storage**: Stores build artifacts and static files
- **Kafka**: Manages real-time build logs and events
- **ClickHouse**: Analytics and logging database
- **AWS ECS**: Container orchestration for build tasks

## Prerequisites

1. **AWS Account** with:
   - S3 bucket for build artifacts
   - ECS cluster configured
   - IAM user with appropriate permissions

2. **Kafka Cluster**
   - Deployed Kafka cluster with SSL authentication
   - Kafka topics for build logs and events

3. **ClickHouse Database**
   - Deployed ClickHouse instance
   - Database and tables for analytics

4. **Docker**
   - Docker installed on the build server
   - AWS ECR access configured

## Environment Setup

### 1. API Server Setup

Create `.env` file in `api-server/`:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-east-1

# ECS Configuration
ECS_CLUSTER=your-ecs-cluster
ECS_TASK_DEFINITION=your-task-definition

# Kafka Configuration
KAFKA_BROKERS=your-kafka-brokers
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
KAFKA_TOPIC_LOGS=build-logs

# ClickHouse Configuration
CLICKHOUSE_HOST=your-clickhouse-host
CLICKHOUSE_DATABASE=vercel
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your-password
```

### 2. Build Server Setup

Create `.env` file in `build-server/`:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=your-builds-bucket

# Kafka Configuration
KAFKA_BROKERS=your-kafka-brokers
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
KAFKA_TOPIC_LOGS=build-logs

# Build Configuration
NODE_ENV=production
```

## Running the System

### 1. Start API Server

```bash
cd api-server
npm install
node index.js
```

### 2. Deploy Build Server

Build and push the Docker image:

```bash
cd build-server
docker build -t vercel-build-server .
docker push your-ecr-repo/vercel-build-server:latest
```

Deploy to ECS:
```bash
# Update the task definition with the new image
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Update the service
aws ecs update-service --cluster your-cluster --service vercel-build-service --task-definition your-task-definition --force-new-deployment
```

### 3. S3 Reverse Proxy

```bash
cd s3-reverse-proxy
npm install
node index.js
```

## Deployment Flow

1. **Project Creation**
   - POST `/project` to create a new project
   - Returns project ID and deployment configuration

2. **Deployment Trigger**
   - Push code to the repository
   - Webhook triggers the build process
   - API server creates a new deployment record

3. **Build Process**
   - API server launches ECS task with build server
   - Build server clones the repository
   - Builds the project using the specified framework
   - Uploads artifacts to S3
   - Sends real-time logs to Kafka

4. **Deployment**
   - Update DNS records to point to the new deployment
   - Serve static files via S3 reverse proxy

## Monitoring and Logs

- **Real-time Logs**: Streamed via Kafka and displayed in the dashboard
- **Analytics**: Stored in ClickHouse for querying and visualization
- **Build Status**: Tracked in the database and updated in real-time

## Security Considerations

1. **Secrets Management**
   - Store sensitive information in environment variables
   - Use AWS Secrets Manager for production

2. **Network Security**
   - Enable VPC for all AWS resources
   - Restrict S3 bucket policies
   - Use security groups to control traffic

3. **Authentication**
   - Implement JWT for API authentication
   - Use IAM roles for AWS services

## Troubleshooting

1. **Build Failures**
   - Check ECS task logs
   - Verify IAM permissions
   - Ensure sufficient resources (CPU/memory)

2. **Deployment Issues**
   - Check DNS propagation
   - Verify S3 bucket policies
   - Check reverse proxy configuration

3. **Kafka Connection Issues**
   - Verify broker URLs
   - Check SSL certificates
   - Validate credentials

## Scaling

- **Horizontal Scaling**: Add more ECS tasks for build servers
- **Vertical Scaling**: Increase instance sizes for more resources
- **Auto-scaling**: Configure based on build queue length
