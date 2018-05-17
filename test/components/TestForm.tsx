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
  render() {
    const {controller, formProps} = this.props;
    const props = controller
      ? controller
      : formProps;

    return (
      <Form {...props}>
        {(formApi: FormAPI) => {
          const {submit} = formApi;

          return (
            <form onSubmit={submit} noValidate data-hook="test-form">
              <Field name="batman" adapter={InputAdapter} />
              <Field name="robin" adapter={InputAdapter} />
              <button type="submit">Submit</button>
            </form>
          );
        }}
      </Form>
    );
  }
}