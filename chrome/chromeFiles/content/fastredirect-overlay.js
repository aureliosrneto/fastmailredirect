/**
*	parses the header, copies the x-rcpt-to-field to the clipboard and opens the redirect-window
*
*	@author Adrian Loetscher <mail@aloetscher.ch>
*
*/
var fastredirect = {

	mlb:		null,
	prot:		null,
	container:	null,
	strCategory: null,
	strLabel: null,
	prefs: null,
	mElements : ["mailaddress1", "mailaddress2", "mailaddress3", "mailaddress4", "mailaddress5"],
	mMailAddresses : null,
	mMailRedirectWindow : null,
	mIsEnabled : false,
	mTextStatusBarEnabled : "",
	mTextStatusBarDisabled : "",
	mShowInStatusBar : false,


	/**
	*	thunderbird 1.0 doesn't notify onEndHeaders listener
	*	this bug has been reported and is fixed in 1.1
	*/
	bTimeoutWorkaround: true,



	/**
	*	some initializations
	*/
	setUp: function()
	{
		fastredirect.container	= document.getElementById('fastredirectHeader');
		fastredirect.mlb		= document.getElementById('fastredirectHeaderBox');

		//init the empty header array
		var resBundle = document.getElementById('fastredirectStrings');
		fastredirect.strCategory = "x-rcpt-to";
		fastredirect.strLabel = resBundle.getString('fastredirect.' + fastredirect.strCategory);
		fastredirect.mTextStatusBarEnabled =  resBundle.getString('fastredirect.statusbar.enabled');
		fastredirect.mTextStatusBarDisabled = resBundle.getString('fastredirect.statusbar.disabled');

		fastredirect.readPref();
		fastredirect.dispHeader();

	},//setUp: function()


	readPref: function()
	{
		var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    	prefs = prefService.getBranch("extensions.fastredirect.");

    	// enabled / disabled
    	fastredirect.mIsEnabled = prefs.getBoolPref( "enabled" );
    	fastredirect.mShowInStatusBar = prefs.getBoolPref( "showStatusInStatusBar" );
    	// mail addresses
    	fastredirect.mMailAddresses = new Array();
    	var j = 0;
    	for (var i=0; i<fastredirect.mElements.length; i++) {
    		var mailaddress = prefs.getCharPref( fastredirect.mElements[i] );
    		if (mailaddress.length > 0 ) fastredirect.mMailAddresses[j++] = mailaddress;
    	}
	},



	/**
	*	does nothing
	*/
	noop: function()
	{
		if (fastredirect.bTimeoutWorkaround) {
			//try to display the icon half a second later
			window.setTimeout(fastredirect.dispHeader, 500);
		}
	},//noop: function()



	/**
	*	loop through the header, find out if we have mailing list headers
	*	and display them if necessary
	*/
	dispHeader: function()
	{

		// Statusbar
		try {
			if ( fastredirect.mIsEnabled ) {
				document.getElementById("fastredirectStatusBar").setAttribute( "label", fastredirect.mTextStatusBarEnabled );
			}
			else {
				document.getElementById("fastredirectStatusBar").setAttribute( "label", fastredirect.mTextStatusBarDisabled );
			}
			document.getElementById("fastredirectStatusBar").setAttribute( "collapsed", ! fastredirect.mShowInStatusBar );
		}
		catch (e) {

		}

		// check, if mail is loaded
		var srcMsgURI = GetLoadedMessage();
		//no message
		if (srcMsgURI == null) {
			return;
		}

		//check, if enabled
		fastredirect.removeAllButtons();
		if ( fastredirect.mIsEnabled ) {

			var strCategory = fastredirect.strCategory;
			if ( currentHeaderData[strCategory] )
			{
				fastredirect.addLinkButton1(strCategory, currentHeaderData[strCategory].headerValue );
			}
			for (var i=0; i<fastredirect.mMailAddresses.length; i++) {
				fastredirect.addLinkButton2( fastredirect.mMailAddresses[i], "<" + fastredirect.mMailAddresses[i] + ">");
			}
			fastredirect.container.setAttribute("collapsed", false);

		}
		else {
			fastredirect.container.setAttribute("collapsed", true);
		}

		// alert( currentHeaderData[strCategory].headerValue );

		//hide if we found none, show if we have some


	},//dispHeader: function()


	/**
	*	adds a link button to the mailing list header buttons
	*/
	addLinkButton1: function (strCategory, strLink )
	{
		var label	= document.createElement("label");
		label.setAttribute("value", fastredirect.strLabel);
		label.setAttribute("href"		, "mailto:" + strLink);
		label.setAttribute("tooltiptext", "mailto:" + strLink);
		label.setAttribute("style"		, "color: #0000FF; text-decoration: underline !important; cursor: pointer;");
		label.setAttribute("onclick"	, "fastredirect.launchRedirect(event.target.getAttribute('href'))");

		fastredirect.mlb.appendChild(label);

	},//addLinkButton: function (strCategory, strLink, strExtraText)

	addLinkButton2: function (strLabel, strLink )
	{
		var label	= document.createElement("label");
		label.setAttribute("value", strLabel);
		label.setAttribute("href"		, "mailto:" + strLink);
		label.setAttribute("tooltiptext", "mailto:" + strLink);
		label.setAttribute("style"		, "color: #0000FF; text-decoration: underline !important; cursor: pointer;");
		label.setAttribute("onclick"	, "fastredirect.launchRedirect(event.target.getAttribute('href'))");

		fastredirect.mlb.appendChild(label);

	},


	launchRedirect: function (strLink)
	{
		fastredirect.copyMailAdressToClipboard( strLink );
		fastredirect.openMailRedirectComposeWindow( strLink );
	},

	copyMailAdressToClipboard: function (strLink)
	{

		/* strLink aufbereiten: von "mailto: <xxx@yyy>" nach "xxx@yyy" */
		strLink = strLink.substr( 8, strLink.length - 9 );

		/* Copy to clipboard */
		netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

		var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		if (!str) return false;
		str.data = strLink;

		var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
		if (!trans) return false;

		trans.addDataFlavor("text/unicode");
		trans.setTransferData("text/unicode", str, strLink.length * 2);

		var clipid = Components.interfaces.nsIClipboard;
		var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);
		if (!clip) return false;

		clip.setData(trans, null, clipid.kGlobalClipboard);
		return true;
	},

	openMailRedirectComposeWindow: function ( strLink )
	{

  		var mailWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService()
    		.QueryInterface(Components.interfaces.nsIWindowMediator).getMostRecentWindow("");
    		// .QueryInterface(Components.interfaces.nsIWindowMediator).getMostRecentWindow("mail:3pane");
  		var gSelectedURIs = mailWindow.GetSelectedMessages();

  		var folder = GetLoadedMsgFolder();
  		var server;

  		if (folder) server = folder.server;
  		var currentIdentity = {key : null};

  		if (server && (server.type == "imap" || server.type == "pop3")) {
    		currentIdentity = getIdentityForServer(server);
  		}

  		fastredirect.mMailRedirectWindow = window.openDialog('chrome://mailredirect/content/mailredirect-compose.xul','_blank',
      		'chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar,center,dialog=no',
     		gSelectedURIs, currentIdentity.key);

     	window.setTimeout( "fastredirect.writeMailAddress('" + strLink + "');", 500 );

	},

	writeMailAddress: function(mMailAddress) {
		// fastredirect.mMailRedirectWindow.awAddRecipient( "addr_to", mMailAddress );
		var recipientType = "addr_to";
		var row = 1;
		// fastredirect.mMailRedirectWindow.awAppendNewRow(false);
		fastredirect.mMailRedirectWindow.awSetInputAndPopupValue(fastredirect.mMailRedirectWindow.awGetInputElement(row), mMailAddress, fastredirect.mMailRedirectWindow.awGetPopupElement(row), recipientType, row);
	},




	/**
	*	removes all mailing list header buttons
	*/
	removeAllButtons: function()
	{
		while (fastredirect.mlb.childNodes.length > 0) {
			fastredirect.mlb.removeChild(fastredirect.mlb.lastChild);
		}
	},//removeAllButtons: function()



	/**
	*	javascript is no real programming language.
	*	*every* real programming language has a trim() function.
	*/
	trim: function(sString)
	{
		return sString.replace(/^\s*|\s*$/g,"");
	},//trim: function(sString)



	/**
	*	sets up the event listener
	*/
	setupEventListener: function()
	{
		fastredirect.setUp();
		fastredirectPrefObserver.register();

		var listener = {};
		listener.onStartHeaders	= fastredirect.noop;
		listener.onEndHeaders	= fastredirect.dispHeader;
		gMessageListeners.push(listener);

        //version check to check if we need the timeout workaround
        try {
            var strVersion = Components.classes['@mozilla.org/xre/app-info;1'].getService(Components.interfaces.nsIXULAppInfo).version;
            dump("fastredirect: version " + strVersion + "\r\n");
            if (strVersion == "1.0+" || Number(strVersion) >= 1.1) {
                fastredirect.bTimeoutWorkaround = false;
            } else {
                //1.0 or older -> workaround needed
                fastredirect.bTimeoutWorkaround = true;
                dump("fastredirect: Activating timeout workaround\r\n");
            }
        } catch (e) {
            //probably old version
            fastredirect.bTimeoutWorkaround = true;
            dump("fastredirect: Activating timeout workaround (no version found)\r\n");
        }
//		dump("mlh: setupEventListener\r\n");
	}//setupEventListener: function()

}//var mailingListHeaders


var fastredirectPrefObserver =
{

  mBranch: null,

  register: function()
  {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService);
    this.mBranch = prefService.getBranch("extensions.fastredirect.");
    this.mBranch.QueryInterface(Components.interfaces.nsIPrefBranch2);
    this.mBranch.addObserver("", this, false);
  },

  unregister: function()
  {
    if(!this.mBranch) return;
    this.mBranch.removeObserver("", this);
  },

  observe: function(aSubject, aTopic, aData)
  {
    if(aTopic != "nsPref:changed") return;
    // aSubject is the nsIPrefBranch we're observing (after appropriate QI)
    // aData is the name of the pref that's been changed (relative to aSubject)

    switch (aData) {
      case "mailaddress1":
      case "mailaddress2":
      case "mailaddress3":
      case "mailaddress4":
      case "mailaddress5":
      case "enabled":
      case "showStatusInStatusBar":
      	{
      		fastredirect.readPref();
      		fastredirect.dispHeader();
      	}
        break;
    }
  }
}

addEventListener('messagepane-loaded', fastredirect.setupEventListener, true);
