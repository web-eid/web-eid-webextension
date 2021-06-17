import TypedMap from "../../../models/TypedMap";

/**
 * Map of ISO 639-2 three-letter language codes to ISO 639-1 two-letter language codes.
 *
 * This is only a partial list used for backwards compatibility.
 *
 * @see https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 */
export default {
  "est": "et",
  "eng": "en",
  "rus": "ru",
  "lit": "lt",
  "lat": "lv",
  "tur": "tr",
} as TypedMap<string>;
