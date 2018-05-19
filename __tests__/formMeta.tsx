import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {getInput, getMetaFromWrapper} from '../test/helpers/getters';

describe('Form meta', async () => {
  let wrapper: ReactWrapper;

  const getFieldInput = () => getInput(wrapper, TestForm.FIELD_ONE_NAME);
  const getMeta = (metaProps: string) =>
    getMetaFromWrapper(wrapper, TestForm.FIELD_ONE_NAME)(metaProps);

  it('isTouched', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);

    expect(getMeta('form:isTouched')).toBe('false');

    getFieldInput().simulate('focus');
    expect(getMeta('form:isTouched')).toBe('true');

    getFieldInput().simulate('blur');
    expect(getMeta('form:isTouched')).toBe('true');
  });

  it('isDirty', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);

    expect(getMeta('form:isDirty')).toBe('false');

    getFieldInput().simulate('change', {target: {value: 'batman'}});

    expect(getMeta('form:isDirty')).toBe('true');
  });
});
