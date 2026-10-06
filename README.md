# Wheel of Names

Spin a wheel to pick the next name. No ads, no accounts, and nothing stored on a server — the list lives in the URL, so a wheel is just a link you can send.

**[Open the live wheel](https://wheel.scaccoman.com)**

![Wheel of Names, with a pastel wheel and an editable list of names](./docs/preview.png)

## What it does

- Click the wheel to spin. The winner gets a short celebration, then drops off the list so the next round picks someone else.
- Edit names in the box on the side. The address bar stays in sync, which makes the current wheel easy to share or bookmark.
- Unfair mode gives each slice a random size.
- Sound plays on spin and when someone wins.
- The layout works on phones and on wide screens.

I built it because every wheel I found wanted an account, an ad, or both. This one is a static page.

## Run it locally

The repo pins Yarn 4.

```bash
yarn
yarn start
```

- `yarn test` runs Jest
- `yarn lint` runs ESLint
- `yarn build` writes a production build to `dist/`

## Stack

React, TypeScript, Webpack, SCSS, and Jest.

## License

Distributed under the MIT license. See [LICENSE.md](./LICENSE.md).
