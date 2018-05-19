import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {getMetaFromWrapper} from '../test/helpers/meta';
import {waitInWrapper} from '../test/helpers/conditions';

describe('Field meta', async () => {
  let wrapper: ReactWrapper;

  const inputSelector = `[data-hook="input-${TestForm.FIELD_ONE_NAME}"]`;
  const waitFor = (condition: () => boolean) => waitInWrapper(wrapper)(condition);
  const getMeta = (metaProps: string) => getMetaFromWrapper(wrapper)(metaProps);

  it('isInitialized', () => {
    const formController = new FormController({});
    expect(formController.API.getFieldMeta(TestForm.FIELD_ONE_NAME).isRegistered).toEqual(false);
    wrapper = mount(<TestForm controller={formController} />);
    expect(formController.API.getFieldMeta('batman').isRegistered).toEqual(true);
  });

  it('isActive', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);
    const input = wrapper.find(inputSelector);

    expect(getMeta('isActive')).not.toBe('true');

    input.simulate('focus');
    wrapper.update();

    expect(getMeta('isActive')).toBe('true');

    input.simulate('blur');
    wrapper.update();

    expect(getMeta('isActive')).not.toBe('true');
  });

  it('isTouched', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);
    const input = wrapper.find(inputSelector);

    expect(getMeta('isTouched')).not.toBe('true');

    input.simulate('focus');
    wrapper.update();

    expect(getMeta('isTouched')).toBe('true');

    input.simulate('blur');
    wrapper.update();

    expect(getMeta('isTouched')).toBe('true');
  });

  it('isDirty', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);
    const input = wrapper.find(inputSelector);

    expect(getMeta('isDirty')).not.toBe('true');

    input.simulate('change', {target: {value: 'batman'}});
    wrapper.update();

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
