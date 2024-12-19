import chai, { assert } from "chai";

describe("Startup", function () {
  it("should have plugin instance defined", function () {
    assert.equal(Zotero.Dummy, true);
  });
});
