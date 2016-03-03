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
