import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {AdapterMetaInfo} from '../src/Field';
// import * as eventually from 'wix-eventually';

describe('meta props', async () => {
  // const checkFor = async (checkFunction: () => boolean) => {
  //   await eventually(() => {
  //     wrapper.update();
  //     if (!checkFunction()) {
  //       throw new Error();
  //     } else {
  //       return true;
  //     }
  //   });
  // };
  let wrapper: ReactWrapper;

  const inputSelector = `[data-hook="input-batman"]`;
  const getMeta = (prop: keyof AdapterMetaInfo) => {
    return wrapper.find(`[data-hook="batman"] [data-hook="meta_${prop}"]`).text();
  };

  it('isInitialized', () => {
    const formController = new FormController({});
    expect(formController.API.getFieldMeta('batman').isInitialized).toBe(false);
    wrapper = mount(<TestForm controller={formController} />);
    expect(formController.API.getFieldMeta('batman').isInitialized).toBe(true);
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
});
