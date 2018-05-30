import * as React from 'react';
import {mount} from 'enzyme';
import {TestForm} from '../test/components/TestForm';
import {InputAdapter} from '../test/components/InputAdapter';
import {Field} from '../src/Field';
import {createTestFormDriver} from '../test/components/TestForm.driver';
import {createInputAdapterDriver} from '../test/components/InputAdapter/InputAdapter.driver';

describe('Form props', async () => {
  it('initialValues', async () => {
    const wrapper = mount(
      <TestForm
        initialValues={{
          [TestForm.FIELD_ONE_NAME]: 'John Snow',
        }}
      />,
    );
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(fieldDriver.get.value()).toBe('John Snow');
  });

  it('formatter', async () => {
    const onValidate = jest.fn();
    const wrapper = mount(
      <TestForm
        initialValues={{
          [TestForm.FIELD_ONE_NAME]: 'John Snow',
        }}
        onValidate={onValidate}
        formatter={(values: any) => {
          return {
            [TestForm.FIELD_ONE_NAME]: values[TestForm.FIELD_ONE_NAME] + ':formatted',
          };
        }}
      >
        <Field name={TestForm.FIELD_ONE_NAME} adapter={InputAdapter} />
      </TestForm>,
    );

    const formDriver = createTestFormDriver({wrapper});
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    expect(formDriver.get.values()[TestForm.FIELD_ONE_NAME]).toBe('John Snow:formatted');

    fieldDriver.when.change('Tyrion Lannister');

    expect(formDriver.get.values()[TestForm.FIELD_ONE_NAME]).toBe('Tyrion Lannister:formatted');

    formDriver.when.submit();

    expect(onValidate).toBeCalledWith({batman: 'Tyrion Lannister:formatted'});
  });
});
