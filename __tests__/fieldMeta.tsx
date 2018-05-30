import * as React from 'react';
import {mount} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {waitFor} from '../test/helpers/conditions';
import {Field} from '../src/Field';
import {InputAdapter} from '../test/components/InputAdapter';
import {createTestFormDriver} from '../test/components/TestForm.driver';
import {createInputAdapterDriver} from '../test/components/InputAdapter/InputAdapter.driver';

describe('Field meta', async () => {
  it('isRegistered', () => {
    const formController = new FormController({});
    expect(formController.API.getFieldMeta(TestForm.FIELD_ONE_NAME).isRegistered).toEqual(false);
    mount(<TestForm controller={formController} />);
    expect(formController.API.getFieldMeta('batman').isRegistered).toEqual(true);
  });

  it('isActive', () => {
    const wrapper = mount(<TestForm />);
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(fieldDriver.get.meta('isActive')).not.toBe('true');

    fieldDriver.when.focus();
    expect(fieldDriver.get.meta('isActive')).toBe('true');

    fieldDriver.when.blur();
    expect(fieldDriver.get.meta('isActive')).not.toBe('true');
  });

  it('isTouched', () => {
    const wrapper = mount(<TestForm />);
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(fieldDriver.get.meta('isTouched')).not.toBe('true');

    fieldDriver.when.focus();
    expect(fieldDriver.get.meta('isTouched')).toBe('true');

    fieldDriver.when.blur();
    expect(fieldDriver.get.meta('isTouched')).toBe('true');
  });

  it('isDirty', () => {
    const wrapper = mount(<TestForm />);

    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(fieldDriver.get.meta('isDirty')).not.toBe('true');

    fieldDriver.when.change('batman');

    expect(fieldDriver.get.meta('isDirty')).toBe('true');
  });

  it('custom', async () => {
    const formController = new FormController({});

    expect(formController.API.getFieldMeta(TestForm.FIELD_ONE_NAME).custom).toEqual({});

    const wrapper = mount(<TestForm controller={formController} />);

    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    formController.API.setFieldCustomState(TestForm.FIELD_ONE_NAME, 'realName', 'Bruce');

    expect(formController.API.getFieldMeta(TestForm.FIELD_ONE_NAME).custom.realName).toBe('Bruce');

    await waitFor(wrapper)(() => {
      return fieldDriver.get.meta('custom:realName') === 'Bruce';
    });
  });

  it('isValidating', async () => {
    const wrapper = mount(
      <TestForm>
        <Field
          onValidate={async (value) => {
            return value === 'batman' ? null : 'notBatman';
          }}
          name={TestForm.FIELD_ONE_NAME}
          adapter={InputAdapter}
        />
      </TestForm>,
    );

    const formDriver = createTestFormDriver({wrapper});
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(fieldDriver.get.meta('isValidating')).not.toBe('true');

    formDriver.when.submit();

    expect(fieldDriver.get.meta('isValidating')).toBe('true');

    await waitFor(wrapper)(() => {
      return fieldDriver.get.meta('form:isValidating') === 'false';
    });
  });
});
