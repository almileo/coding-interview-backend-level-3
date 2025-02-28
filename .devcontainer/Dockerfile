FROM node:16

# Set working directory
WORKDIR /workspace

# Install global dependencies
RUN npm install -g typescript ts-node ts-node-dev

# Install development utilities and Redis
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install git curl wget sqlite3 redis-server \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Set up Redis to bind to all interfaces
RUN sed -i 's/bind 127.0.0.1/bind 0.0.0.0/g' /etc/redis/redis.conf

# Create a startup script
RUN echo '#!/bin/bash\nservice redis-server start\nexec "$@"' > /entrypoint.sh \
    && chmod +x /entrypoint.sh

# Set bash as the default shell
SHELL ["/bin/bash", "-c"]

# Use the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]

# Default command keeps the container running
CMD ["bash", "-c", "while sleep 1000; do :; done"]