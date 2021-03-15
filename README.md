# Web-eID WebExtension

![European Regional Development Fund](https://github.com/open-eid/DigiDoc4-Client/blob/master/client/images/EL_Regionaalarengu_Fond.png)

The Web eID extension for the Chrome, Edge, Firefox and Opera web browsers is
built using the WebExtensions API, a cross-browser system for developing
extensions. The extension communicates with the Web eID native application
using Native messaging. Native messaging enables an extension to exchange
messages with a native application installed on the user's computer to enable
the extension to access resources that are not accessible through WebExtension
APIs, like the smart card subsystem.

## Setup (for developers/testers)

1. Install the latest LTS version of Node.js - [https://nodejs.org](https://nodejs.org)

2. Clone the project
    ```bash
    git clone git@gitlab.com:web-eid/webextension/web-eid-webextension.git
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

5. Load in Firefox as a Temporary Extension
    1. Open [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
    2. Click "Load temporary Add-on..." and open `/web-eid-webextension/dist/manifest.json`

### Configuration

Make sure the `NATIVE_APP_NAME` value in `src/config.ts` matches the one in
the Web-eID native application manifest file.

