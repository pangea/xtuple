enyo.kind({
  name: "onyx.ChatBox",
  kind: "onyx.Menu",
  classes: "chat-box",
  published: {
    //* Title to be displayed
    chatTitle: "Chat:",
    //* Classes for the title bar
    titleHolderClasses: "chat-box-title-holder",
    clientClasses: "chat-box-history",
    inputHolderClasses: "chat-box-input-holder",
    inputClasses: "",
    //* Maximum height of the menu
    maxHeight: 300,
    //* Toggle scrolling
    scrolling: true
  },
  handler: {
    onRequestShowMenu: "requestMenuShow",
    onRequestHideMenu: "requestHide"
  },
  childComponents: [
    {name: "titleHolder", kind: "Control", components: [
      {name: "title", kind: "Control"},
      {tag: "span", content: "_", classes: "chat-box-min", ontap: "minimizeChatBox"},
      {tag: "span", content: "x", classes: "chat-box-close", ontap: "closeChatBox"}
    ]},
    {name: "client", kind: "enyo.Scroller"},
    {name: "inputHolder", kind: "onyx.InputDecorator", components: [
      {name: "input", kind: "onyx.Input", placeholder: "Enter text here", onchange:"inputChanged", onkeypress: "submitChat"}
    ]}
  ],
  create: function() {
    this.inherited(arguments);
    this.chatTitleChanged();
    this.titleClassChanged();
    this.titleHolderClassChanged();
    this.clientClassChanged();
    this.inputHolderClassChanged();    
    this.inputClassChanged();
  },
  chatTitleChanged: function() {
    if (this.$.title) {
      this.$.title.setContent(this.chatTitle);
    }
  },
  origMaxHeight: 300,
  titleHolderClassChanged: function() {
    if (this.$.titleHolder) {
      this.$.titleHolder.setClasses(this.titleHolderClasses);
    }    
  },  
  titleClassChanged: function() {
    if (this.$.title) {
      this.$.title.setClasses(this.titleClasses);
    }    
  },
  clientClassChanged: function() {
    if (this.$.client) {
      this.$.client.setClasses(this.clientClasses);
    }    
  },
  inputHolderClassChanged: function() {
    if (this.$.inputHolder) {
      this.$.inputHolder.setClasses(this.inputHolderClasses);
    }        
  },
  inputClassChanged: function() {
    if (this.$.input) {
      this.$.input.setClasses(this.inputClasses);
    }    
  },
  maxHeightChanged: function() {
    this.origMaxHeight = this.maxHeight;
    this.maxHeight = this.origMaxHeight;
    this.inherited(arguments);
  },
  requestMenuShow: function(inSender, inEvent) {
    this.inherited( arguments );
    this.$.client.node.scrollTop = this.$.client.node.scrollHeight;
  },
  requestHide: function(inSender, inEvent) {
    this.inherited( arguments );
    inEvent.srcElement.value = "";
  },
  minimizeChatBox: function(inSender, inEvent) {
		this.setShowing(false);
  },
  closeChatBox: function() {
    this.parent.destroy();
  },
  submitChat: function(inSender, inEvent){
    var currentUserObj = XM.currentUser,
        currentUserName = currentUserObj.id.charAt(0).toUpperCase() + currentUserObj.id.slice(1);

    // If key is enter and theres a value submit chat
    // If the last post poster attr matches curren user dont append user name to message
    // Else append it
    if(inEvent.keyCode == 13 && inEvent.srcElement.value) {
      if(this.$.client.children.slice(-1)[0].children.slice(-1)[0] && this.$.client.children.slice(-1)[0].children.slice(-1)[0].poster == currentUserName){
        this.$.client.createComponent({
          content: inEvent.srcElement.value, 
          value: currentUserName,
          poster: currentUserName
        });
      } else {
        this.$.client.createComponent({
          content: currentUserName + ": " + inEvent.srcElement.value, 
          value: currentUserName,
          poster: currentUserName
        });
      }
      inEvent.srcElement.value = "";
      this.$.client.render();
      this.$.client.node.scrollTop = this.$.client.node.scrollHeight;
    }
  }
});
