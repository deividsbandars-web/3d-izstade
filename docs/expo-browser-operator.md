# Expo Browser Operator Mode

Dev-only browser operator mode is available for Expo review sessions.

## Entry

Open the Expo 3D view with:

`/expo-3d?operator=1`

Behavior:
- skips the normal menu flow into `fly` mode
- enables a compact operator panel in the top-right corner
- exposes a window operator API for scripted review actions

## Window API

`window.__WARPALA_EXPO_REVIEW_OPERATOR__`

Supported methods:
- `zones`
- `focusZone(zoneId)`
- `focusBooth(slugOrId)`
- `clearFocus()`
- `setMode(mode)`
- `setLayerStates(partialState)`
- `setSectionStates(partialState)`
- `setTargetBasket(targets)`
- `getSnapshot()`

## Purpose

This is not a public user feature.

It exists to:
- accelerate manual review
- make city/booth/screen inspection more repeatable
- expose structured runtime state without relying only on screenshots

## Current scope

The operator mode gives:
- predefined review zones
- focus switching
- layer and section toggles
- live inspector snapshot access

It does not replace a full external browser automation framework. It is the in-app operator layer for Expo review work.
