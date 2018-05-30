import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {Field} from '../src/Field';
import {FormController} from '../src/FormController';
import {InputAdapter} from '../test/components/InputAdapter';
import {TestForm} from '../test/components/TestForm';
import {getMetaFromWrapper} from '../test/helpers/getters';
import {noop} from 'lodash';
import {waitInWrapper} from '../test/helpers/conditions';
import {createInputAdapterDriver} from '../test/components/InputAdapter/InputAdapter.driver';
import {createTestFormDriver} from '../test/components/TestForm.driver';

describe('Form meta', async () => {
  let wrapper: ReactWrapper;

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

    wrapper = mount(<TestForm controller={controller}/>);
    const formDriver = createTestFormDriver({wrapper});
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(getMeta('form:isValid')).toBe('true');

    fieldDriver.when.change('harvy');
    formDriver.when.submit();
    await waitFor(() => getMeta('form:isValid') === 'false');

    fieldDriver.when.change('batman');
    formDriver.when.submit();
    await waitFor(() => getMeta('form:isValid') === 'true');

    fieldDriver.when.change('joker');
    fieldDriver.when.validate();
    await waitFor(() => getMeta('form:isValid') === 'false');
  });

  it('isTouched', () => {
    const controller = new FormController({});
    wrapper = mount(<TestForm controller={controller}/>);
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(getMeta('form:isTouched')).toBe('false');

    fieldDriver.when.focus();
    expect(getMeta('form:isTouched')).toBe('true');

    fieldDriver.when.blur();
    expect(getMeta('form:isTouched')).toBe('true');
  });

  describe('isDirty', () => {
    it('using initial values', () => {
      wrapper = mount(<TestForm initialValues={{
        [TestForm.FIELD_ONE_NAME]: '',
      }}>
        <Field name={TestForm.FIELD_ONE_NAME} adapter={InputAdapter}/>
      </TestForm>);

      const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

      expect(getMeta('form:isDirty')).toBe('false');

      fieldDriver.when.change('batman');

      expect(getMeta('form:isDirty')).toBe('true');

      fieldDriver.when.change('');

      expect(getMeta('form:isDirty')).toBe('false');
    });

    it('using initial field default value', () => {
      wrapper = mount(<TestForm>
        <Field defaultValue={''} name={TestForm.FIELD_ONE_NAME} adapter={InputAdapter}/>
      </TestForm>);

      const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

      expect(getMeta('form:isDirty')).toBe('false');

      fieldDriver.when.change('batman');

      expect(getMeta('form:isDirty')).toBe('true');

      fieldDriver.when.change('');

      expect(getMeta('form:isDirty')).toBe('false');
    });
  });

  it('submitCount', () => {
    const controller = new FormController({});
    wrapper = mount(<TestForm controller={controller}/>);
    const formDriver = createTestFormDriver({wrapper});

    expect(getMeta('form:submitCount')).toBe('0');

    formDriver.when.submit();

    expect(getMeta('form:submitCount')).toBe('1');
  });

  it('isSubmitting', async () => {
    const controller = new FormController({
      onValidate: () => {
        return Promise.resolve();
      },
    });
    wrapper = mount(<TestForm controller={controller}/>);
    const formDriver = createTestFormDriver({wrapper});

    expect(getMeta('form:isSubmitting')).toBe('false');

    formDriver.when.submit();

    expect(getMeta('form:isSubmitting')).toBe('true');

    await waitFor(() => {
      return getMeta('form:isSubmitting') === 'false';
    });
  });

  it('isValidating', async () => {
    const controller = new FormController({
      onSubmit: noop,
      onValidate: async (values) => {
        return values.batman === 'batman' ? {} : {batman: ['notBatman']};
      },
    });
    wrapper = mount(<TestForm controller={controller}/>);
    const formDriver = createTestFormDriver({wrapper});

    expect(getMeta('form:isValidating')).toBe('false');

    formDriver.when.submit();

    expect(getMeta('form:isValidating')).toBe('true');

    await waitFor(() => {
      return getMeta('form:isValidating') === 'false';
    });
  });
});
