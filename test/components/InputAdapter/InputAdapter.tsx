import * as React from 'react';
import {ChangeEvent} from 'react';
import {AdapterProps} from '../../../src/Field';
import {isNil} from 'lodash';
import {Meta} from './Meta';
import {Errors} from './Errors';

export interface InputAdapterProps extends AdapterProps {}

export class InputAdapter extends React.Component<InputAdapterProps> {
  render() {
    const {broform} = this.props;
    const {onFocus, onBlur, validate, name, onChange, value, meta} = broform;
    const {errors} = meta;
    const normalizedValue = isNil(value) ? '' : value;

    return (
      <div data-hook={name}>
        <input
          data-hook={`input-${name}`}
          name={name}
          value={normalizedValue}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onChange(event.target.value);
          }}
          onFocus={onFocus}
          onBlur={onBlur}
        />

        <Errors errors={errors} />

        <Meta meta={meta} />

        <span data-hook="validate" onClick={validate} />
      </div>
    );
  }
}
