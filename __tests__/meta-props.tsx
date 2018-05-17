import * as React from 'react';
import {mount} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {AdapterMetaInfo} from '../src/Field';
// import * as eventually from 'wix-eventually';

test('meta props', async () => {
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

  const getMeta = (prop: keyof AdapterMetaInfo) => {
    return wrapper.find(`[data-hook="batman"] [data-hook="meta_${prop}"]`).text();
  };

  const formController = new FormController({
    initialValues: {
      batman: 'bat',
    },
  });

  expect(formController.API.getFieldMeta('batman').isInitialized).toBe(false);

  const wrapper = mount(<TestForm controller={formController} />);
  const input = wrapper.find(`[data-hook="input-batman"]`);

  expect(getMeta('isInitialized')).toBe('true');

  expect(getMeta('isActive')).not.toBe('true');
  expect(getMeta('isTouched')).not.toBe('true');

  input.simulate('focus');
  wrapper.update();

  expect(getMeta('isActive')).toBe('true');
  expect(getMeta('isTouched')).toBe('true');

  expect(getMeta('isDirty')).not.toBe('true');

  input.simulate('change', {target: {value: 'batman'}});
  wrapper.update();

  expect(getMeta('isDirty')).toBe('true');
});
