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
    // If key is enter and theres a value submit chat
    if(inEvent.keyCode == 13 && inEvent.srcElement.value) {
      var message = inEvent.srcElement.value;

      inEvent.srcElement.value = "";
      // Send the message to the server
      XM.ModelMixin.dispatch(
        'XM.Messenger',
        'deliver',
        [ this.chatTitle, message ],
        {
          success: this.addChatMessage.bind(this)
        }
      );
    }
  },
  addChatMessage: function(msg) {
    var client = this.$.client,
        lastChild = client.children.slice(-1)[0].children.slice(-1)[0];

    if(lastChild && lastChild.value == msg.sender){
      client.createComponent({
        classes: 'chat-message chat-message-continued',
        content: msg.text, 
        value: msg.sender
      });
    } else {
      var senderClasses = 'chat-message-sender',
          senderName = msg.sender,
          msgDate = new Date(msg.postDate),
          dateString = msgDate.format('m/d/yyyy');

      if(senderName == XM.currentUser.id) {
        senderClasses += ' from-me';
        senderName = 'Me';
      }

      if(dateString == (new Date()).format('m/d/yyyy')) {
        dateString = msgDate.format('hh:mm tt');
      }
      client.createComponent({
        classes: 'chat-message',
        components: [
          { classes: senderClasses, components: [
            { classes: 'chat-message-time', content: dateString },
            { classes: 'chat-message-sender-name', content: senderName }
          ] },
          { content: msg.text }
        ],
        value: msg.sender
      });
    }
    client.render();
    client.node.scrollTop = client.node.scrollHeight;
  }
});
