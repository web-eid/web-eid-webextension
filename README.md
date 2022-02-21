# Web-eID WebExtension

![European Regional Development Fund](https://github.com/open-eid/DigiDoc4-Client/blob/master/client/images/EL_Regionaalarengu_Fond.png)

The Web eID extension for the Chrome, Edge and Firefox web browsers is
built using the WebExtensions API, a cross-browser system for developing
extensions. The extension communicates with the [Web eID native application](https://github.com/web-eid/web-eid-app)
using Native messaging. Native messaging enables an extension to exchange
messages with a native application installed on the user's computer to enable
the extension to access resources that are not accessible through WebExtension
APIs, like the smart card subsystem.

The Web eID extension for Safari is built as a [Safari web extension](https://developer.apple.com/documentation/safariservices/safari_web_extensions). The source code of the Safari extension is in the [_web-eid-app_ GitHub repository](https://github.com/web-eid/web-eid-app), in the `src/mac` subdirectory, as it uses native code written in Objective-C that links with _web-eid-app_ code. The JavaScript layer of the Web eID Safari extension comes from the current WebExtension repository though. See the Safari extension overview in the [_web-eid-app_ README](https://github.com/web-eid/web-eid-app#safari-extension) for more details.

## Setup (for developers/testers)

1. Install the latest LTS version of Node.js - [https://nodejs.org](https://nodejs.org)

2. Clone the project
    ```bash
    git clone --recurse-submodules git@gitlab.com:web-eid/webextension/web-eid-webextension.git
    ```

3. Install dependencies
    ```bash
    cd web-eid-webextension
    npm install
    ```

4. Build the project with zip packages
    ```bash
    npm run clean build package
    ```

    For reproducible builds, set the `SOURCE_DATE_EPOCH` environment variable.  
    See [https://reproducible-builds.org/docs/source-date-epoch](https://reproducible-builds.org/docs/source-date-epoch) for details.
    ```bash
    SOURCE_DATE_EPOCH=$(git log -1 --pretty=%ct) npm run clean build package
    ```

    Alternatively, for reproducible builds, the `SOURCE_DATE_EPOCH` value can be taken from the `SOURCE_DATE_EPOCH` file of a previous build.
    ```bash
    SOURCE_DATE_EPOCH=$(cat ../previous-build/dist/firefox/SOURCE_DATE_EPOCH) npm run clean build package
    ```

    For backwards compatibility with TokenSigning API, set the `TOKEN_SIGNING_BACKWARDS_COMPATIBILITY` environment variable to `true`.
    ```bash
    TOKEN_SIGNING_BACKWARDS_COMPATIBILITY=true npm run clean build package
    ```

    During development, for additional logging, set the `DEBUG` environment variable to `true`.
    ```bash
    DEBUG=true npm run clean build package
    ```

5. Load in Firefox as a Temporary Extension
    1. Open [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
    2. Click "Load temporary Add-on..." and open `/web-eid-webextension/dist/manifest.json`

### Configuration

Make sure the `NATIVE_APP_NAME` value in `src/config.ts` matches the one in
the Web-eID native application manifest file.

