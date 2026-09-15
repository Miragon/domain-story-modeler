# Development

## Project Overview

This is a VS Code extension for "Domain Storytelling". It allows users to edit `.egn` files, which are used to model domain stories. The extension is a monorepo managed with Yarn, and it consists of several packages:

* **`apps/dst-plugin`**: The main VS Code extension. It contributes a custom editor for `.egn` files.
* **`apps/dst-webview`**: A webview that renders the diagram-js canvas with the published [`egon-core`](https://github.com/Miragon/egon-core) package. It is a single-page application (SPA) built with Vite.
* **`libs/vscode/data-transfer-objects`**: Contains data transfer objects (DTOs) used for communication between the plugin and the webview.
* **`libs/vscode/domain-story`**: Contains the domain logic for domain stories.

The extension uses `diagram-js` for rendering the diagrams and is written in TypeScript.

## Building and Running

### Build

To build the project, run the following command:

```bash
yarn build
```

This will build all the packages and place the output in the `dist` directory.

### Development

To run the project in development mode, run the following command:

```bash
yarn dev
```

This starts the shared libraries, webview, and extension in watch mode. The apps
resolve shared source through the repository's TypeScript path aliases, and the
modeler core is installed from its pinned release archive, so no pre-existing
local build artifacts are required. Press `F5` in VS Code to start the Extension
Host.

### Test

To run the tests, run the following command:

```bash
yarn test
```

This will run all the tests using Jest.

### Lint

To lint the code, run the following command:

```bash
yarn lint
```

### Tips & Tricks

#### Debugging the webview with WebStorm

1. Run `yarn serve`
2. Use the pre-configured debug configuration in [.run](../.run)
3. Add a breakpoint in [dst-webview](../apps/dst-webview/src). For modeler-core internals, use the upstream [`egon-core`](https://github.com/Miragon/egon-core) repository.
4. Run the debug configuration

## Development Conventions

* **Commit Messages**: The project uses [semantic commit messages](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716).
* **Coding Style**: The project uses ESLint and Prettier to enforce a consistent coding style.
* **Testing**: The project uses Jest for unit and integration testing.

## The Visual Studio Code Extension (VSCE)

This tool assists in packaging and publishing Visual Studio Code extensions.  
Read the [Documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)on the VS Code website.

```shell
vsce package --out egon-io.vsix --yarn --no-dependencies
```
