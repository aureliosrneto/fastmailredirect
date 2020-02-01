/**
*	read and save the user settings
*	@author Adrian Loetscher <mail@aloetscher.ch>
*
*/


var fastredirectPrefs = {

	mElementIDs: ["mailaddress1", "mailaddress2", "mailaddress3", "mailaddress4", "mailaddress5"],

	onInit: function() {

		var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefService);
        prefs = prefs.getBranch("extensions.fastredirect.");

		// enabled / disabled
		var isEnabled = prefs.getBoolPref( "enabled" );

		document.getElementById( "fastredirectEnabled" ).checked = isEnabled;

		var isStatusBar = prefs.getBoolPref( "showStatusInStatusBar" );
		document.getElementById( "fastredirectShowInStatusBar" ).checked = isStatusBar;

	  	// mailaddresses
	  	for (var i = 0; i < fastredirectPrefs.mElementIDs.length; i++) {

	  		var elementID = fastredirectPrefs.mElementIDs[i];
			var elementValue = prefs.getCharPref( elementID );
			document.getElementById( elementID ).value = elementValue;

		}

	},

	onAccept: function() {

		var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefService);
        prefs = prefs.getBranch("extensions.fastredirect.");

		// enabled / disabled
		var isEnabled = document.getElementById( "fastredirectEnabled" ).checked;
		prefs.setBoolPref( "enabled", isEnabled );
		var isStatusBar = document.getElementById( "fastredirectShowInStatusBar" ).checked;
		prefs.setBoolPref( "showStatusInStatusBar", isStatusBar );


	  	// mailaddresses
	  	for (var i = 0; i < fastredirectPrefs.mElementIDs.length; i++) {

	  		var elementID = fastredirectPrefs.mElementIDs[i];
			var elementValue = document.getElementById( elementID ).value;
			prefs.setCharPref( elementID, elementValue );

		}
		return true;
	},

	onCancel: function() {
		return true;
	}

}
