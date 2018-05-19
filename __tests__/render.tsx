import * as React from 'react';
import {mount} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {serialize} from '../test/helpers/serializer';

test('Render', () => {
  const formController = new FormController({});

  const wrapper = mount(<TestForm controller={formController} />);

  expect(serialize(wrapper)).toMatchSnapshot();
});
