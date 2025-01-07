# Use an Alpine base image
FROM alpine:latest

# Install necessary packages
RUN apk add --no-cache bash curl jq

# Copy the update-dns-record script to the container
COPY update-dns-record.sh /usr/local/bin/update-dns-record.sh

# Make the script executable
RUN chmod +x /usr/local/bin/update-dns-record.sh

# Add a crontab entry to run the script every hour
RUN echo "0 * * * * /usr/local/bin/update-dns-record.sh" > /etc/crontabs/root

# Start the cron daemon
CMD ["crond", "-f"]
