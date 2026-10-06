# Wheel of Names

A static wheel for picking the next name. No ads, no accounts, and the list is stored in the URL.

**[Try it](https://wheel.scaccoman.com)**

![Wheel of Names](./docs/preview.png)

## Features

- The list lives in the link (`?names=`), so a shared URL opens the same wheel.
- Spin from the wheel, the Spin button, or Space. Skip with the button or Escape.
- The winner is announced as typed. Copy the host message, or remove that name and spin again.
- Add one name, paste many, then remove, shuffle, or edit the list. The address bar updates as you go.
- Unfair mode gives every name a random slice. Bigger slices are more likely to win, and that setting is saved in the link.
- Light and dark themes. Sound is on until you mute it. M mutes, except while typing.
- The wheel fills a wide window. On a phone, the page scrolls with the names.

## Local development

Yarn 4 is pinned in the repo.

```bash
yarn
yarn start
```

- `yarn test`
- `yarn lint`
- `yarn build` outputs to `dist/`

## Stack

React, TypeScript, Webpack, SCSS, Jest.

## License

MIT. See [LICENSE.md](./LICENSE.md).
