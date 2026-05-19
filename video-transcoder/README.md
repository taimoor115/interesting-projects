# Video Transcoder

An event-driven, serverless video transcoding pipeline built with TypeScript and AWS. Upload a raw video to S3, and the system automatically spins up an ECS Fargate container to transcode it into multiple resolutions (360p, 480p, 720p) — similar to how YouTube handles multi-quality video processing.

## How It Works

```
User uploads .mp4
      │
      ▼
 AWS S3 (raw bucket)
      │  S3 Event Notification
      ▼
  AWS SQS Queue
      │  Long polling (20s)
      ▼
 TypeScript Orchestrator  ──► Validates S3 event
      │                        Parses bucket + key
      │  RunTaskCommand
      ▼
 AWS ECS Fargate
      │  Passes BUCKET_NAME + KEY
      ▼
 Docker Container (FFmpeg)
      │
      ├──► 360p  (480×360)  ──► S3 transcoded/
      ├──► 480p  (858×480)  ──► S3 transcoded/
      └──► 720p  (1280×720) ──► S3 transcoded/
```

## Project Structure

```
video-transcoder/
├── src/
│   └── index.ts          # Orchestrator — polls SQS, launches ECS Fargate tasks
├── container/
│   ├── Dockerfile        # node:18-alpine + ffmpeg
│   ├── index.js          # FFmpeg worker — downloads, transcodes, uploads
│   └── package.json
├── .env.example          # All required environment variables
├── package.json
└── tsconfig.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/get-started)
- An AWS account with:
  - S3 bucket (raw video uploads)
  - S3 bucket (transcoded output)
  - SQS queue with S3 event notification configured
  - ECS cluster + Fargate task definition
  - IAM user with S3, SQS, and ECS permissions

## Setup

### 1. Install dependencies

```sh
pnpm install
```

### 2. Configure environment variables

```sh
cp .env.example .env
```

Edit `.env` and fill in your AWS values:

| Variable | Description |
| --- | --- |
| `AWS_REGION` | AWS region (e.g. `ap-south-1`) |
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `SQS_QUEUE_URL` | Full SQS queue URL |
| `ECS_CLUSTER` | ECS cluster name |
| `ECS_TASK_DEFINITION` | Task definition name + revision (e.g. `video-transcoder-task:1`) |
| `ECS_CONTAINER_NAME` | Container name inside the task definition |
| `ECS_SUBNET_1` | VPC subnet ID for Fargate (e.g. `subnet-0abc1234`) |
| `ECS_SUBNET_2` | Second subnet ID (optional, for availability) |

### 3. Run the orchestrator

```sh
pnpm dev
```

The orchestrator starts long-polling SQS. When a video is uploaded to S3, it automatically launches a Fargate container to process it.

## Docker — FFmpeg Worker

The `container/` directory holds the worker that runs inside ECS Fargate. It receives `BUCKET_NAME` and `KEY` as environment variables, downloads the video from S3, transcodes it to 360p / 480p / 720p in parallel, and uploads all outputs back to S3.

### Build the image

```sh
cd container
docker build -t video-transcoder-worker .
```

### Test locally

```sh
docker run \
  -e BUCKET_NAME=your-raw-bucket \
  -e KEY=your-video.mp4 \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  -e AWS_REGION=ap-south-1 \
  video-transcoder-worker
```

### Push to ECR (for ECS deployment)

```sh
# Authenticate
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com

# Tag & push
docker tag video-transcoder-worker:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/video-transcoder-worker:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/video-transcoder-worker:latest
```

## AWS Setup Checklist

- [ ] Create an S3 bucket for raw uploads
- [ ] Create an S3 bucket for transcoded output
- [ ] Configure S3 → SQS event notification on `ObjectCreated` events
- [ ] Create an SQS Standard Queue and attach an S3-compatible access policy
- [ ] Create an ECR repository and push the Docker image
- [ ] Create an ECS cluster (Fargate)
- [ ] Create a task definition pointing to your ECR image
- [ ] Create an IAM user/role with `s3:GetObject`, `s3:PutObject`, `sqs:*`, `ecs:RunTask` permissions
- [ ] Set all environment variables in `.env`

## Output

Transcoded files are saved to your S3 output bucket under the `transcoded/` prefix:

```text
transcoded/video-360p.mp4
transcoded/video-480p.mp4
transcoded/video-720p.mp4
```

## Tech Stack

- **TypeScript** — Orchestrator service
- **Node.js** — Runtime
- **AWS S3** — Raw video storage + transcoded output
- **AWS SQS** — Event queue (long polling)
- **AWS ECS Fargate** — Serverless container execution
- **Docker** — FFmpeg worker container
- **FFmpeg** (`fluent-ffmpeg`) — Video transcoding engine

## License

MIT
