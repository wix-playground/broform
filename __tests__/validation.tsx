import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {FormController} from '../src/FormController';
import {createInputAdapterDriver} from '../test/components/InputAdapter/InputAdapter.driver';
import {TestForm} from '../test/components/TestForm';
import {waitInWrapper} from '../test/helpers/conditions';
import {createTestFormDriver} from '../test/components/TestForm.driver';

describe('Validation', async () => {
  let wrapper: ReactWrapper;
  const waitFor = (condition: () => boolean) => waitInWrapper(wrapper)(condition);

  it('has errors', async () => {
    const controller = new FormController({
      onSubmit: jest.fn(),
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
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    formDriver.when.submit();

    await waitFor(() => {
      return fieldDriver.get.errors('notBatman') === 'notBatman' && fieldDriver.get.errors('notBruceWayne') === 'notBruceWayne';
    });
  });
});
