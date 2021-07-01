# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.2.0](https://github.com/MapColonies/change-merger/compare/v1.1.3...v1.2.0) (2021-07-01)


### Features

* added traceparent header on response ([#48](https://github.com/MapColonies/change-merger/issues/48)) ([c6e6d85](https://github.com/MapColonies/change-merger/commit/c6e6d85f966df013d35466e394916b3613a1eb0e))

### [1.1.3](https://github.com/MapColonies/change-merger/compare/v1.1.2...v1.1.3) (2021-06-07)


### Bug Fixes

* **configurations:** changed how server is initialized ([#39](https://github.com/MapColonies/change-merger/issues/39)) ([5f6fad7](https://github.com/MapColonies/change-merger/commit/5f6fad725a97ca6423e79168f320240368c7f799))

### [1.1.2](https://github.com/MapColonies/change-merger/compare/v1.1.0...v1.1.2) (2021-06-06)


### Bug Fixes

* **configurations:** fixed broken liveness ([#38](https://github.com/MapColonies/change-merger/issues/38)) ([f4158e9](https://github.com/MapColonies/change-merger/commit/f4158e95f070e51f011ad354b1ebdb14a757dcec))

### [1.1.1](https://github.com/MapColonies/change-merger/compare/v1.1.0...v1.1.1) (2021-05-25)

## [1.1.0](https://github.com/MapColonies/change-merger/compare/v1.0.2...v1.1.0) (2021-05-24)


### Features

* **configurations:** added otel support of tracing and metrics ([#35](https://github.com/MapColonies/change-merger/issues/35)) ([2ab4fae](https://github.com/MapColonies/change-merger/commit/2ab4fae566b591d66a2da3d786074b33645a61bc))
* **configurations:** updates openapi3 version on release ([22402b3](https://github.com/MapColonies/change-merger/commit/22402b33a77e300d6639ffff3cf4738499475fc4))

### [1.0.2](https://github.com/MapColonies/change-merger/compare/v1.0.1...v1.0.2) (2021-05-05)


### Bug Fixes

* **configurations:** ignore no-empty-servers ([08202fa](https://github.com/MapColonies/change-merger/commit/08202faa26bde0f6730e0bdd978953d4c00b0249))

### [1.0.1](https://github.com/MapColonies/change-merger/compare/v1.0.0...v1.0.1) (2021-05-05)


### Bug Fixes

* **configurations:** removed servers list from openapi3.yml ([cf56840](https://github.com/MapColonies/change-merger/commit/cf5684069190be8c2102f1e41e3ceaddf4adf128))

## 1.0.0 (2021-05-03)


### Features

* server payload size is configurable via config file ([cccc2e7](https://github.com/MapColonies/change-merger/commit/cccc2e7ee795f8c9215ee70ed9f6bbc413094a74))
* **change:** implemented post /change/merge ([#6](https://github.com/MapColonies/change-merger/issues/6)) ([554b14e](https://github.com/MapColonies/change-merger/commit/554b14e8f46f07323358c4896d9b38d092261d42)), closes [#5](https://github.com/MapColonies/change-merger/issues/5)


### Bug Fixes

* **change:** changed order of deleted objects ([#9](https://github.com/MapColonies/change-merger/issues/9)) ([98b62e1](https://github.com/MapColonies/change-merger/commit/98b62e1a3a0bbd415c59e059b1f0a9aea8796eeb))
* **change:** fixed strings with disallowed values in xml ([#15](https://github.com/MapColonies/change-merger/issues/15)) ([88eb886](https://github.com/MapColonies/change-merger/commit/88eb886446da5e16ef0f73146995e5a7d696123d))
* **deps:** move openapi-express-viewer to dep from devdep ([#12](https://github.com/MapColonies/change-merger/issues/12)) ([c08f322](https://github.com/MapColonies/change-merger/commit/c08f32257cbb21b989c836de2692821393ad2b3a))
