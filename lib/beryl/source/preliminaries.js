// Override preliminaries.js methods that setup menus
XT.setVersion = function (version, qualifier) {
  // // default to the core version
  // version = version || XT.session.config.version;
  //
  // var aboutVersionLabel = XT.app.$.postbooks.$.navigator.$.aboutVersion,
  //   versionText = "_version".loc() + " " + version;
  //
  // if (qualifier) {
  //   versionText = ("_" + qualifier).loc() + " " + versionText;
  // }
  // if (aboutVersionLabel.getContent()) {
  //   versionText = aboutVersionLabel.getContent() + "<br>" + versionText;
  // }
  //
  // aboutVersionLabel.setContent(versionText);
  console.log("refactor XT.setVersion in beryl.Navigator");
};
