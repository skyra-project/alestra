# Alestra [![Discord](https://discordapp.com/api/guilds/254360814063058944/embed.png)](https://join.skyra.pw)

Alestra is a private Discord Bot used for [`canvas-constructor`]'s [official server][cc-server].

## Development Requirements

-   [`Node.js`]: To run the project.

## Set-Up

Copy and paste the [`config.ts.example`] file and rename it to `config.ts`, then fill it with the precise variables.
Once all development requirements are set up:

```bash
# Lints and format all the code:
$ yarn lint

# Run Alestra in development mode:
$ yarn start

# Run Alestra in production mode:
$ yarn pm2:start
```

> **Note**: Before pushing to the repository, please run `yarn lint` so formatting stays consistent and there are no
> linter warnings.

## Links

**Alestra links**

-   [Support Server](https://join.skyra.pw)
-   [Patreon](https://donate.skyra.pw/patreon)

**Framework links**

-   [Klasa's Website](https://klasa.js.org)

<!-- Link Dump -->

[`canvas-constructor`]: https://github.com/kyranet/CanvasConstructor
[cc-server]: https://discord.gg/taNgb9d
[`node.js`]: https://nodejs.org/en/download/current/
[`config.ts.example`]: /config.ts.example
