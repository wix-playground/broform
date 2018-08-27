import * as React from 'react';
import {mount} from 'enzyme';
import {TestForm} from '../test/components/TestForm';
import {InputAdapter} from '../test/components/InputAdapter';
import {Field} from '../src/Field';
import {createTestFormDriver} from '../test/components/TestForm.driver';
import {createInputAdapterDriver} from '../test/components/InputAdapter/InputAdapter.driver';
import {waitFor} from '../test/helpers/conditions';

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

  it('onSubmitAfter', async () => {
    const callbackStack: string[] = [];

    const wrapper = mount(
      <TestForm
        initialValues={{
          [TestForm.FIELD_ONE_NAME]: 'John Snow',
        }}
        onSubmit={() => callbackStack.push('onSubmit')}
        onSubmitAfter={() => callbackStack.push('onSubmitAfter')}
      />,
    );

    const formDriver = createTestFormDriver({wrapper});
    formDriver.when.submit();

    await waitFor(wrapper)(() => {
      const [firstCall, secondCall] = callbackStack;
      return firstCall === 'onSubmit' && secondCall === 'onSubmitAfter';
    });
  });


  it('formatter (with field support)', async () => {
    const onValidate = jest.fn();
    const wrapper = mount(
      <TestForm
        initialValues={{
          [TestForm.FIELD_ONE_NAME]: 'John Snow',
          [TestForm.FIELD_TWO_NAME]: 'Ned Stark',
        }}
        onValidate={onValidate}
        formatter={(values: any) => {
          return {
            ...values,
            [TestForm.FIELD_ONE_NAME]: values[TestForm.FIELD_ONE_NAME] + ':formatted',
          };
        }}
      >
        <Field name={TestForm.FIELD_ONE_NAME} adapter={InputAdapter} />
        <Field
          name={TestForm.FIELD_TWO_NAME}
          adapter={InputAdapter}
          onFormat={(value: string) => {
            return value + ':formatted';
          }}
        />
      </TestForm>,
    );

    const formDriver = createTestFormDriver({wrapper});
    const fieldOneDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});
    const fieldTwoDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_TWO_NAME});

    expect(formDriver.get.values()[TestForm.FIELD_ONE_NAME]).toBe('John Snow:formatted');
    expect(formDriver.get.values()[TestForm.FIELD_TWO_NAME]).toBe('Ned Stark:formatted');

    fieldOneDriver.when.change('Tyrion Lannister');
    fieldTwoDriver.when.change('Arya Stark');

    expect(formDriver.get.values()[TestForm.FIELD_ONE_NAME]).toBe('Tyrion Lannister:formatted');
    expect(formDriver.get.values()[TestForm.FIELD_TWO_NAME]).toBe('Arya Stark:formatted');

    formDriver.when.submit();

    expect(onValidate).toBeCalledWith({
      [TestForm.FIELD_ONE_NAME]: 'Tyrion Lannister:formatted',
      [TestForm.FIELD_TWO_NAME]: 'Arya Stark:formatted'
    });
  });
});
