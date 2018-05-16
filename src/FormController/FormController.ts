import * as React from 'react';
import {observable, action, runInAction, toJS, computed} from 'mobx';
import {flatten} from 'flat';
import {Field, ValidationFunction, EqualityFunction, FieldProps} from '../Field';
const set = require('lodash/set');
const get = require('lodash/get');
const isEmpty = require('lodash/isEmpty');
const merge = require('lodash/merge');
const size = require('lodash/size');
const isUndefined = require('lodash/isUndefined');

export type FormValidationErrors = {
  [key: string]: string[] | FormValidationErrors;
} | null;

export type FormValues = {
  [key: string]: any | FormValues;
};

export type FieldValidationError = string | string[] | null;

export interface FormControllerOptions {
  initialValues?: FormValues;
  onValidate?: (values: any) => any;
  onSubmit?: (errors: FormValidationErrors, values: FormValues, submitEvent?: React.FormEvent<any>) => void;
  formatter?: (values: FormValues) => FormValues;
}

export interface FormField {
  instance: Field;
  errors: FieldValidationError;
  meta: FormFieldMeta;
  props: FieldProps;
  value: any;
  isRegistered: boolean;
}

export interface FormFieldMeta {
  custom: any;
  isEqual: EqualityFunction;
  initialValue: any;
  isTouched: boolean;
  isActive: boolean;
  isValidating: boolean;
  isDirty: boolean;
}

export interface FormAPI {
  values: FormValues;
  errors: FormValidationErrors;
  submit: (submitEvent?: React.FormEvent<any>) => void;
  reset: () => void;
  clear: () => void;
  setFieldValue: (fieldName: string, value: any) => void;
  setFieldCustomState: (fieldName: string, key: string, value: any) => void;
  setFormCustomState: (key: string, value: any) => void;
  onValidate: () => void;
  getFieldMeta: (fieldName: string) => FormFieldMeta;
  meta: {
    isSubmitting: boolean;
    isValidating: boolean;
    submitCount: number;
    isValid: boolean;
    isDirty: boolean;
    isTouched: boolean;
  };
}

export class FormController {
  //Form options
  protected readonly options: FormControllerOptions;

  //get all field level validations
  @computed
  protected get fieldValidations() {
    const fieldValidations: {[index: string]: ValidationFunction} = {};
    this.fields.forEach((field: FormField, name: string) => {
      if (field.instance && field.props.validation) {
        fieldValidations[name] = field.props.validation;
      }
    });

    return fieldValidations;
  }

  //get all field values
  @computed
  protected get values() {
    const values = {};

    this.fields.forEach((field: FormField, name: string) => {
      if (field.instance) {
        set(
          values,
          name,
          toJS(field.value, {
            detectCycles: false,
          }),
        );
      }
    });

    return values;
  }

  //used for passing safe copy of values to users form child render function
  @computed
  protected get formattedValues() {
    const {formatter} = this.options;
    const values = this.values;
    return formatter ? formatter(values) : values;
  }

  //executes general form validator passed to Form as a `onValidate` prop and returns errors
  protected runFormLevelValidations = async () => {
    return this.options.onValidate ? await this.options.onValidate(this.formattedValues) : {};
  };

  //executes all field level validators passed to Fields as a `validate` prop and returns errors
  protected runFieldLevelValidations = async (): Promise<({[name: string]: FieldValidationError}) | {}> => {
    let pendingValidationCount = size(this.fieldValidations);

    if (pendingValidationCount === 0) {
      return {};
    }

    return await new Promise((resolve) => {
      const errors: {[index: string]: FieldValidationError} = {};

      Object.keys(this.fieldValidations).forEach((fieldName) => {
        const fieldMeta = this.fields.get(fieldName).meta;

        runInAction(() => (fieldMeta.isValidating = true));

        Promise.resolve(this.validateField(fieldName)).then((error: FieldValidationError) => {
          if (error !== null) {
            errors[fieldName] = error;
          }
          runInAction(() => (fieldMeta.isValidating = false));

          pendingValidationCount--;

          if (pendingValidationCount === 0) {
            resolve(errors);
          }
        });
      });
    });
  };

  @action
  protected setErrors = (errors: FormValidationErrors) => {
    this.errors = !isEmpty(errors) ? errors : null;
  };
  //All validation errors
  @observable protected errors: FormValidationErrors;

  //validates particular field by calling field level validator passed to Field as a `validate` prop
  protected validateField = async (name: string): Promise<any> => {
    return await this.fieldValidations[name](get(this.values, name), this.values);
  };

  @action
  protected createVirtualField = (name: string) => {
    const controller = this;

    this.fields.set(name, {
      instance: null,
      errors: null,
      value: null,
      props: {} as FieldProps,
      isRegistered: false,
      meta: {
        isEqual: (a: any, b: any) => a === b,
        custom: {},
        initialValue: null,
        isTouched: false,
        isActive: false,
        isValidating: false,
        get isDirty() {
          const field = controller.fields.get(name);
          return !field.meta.isEqual(field.value, field.meta.initialValue);
        },
      },
    });
  };

  //used for first time field creation
  @action
  protected updateFieldAsNew = (fieldInstance: Field, props: FieldProps) => {
    const {name, isEqual} = props;
    const field = this.fields.get(name);

    const initialValue = !isUndefined(get(this.options.initialValues, name))
      ? get(this.options.initialValues, name)
      : props.defaultValue;

    merge(field, {
      instance: fieldInstance,
      errors: null,
      props,
      value: initialValue,
      isRegistered: true,
      meta: {
        custom: {},
        isEqual: isEqual,
        initialValue: initialValue,
        isTouched: false,
        isActive: false,
        isValidating: false,
      }
    });
  };

  //used for cases when field was created, unmounted and created again
  @action
  protected updateFieldAsExisting = (fieldInstance: Field, props: FieldProps) => {
    const field = this.fields.get(props.name);

    field.instance = fieldInstance;
  };

  //general handler for registering the field upon it's mounting
  registerField = (fieldInstance: Field, props: FieldProps) => {
    const {name} = props;
    if (this.fields.has(name) && this.fields.get(name).isRegistered) {
      this.updateFieldAsExisting(fieldInstance, props);
    } else {
      this.createVirtualField(name);
      this.updateFieldAsNew(fieldInstance, props);
    }
  };

  @action
  protected updateErrorOnSingleField = (fieldName: string, errors: {[name: string]: FieldValidationError}) => {
    this.fields.get(fieldName).errors = errors[fieldName] ? errors[fieldName] : null;
  };

  //sets errors for all fields
  @action
  protected updateErrorOnEveryFieldUsing = (formValidationErrors: FormValidationErrors) => {
    const fieldErrors: {[key: string]: string[] | null} = formValidationErrors
      ? flatten(formValidationErrors, {
          safe: true,
        })
      : null;

    this.fields.forEach((field) => {
      if (field.instance) {
        const name = field.props.name;
        const errors = fieldErrors && fieldErrors[name];

        field.errors = errors ? errors : null;
      }
    });
  };

  protected getFieldMeta = (fieldName: string) => {
    this.createFieldIfDontExist(fieldName);
    return toJS(this.fields.get(fieldName).meta, {detectCycles: false});
  };

  //general handler for resetting form to specific state
  @action
  protected resetToValues = (values: FormValues) => {
    this.fields.forEach((field: FormField, name: string) => {
      const value = get(values, name);

      if (isUndefined(value) && !isUndefined(field.meta.initialValue)) {
        field.value = field.meta.initialValue;
      } else {
        field.value = value;
      }
      field.meta.isTouched = false;
    });
    this.setSubmitCount(0);
    this.updateErrorOnEveryFieldUsing({});
  };

  constructor(props: FormControllerOptions) {
    this.options = props;
  }

  //form FormAPI, which will be passed to child render function or could be retrieved with getApi prop callback
  @computed
  get API(): FormAPI {
    return {
      values: this.formattedValues,
      errors: this.errors,
      submit: this.submit,
      reset: this.reset,
      clear: this.clear,
      setFieldValue: this.changeFieldValue,
      setFieldCustomState: this.setFieldCustomState,
      setFormCustomState: this.setFormCustomState,
      onValidate: this.validate,
      getFieldMeta: this.getFieldMeta,
      meta: {
        isValidating: this.isValidating,
        isSubmitting: this.isSubmitting,
        submitCount: this.submitCount,
        isValid: this.isValid,
        isDirty: this.isDirty,
        isTouched: this.isTouched,
      },
    };
  }

  //where any of the form fields ever under user focus
  @computed
  get isTouched(): boolean {
    const fieldValues = Array.from(this.fields.values());
    return fieldValues.some((field: FormField) => field.meta.isTouched);
  }

  //are any of the fields have value different from initial
  @computed
  get isDirty(): boolean {
    const fieldValues = Array.from(this.fields.values());
    return fieldValues.some((field: FormField) => field.meta.isDirty);
  }

  //all registered form fields, new field is being added when Field constructor is called
  fields: Map<string, FormField> = observable.map();

  //changed when form validation state changes
  @observable isValid: boolean = true;
  @action setIsValid = (state: boolean) => (this.isValid = state);

  //changed when form starts or finishes validating
  @observable isValidating: boolean = false;
  @action setIsValidating = (state: boolean) => (this.isValidating = state);

  //changed when form starts or finishes submit process
  @observable isSubmitting: boolean = false;
  @action setIsSubmitting = (state: boolean) => (this.isSubmitting = state);

  //increments upon every submit try
  @observable submitCount: number = 0;
  @action setSubmitCount = (state: number) => (this.submitCount = state);

  //used for setting custom form state, which should be accessible from form api, is passed to adapter options as well
  @observable formCustomState: any = {};
  @action setFormCustomState = (key: string, value: any) => (this.formCustomState[key] = value);

  //is called when field is unmounted
  @action
  unRegisterField = (fieldName: string) => {
    const field = this.fields.get(fieldName);
    if (field.props.persist) {
      field.instance = null;
    } else {
      this.fields.delete(fieldName);
    }
  };

  //changes field active state usually based on 'blur'/'focus' events
  @action
  changeFieldActiveState = (fieldName: string, isActive: boolean) => {
    const field = this.fields.get(fieldName);
    if (isActive) {
      field.meta.isTouched = true;
    }
    field.meta.isActive = isActive;
  };

  //changes field custom state set by user
  @action
  setFieldCustomState = (fieldName: string, key: string, value: any) => {
    this.createFieldIfDontExist(fieldName);
    this.fields.get(fieldName).meta.custom[key] = value;
  };

  //changes when user interacts with the the field, usually 'focus' event
  @action
  setFieldTouched = (fieldName: string) => {
    this.fields.get(fieldName).meta.isTouched = true;
  };

  //changes when called adapted onChange handler
  @action
  changeFieldValue = (fieldName: string, value: any) => {
    this.createFieldIfDontExist(fieldName);
    const field = this.fields.get(fieldName);
    field.value = value;
  };

  createFieldIfDontExist = (fieldName: string) => {
    if (!this.fields.has(fieldName)) {
      this.createVirtualField(fieldName);
    }
  };

  //resets the form to initial values and making it pristine
  reset = () => {
    return this.resetToValues(this.options.initialValues);
  };

  clear = () => {
    return this.resetToValues({});
  };

  //validates the form by calling form level validation function combined with field level validations
  validate = async () => {
    this.setIsValidating(true);

    const [fieldValidationErrors, formValidationErrors] = await Promise.all([
      this.runFieldLevelValidations(),
      this.runFormLevelValidations(),
    ]);
    this.setErrors(merge(fieldValidationErrors, formValidationErrors));
    this.updateErrorOnEveryFieldUsing(this.errors);

    this.setIsValid(this.errors !== null);
    this.setIsValidating(false);
  };

  //wraps submit function passed as a form `onSubmit` prop and it's being passed to child render function
  submit = async (submitEvent?: React.FormEvent<any>) => {
    if (submitEvent) {
      submitEvent.persist();
      submitEvent.preventDefault();
    }

    this.setSubmitCount(this.submitCount + 1);
    this.setIsSubmitting(true);

    await this.validate();

    try {
      await this.options.onSubmit(this.errors, this.formattedValues, submitEvent);
    } finally {
      this.setIsSubmitting(false);
    }
  }

}
