/*
 * Copyright (c) 2020 The Web eID Project
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import TlsConnectionBrokenError from "@web-eid/web-eid-library/errors/TlsConnectionBrokenError";
import TlsConnectionInsecureError from "@web-eid/web-eid-library/errors/TlsConnectionInsecureError";
import TlsConnectionWeakError from "@web-eid/web-eid-library/errors/TlsConnectionWeakError";
import CertificateChangedError from "@web-eid/web-eid-library/errors/CertificateChangedError";
import ServerRejectedError from "@web-eid/web-eid-library/errors/ServerRejectedError";

import { OnHeadersReceivedDetails, CertificateInfo, Fingerprint } from "../../models/Browser/WebRequest";
import HttpResponse from "../../models/HttpResponse";
import { headersToObject } from "../../shared/utils";


export default class WebServerService {
  private fingerprints: Fingerprint[];

  constructor() {
    this.fingerprints = [];
  }

  hasCertificateChanged(): boolean {
    return !this.fingerprints.every((fingerprint) => this.fingerprints[0].sha256 === fingerprint.sha256);
  }

  async fetch<T>(fetchUrl: string, init?: RequestInit): Promise<HttpResponse<T>> {
    let certificateInfo: CertificateInfo | null;

    let fetchError: Error | null = null;


    let hasWebRequestPermission = false;
    try {
      hasWebRequestPermission = await browser.permissions.contains({
        permissions: [
          "webRequest",
          "webRequestBlocking",
        ],
      });
    } catch(error) {
      console.log("Failed to fetch permissions", error);
    }

    certificateInfo = null;

    const onHeadersReceivedListener = async (details: OnHeadersReceivedDetails): Promise<any> => {
      const securityInfo = await browser.webRequest.getSecurityInfo(
        details.requestId,
        { rawDER: true }
      );

      switch (securityInfo.state) {
        case "secure": {
          certificateInfo = securityInfo.certificates[0];

          this.fingerprints.push(certificateInfo.fingerprint);

          if (this.hasCertificateChanged()) {
            fetchError = new CertificateChangedError();
            return { cancel: true };
          }

          break;
        }

        case "broken": {
          fetchError = new TlsConnectionBrokenError(`TLS connection was broken while requesting ${fetchUrl}`);
          return { cancel: true };
        }

        case "insecure": {
          fetchError = new TlsConnectionInsecureError(`TLS connection was insecure while requesting ${fetchUrl}`);
          return { cancel: true };
        }

        case "weak": {
          fetchError = new TlsConnectionWeakError(`TLS connection was weak while requesting ${fetchUrl}`);
          return { cancel: true };
        }

        default:
          fetchError = new Error("Unexpected connection security state");
          return { cancel: true };
      }
    };

    if (hasWebRequestPermission) {
      browser.webRequest.onHeadersReceived.addListener(
        onHeadersReceivedListener,
        { urls: [fetchUrl] },
        ["blocking"]
      );
    }

    try {
      const response = await fetch(fetchUrl, init);

      const headers = headersToObject(response.headers);

      const body = (
        headers["content-type"]?.includes("application/json")
          ? (await response.json())
          : (await response.text())
      ) as T;

      if (hasWebRequestPermission) {
        browser.webRequest.onHeadersReceived.removeListener(onHeadersReceivedListener);
      }

      const {
        ok,
        redirected,
        status,
        statusText,
        type,
        url,
      } = response;

      const result = {
        certificateInfo,
        ok,
        redirected,
        status,
        statusText,
        type,
        url,
        body,
        headers,
      };

      if (!ok) {
        fetchError = new ServerRejectedError();
        Object.assign(fetchError, {
          response: {
            ok,
            redirected,
            status,
            statusText,
            type,
            url,
            body,
            headers,
          },
        });
      }

      if (fetchError) {
        throw fetchError;
      }

      return result;

    } finally {
      if (hasWebRequestPermission) {
        browser.webRequest.onHeadersReceived.removeListener(onHeadersReceivedListener);
      }
    }
  }
}

