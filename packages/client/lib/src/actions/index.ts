import type { ActionState } from '@workspace/client-types';

export function actionSuccess<TData>(data: TData, message?: string): ActionState<TData> {
  return {
    status: 'success',
    message,
    data,
  };
}

export function actionError<TData>(
  data: TData,
  fieldErrors?: Record<string, string | string[]>,
  message?: string,
): ActionState<TData> {
  return {
    status: 'error',
    message,
    fieldErrors,
    data,
  };
}
