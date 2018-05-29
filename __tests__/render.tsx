import * as React from 'react';
import {mount} from 'enzyme';
import {FormController} from '../src/FormController';
import {TestForm} from '../test/components/TestForm';
import {createTestFormDriver} from '../test/components/TestForm.driver';

test('Render', () => {
  const formController = new FormController({});

  const wrapper = mount(<TestForm controller={formController} />);
  const formDriver = createTestFormDriver({wrapper});

  expect(formDriver.get.serialized()).toMatchSnapshot();
});
