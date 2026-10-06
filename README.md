# Wheel of Names

A static wheel for picking the next name. No ads, no accounts, and the list is stored in the URL.

**[Try it](https://wheel.scaccoman.com)**

![Wheel of Names](./docs/preview.png)

## Features

- Spin from the wheel, the Spin button, or the Space bar. Skip with the button or Escape.
- The winner is announced as typed. Copy message keeps the host note and the link for the next round.
- Add, remove, shuffle, or edit the names. The address bar updates as you go.
- Unfair mode gives every name a random slice. Bigger slices are more likely to win.
- Light and dark themes, and a mute button. M mutes, except while typing.
- Works on phones and wide screens.

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
