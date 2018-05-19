import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {noop} from 'lodash';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {waitInWrapper} from '../test/helpers/conditions';

describe('Validation', async () => {
  let wrapper: ReactWrapper;
  const waitFor = (condition: () => boolean) => waitInWrapper(wrapper)(condition);

  it('', async () => {
    const controller = new FormController({
      onSubmit: noop,
      onValidate: async (values) => {
        if (values.batman === 'batman') {
          return {};
        } else {
          return {
            batman: ['not_batman', {id: 'not_bruce_wayne'}],
          };
        }
      },
    });

    wrapper = mount(<TestForm controller={controller} />);

    wrapper.find(`[data-hook="test-form"]`).simulate('submit', {target: {}});

    await waitFor(() => {
      return (
        wrapper.find(`[data-hook="error-not_batman"]`).length === 1 &&
        wrapper.find(`[data-hook="error-not_bruce_wayne"]`).length === 1
      );
    });
  });
});
