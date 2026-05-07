# Infrastructure Notes

## Docker Disk Management

### Problem
Disk filled to 100% (149GB used on 150GB volume) due to accumulated Docker build layers
from failed builds. This caused Coolify to crash and the MCP server to lose connectivity.

### Resolution (2026-05-06)
- Ran `docker system prune -a -f` on host — freed ~125GB
- Restarted Coolify: `docker restart coolify`
- Fixed MCP server env var: `COOLIFY_URL` changed from `http://10.0.1.5:8080`
  to `http://coolify:8080` (hostname-based, survives container restarts)

### Prevention
Weekly cron added to host (runs Sunday 3am):
```
0 3 * * 0 docker system prune -a -f --filter "until=24h" >> /var/log/docker-prune.log 2>&1
```

To verify cron is set: `crontab -l`
To check prune log: `cat /var/log/docker-prune.log`

### Why hostname > IP
Coolify container IPs (e.g. 10.0.1.5) can change on restart.
The Docker hostname `coolify` resolves correctly within the shared Docker network
and is stable across restarts.
