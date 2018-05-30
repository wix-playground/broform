import * as React from 'react';
import {mount} from 'enzyme';
import {TestForm} from '../test/components/TestForm';
import {createTestFormDriver} from '../test/components/TestForm.driver';

test('Render', () => {
  const wrapper = mount(<TestForm  />);
  const formDriver = createTestFormDriver({wrapper});

  expect(formDriver.get.serialized()).toMatchSnapshot();
});
