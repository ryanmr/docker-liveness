# docker-liveness

> Keeps `docker-desktop` for Ubuntu from staying in a corrupted / semi-crashed state.

## tech

* zx
* axios
* node
* ubuntu / `systemctl`

## how it works

My `docker-desktop` runs pihole among other things, but for whatever reason, `docker-desktop` on Ubuntu 22.04 is fairly unstable. This script will check if `docker-desktop` has stopped responding. If it has, it will try to restart it.

## cron

Using userland `crontab -e`, we can set this `zx` script to regularly run and fix docker if it breaks.

```cron
*/1 * * * * /home/ryan/services/docker-liveness/index.js >> /home/ryan/services/docker-liveness/script.log 2>&1
```

## .env

Make your `.env` file with appropriate values:

```
DOCKER_LIVENESS_DISCORD_WEBHOOK_URL=
```