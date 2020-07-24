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
