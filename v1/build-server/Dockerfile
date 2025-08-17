FROM ubuntu:focal

# Install dependencies
RUN apt-get update
RUN apt-get install -y curl git

# Install Node.js 20 + npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# Set working directory
WORKDIR /home/app

# Copy project files
COPY main.sh main.sh
COPY script.js script.js
COPY package*.json ./

# Install dependencies
RUN npm install

# Permissions
RUN chmod +x main.sh
RUN chmod +x script.js

# Entrypoint
ENTRYPOINT [ "/home/app/main.sh" ]

# FROM ubuntu:focal

# RUN apt-get update
# RUN apt-get install -y curl
# RUN curl -y https://deb.nodesource.com/setup_20.x | bash -
# RUN apt-get upgrade -y
# RUN apt-get install -y nodejs
# RUN apt-get install git -y

# WORKDIR /home/app

# COPY main.sh main.sh
# COPY script.js script.js
# COPY package*.json .
# RUN npm install


# RUN chmod +x main.sh
# RUN chmod +x script.js

# ENTRYPOINT [ "/home/app/main.sh" ]