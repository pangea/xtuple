(function () {

  enyo.kind({
    name: "beryl.Postbooks",
    kind: "XV.ModuleContainer",
    modules: [
      {name: "dashboard", label: "_dashboard".loc(), hasSubmenu: false,
        panels: [
        {
          name: "dashboardPage",
          content: "Hi, I'm the Dashboard",
          style: "border: none;"
        }
      ]},
      {name: "setup", label: "_setup".loc(), sortAlpha: true, panels: [
        {name: "configureList", kind: "XV.ConfigurationsList", toggleSelected: false},
        {name: "userAccountList", kind: "XV.UserAccountList", toggleSelected: false},
        {name: "userAccountRoleList", kind: "XV.UserAccountRoleList"}
      ]}
    ],
    activate: function () {
      // // Look for welcome page and set to what settings say to
      // var children = this.$.navigator.$.contentPanels.children,
      //   welcome = _.findWhere(children, {name: "welcomePage"}),
      //   url = XT.session.settings.get("MobileWelcomePage"),
      //   params = "?client=mobileweb" +
      //     //"&username=" + XT.session.details.id +
      //     "&hostname=" + window.location.hostname +
      //     "&organization=" + XT.session.details.organization +
      //     "&version=" + XT.session.config.version;
      //
      // if (welcome && url) {
      //   welcome.setAttributes({src: url + params});
      // }
      this.inherited(arguments);
    }

  });

}());
