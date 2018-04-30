import * as jsdomRegistrar from 'jsdom-global';
import {configure} from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-15';

const createEnvironment = () => {
  const documentHTML = `
    <!doctype html>
    <html>
      <head></head>
      <body>
        <div id="test-react-root"></div>
      </body>
    </html>
  `;

  jsdomRegistrar(documentHTML, {
    pretendToBeVisual: true,
  });

  configure({
    adapter: new Adapter(),
  });
};

createEnvironment();
