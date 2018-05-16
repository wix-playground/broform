import * as React from 'react';
import {shallow} from 'enzyme';

test('render a label', () => {
  const wrapper = shallow(<label>Hello Jest</label>);
  expect(wrapper).toMatchSnapshot();
});
