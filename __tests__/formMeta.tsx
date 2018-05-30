import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {Field} from '../src/Field';
import {InputAdapter} from '../test/components/InputAdapter';
import {TestForm} from '../test/components/TestForm';
import {waitInWrapper} from '../test/helpers/conditions';
import {createInputAdapterDriver} from '../test/components/InputAdapter/InputAdapter.driver';
import {createTestFormDriver} from '../test/components/TestForm.driver';

describe('Form meta', async () => {
  let wrapper: ReactWrapper;

  const waitFor = (condition: () => boolean) => waitInWrapper(wrapper)(condition);

  it('isValid', async () => {
    wrapper = mount(
      <TestForm
        onSubmit={jest.fn()}
        onValidate={async (values) => {
          if (values[TestForm.FIELD_ONE_NAME] === 'batman') {
            return {};
          } else {
            return {
              [TestForm.FIELD_ONE_NAME]: ['notBatman', {id: 'notBruceWayne'}],
            };
          }
        }}
      />,
    );
    const formDriver = createTestFormDriver({wrapper});
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(fieldDriver.get.meta('form:isValid')).toBe('true');

    fieldDriver.when.change('harvy');
    formDriver.when.submit();
    await waitFor(() => fieldDriver.get.meta('form:isValid') === 'false');

    fieldDriver.when.change('batman');
    formDriver.when.submit();
    await waitFor(() => fieldDriver.get.meta('form:isValid') === 'true');

    fieldDriver.when.change('joker');
    fieldDriver.when.validate();
    await waitFor(() => fieldDriver.get.meta('form:isValid') === 'false');
  });

  it('isTouched', () => {
    wrapper = mount(<TestForm />);
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(fieldDriver.get.meta('form:isTouched')).toBe('false');

    fieldDriver.when.focus();
    expect(fieldDriver.get.meta('form:isTouched')).toBe('true');

    fieldDriver.when.blur();
    expect(fieldDriver.get.meta('form:isTouched')).toBe('true');
  });

  describe('isDirty', () => {
    it('using initial values', () => {
      wrapper = mount(
        <TestForm
          initialValues={{
            [TestForm.FIELD_ONE_NAME]: '',
          }}
        >
          <Field name={TestForm.FIELD_ONE_NAME} adapter={InputAdapter} />
        </TestForm>,
      );

      const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

      expect(fieldDriver.get.meta('form:isDirty')).toBe('false');

      fieldDriver.when.change('batman');

      expect(fieldDriver.get.meta('form:isDirty')).toBe('true');

      fieldDriver.when.change('');

      expect(fieldDriver.get.meta('form:isDirty')).toBe('false');
    });

    it('using initial field default value', () => {
      wrapper = mount(
        <TestForm>
          <Field defaultValue={''} name={TestForm.FIELD_ONE_NAME} adapter={InputAdapter} />
        </TestForm>,
      );

      const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

      expect(fieldDriver.get.meta('form:isDirty')).toBe('false');

      fieldDriver.when.change('batman');

      expect(fieldDriver.get.meta('form:isDirty')).toBe('true');

      fieldDriver.when.change('');

      expect(fieldDriver.get.meta('form:isDirty')).toBe('false');
    });
  });

  it('submitCount', () => {
    wrapper = mount(<TestForm />);
    const formDriver = createTestFormDriver({wrapper});
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(fieldDriver.get.meta('form:submitCount')).toBe('0');

    formDriver.when.submit();

    expect(fieldDriver.get.meta('form:submitCount')).toBe('1');
  });

  it('isSubmitting', async () => {
    wrapper = mount(
      <TestForm
        onValidate={() => {
          return Promise.resolve();
        }}
      />,
    );
    const formDriver = createTestFormDriver({wrapper});
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(fieldDriver.get.meta('form:isSubmitting')).toBe('false');

    formDriver.when.submit();

    expect(fieldDriver.get.meta('form:isSubmitting')).toBe('true');

    await waitFor(() => {
      return fieldDriver.get.meta('form:isSubmitting') === 'false';
    });
  });

  it('isValidating', async () => {
    wrapper = mount(
      <TestForm
        onSubmit={jest.fn()}
        onValidate={async (values) => {
          return values.batman === 'batman' ? {} : {batman: ['notBatman']};
        }}
      />,
    );
    const formDriver = createTestFormDriver({wrapper});
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(fieldDriver.get.meta('form:isValidating')).toBe('false');

    formDriver.when.submit();

    expect(fieldDriver.get.meta('form:isValidating')).toBe('true');

    await waitFor(() => {
      return fieldDriver.get.meta('form:isValidating') === 'false';
    });
  });
});
