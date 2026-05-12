import {StatusCodes} from '../config/status-codes';
class ApiError extends Error {
  public statusCode: number;
  public errors?: any;
  public isOperational: boolean;

  constructor(
    statusCode: keyof typeof StatusCodes,
    message: string,
    errors?: any,
    isOperational: boolean = true
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode =StatusCodes[statusCode];
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this);
  }
}

export default ApiError;