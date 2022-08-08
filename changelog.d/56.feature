A subclass of the AppService class can now signal user query errors in its
onUserQuery method by throwing an AppserviceHttpError exception. This allows the
appservice to return a HTTP status, a Matrix errorcode, and a Matrix error message.
