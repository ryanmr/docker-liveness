#!/home/ryan/.volta/bin/node /home/linuxbrew/.linuxbrew/bin/zx

// depending on the environment this script runs in,
// you need to reference zx accordingly
// the default is `#!/usr/bin/env zx`
// but this server is special and uses volta and linuxbrew zx (installed through yarn)

import "zx/globals";
import { $ } from "zx";
import axios from "axios";

/**
 * In order for zx to run some commands like `systemctl`,
 * as my `ryan` user, we need to ensure that the environment in the `child_process` is setup properly.
 * @see https://github.com/google/zx#attaching-a-profile
 *
 * Path sets volta installed node and brew/yarn installed zx, and system commands.
 * DBUS_SESSION_BUS_ADDRESS/XDG_RUNTIME_DIR are harded coded here for docker interaction.
 */
const setup = [
  "export PATH=/home/ryan/.volta/bin:/home/linuxbrew/.linuxbrew/bin::/home/linuxbrew/.linuxbrew/sbin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
  "export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus",
  "export XDG_RUNTIME_DIR=/run/user/1000",
];

$.prefix += setup.join("; ") + "; ";

void (async function main() {
  console.info(`docker liveness check ${new Date().toISOString()}`);

  // --
  // 1. we need to hit http://localhost
  // if it doesn't reply, then it pihole is down and docker is likely dead

  const liveness = await isWellKnownServiceAlive();
  console.info(`liveness status: ${liveness}`);

  if (liveness === "alive") {
    console.info("🟢 docker is alive");
    return;
  } else if (liveness === "loading") {
    console.info("🔵 docker is loading");
    return;
  } else {
    console.info("🟠 docker is dead");
  }

  // 2. stop docker desktop
  // ubuntu command for docker desktop: systemctl --user stop docker-desktop

  const resultStop = await $`systemctl --user stop docker-desktop`;

  // 3. wait a while until docker can startup properly
  await delay(10 * 1000);

  // 4. start docker desktop
  // ubuntu command for docker desktop: systemctl --user start docker-desktop

  const resultStart = await $`systemctl --user start docker-desktop`;

  // 5. wait until docker comes up
  const resultDocker = await waitUntilDockerComesUp();

  if (resultDocker) {
    console.info("🟢 docker started successfully");
  } else {
    console.info("😝 docker did not start");
  }

  // --
})()
  .then(() => console.info("all done 😺"))
  .catch((err) => {
    console.info("there was an error 🙀");
    console.error(err);
  });

async function isWellKnownServiceAlive() {
  try {
    await axios.get("http://localhost", { timeout: 1000 });
    return "alive";
  } catch (err) {
    // ECONNRESET
    if (err.code === "ECONNABORTED" || err.code === "ECONNREFUSED") {
      // if the timeout is hit or the connect is refused actively,
      // then we can think that docker is dead
      return "dead";
    } else if (err.code === "ECONNRESET") {
      // if docker is loading it's possible that the script
      // might connect to the well known canary
      // but could get disconnected; no reason to restart the system for this case
      return "loading";
    }

    console.warn("unknwon error occured during the liveness check");
    throw err;
  }
}

/**
 *
 * @returns
 */
async function waitUntilDockerComesUp() {
  const max = 50;
  for (let i = 0; i < max; i++) {
    const v = await isWellKnownServiceAlive();
    console.info(`🖍 docker was ${v}`);
    if (v === "alive") {
      return true;
    }
  }

  return false;
}

function delay(duration = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}
