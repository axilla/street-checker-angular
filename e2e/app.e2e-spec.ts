import { StreetCheckerPage } from './app.po';

describe('street-checker App', () => {
  let page: StreetCheckerPage;

  beforeEach(() => {
    page = new StreetCheckerPage();
  });

  it('should display welcome message', done => {
    page.navigateTo();
    page.getParagraphText()
      .then(msg => expect(msg).toEqual('Welcome to app!!'))
      .then(done, done.fail);
  });
});
