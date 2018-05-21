import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {getInput, getMetaFromWrapper} from '../test/helpers/getters';
import {noop} from 'lodash';
import {waitInWrapper} from '../test/helpers/conditions';

describe('Form meta', async () => {
  let wrapper: ReactWrapper;

  const getFieldInput = () => getInput(wrapper, TestForm.FIELD_ONE_NAME);
  const waitFor = (condition: () => boolean) => waitInWrapper(wrapper)(condition);
  const getMeta = (metaProps: string) => getMetaFromWrapper(wrapper, TestForm.FIELD_ONE_NAME)(metaProps);

  it('isValid', async () => {
    const controller = new FormController({
      onSubmit: noop,
      onValidate: async (values) => {
        if (values[TestForm.FIELD_ONE_NAME] === 'batman') {
          return {};
        } else {
          return {
            [TestForm.FIELD_ONE_NAME]: ['notBatman', {id: 'notBruceWayne'}],
          };
        }
      },
    });
    wrapper = mount(<TestForm controller={controller} />);

    expect(getMeta('form:isValid')).toBe('true');

    getFieldInput().simulate('change', {target: {value: 'harvy'}});
    wrapper.find(`[data-hook="test-form"]`).simulate('submit', {target: {}});
    await waitFor(() => getMeta('form:isValid') === 'false');

    getFieldInput().simulate('change', {target: {value: 'batman'}});
    wrapper.find(`[data-hook="test-form"]`).simulate('submit', {target: {}});
    await waitFor(() => getMeta('form:isValid') === 'true');

    getFieldInput().simulate('change', {target: {value: 'joker'}});
    wrapper.find(`[data-hook="${TestForm.FIELD_ONE_NAME}"] [data-hook="validate"]`).simulate('click');
    await waitFor(() => getMeta('form:isValid') === 'false');
  });

  it('isTouched', () => {
    const controller = new FormController({});
    wrapper = mount(<TestForm controller={controller} />);

    expect(getMeta('form:isTouched')).toBe('false');

    getFieldInput().simulate('focus');
    expect(getMeta('form:isTouched')).toBe('true');

    getFieldInput().simulate('blur');
    expect(getMeta('form:isTouched')).toBe('true');
  });

  it('isDirty', () => {
    const controller = new FormController({});
    wrapper = mount(<TestForm controller={controller} />);

    expect(getMeta('form:isDirty')).toBe('false');

    getFieldInput().simulate('change', {target: {value: 'batman'}});

    expect(getMeta('form:isDirty')).toBe('true');
  });
});
