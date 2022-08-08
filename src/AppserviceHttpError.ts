/**
 * Represents an HTTP error from the Appservice.
 * @category Error handling
 */
 export class AppserviceHttpError extends Error {
  /**
   * The Matrix error code
   */
  public readonly errcode: string;

  /**
   * Optional human-readable error message.
   */
  public readonly error: string;

  /**
   * Creates a new Appservice HTTP error
   * @param body The error body.
   * @param status The HTTP status code.
   */
  constructor(readonly body: { errcode: string, error: string }, public readonly status: number) {
      super();
      this.errcode = body.errcode;
      this.error = body.error;
  }

  /**
   * Developer-friendly error message.
   */
  public get message() {
      return `${this.errcode}: ${this.error}`;
  }
}
