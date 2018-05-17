import * as React from 'react';
import {ChangeEvent} from 'react';
import {AdapterProps} from '../../src/Field';
import {isArray, isObject, isNil, isEmpty} from 'lodash';

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
        {!isEmpty(errors) ? (
          <span data-hook="errors">
            {isArray(errors) &&
              errors.map((error) => {
                if (isObject(error)) {
                  return (
                    <span key={error.id} data-hook={`error-${error.id}`}>
                      {error.id}
                    </span>
                  );
                } else {
                  return (
                    <span key={error} data-hook={`error-${error}`}>
                      {error}
                    </span>
                  );
                }
              })}
          </span>
        ) : (
          ''
        )}

        <div data-hook="meta-info">
          {Object.keys(meta).map((key) => {
            if (!isObject(meta[key])) {
              return (
                <span key={key} data-hook={`meta_${key}`}>
                  {meta[key] && meta[key].toString()}
                </span>
              );
            } else {
              return null;
            }
          })}
        </div>

        <span data-hook="onFocus" onClick={validate} />
      </div>
    );
  }
}
