class i {
  constructor(s) {
    this.sessionId = s, this.TYPE = i.name;
  }
}
class o {
  constructor(s, t) {
    this.sessionId = s, this.text = t, this.TYPE = o.name;
  }
}
class c {
  constructor(s, t) {
    this.sessionId = s, this.text = t, this.TYPE = c.name;
  }
}
class n {
  constructor(s, t) {
    this.sessionId = s, this.svg = t, this.TYPE = n.name;
  }
}
export {
  o as DisplayDomainStoryCommand,
  n as GetDomainStoryAsSvgCommand,
  i as InitializeWebviewCommand,
  c as SyncDocumentCommand
};
