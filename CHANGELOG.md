v0.3.3
------
`AppService`:
 * Redact access tokens in the AppService logs.
`AppServiceRegistration`:
 * Added a flag to indicate to the HS not to rate limit the AS client or any users belonging to the AS. The default is set to `true`. Set by calling `setRateLimited(false)`.

v0.3.2
------
Expanded `AppService.listen` to accept more parameters to control how the service
listens for connections.

v0.3.1
------
`AppServiceRegistration`:
 * Bug fix which prevented registration files from being loaded correctly.

v0.3.0
------
`AppServiceRegistration`:
 * Require an ID to be set with the `setId` method.

v0.2.3
------
`AppServiceRegistration`:
 * Added instance method `setAppServiceUrl`. Setting the URL in the constructor
   is still possible but discouraged as it is less clear which URL should go
   there (HS or AS).

v0.2.2
------
`AppServiceRegistration`:
 * Added static method `fromObject`
 * Added instance methods `isUserMatch`, `isAliasMatch`, `isRoomMatch`.
