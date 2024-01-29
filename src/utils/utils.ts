const STATUS_OK = "ok";
const STATUS_ERROR = "error";

const fiveMinutesInMillis = 300000; //5 minutes in millis
const oneYearInMillis = 31536000000; //1 year in millis

interface SpinderResponse<T> {
  status: string;
  data: T;
}

class SpinderErrorResponse implements SpinderResponse<string> {
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

function statusOk(statusCode: number): boolean {
  // Check if the status code is within the range of standard success codes
  return statusCode >= 200 && statusCode < 300;
}

export {
  STATUS_OK,
  STATUS_ERROR,
  fiveMinutesInMillis,
  oneYearInMillis,
  type SpinderResponse,
  SpinderErrorResponse,
  statusOk,
};
