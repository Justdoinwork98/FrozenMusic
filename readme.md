## Prerequisites

### Install Node.js and npm
Download and install the **LTS** version from: [https://nodejs.org/](https://nodejs.org/)

After installation, verify that the following command return the version numbers:
```bash
node -v
npm -v
```

### Install dependencies

```bash
npm install
cd frontend
npm install
cd ..
```

### Run the app in development

```bash
npm run dev
```

## Useful Scripts

| Command         | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Run React + Electron in dev mode             |
| `npm run build` | Build React frontend for production          |
| `npm start`     | Launch Electron using production build       |
| `npm run dist`  | Build and package your app into an installer |

---

## Building an Installer
First build the frontend
```bash
npm run build
```
Then build the installer (run this as administrator)
```bash
npm run dist
```