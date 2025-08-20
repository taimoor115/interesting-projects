# Custom Redis Server

This is a simple Redis-compatible server implementation in Node.js that supports basic commands like `SET` and `GET`.

## Features

- `SET key value` - Store a key-value pair
- `GET key` - Retrieve a value by key
- Redis protocol compatible responses
- Error handling for invalid commands

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- (Optional) Redis CLI for testing

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Server

Start the Redis server:
```bash
node redis-server.js
```

The server will start on port 8000 by default.

## Testing the Server

### Using Redis CLI

If you have Redis CLI installed locally:

```bash
redis-cli -p 8000
```

Then run commands like:
```
SET mykey "Hello"
GET mykey
```

### Using Docker

If you have Docker installed, you can use the official Redis CLI container:

```bash
docker run -it --rm redis redis-cli -h host.docker.internal -p 8000
```

Then test with Redis commands:
```
SET test "Docker test"
GET test
```

### Using Telnet

You can also use telnet for basic testing:

```bash
telnet localhost 8000
```

Then enter commands in the format:
```
*3
$3
SET
$5
mykey
$5
hello
```

## Example Session

```
$ redis-cli -p 8000
127.0.0.1:8000> SET greeting "Hello, Redis!"
+OK
127.0.0.1:8000> GET greeting
$13
Hello, Redis!
127.0.0.1:8000> GET nonexistent
$-1
127.0.0.1:8000> INVALID_COMMAND
-ERR unknown command 'INVALID_COMMAND'
```

## Notes

- This is a basic implementation for demonstration purposes
- Data is stored in memory and will be lost when the server restarts
- Only basic commands are implemented
- Not suitable for production use
