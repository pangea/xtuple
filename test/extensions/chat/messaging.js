/*jshint trailing:true, white:true, indent:2, strict:true, curly:true,
  immed:true, eqeqeq:true, forin:true, latedef:true,
  newcap:true, noarg:true, undef:true */
/*global XT:true, XM:true, XV:true, describe:true, it:true,
  setTimeout:true, console:true, before:true, after:true, module:true, require:true */

(function () {
   "use strict";

  var zombieAuth = require("../../lib/zombie_auth"),
   _ = require("underscore"),
    // smoke = require("../../lib/smoke"),
    assert = require("chai").assert;

  describe('Chat', function () {
    this.timeout(20 * 1000);
		   
    before(function (done) {
      zombieAuth.loadApp(done);
    });

    describe('Chat Widget', function () {
      it('should allow users to send messages', function (done) {
           // open a chatbox
           var workspace = XT.app.$.postbooks.$.navigator.$.workspace,
           document = XZ.browser.document;

           // workspace.generateNewChatBox('admin',false);

           // button = document.querySelectorAll("#" + messageHolder.$.adminChat.id + " button")[0];
           // XZ.browser.clickLink(button);

           XM.ModelMixin.dispatch( 'XM.Messenger','deliver',['admin','hi'],{});
           XM.ModelMixin.dispatch( 'XM.Messenger','deliver',['admin','hi'],{});
           // try{
           // messageHolder.$.adminChatBox.show();             
           // } catch (x) {

           // }
           var messageHolder = workspace.$.messageHolder;
           console.log(XM.currentUser.id);
           // console.log(messageHolder.$.adminChatBox.$.client.children.slice(-1)[0].children.slice(-1)[0].content);
           console.log(messageHolder.$.adminChatBox.$.client);
           console.log(messageHolder.$.adminChatBox.$.client.children);
           console.log(messageHolder.$.adminChatBox.$.client.children.slice(-1)[0]);
           debugger;
           console.log(messageHolder.$.adminChatBox.$.client.children.slice(-1)[0].children);

           XZ.browser.fill(document.querySelectorAll(messageHolder.$.adminChatBox.$.client.children.slice(-1)[0].children.slice(-1)[0]),"cunt biscuits");
           messageHolder.$.adminChatBox.submitChat.node.submit();
           // send a message
//           XM.ModelMixin.dispatch( 'XM.Messenger','deliver',['admin','hi'],{});
//           XM.ModelMixin.dispatch("XM.Messenger", 'deliver', ['admin', 'tits'], {success: messageHolder.$.adminChatBox.addChatMessage.bind(messageHolder.$.adminChatBox) } );


           var messageBox = messageHolder.$.adminChatBox;
           console.log( messageBox.node);
           var lastMsg = messageBox.children[1].children.slice(-1)[0].children.slice(-1)[0].content;

           assert.equal(lastMsg,"hi");
           done();

        // smoke.navigateToNewWorkspace(XT.app, "XV.QuoteList", function (workspaceContainer) {

        //   var quoteWorkspace = workspaceContainer.$.workspace,
        //     customerWorkspace;

        //   assert.equal(quoteWorkspace.value.recordType, "XM.Quote");

        //   //quoteWorkspace.$.customerWidget.$.customerButton.tap({});
        //   quoteWorkspace.$.customerWidget.popupTapped({}, {originator: {name: "customerButton"}});
        //   customerWorkspace = XT.app.$.postbooks.getActive().$.workspace;
        //   assert.equal(customerWorkspace.kind, "XV.CustomerWorkspace");

        //   smoke.setWorkspaceAttributes(customerWorkspace, require("../../lib/model_data").customer);
        //   assert.isUndefined(customerWorkspace.value.validate(customerWorkspace.value.attributes));
        //   XT.app.$.postbooks.getActive().saveAndClose();
        //   setTimeout(function () { // yeah yeah yeah
        //     assert.equal(XT.app.$.postbooks.getActive().$.workspace.kind, "XV.QuoteWorkspace");
        //     assert.equal(quoteWorkspace.value.getValue("customer.name"), "TestCust");
        //     XT.app.$.postbooks.getActive().close({force: true});
        //     setTimeout(function () {
        //       done();
        //     }, 3000);
          // }, 3000);
        // });
      });
    });
  });
}());
