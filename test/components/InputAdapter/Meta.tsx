import * as React from 'react';
import {isEmpty, isObject} from 'lodash';
import {AdapterMetaInfo} from '../../src/Field';
import {observer} from 'mobx-react';

export const Meta = observer((props: {meta: AdapterMetaInfo}) => {
  const {meta} = props;

  const renderMetaProperty = (metaFields: any, currentKey: string = ''): any => {
    return Object.keys(metaFields).map((key) => {
      if (!isObject(metaFields[key])) {
        return (
          <span key={key} data-hook={`meta_${currentKey ? currentKey + ':' : ''}${key}`}>
            {String(metaFields[key])}
          </span>
        );
      } else if (!isEmpty(metaFields)) {
        return renderMetaProperty(metaFields[key], key);
      } else {
        return null;
      }
    });
  };

  const metaFields = renderMetaProperty(meta);

  return <div data-hook="meta-props">{metaFields}</div>;
});
