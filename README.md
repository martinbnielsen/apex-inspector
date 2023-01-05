# apex-inspector
Oracle APEX Inspector Plugin

The APEX Inspector is a plugin which can help developers inspect APEX pages at runtime.
It adds an extra option to the developer toolbar,which can be turned on/off.
The toolbar option offers the followinf functionality:

* Highlights APEX page components when hovering over these.
* Displays both client and server side information about the components, by inspecting the DOM (client side), and by querying the APEX dictionary (server-side).
* Information about inspected elements are displayed in the devtools console of the browser.
* Supported page elements are:
  * Regions
  * Items
  * Buttons 