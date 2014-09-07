jquery-hierarchy
================

A jquery plugin which creates HTML form inputs for entering or editing a hierarchical array of settings, for example those used with a JavaScript charting array.

It was designed to help with producing javascript charts through a library like HighCharts or amCharts. This plugin enables the creation of a more user-friendly form for entering the options and storing them in a database, rather than the user having to enter JSON by hand into a textarea.

How to setup the plugin
-----------------------

The plugin is designed to take json data (presented as a string in a textarea), and construct a nest hierarchical list which enables a user to select options and enter values. These entered options are then transformed back into a json output, which can then update the original textarea, allowing the data to be saved to a database.

The nested list is powered by a schema which defines which options are available, and what format they take (eg input, select, boolean, etc). The formats are based on HTML5 input types, rather than javascript data types. This schema takes the form of a javascript object, with the following syntax:

```
var schema = {
	"_children":{	// this is always needed
		"option_key": {							// used as the "name" variable for the created option
			"_type":"select",					// type of option: select, bool, text, url, number, date, etc
			"_options":["column","bar","pie"],	// if select element, then the options that will be presented
			"_label":"Type",					// Human readable label for the option
			"_default_value":"column"			// default value to be used
		},		
		"option_key_with_children": {			// used as the "name" variable for the created option
			"_type":"object",					// object here means the script will attempt to create a nested <ul>
			"_label":"Type",					// Human readable label for the option
			"_children":{						// object holding the children
				"child_option_key":{			// an example child option
					"_type":"text"
				}
			}
		},
	}
}

```

The plugin is then activated through the following code:

```
$('#settings-textarea').hierarchySettings( schema, config );
```

The `config` object holds any configuration options for the plugin.

The returned json object is currently only accessed through the original <textarea>, which is updated every time the list is changed. Future versions hope to make the json object easier to access through other methods. The textarea is hidden by default, but can be show by setting `config.showOriginalTextarea` to `true`.

How to use the form
-------------------

The resulting form should be straightforward to use. A user simply selects one of the available options from the dropdown menu, and this then allows them to either enter or select the value for this option, or shows them a list of sub-options which are available.

If an option key is entered more than once by a user, the resulting data contains an array with all the entered values. This can be useful for creating arrays of elements (eg where more than one axis is defined in a graph). In future versions it may be possible to switch this behaviour off.

To clear an option, simply select the blank option from the selection menu for that option.