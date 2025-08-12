/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Expired Time - Set the expiration time for links. After this period, links will be automatically deleted. */
  "expiredTime": "1day" | "1week" | "2week" | "1month" | "3month" | "6month" | "1year"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `add-from-clipboard` command */
  export type AddFromClipboard = ExtensionPreferences & {}
  /** Preferences accessible in the `add` command */
  export type Add = ExtensionPreferences & {}
  /** Preferences accessible in the `search` command */
  export type Search = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `add-from-clipboard` command */
  export type AddFromClipboard = {}
  /** Arguments passed to the `add` command */
  export type Add = {}
  /** Arguments passed to the `search` command */
  export type Search = {}
}

