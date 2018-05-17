import * as React from 'react';
import {ChangeEvent} from 'react';
import {AdapterProps} from '../../src/Field';
const isNil = require('lodash/isNil');
const isEmpty = require('lodash/isEmpty');

export interface InputAdapterProps extends AdapterProps {}

export class InputAdapter extends React.Component<InputAdapterProps> {
  render() {
    const {broform} = this.props;
    const {onFocus, onBlur, validate, name, onChange, value, meta} = broform;
    const {errors} = meta;
    const normalizedValue = isNil(value) ? '' : value;

    return (
      <div>
        <input
          data-hook="input"
          name={name}
          value={normalizedValue}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onChange(event.target.value);
          }}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {
          !isEmpty(errors)
            ? <span data-hook="error">{errors && errors[0]}</span>
            : ''
        }
        <span data-hook="validate" onClick={validate} />
      </div>
    );
  }
}

