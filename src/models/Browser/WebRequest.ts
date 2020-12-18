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

export type SecurityInfoStateType
  = "insecure"
  | "weak"
  | "broken"
  | "secure";

export type SecurityInfoProtocolVersionType
  = "TLSv1"
  | "TLSv1.1"
  | "TLSv1.2"
  | "TLSv1.3"
  | "unknown";

export type CertificateTransparencyStatusType
  = "not_applicable"
  | "policy_compliant"
  | "policy_not_enough_scts"
  | "policy_not_diverse_scts";

export type ResourceType
  = "main_frame"
  | "sub_frame"
  | "stylesheet"
  | "script"
  | "image"
  | "object"
  | "object_subrequest"
  | "xmlhttprequest"
  | "xbl"
  | "xslt"
  | "ping"
  | "beacon"
  | "xml_dtd"
  | "font"
  | "media"
  | "websocket"
  | "csp_report"
  | "imageset"
  | "web_manifest"
  | "speculative"
  | "other";

export type UrlClassificationFlagType
  = "fingerprinting"
  | "fingerprinting_content"
  | "cryptomining"
  | "cryptomining_content"
  | "tracking"
  | "tracking_ad"
  | "tracking_analytics"
  | "tracking_social"
  | "tracking_content"
  | "any_basic_tracking"
  | "any_strict_tracking"
  | "any_social_tracking";

export type TransportWeaknessReasons = "cipher";

export type OnHeadersReceivedOptions = "blocking" | "responseHeaders";

export default interface WebRequest {
  /**
   *
   * @param requestId ID of the request for which you want security info.
   * You can get this from the details object that is passed into any webRequest event listeners.
   *
   * @param options.certificateChain If `true`, the `SecurityInfo` object returned will include the entire certificate
   * chain up to and including the trust root. If `false`, it will include only the server certificate.
   * Defaults to `false`.
   *
   * @param options.rawDER If `true`, every `CertificateInfo` in the `SecurityInfo.certificates` property will contain
   * a property `rawDER`. This contains the DER-encoded ASN.1 that comprises the certificate data.
   *
   * @returns A Promise of a SecurityInfo - an object describing the security properties of a particular web request.
   */
  getSecurityInfo(requestId: string, options?: GetSecurityInfoOptions): Promise<SecurityInfo>;

  /**
   * Fired when the HTTP response headers associated with a request have been received.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onHeadersReceived
   */
  onHeadersReceived: OnHeadersReceivedEvent;
}

export interface RequestFilter {
  /**
   * An array of match patterns.
   * The listener will only be called for requests whose targets match any of the given patterns.
   * Only requests made using HTTP or HTTPS will trigger events,
   * other protocols (such as data: and file:) supported by pattern matching do not trigger events.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
   */
  urls: string[];

  /**
   * A list of resource types (for example, stylesheets, images, scripts).
   * The listener will only be called for requests for resources which are one of the given types.
   */
  types?: ResourceType[];

  /**
   * The listener will only be called for requests from the `tab` identified by this ID.
   */
  tabId?: number;

  /**
   * The listener will only be called for requests from the `window` identified by this ID.
   */
  windowId?: number;

  /**
   * If provided, requests that do not match the incognito state (true or false) will be filtered out.
   */
  incognito?: boolean;
}

export interface OnHeadersReceivedEvent {
  /**
   * Adds a listener to this event.
   *
   * @param callback Called when an event occurs. The parameters of this function depend on the type of event.
   * @param filter A set of filters that restricts the events that will be sent to this listener.
   * @param extraInfoSpec Optional. Array of extra information that should be passed to the listener function.
   */
  addListener(
    callback: (details: OnHeadersReceivedDetails) => void,
    filter: RequestFilter,
    extraInfoSpec?: OnHeadersReceivedOptions[]
  ): void;

  /**
   * Removes a listener from this event.
   *
   * @param callback Callback to be removed.
   */
  removeListener(
    callback: (details: OnHeadersReceivedDetails) => void,
  ): void;
}

export interface GetSecurityInfoOptions {
  /**
   * If `true`, the `SecurityInfo` object returned will include the entire certificate chain up to and
   * including the trust root. If `false`, it will include only the server certificate. Defaults to `false`.
   */
  certificateChain?: boolean;

  /**
   * If `true`, every `CertificateInfo` in the `SecurityInfo.certificates` property will contain a property `rawDER`.
   * This contains the DER-encoded ASN.1 that comprises the certificate data.
   */
  rawDER?: boolean;
}

/**
 * An object describing the security properties of a particular web request.
 * An object of this type is returned from the `webRequest.getSecurityInfo()` API.
 *
 * If the request is not secured using TLS,
 * then this object will contain only the property `state`, whose value will be `insecure`.
 */
export interface SecurityInfo {
  /**
   * State of the connection. One of:
   * - `broken`:   The TLS handshake failed (for example, the certificate had expired)
   * - `insecure`: The connection is not a TLS connection
   * - `secure`:   The connection is a secure TLS connection
   * - `weak`:     The connection is a TLS connection but is considered weak.
   *
   * Note though that at present you can only call `getSecurityInfo()` in the `onHeaderReceived` listener,
   * and the onHeaderReceived event is not fired when the handshake fails.
   * So in practice this will never be set to `broken`.
   */
  state: SecurityInfoStateType;

  /**
   * If there was a problem with the TLS handshake (for example, the certificate had expired, or a trusted root could
   * not be found, or a certificate was revoked) then status will be `broken` and the `errorMessage` property will
   * contain a string describing the error, taken from Firefox's internal list of error codes.
   *
   * Note though that at present you can only call `getSecurityInfo()` in the `onHeaderReceived` listener,
   * and the onHeaderReceived event is not fired when the handshake fails. So in practice this will never be set.
   */
  errorMessage?: string;

  /**
   * Version of the TLS protocol used. One of:
   * - `TLSv1`
   * - `TLSv1.1`
   * - `TLSv1.2`
   * - `TLSv1.3`
   * - `unknown` (if the version is not valid)
   */
  protocolVersion?: SecurityInfoProtocolVersionType;

  /**
   * Cipher suite used for the connection, formatted as per the TLS specification.
   *
   * @example "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"
   */
  cipherSuite?: string;

  /**
   *  If `state` is `secure` this describes the key exchange algorithm used in this request.
   */
  keaGroupName?: string;

  /**
   * If `state` is `secure` this describes the signature scheme used in this request.
   */
  signatureSchemeName?: string;

  /**
   * Array of `CertificateInfo`.
   * If `webRequest.getSecurityInfo()` was called with the `certificateChain` option present and set to true,
   * this will contain a `CertificateInfo` object for every certificate in the chain,
   * from the server certificate up to and including the trust root.
   *
   * Otherwise it will contain a single `CertificateInfo` object, for the server certificate.
   */
  certificates: CertificateInfo[];

  /**
   * `true` if the server's domain name does not match the domain name in its certificate, `false` otherwise.
   */
  isDomainMismatch?: boolean;

  /**
   * `true` if the server has an Extended Validation Certificate, `false` otherwise.
   */
  isExtendedValidation?: boolean;

  /**
   * `true` if the current time falls outside
   * the server certificate's validity period (i.e. the certificate has expired or is not yet valid), `false` otherwise.
   */
  isNotValidAtThisTime?: boolean;

  /**
   * `true` if a chain back to a trusted root certificate could not be constructed, `false` otherwise.
   */
  isUntrusted?: boolean;

  /**
   * Indicates the Certificate Transparency status for the connection.
   * This may take any one of the following values:
   * - `not_applicable`
   * - `policy_compliant`
   * - `policy_not_enough_scts`
   * - `policy_not_diverse_scts`
   */
  certificateTransparencyStatus?: CertificateTransparencyStatusType;

  /**
   * `true` if the host uses Strict Transport Security, `false` otherwise.
   */
  hsts?: boolean;

  /**
   * `true` if the host uses Public Key Pinning, `false` otherwise.
   */
  hpkp?: string;

  /**
   * If state is `weak`, this indicates the reason.
   * Currently this may contain only a single value `cipher`,
   * indicating that the negotiated cipher suite is considered weak.
   */
  weaknessReasons?: TransportWeaknessReasons[];
}

/**
 * An object describing a single X.509 certificate.
 *
 * The SecurityInfo object returned from the the `webRequest.getSecurityInfo()` API includes
 * a certificates property which is an array of these objects.
 */
export interface CertificateInfo {
  /**
   * Hash of the certificate's DER encoding.
   */
  fingerprint: Fingerprint;

  /**
   * `true` if the certificate is one of the trust roots installed in the browser, `false` otherwise.
   */
  isBuiltInRoot: boolean;

  /**
   * Name of the organization that issued this certificate, represented as a Distinguished Name and
   * formatted as a comma-separated list of Relative Distinguished Names, each of the form `type=value`.
   *
   * @example "CN=DigiCert SHA2 Secure Server CA,O=DigiCert Inc,C=US"
   */
  issuer: string;

  /**
   * If `webRequest.getSecurityInfo()` was called with the `rawDER` option present and set to `true`,
   * this will contain the DER encoding of the certificate.
   */
  rawDER?: number[];

  /**
   * The certificate's serial number.
   */
  serialNumber: string;

  /**
   * Name of the organization that issued this certificate,
   * represented as a Distinguished Name and formatted as a comma-separated list of Relative Distinguished Names,
   * each of the form `type=value`.
   *
   * @example "CN=*.cdn.mozilla.net,O=Mozilla Corporation,L=Mountain View,ST=California,C=US"
   */
  subject: string;

  /**
   * DER-encoded public key info.
   */
  subjectPublicKeyInfoDigest: {
    /**
     * Base64 encoded SHA-256 hash of the DER-encoded public key info.
     */
    sha256: string;
  };

  /**
   * Validity period for the certificate.
   */
  validity: {
    /**
     * The start of the certificate's validity period, in milliseconds since the epoch.
     */
    start: number;

    /**
     * The end of the certificate's validity period, in milliseconds since the epoch.
     */
    end: number;
  };
}

export interface FrameAccessor {
  /**
   * The URL that the document was loaded from.
   */
  url: string;

  /**
   * The `frameId` of the document. `details.frameAncestors[0].frameId` is the same as `details.parentFrameId`.
   */
  frameId: number;
}

export interface HttpHeader {
  /**
   * Name of the HTTP header.
   */
  name: string;

  /**
   * Value of the HTTP header if it can be represented by UTF-8. Either this property or `binaryValue` must be present
   */
  value?: string;

  /**
   * Value of the HTTP header if it cannot be represented by UTF-8, represented as bytes (0..255).
   * Either this property or `value` must be present.
   */
  binaryValue?: number[];
}

export interface Fingerprint {
  /**
   * SHA-1 hash of the certificate's DER encoding.
   */
  sha1: string;

  /**
   * SHA-256 hash of the certificate's DER encoding.
   */
  sha256: string;
}

export interface OnHeadersReceivedDetails {
  /**
   * If the request is from a tab open in a contextual identity, the cookie store ID of the contextual identity.
   */
  cookieStoreId?: string;

  /**
   * URL of the document in which the resource will be loaded.
   * For example, if the web page at `https://example.com` contains an image or an iframe,
   * then the `documentUrl` for the image or iframe will be `https://example.com`.
   * For a top-level document, `documentUrl` is `undefined`.
   */
  documentUrl?: string;

  /**
   * Information for each document in the frame hierarchy up to the top-level document.
   * The first element in the array contains information about the immediate parent of the document being requested,
   * and the last element contains information about the top-level document. If the load is for the top-level document,
   * then this array is empty.
   */
  frameAncestors: FrameAccessor[];

  /**
   * Zero if the request happens in the main frame; a positive value is the ID of a subframe in which
   * the request happens. If the document of a (sub-)frame is loaded (`type` is `main_frame` or `sub_frame`),
   * `frameId` indicates the ID of this frame, not the ID of the outer frame. Frame IDs are unique within a tab.
   */
  frameId: number;

  /**
   * Weather the response is fetched from disk cache.
   */
  fromCache: boolean;

  /**
   * Weather the request is from a private browsing window.
   */
  incognito?: boolean;

  /**
   * The IP address of the server the request was sent to. It may be a literal IPv6 address.
   */
  ip: string;

  /**
   * Standard HTTP method: for example, `GET` or `POST`.
   */
  method: string;

  /**
   * URL of the resource which triggered the request. For example, if `https://example.com` contains a link,
   * and the user clicks the link, then the `originUrl` for the resulting request is `https://example.com`.
   *
   * The `originUrl` is often but not always the same as the `documentUrl`. For example, if a page contains an iframe,
   * and the iframe contains a link that loads a new document into the iframe,
   * then the `documentUrl` for the resulting request will be the iframe's parent document,
   * but the `originUrl` will be the URL of the document in the iframe that contained the link.
   */
  originUrl?: string;

  /**
   * ID of the frame that contains the frame which sent the request. Set to -1 if no parent frame exists.
   */
  parentFrameId: number;

  /**
   * This property is present only if the request is being proxied.
   */
  proxyInfo?: {
    /**
     * The hostname of the proxy server.
     */
    host: string;

    /**
     * The port number of the proxy server.
     */
    port: number;

    /**
     * The type of proxy server. One of:
     * - `http`:    HTTP proxy (or SSL CONNECT for HTTPS)
     * - `https`:   HTTP proxying over TLS connection to proxy
     * - `socks`:   SOCKS v5 proxy
     * - `socks4`:  SOCKS v4 proxy
     * - `direct`:  no proxy
     * - `unknown`: unknown proxy
     */
    type: "http" | "https" | "socks" | "socks4" | "direct" | "unknown";

    /**
     * Username for the proxy service.
     */
    username: string;

    /**
     * `true` if the proxy will perform domain name resolution based on the hostname supplied,
     * meaning that the client should not do its own DNS lookup.
     */
    proxyDNS: boolean;

    /**
     * Failover timeout in seconds. If the proxy connection fails, the proxy will not be used again for this period.
     */
    failoverTimeout: number;
  };

  /**
   * The ID of the request. The request IDs are unique within a browser session,
   * so you can use them to relate different events associated with the same request.
   */
  requestId: string;

  /**
   * The HTTP response header that were received for this request.
   */
  responseHeaders?: HttpHeader[];

  /**
   * Standard HTTP status code returned by the server.
   */
  statusCode: number;

  /**
   * HTTP status line of the response or the `HTTP/0.9 200 OK` string
   * for HTTP/0.9 responses (that is, responses that lack a status line).
   */
  statusLine: string;

  /**
   * ID of the tab in which the request takes place. Set to -1 if the request isn't related to a tab.
   */
  tabId: number;

  /**
   * Indicates whether the request and its content window hierarchy are third party.
   */
  thirdParty: boolean;

  /**
   * The time when this event fired, in milliseconds since the epoch.
   */
  timeStamp: number;

  /**
   * The type of resource being requested: for example, `image`, `script`, `stylesheet`.
   */
  type: ResourceType;

  /**
   * Target of the request.
   */
  url: string;

  /**
   * The type of tracking associated with the request,
   * if with the request has been classified by Firefox Tracking Protection.
   * This is an object with the following properties:
   * - `firstParty`: Classification flags for the request's first party.
   * - `thirdParty`: Classification flags for the request or its window hierarchy's third parties.
   *
   * The classification flags include:
   * - `fingerprinting` and `fingerprinting_content`: indicates the request is involved in fingerprinting.
   *   `fingerprinting_content` indicates the request is loaded from an origin that has been found to fingerprint,
   *   but is not considered to participate in tracking, such as a payment provider.
   * - `cryptomining` and `cryptomining_content`: similar to the `fingerprinting` category,
   *   but for cryptomining resources.
   * - `tracking`, `tracking_ad`, `tracking_analytics`, `tracking_social`, and `tracking_content`: indicates the request
   *   is involved in tracking. `tracking` is any generic tracking request, the `ad`, `analytics`, `social`,
   *   and `content` suffixes identify the type of tracker.
   * - `any_basic_tracking`: a meta flag that combines any tracking and fingerprinting flags,
   *   excluding `tracking_content` and `fingerprinting_content`.
   * - `any_strict_tracking`: a meta flag that combines any tracking and fingerprinting flags,
   *   including `tracking_content` and `fingerprinting_content`.
   * - `any_social_tracking`: a meta flag that combines any social tracking flags.
   */
  urlClassification?: {
    /**
     * Classification flags for the request's first party.
     */
    firstParty: UrlClassificationFlagType[];

    /**
     * Classification flags for the request or its window hierarchy's third parties.
     */
    thirdParty: UrlClassificationFlagType[];
  };
}
