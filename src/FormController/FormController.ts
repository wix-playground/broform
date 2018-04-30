import * as React from 'react';
import {observable, action, runInAction, toJS, computed} from 'mobx';
import {FormProps} from '../Form';
import {flatten} from 'flat';
import {Field, FieldProps, ValidationFunction} from '../Field';
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

export interface FormField {
  instance: Field;
  props: FieldProps;
  errors: FieldValidationError;
  value: any;
  meta: FormFieldMeta;
  validation: ValidationFunction;
}

export interface FormFieldMeta {
  custom: {[key: string]: any};
  initialValue: any;
  isTouched: boolean;
  isActive: boolean;
  isValidating: boolean;
  isDirty: boolean;
}

export interface FormAPI {
  values: FormValues;
  errors: FormValidationErrors;
  submit: (submitEvent?: React.FormEvent<any>) => Promise<void>;
  onReset: (values?: any) => void;
  onClear: () => void;
  setFieldValue: (fieldName: string, value: any) => void;
  setFieldCustomState: (fieldName: string, key: string, value: any) => void;
  setFormCustomState: (key: string, value: any) => void;
  onValidate: () => void;
  meta: {
    isSubmitting: boolean;
    submitCount: number;
    isValid: boolean;
    isDirty: boolean;
    isTouched: boolean;
  };
}

export class FormController {
  //Form props
  protected readonly props: FormProps;

  //get all field level validations
  @computed
  protected get fieldValidations() {
    const fieldValidations: {[index: string]: ValidationFunction} = {};
    this.fields.forEach((field: FormField, name: string) => {
      if (field.instance && field.validation) {
        fieldValidations[name] = field.validation;
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
    const {formatter} = this.props;
    const values = this.values;
    return formatter ? formatter(values) : values;
  }

  //get all field errors
  @computed
  protected get errors(): FormValidationErrors {
    const errors = {};

    this.fields.forEach((field: FormField, name: string) => {
      if (field.instance && !isEmpty(field.errors)) {
        set(errors, name, toJS(field.errors, {detectCycles: false}));
      }
    });

    return !isEmpty(errors) ? errors : null;
  }

  //executes general form validator passed to Form as a `onValidate` prop and returns errors
  protected formValidationErrors = async () => {
    return this.props.onValidate ? await this.props.onValidate(this.formattedValues) : {};
  }

  //executes all field level validators passed to Fields as a `validate` prop and returns errors
  protected validateAllFields = async (
    name?: string,
  ): Promise<({[name: string]: FieldValidationError}) | {}> => {
    let pendingValidationCount = size(this.fieldValidations);

    if (pendingValidationCount === 0) {
      return {};
    }

    if (name) {
      const errors = {};
      const fieldMeta = this.fields.get(name).meta;

      runInAction(() => (fieldMeta.isValidating = true));

      return this.validateField(name).then((fieldErrors) => {
        if (fieldErrors !== null) {
          set(errors, name, fieldErrors);
        }

        runInAction(() => (fieldMeta.isValidating = false));

        return errors;
      });
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
  }

  //validates particular field by calling field level validator passed to Field as a `validate` prop
  protected validateField = async (name: string): Promise<any> => {
    return await this.fieldValidations[name](get(this.values, name), this.values);
  }

  //returns true if field different from its initial value
  protected isFormFieldDirty = (field: FormField, value: any): boolean => {
    return !field.props.isEqual(field.meta.initialValue, value);
  }

  //general handler for resetting form to specific state
  @action
  protected resetToValues = async (values: FormValues) => {
    this.fields.forEach((field: FormField, name: string) => {
      const value = get(values, name);
      const fieldProps = field.props;

      if (isUndefined(value) && !isUndefined(fieldProps.defaultValue)) {
        field.value = fieldProps.defaultValue;
      } else {
        field.value = value;
      }
      field.meta.isTouched = false;
    });
    this.setSubmitCount(0);
    this.updateAllFieldsErrors({});
  }

  //construct initial meta info for field
  protected constructDefaultFieldMeta = (field: React.Component<FieldProps>, options: {initialValue: any}): FormFieldMeta => {
    const controller = this;
    const {name} = field.props;

    return {
      custom: {},
      initialValue: options.initialValue,
      isTouched: false,
      isActive: false,
      isValidating: false,
      get isDirty() {
        return !field.props.isEqual(controller.fields.get(name).value, this.initialValue);
      },
    };
  }

  //used for cases when field was created, unmounted and created again
  @action
  protected updateExistingField = (fieldInstance: Field) => {
    const {name} = fieldInstance.props;
    const field = this.fields.get(name);

    field.instance = fieldInstance;
    field.meta.isTouched = false;
    field.meta.isActive = false;
    field.meta.isValidating = false;
    field.validation = fieldInstance.props.validation;
  }

  //used for first time field creation
  @action
  protected registerNewField = (fieldInstance: Field) => {
    const {props} = fieldInstance;
    const {name} = props;

    const initialValue = !isUndefined(get(this.props.initialValues, name))
      ? get(this.props.initialValues, name)
      : fieldInstance.props.defaultValue;

    this.fields.set(name, {
      instance: fieldInstance,
      props,
      errors: null,
      value: initialValue,
      meta: this.constructDefaultFieldMeta(fieldInstance, {initialValue}),
      validation: props.validation,
    });
  }

  @action
  protected updateFieldError = (fieldName: string, errors: {[name: string]: FieldValidationError}) => {
    this.fields.get(fieldName).errors = errors[fieldName] ? errors[fieldName] : null;
  }

  //sets errors for all fields
  @action
  protected updateAllFieldsErrors = (formValidationErrors: FormValidationErrors) => {
    const fieldErrors: {[key: string]: string[] | null} = flatten(formValidationErrors, {
      safe: true,
    });

    this.fields.forEach((field) => {
      const name = field.props.name;
      const errors = fieldErrors[name];

      field.errors = errors ? errors : null;
    });
  }

  constructor(props: any) {
    this.props = props;
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

  //form FormAPI, which will be passed to child render function or could be retrieved with getApi prop callback
  @computed
  get API(): FormAPI {
    return {
      values: this.formattedValues,
      errors: this.errors,
      submit: this.submit,
      onReset: this.reset,
      onClear: this.clear,
      setFieldValue: this.changeFieldValue,
      setFieldCustomState: this.setFieldCustomState,
      setFormCustomState: this.setFormCustomState,
      onValidate: this.validate,
      meta: {
        isSubmitting: this.isSubmitting,
        submitCount: this.submitCount,
        isValid: this.isValid,
        isDirty: this.isDirty,
        isTouched: this.isTouched,
      },
    };
  }

  //TODO fix typings
  //all registered form fields, new field is being added when Field constructor is called
  fields: Map<string, FormField> = observable.map() as any;

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

  //used for setting custom form state, which should be accessible from form api, is passed to adapter props as well
  @observable formCustomState: any = {};
  @action setFormCustomState = (key: string, value: any) => (this.formCustomState[key] = value);

    //general handler for registering the field upon it's creation
  registerField = (field: Field) => {
    const {name} = field.props;
    if (this.fields.has(name)) {
      this.updateExistingField(field);
    } else {
      this.registerNewField(field);
    }
  }

  //is called when field is unmounted
  @action
  unRegisterField = (fieldName: string) => {
    const formField = this.fields.get(fieldName);
    if (formField.props.persist) {
      formField.instance = null;
      formField.meta.isActive = false;
    } else {
      this.fields.delete(fieldName);
    }
  }

  //validates the form by calling general form validator combined with field level validators
  validate = async (name?: string) => {
    this.setIsValidating(true);

    if (name) {
      const errors = await this.validateAllFields(name);
      this.updateFieldError(name, errors);
    } else {
      const [fieldValidationErrors, formValidationErrors] = await Promise.all([
        this.validateAllFields(),
        this.formValidationErrors(),
      ]);
      const errors = merge(fieldValidationErrors, formValidationErrors);
      this.updateAllFieldsErrors(errors);
    }

    this.setIsValidating(false);
  }

  //changes field active state usually based on 'blur'/'focus' events
  @action
  changeFieldActiveState = (fieldName: string, isActive: boolean) => {
    const field = this.fields.get(fieldName);
    if (isActive) {
      field.meta.isTouched = true;
    }
    field.meta.isActive = isActive;
  }

  //changes field custom state set by user
  @action
  setFieldCustomState = (fieldName: string, key: string, value: any) => {
    this.fields.get(fieldName).meta.custom[key] = value;
  }

  //changes when user interacts with the the field, usually 'focus' event
  @action
  setFieldTouched = (fieldName: string) => {
    this.fields.get(fieldName).meta.isTouched = true;
  }

  //changes when called adapted onChange handler
  @action
  changeFieldValue = (fieldName: string, value: any) => {
    const field = this.fields.get(fieldName);
    field.value = value;
  }

  //resets the form to initial values and making it pristine
  reset = (values = this.props.initialValues) => {
    return this.resetToValues(values);
  }

  //clears all form values and making it pristine
  clear = () => {
    return this.resetToValues({});
  }

  //wraps submit function passed as a form `onSubmit` prop and it's being passed to child render function
  submit = async (submitEvent?: React.FormEvent<any>) => {
    if (submitEvent) {
      submitEvent.persist();
      submitEvent.preventDefault();
    }

    runInAction(() => {
      this.setSubmitCount(this.submitCount + 1);
      this.setIsValid(true);
      this.setIsSubmitting(true);
    });

    await runInAction(async () => {
      await this.validate();

      if (this.errors) {
        this.setIsValid(false);
      }

      try {
        await this.props.onSubmit(this.errors, this.formattedValues, submitEvent);
      } finally {
        this.setIsSubmitting(false);
      }
    });
  }
}
