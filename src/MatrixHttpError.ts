export interface MatrixHttpError {
  status: number;
  errorcode: string;
  message: string;
}

export function isMatrixHttpError(error: any): error is MatrixHttpError {
    return (error as MatrixHttpError).status != undefined &&
      (error as MatrixHttpError).errorcode != undefined &&
      (error as MatrixHttpError).message != undefined;
}
