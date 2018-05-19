import {TestForm} from '../components/TestForm';
import {ReactWrapper} from 'enzyme';

export const getMetaFromWrapper = (wrapper: ReactWrapper) => (prop: string) => {
  return wrapper
    .find(`[data-hook="${TestForm.FIELD_ONE_NAME}"] [data-hook="meta_${prop}"]`)
    .at(0)
    .text();
};
