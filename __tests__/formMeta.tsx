import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {getMetaFromWrapper} from '../test/helpers/meta';

describe('Form meta', async () => {
  let wrapper: ReactWrapper;

  const inputSelector = `[data-hook="input-${TestForm.FIELD_ONE_NAME}"]`;
  const getMeta = (metaProps: string) => getMetaFromWrapper(wrapper)(metaProps);

  it('isTouched', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);
    const input = wrapper.find(inputSelector);

    expect(getMeta('form:isTouched')).not.toBe('true');

    input.simulate('focus');
    wrapper.update();

    expect(getMeta('form:isTouched')).toBe('true');

    input.simulate('blur');
    wrapper.update();

    expect(getMeta('form:isTouched')).toBe('true');
  });

  it('isDirty', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);
    const input = wrapper.find(inputSelector);

    expect(getMeta('form:isDirty')).not.toBe('true');

    input.simulate('change', {target: {value: 'batman'}});
    wrapper.update();

    expect(getMeta('form:isDirty')).toBe('true');
  });
});
