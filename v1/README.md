# Build Server — Run & Deploy Instructions

This document explains how to build, run and push the build server Docker image, run a local Redis instance, and run the related API and proxy servers. Replace placeholder values (ALL_CAPS) with your real values.

## Prerequisites
- Docker installed and running
- (Optional) Docker Hub account for pushing images
- Node.js (for API / proxy servers)
- AWS credentials with S3 access
- Git configured to push to your GitHub repository

## S3
- Bucket name: replace with your bucket name, e.g. `my-build-bucket`
- S3 base URL (public objects): `https://{BUCKET_NAME}.s3.amazonaws.com//__outputs`
  - If using region-specific endpoints, use the appropriate URL for your region.

## Docker — build and push
From the `v1/build-server` directory where the Dockerfile exists:

- Build locally with a local tag:
  ```powershell
  docker build -t your_image_name .
  ```

- Build with a Docker Hub (or registry) tag:
  ```powershell
  docker build -t docker_hub_username/your_image_name:tagname .
  ```

- Tag latest (optional):
  ```powershell
  docker tag docker_hub_username/your_image_name:tagname docker_hub_username/your_image_name:latest
  ```

- Push to Docker Hub:
  ```powershell
  docker push docker_hub_username/your_image_name:latest
  ```

## Docker up / run
If you have a `docker-compose.yml`, use:
```powershell
docker-compose up -d
```

To run the image directly with required environment variables:
```powershell
docker run -it \
  -e AWS_ACCESS_KEY_ID=AWS_ID \
  -e AWS_SECRET_ACCESS_KEY=AWS_SECRET \
  -e PROJECT_ID=PROJECT_ID \
  -e GITHUB_REPOSITORY_URL="https://github.com/owner/repo.git" \
  --name your_image_name \
  docker_hub_username/your_image_name:latest
```

Notes:
- Do not include real secrets in commands you commit. Use CI secrets or environment management for production.

## Local Redis (Docker)
Run Redis locally in Docker so build-server / API can connect on port 6379:
```powershell
# Run Redis container bound to host 6379
docker run -d --name local-redis -p 6379:6379 redis:7
```

Verify with:
```powershell
docker ps
# or
redis-cli -h 127.0.0.1 -p 6379 ping
```

## API server (development)
1. Open a terminal in `v1/api-server`:
```powershell
cd v1\api-server
npm install
# run with node if no npm start script
node server.js
# or
npm start
```

The API server listens on port `9092` (see `server.js`). Ensure Redis is available at `localhost:6379` (or set env vars accordingly).

## Proxy server (development)
1. Open a terminal in `v1/proxy-server`:
```powershell
cd v1\proxy-server
npm install
node server.js
# or
npm start
```

## S3 bucket base URL usage
- Use the S3 base URL to upload or retrieve build artifacts. Example:
  `https://my-build-bucket.s3.amazonaws.com/path/to/artifact.tar.gz`

## Commit & push to GitHub
From repository root:
```powershell
git add .
git commit -m "Add build-server run instructions"
git push origin main
```

If you want this README in another location, copy or move `v1/build-server/README.md` to the desired path before committing.

---
If you need a `docker-compose.yml` example or CI pipeline example for building and pushing the image, say so and a sample will be provided.
