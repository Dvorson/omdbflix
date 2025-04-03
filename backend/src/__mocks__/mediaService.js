class MediaServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'MediaServiceError';
  }
}

export const searchMedia = jest.fn();
export const getMediaById = jest.fn();
export { MediaServiceError }; 