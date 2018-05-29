import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {getMetaFromWrapper} from '../test/helpers/getters';
import {waitInWrapper} from '../test/helpers/conditions';
import {Field} from '../src/Field';
import {InputAdapter} from '../test/components/InputAdapter';
import {createTestFormDriver} from '../test/components/TestForm.driver';
import {createInputAdapterDriver} from '../test/components/InputAdapter/InputAdapter.driver';

describe('Field meta', async () => {
  let wrapper: ReactWrapper;

  const waitFor = (condition: () => boolean) => waitInWrapper(wrapper)(condition);
  const getMeta = (metaProps: string) => getMetaFromWrapper(wrapper, TestForm.FIELD_ONE_NAME)(metaProps);

  it('isRegistered', () => {
    const formController = new FormController({});
    expect(formController.API.getFieldMeta(TestForm.FIELD_ONE_NAME).isRegistered).toEqual(false);
    wrapper = mount(<TestForm controller={formController} />);
    expect(formController.API.getFieldMeta('batman').isRegistered).toEqual(true);
  });

  it('isActive', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(getMeta('isActive')).not.toBe('true');

    fieldDriver.when.focus();
    expect(getMeta('isActive')).toBe('true');

    fieldDriver.when.blur();
    expect(getMeta('isActive')).not.toBe('true');
  });

  it('isTouched', () => {
    const formController = new FormController({});
    wrapper = mount(<TestForm controller={formController} />);
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(getMeta('isTouched')).not.toBe('true');

    fieldDriver.when.focus();
    expect(getMeta('isTouched')).toBe('true');

    fieldDriver.when.blur();
    expect(getMeta('isTouched')).toBe('true');
  });

  it('isDirty', () => {
    const formController = new FormController({});

    wrapper = mount(<TestForm controller={formController} />);

    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(getMeta('isDirty')).not.toBe('true');

    fieldDriver.when.change('batman');

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

  it('isValidating', async () => {
    const formController = new FormController({});
    wrapper = mount(
      <TestForm controller={formController}>
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

    expect(getMeta('isValidating')).not.toBe('true');

    formDriver.when.submit();

    expect(getMeta('isValidating')).toBe('true');

    await waitFor(() => {
      return getMeta('form:isValidating') === 'false';
    });
  });
});
