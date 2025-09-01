# Video Transcoder

## Overview

This project is a **Video Transcoder** system designed to efficiently convert video files from one format to another. It is built with Node.js and TypeScript, and is containerized using Docker for easy deployment and scalability. The system is suitable for both local development and production environments.

### Features
- Transcode videos to different formats
- Containerized for portability
- Easy integration into CI/CD pipelines
- Ready for cloud deployment

## Project Structure
```
video-transcoder/
│   README.md
│   package.json
│   pnpm-lock.yaml
│   tsconfig.json
│
├── container/
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
│
└── src/
    └── index.ts
```

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/get-started) installed
- [Node.js](https://nodejs.org/) (for local development)
- [pnpm](https://pnpm.io/) (if using pnpm for package management)

### Local Development

1. **Install dependencies:**
   ```sh
   pnpm install
   ```
2. **Run the TypeScript source directly:**
   ```sh
   pnpm start
   ```
   Or, if you want to run the containerized version:
   ```sh
   cd container
   pnpm install
   node index.js
   ```


### Running with Docker (Local & Production)

#### Build the Docker Image
```sh
cd container
# Build the Docker image
docker build -t video-transcoder .
```

#### Run the Docker Container (Local/Production)
The application does not expose a web port by default. Instead, you should run the container with the required environment variables for your transcoding job:

```sh
docker run -e BUCKET_NAME=taimoor-video-raw-bucket -e KEY=demo.mp4 video-transcoder
```

Replace `BUCKET_NAME` and `KEY` with your own values as needed.

You do **not** need to expose any ports unless you modify the application to run a web server.

#### Example Docker Compose Service
If you want to use Docker Compose for orchestration:
```yaml
services:
  video-transcoder:
    image: video-transcoder
    environment:
      - BUCKET_NAME=taimoor-video-raw-bucket
      - KEY=demo.mp4
    restart: always
```

## Environment Variables

## Environment Variables
- `BUCKET_NAME`: The name of the bucket containing the video file.
- `KEY`: The key (filename) of the video to transcode.

You can pass these variables directly with `-e` flags or use an `.env` file:
```sh
docker run --env-file .env video-transcoder
```

## Contributing
Feel free to open issues or submit pull requests for improvements.

## License
This project is licensed under the MIT License.
