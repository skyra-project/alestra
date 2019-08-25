# Alestra [![Discord](https://discordapp.com/api/guilds/254360814063058944/embed.png)](https://skyra.pw/join)

Alestra is a private Discord Bot used for [`canvas-constructor`]'s [official server][cc-server].

[`canvas-constructor`]: https://github.com/kyranet/CanvasConstructor
[cc-server]: https://discord.gg/taNgb9d

## Development Requirements

- [`Node.js`]: To run the project.
- [`Ny-API`]: (Dev Optional) Central server.

[`Node.js`]: https://nodejs.org/en/download/current/
[`Ny-API`]: https://github.com/kyranet/Ny-API

## Set-Up

Copy and paste the [`config.ts.example`] file and rename it to `config.ts`, then fill it with the precise variables.
Once all development requirements are set up:

```bash
# Lints and format all the code:
$ yarn lint

# Run Alestra in development mode:
$ yarn start

# Run Alestra in production mode, requires
# Ny-API to be running:
$ yarn pm2:start
```

> **Note**: Before pushing to the repository, please run `yarn lint` so formatting stays consistent and there are no
linter warnings.

[`config.ts.example`]: /config.ts.example

## Links

**Alestra links**

- [Support Server](https://skyra.pw/join)
- [Patreon](https://www.patreon.com/kyranet)

**Framework links**

- [Klasa's Website](https://klasa.js.org)
