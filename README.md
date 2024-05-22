# Alestra [![Discord](https://discordapp.com/api/guilds/254360814063058944/embed.png)](https://join.skyra.pw)

**Alestra has been archived and is no longer maintained.** If you're looking for prototyping with [`canvas-constructor`],
you can use the button below as well as ask the [official server][cc-server] for help.

[![Edit on Stackblitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/canvas-constructor-vite?file=main.js)

~~Alestra is a private Discord Bot used for [`canvas-constructor`]'s [official server][cc-server].~~

## Development Requirements

-   [`Node.js`]: To run the project.

## Set-Up

Copy and paste the [`.env`] file and rename it to `.env.development.local`, then fill it with the precise variables.
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

-   [Sapphire's Website](https://www.sapphirejs.dev/)

<!-- Link Dump -->

[`canvas-constructor`]: https://github.com/kyranet/CanvasConstructor
[cc-server]: https://discord.gg/taNgb9d
[`node.js`]: https://nodejs.org/en/download/current/
[`.env`]: /src/.env
