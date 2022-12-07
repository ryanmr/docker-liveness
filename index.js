#!/home/ryan/.volta/bin/node /home/linuxbrew/.linuxbrew/bin/zx

// depending on the environment this script runs in,
// you need to reference zx accordingly
// the default is `#!/usr/bin/env zx`
// but this server is special and uses volta and linuxbrew zx (installed through yarn)

import "dotenv/config";

import { main } from "./core.js";

main()
  .then(() => console.info("all done 😺"))
  .catch((err) => {
    console.info("there was an error 🙀");
    console.error(err);
  });
