import * as React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {Field} from '../src/Field';
import {InputAdapter} from '../test/components/InputAdapter';
import {createInputAdapterDriver} from '../test/components/InputAdapter/InputAdapter.driver';
import {createTestFormDriver} from '../test/components/TestForm.driver';
import {waitInWrapper} from '../test/helpers/conditions';

describe('Field interactions', async () => {
  const waitFor = (condition: () => boolean) => waitInWrapper(wrapper)(condition);
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
    const toggleField = wrapper.find(`[data-hook="toggle-field"]`);

    fieldDriver.when.change('batman');

    toggleField.simulate('click');
    toggleField.simulate('click');

    expect(fieldDriver.get.value()).toBe('');
  });

  it('set custom state', async () => {
    const formController = new FormController({});

    expect(formController.API.getFieldMeta(TestForm.FIELD_ONE_NAME).custom).toEqual({});

    wrapper = mount( <TestForm>
      <Field
        name={TestForm.FIELD_ONE_NAME}
        adapter={InputAdapter}
        adapterProps={{
          customState: {
            customProperty: 'custom value'
          }
        }}
      />
    </TestForm>);

    const fieldDriver = createInputAdapterDriver({wrapper, dataHook: TestForm.FIELD_ONE_NAME});

    fieldDriver.when.setCustomState();

    await waitFor(() => {
      return fieldDriver.get.meta('custom:customProperty') === 'custom value';
    });
  });


});
