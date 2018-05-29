import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {noop} from 'lodash';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {waitInWrapper} from '../test/helpers/conditions';
import {getErrorFromWrapper} from '../test/helpers/getters';
import {createTestFormDriver} from '../test/components/TestForm.driver';

describe('Validation', async () => {
  let wrapper: ReactWrapper;
  const getError = (key: string) => getErrorFromWrapper(wrapper, TestForm.FIELD_ONE_NAME)(key);
  const waitFor = (condition: () => boolean) => waitInWrapper(wrapper)(condition);

  it('has errors', async () => {
    const controller = new FormController({
      onSubmit: noop,
      onValidate: async (values) => {
        if (values.batman === 'batman') {
          return {};
        } else {
          return {
            batman: ['notBatman', {id: 'notBruceWayne'}],
          };
        }
      },
    });

    wrapper = mount(<TestForm controller={controller} />);

    const formDriver = createTestFormDriver({wrapper});

    formDriver.when.submit();

    await waitFor(() => {
      return getError('notBatman') === 'notBatman' && getError('notBruceWayne') === 'notBruceWayne';
    });
  });
});
