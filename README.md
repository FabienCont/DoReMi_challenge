# DoReMi 3D Challenge

A DoReMi challenge website - An interactive 3D web game where you control a ball's position using your voice pitch.

## 🎵 How it works

The website uses microphone input to analyze your singing pitch. 
- Sing **Low** notes (e.g., Do/C) to keep the ball low.
- Sing **High** notes (e.g., Si/B) to raise the ball.
- Match the pitch to the holes in the walls to pass through obstacles.

## 🛠️ Tech Stack

- **[Nuxt 4](https://nuxt.com)** - Full-stack framework
- **[Nuxt UI](https://ui.nuxt.com)** - UI Component library
- **[TresJS](https://tresjs.org/)** - Declarative Three.js for Vue
- **Web Audio API** - Native pitch detection (Autocorrelation)


## Setup

Make sure to install the dependencies:

```bash
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

## License

[MIT](./LICENSE)
