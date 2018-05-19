import {ReactWrapper} from 'enzyme';
import * as eventually from 'wix-eventually';

export const waitInWrapper = (wrapper: ReactWrapper) => async (checkFunction: () => boolean) => {
  await eventually(() => {
    wrapper.update();
    if (!checkFunction()) {
      throw new Error();
    } else {
      return true;
    }
  });
};
