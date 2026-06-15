/*
 * Copyright (c) 2020-2026 Estonian Information System Authority
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

import Action from "@web-eid.js/models/Action";
import ErrorCode from "@web-eid.js/errors/ErrorCode";
import UserCancelledError from "@web-eid.js/errors/UserCancelledError";

import {
  NativeAuthenticateResponse,
  NativeGetSigningCertificateResponse,
  NativeSignResponse,
} from "@web-eid.js/models/message/NativeResponse";

import { MessageSender } from "../../../models/Browser/Runtime";
import NativeAppService from "../../services/NativeAppService";
import authenticate from "../authenticate";
import getSigningCertificate from "../getSigningCertificate";
import sign from "../sign";

const SENDER: MessageSender = {
  tab: { id: 1 },
  url: "https://example.com/path?query=1#fragment",
};

function mockNativeConnect(version = "2.4.1"): jest.SpyInstance {
  return jest.spyOn(NativeAppService.prototype, "connect").mockResolvedValue({ version });
}

function mockNativeSend(response: object): jest.SpyInstance {
  return jest.spyOn(NativeAppService.prototype, "send").mockResolvedValue(response);
}

describe("background native IPC actions", () => {
  let closeSpy: jest.SpyInstance;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    closeSpy = jest.spyOn(NativeAppService.prototype, "close").mockImplementation(() => undefined);
    consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends authenticate request arguments to web-eid-app and maps the response", async () => {
    mockNativeConnect("2.9.0+0");
    const nativeResponse: NativeAuthenticateResponse = {
      algorithm:             "ES256",
      appVersion:            "https://web-eid.eu/web-eid-app/releases/2.9.0+0",
      format:                "web-eid:1.0",
      signature:             "base64-signature",
      unverifiedCertificate: "base64-auth-certificate",
    };
    const sendSpy = mockNativeSend(nativeResponse);

    const response = await authenticate(
      "12345678123456781234567812345678912356789123",
      SENDER,
      "2.4.1",
      12345,
      "et"
    );

    expect(sendSpy).toHaveBeenCalledWith(
      {
        command: "authenticate",
        arguments: {
          challengeNonce: "12345678123456781234567812345678912356789123",
          lang:           "et",
          origin:         "https://example.com",
        },
      },
      12345,
      expect.objectContaining({ code: ErrorCode.ERR_WEBEID_USER_TIMEOUT })
    );
    expect(response).toEqual({
      action: Action.AUTHENTICATE_SUCCESS,
      ...nativeResponse,
    });
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it("sends get-signing-certificate request arguments to web-eid-app and maps the response", async () => {
    mockNativeConnect();
    const nativeResponse: NativeGetSigningCertificateResponse = {
      certificate: "base64-signing-certificate",
      supportedSignatureAlgorithms: [
        {
          cryptoAlgorithm: "ECC",
          hashFunction:    "SHA-384",
          paddingScheme:   "NONE",
        },
      ],
    };
    const sendSpy = mockNativeSend(nativeResponse);

    const response = await getSigningCertificate(SENDER, "2.4.1", 12345, "en");

    expect(sendSpy).toHaveBeenCalledWith(
      {
        command: "get-signing-certificate",
        arguments: {
          lang:   "en",
          origin: "https://example.com",
        },
      },
      12345,
      expect.objectContaining({ code: ErrorCode.ERR_WEBEID_USER_TIMEOUT })
    );
    expect(response).toEqual({
      action: Action.GET_SIGNING_CERTIFICATE_SUCCESS,
      ...nativeResponse,
    });
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it("sends sign request arguments to web-eid-app and maps the response", async () => {
    mockNativeConnect();
    const nativeResponse: NativeSignResponse = {
      signature: "base64-signature",
      signatureAlgorithm: {
        cryptoAlgorithm: "RSA",
        hashFunction:    "SHA-384",
        paddingScheme:   "PSS",
      },
    };
    const sendSpy = mockNativeSend(nativeResponse);

    const response = await sign(
      "base64-signing-certificate",
      "base64-document-hash",
      "SHA-384",
      SENDER,
      "2.4.1",
      12345,
      "fi"
    );

    expect(sendSpy).toHaveBeenCalledWith(
      {
        command: "sign",
        arguments: {
          certificate:  "base64-signing-certificate",
          hash:         "base64-document-hash",
          hashFunction: "SHA-384",
          lang:         "fi",
          origin:       "https://example.com",
        },
      },
      12345,
      expect.objectContaining({ code: ErrorCode.ERR_WEBEID_USER_TIMEOUT })
    );
    expect(response).toEqual({
      action: Action.SIGN_SUCCESS,
      ...nativeResponse,
    });
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it("maps native user cancellation to an extension failure response", async () => {
    mockNativeConnect();
    jest.spyOn(NativeAppService.prototype, "send").mockRejectedValue(
      new UserCancelledError("User cancelled")
    );

    const response = await authenticate(
      "12345678123456781234567812345678912356789123",
      SENDER,
      "2.4.1",
      12345
    );

    expect(response).toEqual({
      action: Action.AUTHENTICATE_FAILURE,
      error:  expect.objectContaining({
        code:    ErrorCode.ERR_WEBEID_USER_CANCELLED,
        message: "User cancelled",
        name:    "UserCancelledError",
      }),
    });
    expect(consoleError).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it("maps native connection failures to extension failure responses before sending a request", async () => {
    const connectError = new Error("missing native application port");
    jest.spyOn(NativeAppService.prototype, "connect").mockRejectedValue(connectError);
    const sendSpy = jest.spyOn(NativeAppService.prototype, "send");

    const response = await getSigningCertificate(SENDER, "2.4.1", 12345);

    expect(sendSpy).not.toHaveBeenCalled();
    expect(response).toEqual({
      action: Action.GET_SIGNING_CERTIFICATE_FAILURE,
      error:  expect.objectContaining({
        code:    ErrorCode.ERR_WEBEID_UNKNOWN_ERROR,
        message: "missing native application port",
      }),
    });
    expect(consoleError).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });
});
