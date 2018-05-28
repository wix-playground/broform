import * as React from 'react';
import {Field} from '../../src/Field';
import {Form, FormProps} from '../../src/Form';
import {FormAPI} from '../../src/FormController';
import {InputAdapter} from './InputAdapter';

export interface TestFormProps {
  controller?: any;
  formProps?: FormProps;
}

export class TestForm extends React.Component<TestFormProps> {
  static FIELD_ONE_NAME = 'batman';
  static FIELD_TWO_NAME = 'robin';

  render() {
    const {controller, formProps} = this.props;
    const props = controller ? {controller} : formProps;

    return (
      <Form {...props}>
        {(formApi: FormAPI) => {
          const {submit} = formApi;

          return (
            <form onSubmit={submit} noValidate data-hook="test-form">
              {this.props.children ? (
                this.props.children
              ) : (
                <div>
                  <Field name={TestForm.FIELD_ONE_NAME} adapter={InputAdapter} />
                  <Field name={TestForm.FIELD_TWO_NAME} adapter={InputAdapter} />
                </div>
              )}
              <button type="submit">Submit</button>
            </form>
          );
        }}
      </Form>
    );
  }
}
