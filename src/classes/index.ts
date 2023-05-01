export class HttpError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.status = status;
  }
}