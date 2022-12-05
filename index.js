#!/usr/bin/env zx

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
  } else {
    console.info("🟠 docker is dead");
  }

  // 2. stop docker desktop
  // ubuntu command for docker desktop: systemctl --user stop docker-desktop

  const resultStop = await $`sudo systemctl --user stop docker-desktop`;

  // 3. wait a while until docker can startup properly
  await delay(10 * 1000);

  // 4. start docker desktop
  // ubuntu command for docker desktop: systemctl --user start docker-desktop

  const resultStart = await $`sudo systemctl --user start docker-desktop`;

  // 5. wait until docker comes up
  const resultDocker = await waitUntilDockerComesUp();

  if (resultDocker) {
    console.info("🟢 docker started successfully");
  } else {
    console.info("😝 docker did not start");
  }

  // --
})()
  .then(() => console.log("all done 😺"))
  .catch(() => console.log("there was an error 🙀"));

async function isWellKnownServiceAlive() {
  try {
    await axios.get("http://localhost", { timeout: 1000 });
    return "alive";
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      return "dead";
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
