export const STATUS_OK = "ok";
export const STATUS_ERROR = "error";

export interface SpinderResponse<T> {
  status: string;
  data: T;
}

export class SpinderErrorResponse implements SpinderResponse<string> {
  status: string;
  code: string;
  data: string;

  constructor(code: string, data: string) {
    this.status = STATUS_ERROR;
    this.code = code;
    this.data = data;
  }

  error(): Error {
    return new Error(this.data);
  }
}

export function statusOk(statusCode: number): boolean {
  // Check if the status code is within the range of standard success codes
  return statusCode >= 200 && statusCode < 300;
}
