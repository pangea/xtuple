enyo.kind({
  name: "onyx.TitledMenu",
  kind: "onyx.Menu",
  published: {
    //* Title to be displayed
    menuTitle: "Menu:",
    //* Classes for the title bar
    titleClasses: "menu-title",
    //* Maximum height of the menu
    maxHeight: 300,
    //* Toggle scrolling
    scrolling: true
  },
  childComponents: [
    {name: "title", kind: "Control"},
    {name: "client", kind: "enyo.Scroller", strategyKind: "TouchScrollStrategy"}
  ],
  create: function() {
    this.inherited(arguments);
    this.menuTitleChanged();
    this.titleClassChanged();
  },
  menuTitleChanged: function() {
    if (this.$.title) {
      this.$.title.setContent(this.menuTitle);
    }
  },
  origMaxHeight: 300,
  titleClassChanged: function() {
    if (this.$.title) {
      this.$.title.setClasses(this.titleClasses);
    }    
  },
  maxHeightChanged: function() {
    this.origMaxHeight = this.maxHeight;
    this.maxHeight = this.origMaxHeight - this.titleHeight;
    this.inherited(arguments);
  }
});
