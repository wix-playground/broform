import * as React from 'react';
import {mount} from 'enzyme';
import {noop} from 'lodash';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import * as eventually from 'wix-eventually';

test('validate', async () => {
  const formController = new FormController({
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

  const wrapper = mount(<TestForm controller={formController} />);

  wrapper.find(`[data-hook="test-form"]`).simulate('submit', {target: {}});

  await eventually(() => {
    wrapper.update();
    if (
      wrapper.find(`[data-hook="error-not_batman"]`).length === 0 ||
      wrapper.find(`[data-hook="error-not_bruce_wayne"]`).length === 0
    ) {
      throw new Error();
    } else {
      return true;
    }
  });
});
