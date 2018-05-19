import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {getInput, getMetaFromWrapper} from '../test/helpers/getters';
import {waitInWrapper} from '../test/helpers/conditions';

describe('Field meta', async () => {
  let wrapper: ReactWrapper;

  const getFieldInput = () => getInput(wrapper, TestForm.FIELD_ONE_NAME);
  const waitFor = (condition: () => boolean) => waitInWrapper(wrapper)(condition);
  const getMeta = (metaProps: string) =>
    getMetaFromWrapper(wrapper, TestForm.FIELD_ONE_NAME)(metaProps);

  it('isInitialized', () => {
    const formController = new FormController({});
    expect(formController.API.getFieldMeta(TestForm.FIELD_ONE_NAME).isRegistered).toEqual(false);
    wrapper = mount(<TestForm controller={formController} />);
    expect(formController.API.getFieldMeta('batman').isRegistered).toEqual(true);
  });

  it('isActive', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);

    expect(getMeta('isActive')).not.toBe('true');

    getFieldInput().simulate('focus');
    expect(getMeta('isActive')).toBe('true');

    getFieldInput().simulate('blur');
    expect(getMeta('isActive')).not.toBe('true');
  });

  it('isTouched', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);

    expect(getMeta('isTouched')).not.toBe('true');

    getFieldInput().simulate('focus');
    expect(getMeta('isTouched')).toBe('true');

    getFieldInput().simulate('blur');
    expect(getMeta('isTouched')).toBe('true');
  });

  it('isDirty', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);

    expect(getMeta('isDirty')).not.toBe('true');

    getFieldInput().simulate('change', {target: {value: 'batman'}});

    expect(getMeta('isDirty')).toBe('true');
  });

  it('custom', async () => {
    const formController = new FormController({});

    expect(formController.API.getFieldMeta(TestForm.FIELD_ONE_NAME).custom).toEqual({});

    wrapper = mount(<TestForm controller={formController} />);

    formController.API.setFieldCustomState(TestForm.FIELD_ONE_NAME, 'realName', 'Bruce');

    expect(formController.API.getFieldMeta(TestForm.FIELD_ONE_NAME).custom.realName).toBe('Bruce');

    await waitFor(() => {
      return getMeta('custom:realName') === 'Bruce';
    });
  });
});
