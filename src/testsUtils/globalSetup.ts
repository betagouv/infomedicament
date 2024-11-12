import nock from "nock";

export function setup() {
  nock.disableNetConnect();
}

export function teardown() {
  nock.cleanAll();
  nock.enableNetConnect();
}
