import {ReactWrapper} from 'enzyme';

export const getMetaFromWrapper = (wrapper: ReactWrapper, field: string) => (key: string) => {
  return wrapper
    .find(`[data-hook="${field}"] [data-hook="meta_${key}"]`)
    .at(0)
    .text();
};

export const getErrorFromWrapper = (wrapper: ReactWrapper, field: string) => (key: string) => {
  return wrapper
    .find(`[data-hook="${field}"] [data-hook="error:${key}"]`)
    .at(0)
    .text();
};

export const getInput = (wrapper: ReactWrapper, field: string) => {
  return wrapper.find(`[data-hook="input-${field}"]`) as ReactWrapper;
};
