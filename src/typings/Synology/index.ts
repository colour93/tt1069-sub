export type BaseApiSuccessResponse<T> = {
  success: true;
  data: T;
}

export type BaseApiErrorResponse = {
  success: false;
  error: {
    code: number;
  };
}

export type BaseApiResponse<T> = BaseApiSuccessResponse<T> | BaseApiErrorResponse;
