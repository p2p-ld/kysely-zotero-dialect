import {assert} from 'chai';

describe('Startup', () => {
  it('should have dummy plugin instance defined', () => {
    assert.equal(Zotero.Dummy, true);
  });
});
