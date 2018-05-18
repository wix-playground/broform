import * as React from 'react';
import {isEmpty, isObject} from 'lodash';
import {AdapterMetaInfo} from '../../src/Field';

export const Meta = (fieldMeta: AdapterMetaInfo | null) => {
  const renderMetaProperty = (meta: any): any => {
    return Object.keys(meta).map((key) => {
      if (!isObject(meta[key])) {
        return (
          <span key={key} data-hook={`meta_${key}`}>
            {meta[key] && String(meta[key])}
          </span>
        );
      } else if (!isEmpty(meta)) {
        return renderMetaProperty(meta[key]);
      } else {
        return null;
      }
    });
  };

  const metaFields = renderMetaProperty(fieldMeta);

  return <div data-hook="meta-info">{metaFields}</div>;
};
