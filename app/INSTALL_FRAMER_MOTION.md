# Install Framer Motion

The Customer Home page uses Framer Motion for smooth animations. You need to install it:

## Installation

### Using npm:
```bash
cd app
npm install framer-motion
```

### Using yarn:
```bash
cd app
yarn add framer-motion
```

### Using pnpm:
```bash
cd app
pnpm add framer-motion
```

## Verify Installation

After installation, you can verify by checking:
```bash
cd app
npm list framer-motion
```

You should see the version number if it's installed correctly.

## Note

If you see errors like "Cannot find module 'framer-motion'" after installation:
1. Make sure you installed it in the `app` directory
2. Restart your development server
3. Clear your Next.js cache: `rm -rf .next` (or `.next` folder on Windows)

