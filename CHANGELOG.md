0.9.0 (2021-07-15)
==================

Internal Changes
----------------

- The `master` branch has been renamed to `develop` to be consistent wih other `matrix-org` projects. ([\#40](https://github.com/matrix-org/matrix-appservice-node/issues/40))
- Update to Typescript 4.3.5 and update Typedoc. ([\#44](https://github.com/matrix-org/matrix-appservice-node/issues/44))


0.8.0 (2021-03-01)
===================

Features
--------

- Add health check endpoint ([\#38](https://github.com/matrix-org/matrix-appservice-node/issues/38))


0.7.1 (2020-11-05)
===================

Internal Changes
----------------

- Export `AppServiceOutput` and `RegexObj` interfaces. ([\#35](https://github.com/matrix-org/matrix-appservice-node/issues/35))


0.7.0 (2020-10-30)
===================

Bugfixes
--------

- Fix issue where `AppServiceRegistration.getOutput()` would fail if `de.sorunome.msc2409.push_ephemeral` is undefined. ([\#34](https://github.com/matrix-org/matrix-appservice-node/issues/34))


0.6.0 (2020-10-08)
===================

Features
--------

- Add experimental support for receiving ephemeral data from the homeserver (MSC2409) ([\#32](https://github.com/matrix-org/matrix-appservice-node/issues/32))


0.5.0 (2020-09-14)
===================

Features
--------

- Expose `AppService.app` so that services may add their own Express request handlers. ([\#26](https://github.com/matrix-org/matrix-appservice-node/issues/26))
- Expose `AppService.expressApp` ([\#27](https://github.com/matrix-org/matrix-appservice-node/issues/27))
- Documentation is now generated for Typescript files ([\#28](https://github.com/matrix-org/matrix-appservice-node/issues/28))


Internal Changes
----------------

- Remove `request` dependency ([\#25](https://github.com/matrix-org/matrix-appservice-node/issues/25))


0.4.2 (2020-07-24)
===================

Internal Changes
----------------

- Start using towncrier for changelogs ([\#23](https://github.com/matrix-org/matrix-appservice-node/issues/23))
- Update packages. ([\#24](https://github.com/matrix-org/matrix-appservice-node/issues/24))


v0.4.1
======

- Fixed an issue which caused the package to fail to install.

v0.4.0
======

- **The library is now written in Typescript**.
  This change should not cause any breakages, as the library will
  compile itself on installation via the `postinstall` script.

v0.3.5
======

Updated `body-parser`, `express`, `morgan` and `request` packages to fix security vulnerabilities.


v0.3.4
======
`AppServiceRegistration`:
 * Added `getProtocols()` and `setProtocols(string[])`. (Thanks @Half-Shot!)
`AppService`:
 * Add HTTPS support if the environment variables `MATRIX_AS_TLS_KEY` and `MATRIX_AS_TLS_CERT` exist. (Thanks @AndrewJDR!)

v0.3.3
======
`AppService`:
 * Redact access tokens in the AppService logs.
`AppServiceRegistration`:
 * Added a flag to indicate to the HS not to rate limit the AS client or any users belonging to the AS. The default is set to `true`. Set by calling `setRateLimited(false)`.

v0.3.2
======
Expanded `AppService.listen` to accept more parameters to control how the service
listens for connections.

v0.3.1
======
`AppServiceRegistration`:
 * Bug fix which prevented registration files from being loaded correctly.

v0.3.0
======
`AppServiceRegistration`:
 * Require an ID to be set with the `setId` method.

v0.2.3
======
`AppServiceRegistration`:
 * Added instance method `setAppServiceUrl`. Setting the URL in the constructor
   is still possible but discouraged as it is less clear which URL should go
   there (HS or AS).

v0.2.2
======
`AppServiceRegistration`:
 * Added static method `fromObject`
 * Added instance methods `isUserMatch`, `isAliasMatch`, `isRoomMatch`.
