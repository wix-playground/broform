import {ReactWrapper} from 'enzyme';

export const createInputAdapterDriver = (options: {wrapper: ReactWrapper; dataHook: string}) => {
  const {wrapper, dataHook} = options;

  const API = {
    get: {
      root: () => {
        return wrapper.find(`[data-hook="${dataHook}"]`) as ReactWrapper;
      },
      input: () => {
        return API.get.root().find(`[data-hook="input-${dataHook}"]`) as ReactWrapper;
      },
      inputNode: () => {
        return API.get.input().getDOMNode() as HTMLInputElement;
      },
      value: () => {
        return API.get.inputNode().value;
      },
    },

    when: {
      focus: () => {
        API.get.input().simulate('focus');
      },
      blur: () => {
        API.get.input().simulate('blur');
      },
      validate: () => {
        API.get
          .root()
          .find(`[data-hook="validate"]`)
          .simulate('click');
      },
      change: (value: string) => {
        API.get.input().simulate('change', {target: {value}});
      },
    },
  };

  return {
    get: {
      value: API.get.value,
    },
    when: {
      focus: API.when.focus,
      blur: API.when.blur,
      validate: API.when.validate,
      change: API.when.change,
    },
  };
};
