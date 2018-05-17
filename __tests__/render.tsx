import * as React from 'react';
import {mount} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import toJson from 'enzyme-to-json';

test('render form', () => {
  const formController = new FormController({});

  const wrapper = mount(<TestForm controller={formController}/>);
  expect(toJson(wrapper, {noKey: true, mode: 'deep'})).toMatchSnapshot();
});
