import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {TestForm} from '../test/components/TestForm';
import {getInput} from '../test/helpers/getters';
import {InputAdapter} from '../test/components/InputAdapter';
import {Field} from '../src/Field';
import {createTestFormDriver} from '../test/components/TestForm.driver';

describe('Form props', async () => {
  let wrapper: ReactWrapper;

  const getFieldInput = () => getInput(wrapper, TestForm.FIELD_ONE_NAME);

  it('initialValues', async () => {
    wrapper = mount(
      <TestForm
        initialValues={{
          [TestForm.FIELD_ONE_NAME]: 'John Snow',
        }}
      />,
    );

    expect((getFieldInput().getDOMNode() as HTMLInputElement).value).toBe('John Snow');
  });

  it('formatter', async () => {
    const onValidate = jest.fn();

    wrapper = mount(
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

    expect(formDriver.get.values()[TestForm.FIELD_ONE_NAME]).toBe('John Snow:formatted');

    getFieldInput().simulate('change', {target: {value: 'Tyrion Lannister'}});

    expect(formDriver.get.values()[TestForm.FIELD_ONE_NAME]).toBe('Tyrion Lannister:formatted');

    formDriver.when.submit();

    expect(onValidate).toBeCalledWith({batman: 'Tyrion Lannister:formatted'});
  });
});
