import toJson from 'enzyme-to-json';
import {Json} from 'enzyme-to-json';
import {ReactWrapper} from 'enzyme';

export const serialize = (wrapper: ReactWrapper) => toJson(wrapper, {noKey: true, mode: 'deep'}) as Json;
