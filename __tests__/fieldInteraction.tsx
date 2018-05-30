import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {TestForm} from '../test/components/TestForm';
import {Field} from '../src/Field';
import {InputAdapter} from '../test/components/InputAdapter';
import {createInputAdapterDriver} from '../test/components/InputAdapter/InputAdapter.driver';
import {createTestFormDriver} from '../test/components/TestForm.driver';

describe('Field interactions', async () => {
  let wrapper: ReactWrapper;

  it('should keep value if "persist=true"', () => {
    type StatefulFormState = {
      hiddenField: boolean;
    }
    class StatefulForm extends React.Component<null, StatefulFormState> {
      state = {
        hiddenField: false
      };

      render() {
        return (
          <TestForm>
            {!this.state.hiddenField && <Field name={TestForm.FIELD_ONE_NAME} adapter={InputAdapter} persist={true} />}
            <button type="button" data-hook="toggle-field" onClick={() => {
              this.setState((state) => {
                return {
                  hiddenField: !state.hiddenField
                }
              })
            }}>Toggle Field</button>
          </TestForm>
        );
      }
    }
    wrapper = mount(<StatefulForm />);

    const formDriver = createTestFormDriver({wrapper});
    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});
    const toggleField = wrapper.find(`[data-hook="toggle-field"]`);

    fieldDriver.when.change('batman');

    toggleField.simulate('click');

    expect(formDriver.get.values()[TestForm.FIELD_ONE_NAME]).toBeUndefined();

    toggleField.simulate('click');

    expect(fieldDriver.get.value()).toBe('batman');
  });

  it('should not keep value', () => {
    type StatefulFormState = {
      hiddenField: boolean;
    }
    class StatefulForm extends React.Component<null, StatefulFormState> {
      state = {
        hiddenField: false
      };

      render() {
        return (
          <TestForm>
            {!this.state.hiddenField && <Field name={TestForm.FIELD_ONE_NAME} adapter={InputAdapter} />}
            <button type="button" data-hook="toggle-field" onClick={() => {
              this.setState((state) => {
                return {
                  hiddenField: !state.hiddenField
                }
              })
            }}>Toggle Field</button>
          </TestForm>
        );
      }
    }
    wrapper = mount(<StatefulForm />);

    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    fieldDriver.when.change('batman');

    wrapper.find(`[data-hook="toggle-field"]`).simulate('click');

    wrapper.find(`[data-hook="toggle-field"]`).simulate('click');

    expect(fieldDriver.get.value()).toBe('');
  });
});
