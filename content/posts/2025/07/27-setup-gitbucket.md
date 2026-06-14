---
title: "GitBucket Setup and Configuration Guide"
date: "2025-07-27"
updated: "2025-07-27"
slug: "setup-gitbucket"
published: true
layout: "blog-post"
tags:
  - git
  - programming
  - coding
  - development
  - productivity
  - tools
  - ssh
  - database
  - mysql
  - postgresql
  - dns
  - server-setup
  - java
  - war-file
---

## Download the GitBucket WAR File

Download the latest [GitBucket WAR file](https://github.com/gitbucket/gitbucket/releases).  
Verify the checksum or signature before use when available to ensure the file has not been tampered with.

## Running the GitBucket WAR File

You can run GitBucket directly with the Java runtime:

```bash
java -jar gitbucket.war
```

Alternatively, deploy the WAR file to a servlet container (e.g., Tomcat) for integration with existing infrastructure.  
Startup may display logging-related warnings (e.g., missing config files or logback fallback notices); these are non-fatal.  
Use `journalctl` or your container logs to monitor the service:

```bash
journalctl -u gitbucket -f
```

## Logging and Troubleshooting

System logs provide the most reliable source of error context:

```bash
sudo systemctl status gitbucket
journalctl -u gitbucket -f
```

If GitBucket fails to start or returns generic HTTP errors, check the underlying database logs and JVM output.  
Enable debug logging in the GitBucket configuration if you need detailed stack traces.

## Configuring GitBucket for Production Use

The default embedded H2 database is not persistent or scalable. For production use:

1. Set up MySQL or PostgreSQL.
2. Configure GitBucket with JDBC connection parameters.

Example for PostgreSQL:

```bash
GITBUCKET_HOME=/opt/gitbucket
cat > $GITBUCKET_HOME/database.conf <<EOF
db.url=jdbc:postgresql://localhost:5432/gitbucket
db.user=gitbucket_user
db.password=secure_password
EOF
```

Ensure the target database exists and credentials are valid.

## Database Error Diagnosis

GitBucket will display HTTP 500 errors for most database issues, masking the actual cause.  
Inspect the database server logs directly:

```bash
# MySQL
sudo tail -f /var/log/mysql/error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

Check for authentication failures, permission denials, invalid schema references, or dropped connections.  
Also validate firewall rules and SELinux/AppArmor settings if applicable.

## SSH Configuration for GitBucket

GitBucket supports SSH-based Git operations.  
Avoid port 22 for GitBucket’s SSH due to system constraints or shared services. Use an unprivileged high-numbered port like 29418.  
Redirect standard port 22 to 29418 to maintain client compatibility:

```bash
iptables -t nat -A PREROUTING -p tcp --dport 22 -j REDIRECT --to-port 29418
iptables -A INPUT -p tcp --dport 29418 -j ACCEPT
```

Persist firewall rules:

```bash
sudo iptables-save > /etc/iptables/rules.v4
```

Ensure the GitBucket instance listens on the specified SSH port. Configure this in `gitbucket.conf`:

```properties
gitbucket.ssh.port=29418
```

Restart the service after applying changes.

## Network and DNS Setup

If GitBucket is hosted on a VPN, container, or isolated interface, assign a static IP:

```bash
ip addr add 10.8.0.2/24 dev tun0
```

Update your DNS server or `/etc/hosts` to resolve a proper hostname:

```
gitbucket.example.com. IN A 10.8.0.2
```

DNS is essential for:

- Hostname-based Git operations
- SSL certificate issuance
- API and webhook consistency
- Integrations with CI/CD or other tools

Allow for DNS propagation delays before testing public access.

## Generating and Adding SSH Keys in GitBucket

To authenticate via SSH:

1. Generate a key pair on the client machine:

```bash
ssh-keygen -t rsa -b 4096 -C "user@example.com"
```

2. Copy the public key:

```bash
cat ~/.ssh/id_rsa.pub
```

3. Log into GitBucket.
4. Navigate to **User Settings > SSH Keys**.
5. Paste and save the public key.

Ensure:

- The SSH daemon is configured to accept the port used by GitBucket.
- GitBucket's internal SSH service is running and correctly mapped to that port.
- No firewall or SELinux rule is blocking the custom port.

Test with:

```bash
ssh -T -p 29418 git@gitbucket.example.com
```

## Summary of Critical Points

- Always use MySQL or PostgreSQL in production; H2 is not durable or scalable.
- Check systemd and database logs for all unexplained HTTP errors.
- Use a non-privileged SSH port and port-forward 22 if compatibility is needed.
- Set a dedicated static IP and configure DNS with proper hostname resolution.
- Upload SSH public keys into GitBucket UI for access control.
- Validate and test each component (JVM, database, SSH, firewall) independently before final deployment.
