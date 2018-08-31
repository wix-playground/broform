import * as React from 'react';
import {observable, action, runInAction, toJS, computed} from 'mobx';
import {flatten} from 'flat';
import {Field, ValidationFunction, EqualityCheckFunction, FieldProps, FormatterFunction} from '../Field';
const set = require('lodash/set');
const get = require('lodash/get');
const merge = require('lodash/merge');

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
  onFormat?: (values: FormValues) => FormValues;
  onSubmit?: (errors: FormValidationErrors, values: FormValues, submitEvent?: React.FormEvent<any>) => void;
  onSubmitAfter?: (errors: FormValidationErrors, values: FormValues, submitEvent?: React.FormEvent<any>) => void;
}

export interface FormField {
  instance: null | Field;
  errors: FieldValidationError;
  meta: FormFieldMeta;
  props: undefined | FieldProps;
  value: any;
}

export interface FormFieldMeta {
  custom: {[key: string]: any};
  isEqual: EqualityCheckFunction;
  initialValue: any;
  isTouched: boolean;
  isActive: boolean;
  isValidating: boolean;
  isDirty: boolean;
  isRegistered: boolean;
}

export interface FormMeta {
  isValidating: boolean;
  isSubmitting: boolean;
  submitCount: number;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
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
  meta: FormMeta;
}

export class FormController {
  //Form options
  @observable
  protected options!: FormControllerOptions;
  @action
  setOptions = (options: FormControllerOptions) => (this.options = options);

  //set current form values as initialValues
  @action
  protected updateInitialValues = () => {
    this.options.initialValues = this.values;
    this.fields.forEach((field: FormField) => {
      field.meta.initialValue = get(this.options.initialValues, field.props!.name);
    });
  };

  //get all field level validations
  @computed
  protected get fieldFormatters() {
    const fieldFormatters: {[index: string]: FormatterFunction} = {};
    this.fields.forEach((field: FormField, name: string) => {
      if (field.instance && field.props!.onFormat) {
        fieldFormatters[name] = field.props!.onFormat as FormatterFunction;
      }
    });

    return fieldFormatters;
  }

  //get all field level validations
  @computed
  protected get fieldValidations() {
    const fieldValidations: {[index: string]: ValidationFunction} = {};
    this.fields.forEach((field: FormField, name: string) => {
      if (field.instance && field.props!.onValidate) {
        fieldValidations[name] = field.props!.onValidate as ValidationFunction;
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
    const {onFormat} = this.options;
    const values = this.values;

    Object.keys(this.fieldFormatters).forEach((fieldName) => {
      set(values, fieldName, this.fieldFormatters[fieldName](get(this.values, fieldName)));
    });

    return onFormat ? onFormat(values) : values;
  }

  //executes general form validator passed to Form as a `onValidate` prop and returns errors
  protected runFormLevelValidations = async () => {
    return this.options.onValidate ? await this.options.onValidate(this.formattedValues) : {};
  };

  //executes all field level validators passed to Fields as a `validate` prop and returns errors
  protected runFieldLevelValidations = async (): Promise<({[name: string]: FieldValidationError}) | {}> => {
    let pendingValidationCount = Object.keys(this.fieldValidations).length;

    if (pendingValidationCount === 0) {
      return {};
    }

    return await new Promise((resolve) => {
      const errors: {[index: string]: FieldValidationError} = {};

      Object.keys(this.fieldValidations).forEach((fieldName) => {
        const fieldMeta = this.fields.get(fieldName)!.meta;

        runInAction(() => (fieldMeta.isValidating = true));

        Promise.resolve(this.validateField(fieldName))
          .then(
            (error: FieldValidationError) => {
              if (!(error === null || error === undefined)) {
                errors[fieldName] = error;
              }
            },
            (error) => {
              errors[fieldName] = error;
            },
          )
          .then(() => {
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
    this.errors = errors && Object.keys(errors).length ? errors : null;
  };
  //All onValidate errors
  @observable
  protected errors: FormValidationErrors = null;

  //validates particular field by calling field level validator passed to Field as a `validate` prop
  protected validateField = async (name: string): Promise<any> => {
    return await this.fieldValidations[name](get(this.values, name), this.values);
  };

  @action
  protected createVirtualField = (name: string) => {
    const self = this;

    const meta: FormFieldMeta = {
      isEqual: (a: any, b: any) => a === b,
      custom: observable.map(),
      initialValue: undefined,
      isTouched: false,
      isActive: false,
      isValidating: false,
      isRegistered: false,
      get isDirty() {
        const field = self.fields.get(name)!;
        return !field.meta.isEqual(field.value, field.meta.initialValue);
      },
    };

    this.fields.set(name, {
      instance: null,
      errors: null,
      value: undefined,
      props: undefined,
      meta,
    });
  };

  //used for first time field creation
  @action
  protected updateFieldAsNew = (fieldInstance: Field, props: FieldProps) => {
    const {name, onEqualityCheck} = props;
    const field = this.fields.get(name);

    const initialValue =
      get(this.options.initialValues, name) !== undefined ? get(this.options.initialValues, name) : props.defaultValue;

    merge(field, {
      instance: fieldInstance,
      props,
      value: initialValue,
      meta: {
        onEqualityCheck,
        initialValue,
        isRegistered: true,
      },
    });
  };

  //used for cases when field was created, unmounted and created again
  @action
  protected updateFieldAsExisting = (fieldInstance: Field, props: FieldProps) => {
    const field = this.fields.get(props.name)!;

    field.instance = fieldInstance;
  };

  //general handler for registering the field upon it's mounting
  registerField = (fieldInstance: Field, props: FieldProps) => {
    const {name} = props;
    if (this.fields.has(name) && this.fields.get(name)!.meta.isRegistered) {
      this.updateFieldAsExisting(fieldInstance, props);
    } else {
      this.createVirtualField(name);
      this.updateFieldAsNew(fieldInstance, props);
    }
  };

  //sets errors for all fields
  @action
  protected updateErrorOnEveryFieldUsing = (formValidationErrors: FormValidationErrors) => {
    const fieldErrors: {[key: string]: string[]} | null = formValidationErrors
      ? flatten(formValidationErrors, {
          safe: true,
        })
      : null;

    this.fields.forEach((field) => {
      if (field.instance) {
        const errors = fieldErrors && fieldErrors[field.props!.name];

        field.errors = errors ? errors : null;
      }
    });
  };

  protected getFieldMeta = (fieldName: string) => {
    this.createFieldIfDontExist(fieldName);
    return toJS(this.fields.get(fieldName)!.meta);
  };

  //general handler for resetting form to specific state
  @action
  protected resetToValues = (values: FormValues) => {
    this.fields.forEach((field: FormField, name: string) => {
      field.value = get(values, name);
      field.meta.isTouched = false;
    });
    this.setSubmitCount(0);
    this.updateErrorOnEveryFieldUsing({});
  };

  constructor(options: FormControllerOptions) {
    this.setOptions(options);
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

  //changed when form onValidate state changes
  @computed
  get isValid(): boolean {
    return this.errors === null;
  }

  //changed when form starts or finishes validating
  @observable
  isValidating: boolean = false;
  @action
  setIsValidating = (state: boolean) => (this.isValidating = state);

  //changed when form starts or finishes submit process
  @observable
  isSubmitting: boolean = false;
  @action
  setIsSubmitting = (state: boolean) => (this.isSubmitting = state);

  //increments upon every submit try
  @observable
  submitCount: number = 0;
  @action
  setSubmitCount = (state: number) => (this.submitCount = state);

  //used for setting custom form state, which should be accessible from form api, is passed to adapter options as well
  @observable
  formCustomState: any = {};
  @action
  setFormCustomState = (key: string, value: any) => (this.formCustomState[key] = value);

  //resets the form to initial values and making it pristine
  reset = () => {
    return this.options.initialValues && this.resetToValues(this.options.initialValues);
  };

  clear = () => {
    return this.resetToValues({});
  };

  //is called when field is unmounted
  @action
  unRegisterField = (fieldName: string) => {
    const field = this.fields.get(fieldName)!;
    if (field.props!.persist) {
      field.instance = null;
    } else {
      this.fields.delete(fieldName);
    }
  };

  //changes field active state usually based on 'blur'/'focus' events
  @action
  changeFieldActiveState = (fieldName: string, isActive: boolean) => {
    const field = this.fields.get(fieldName)!;
    if (isActive) {
      field.meta.isTouched = true;
    }
    field.meta.isActive = isActive;
  };

  //changes field custom state set by user
  @action
  setFieldCustomState = (fieldName: string, key: string, value: any) => {
    this.createFieldIfDontExist(fieldName);
    this.fields.get(fieldName)!.meta.custom.set(key, value);
  };

  //changes when called adapted onChange handler
  @action
  changeFieldValue = (fieldName: string, value: any) => {
    this.createFieldIfDontExist(fieldName);
    const field = this.fields.get(fieldName)!;
    field.value = value;
  };

  createFieldIfDontExist = (fieldName: string) => {
    if (!this.fields.has(fieldName)) {
      this.createVirtualField(fieldName);
    }
  };

  //validates the form by calling form level onValidate function combined with field level validations
  validate = async () => {
    this.setIsValidating(true);

    const [fieldValidationErrors, formValidationErrors] = await Promise.all([
      this.runFieldLevelValidations(),
      this.runFormLevelValidations(),
    ]);

    this.setErrors(merge(fieldValidationErrors, formValidationErrors));

    this.updateErrorOnEveryFieldUsing(this.errors);

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
      await this.options.onSubmit!(this.errors, this.formattedValues, submitEvent);

      if (this.errors === null) {
        this.updateInitialValues();
      }
    } catch {
    } finally {
      this.setIsSubmitting(false);
    }

    if (this.options.onSubmitAfter) {
      this.options.onSubmitAfter(this.errors, this.formattedValues, submitEvent);
    }
  };
}
