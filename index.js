#!/home/ryan/.volta/bin/node /home/linuxbrew/.linuxbrew/bin/zx

// depending on the environment this script runs in,
// you need to reference zx accordingly
// the default is `#!/usr/bin/env zx`
// but this server is special and uses volta and linuxbrew zx (installed through yarn)

import "zx/globals";
import { $ } from "zx";
import axios from "axios";

void (async function main() {
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
  } else {
    console.info("🟠 docker is dead");
  }

  // 2. stop docker desktop
  // ubuntu command for docker desktop: systemctl --user stop docker-desktop

  const resultStop =
    await $`systemctl --machine=ryan --user stop docker-desktop`;

  // 3. wait a while until docker can startup properly
  await delay(10 * 1000);

  // 4. start docker desktop
  // ubuntu command for docker desktop: systemctl --user start docker-desktop

  const resultStart =
    await $`systemctl --machine=ryan --user start docker-desktop`;

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
      return "dead";
    } else if (err.code === "ECONNRESET") {
      return "loading";
    }

    console.warn("unknwon error occured during the liveness check");
    throw err;
  }
}

async function waitUntilDockerComesUp() {
  const max = 25;
  for (let i = 0; i < max; i++) {
    const v = await isWellKnownServiceAlive();
    if (v) {
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
