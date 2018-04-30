import * as React from 'react';
import {observer, Provider} from 'mobx-react';
import {FormController, FormValidationErrors, FormValues} from '../FormController';
import {FormPart, FormPartProps} from '../FormPart';

export interface FormProps extends FormPartProps {
  initialValues?: FormValues;
  onValidate?: (values: any) => any;
  onSubmit?: (
    errors: FormValidationErrors,
    values: FormValues,
    submitEvent?: React.FormEvent<any>,
  ) => void;
  formatter?: (values: FormValues) => FormValues;
  controller?: FormController;
}

@observer
export class Form extends React.Component<FormProps, any> {
  controller: FormController;

  constructor(props: any) {
    super(props);
    //controller can be injected by prop and created in any place outside of `render` function / component where used
    this.controller = props.controller || new FormController(props);
  }

  //creates the provider and sets the controller which will be accessible from `Field`
  render() {
    return (
      <Provider controller={this.controller}>
        <FormPart>{this.props.children}</FormPart>
      </Provider>
    );
  }
}
