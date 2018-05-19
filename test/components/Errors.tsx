import * as React from 'react';
import {isEmpty, isArray, isObject} from 'lodash';
import {observer} from 'mobx-react';

export const Errors = observer((props: {errors: any}) => {
  const {errors} = props;
  return !isEmpty(errors) ? (
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
  ) : null;
});
