/*
 * hierarchy options plugin v0.3.0
 * https://github.com/drkane/jquery-hierarchy
 *
 * Copyright (c) 2014 David Kane. All rights reserved. 
 * Released under the GPL
 * 
 * Date: 2015-05-19
 */
(function( $ ) {
	
	// additional function to reverse an array
	$.fn.reverse = [].reverse;
	
	// Main function
	$.fn.hierarchySettings = function( schema, settings ){

		// get configuration data
		var config = $.extend( {}, $.fn.hierarchySettings.defaults, settings );
		config["schema"] = schema;
		if(!config.schema["_children"]){
			config.schema = { "_children": config.schema };
		}
		if(!config.existingOptions){
			config["existingOptions"] = $.parseJSON( $(this).val() );
		}
		config.jsonTextarea = this;
		
		// add a new div which will hold the list
		config.containerDiv = $('<div/>');
		config.containerDiv.attr("id", config.containerDivID);
		$(config.jsonTextarea).after( config.containerDiv );
		
		// intitialise the function
		var initialise = function(){
			
			// add a new menu to the container div
			var containerMenu = createHierarchyMenu( config.schema["_children"], config.existingOptions );
			$(config.containerDiv).append( containerMenu );
			
			// hide the textarea if we're meant to
			if(!config.showOriginalTextarea){
				$(config.jsonTextarea).hide();
			} else {
				$(config.jsonTextarea).attr("disabled", "disabled");
			}
			
			// put the current configuration into the original textarea
			$(config.jsonTextarea).val( JSON.stringify(getJson(), null, 2) );
			
		}
		
		// add a ul with any already-selected options
		var createHierarchyMenu = function( list, existingOptions ){
			
			var hierarchyMenu = $('<ul/>');
			if( !existingOptions ){ existingOptions = {}; }
			$.each( existingOptions, function(k, v){
				if( $.isArray( v ) ){
					$.each( v, function(k2, v2){
						hierarchyMenu.append( createHierarchyElement( list, k, v2 ) );
					});
				} else {
					hierarchyMenu.append( createHierarchyElement( list, k, v ) );
				}
			});
			hierarchyMenu.append( createHierarchyElement( list ) );
			return hierarchyMenu;
			
		}
	
		// create a <li> which can be used in a list
		// the <li> contains a <select> element which can be used to select which key the value will relate to
		var createHierarchyElement = function ( list, key, value ){
		
			var li = $('<li/>');
			var container = $('<span/>');
			container.addClass( config.menuContainerClass );
			
			if( list ){
				var select = $('<select/>');
				
				$(select).append('<option/>');
				
				$.each( list, function( k, v ){
					var option = $('<option>');
					try {
					if( v._label ){
						label = v._label;
					} else {
						label = k;
					}
					} catch( err) {
						console.log( v, err);
					}
					var option_value = k;
					if(typeof v._save_as != "undefined"){
						option.attr("data-save_as", v._save_as);
					}
					
					option.val(option_value);
					option.text(label);
					$(select).append(option);
				});
				if( typeof value != "undefined" ){
					var selectedOption = list[key];
				}
			} else {
				var select = $('<input/>');
				if( typeof value != "undefined" ){
					var selectedOption = key;
				}
			}
			if(selectedOption){
				container.append( createOptionElement(selectedOption, key, value) );
				select.val( key );
			}
			
			select.addClass( config.optionSelectClass )
			li.append(select);
			li.append(container);
			return li;
		}
		
		// add an element which is used to enter the actual value
		// can either be a form input or select, or a new menu with child options
		var createOptionElement = function( option, selectedOption, value ){
			
			var optionElement = null;
			
			// if we're meant to, then force any options with children to be an object
			if( config.forceChildrenToObjects ){
				if( option._children ){
					option._type = "object";
				}
			}
			
			// if no option type is set then guess what type it is 
			if( !option._type ){
				// if there are children it's probably an object
				if( option._children ){
					option._type = "object";
				
				// if there are options then it's a select
				} else if( option._options ){
					option._type = "select";
						
				// otherwise it's a text box
				} else {
					option._type = "text";
				}
			}
			console.log(option);
			// if it's a boolean then we do it as select anyway
			if( option._type=="select" || option._type=="bool" ){
			
				if(option._type=="bool"){
					option._options = [true, false];
				}
				optionElement = $('<select/>');
				optionElement.attr("name", selectedOption);
				optionElement.append('<option/>');
				var is_object = !$.isArray(option._options);
				$.each( option._options, function( k, v){
					var new_option = $('<option/>');
					new_option.text( v );
					if( is_object ){
						new_option.attr("value", k);
					}
					optionElement.append(new_option);
				});
			
			// if it's an object then we need to add a child menu
			} else if( option._type=="object"){
			
				option = checkExtendableOption( option );
				optionElement = createHierarchyMenu( option._children, value );
			
			// otherwise assume it's an input
			} else if( option._type=="numeric") {
			
				optionElement = $('<input/>');
				optionElement.attr("name", selectedOption);
				optionElement.attr("type", "number" );
				
			} else {
			
				optionElement = $('<input/>');
				optionElement.attr("name", selectedOption);
				optionElement.attr("type", option._type );
				
			}
			
			optionElement.attr("data-field_type", option._type);
			
			if( typeof option._description != "undefined" ){
				optionElement.attr("title", option._description);
			} else {
				optionElement.removeAttr("title");
			}
			
			// if a value is present then set it
			if( typeof value != "undefined" ){
				if( value==null){
					strvalue = "null";
				} else {
					strvalue = value.toString()
				}
				optionElement.val( strvalue );
			// otherwise set a default value
			} else if( option._default_value ){
				optionElement.val( option._default_value );
			} else if( option._default ){
				optionElement.val( option._default );
			}
			
			return optionElement;
		
		}
		
		// return the list as json
		var getJson = function(){
		
			var list = $(config.containerDiv).children('ul');
			return getJsonList( list );
		
		}
		
		// find out if this option is extending another one
		var checkExtendableOption = function( option ){
			if( option._extends ){
				extendableOption = option._extends.split("-");
				var reference = config.schema;
				var all_options_found = true;
				$.each( extendableOption, function(key, value){
					if( reference["_children"][value] ){
						reference = reference["_children"][value];
					} else {
						all_options_found = false;
					}
				});
				if(all_options_found){
					reference = checkExtendableOption( reference ); // nested for recursive extending
					if(!option._children){ 
						option._children = {}; 
					}
					if(option._children == [] || $.isEmptyObject(option._children) ){ 
						option._children = {}; 
					}
					$.extend( option._children, reference._children );
				}
			}
			return option;
		}
		
		// turn a single list into json, recursively
		var getJsonList = function( list ){
			
			var jsonReturn = {}
			
			$(list).children("li").each( function(){
				// get the key for this item
				var key = $(this).find('.' + config.optionSelectClass).val();
				
				// if we've also found a "save as" description then use that instead of the key
				if( $(this).find('.' + config.optionSelectClass).find(":selected").data("save_as") ){
					key = $(this).find('.' + config.optionSelectClass).find(":selected").data("save_as");
				}
				
				if( $(this).find('.' + config.menuContainerClass).find('ul').length > 0 ){
					var value = getJsonList( $(this).children('.' + config.menuContainerClass).children('ul') );
				} else {
					var value = $(this).children('.' + config.menuContainerClass).children('input, select').val();
					
					var value_type = $(this).children('.' + config.menuContainerClass).children('input, select').data("field_type");
					if(value_type=="bool"){
						if(value=="true"){ value= true; } else if(value=="false"){ value= false; }
					}
					if(value_type=="numeric"){
						value = Number(value);
					}
				}
				
				// if we've already got a value then include it in an array
				if( jsonReturn[key] ){
					if( !$.isArray(jsonReturn[key]) ){
						jsonReturn[key] = [jsonReturn[key]];
					}
					jsonReturn[key].push( value );
				} else {
					jsonReturn[key] = value;
				}
			});
			
			return jsonReturn;
		}
		
		// look for changes in any of the key selection <select>s
		// if it's changed then add in the required input element
		$(config.containerDiv).on( 'change', '.' + config.optionSelectClass, function( ev){
			ev.prevent_default;
			var selectedOption = $(this).val();
			
			var optionsContainer = $(this).closest("li").children('.' + config.menuContainerClass).empty();
			var new_option = $(this).closest("li").clone();
			new_option.children('.' + config.menuContainerClass).empty();
			
			// if it's blank then delete all blank ones and add one blank one
			var parent_list = $(this).closest("ul");
			parent_list.children("li").each(function(){
				if( $(this).children("."+config.optionSelectClass).val()==""){
					$(this).remove();
				}
			});
			parent_list.append( new_option );
			
			// find out the options for this key
			if( $(this).prop("tagName")=="SELECT"){
				var option = config.schema;
				var parents = $(this).parentsUntil(config.containerDiv, 'li').reverse().each( function( k, v){
					this_key = $(this).find("select").val();
					option = option["_children"][this_key];
				});
				if(!option){
					return;
				}
				
				if( typeof option._description != "undefined" ){
					$(this).attr("title", option._description);
				} else {
					$(this).removeAttr("title");
				}
			
			} else if( $(this).prop("tagName")=="INPUT" ) {
				var option = {};
			}
			
			// create the needed element and append it
			optionsContainer.append( createOptionElement(option, selectedOption) );
			$(this).closest("ul").append( new_option );
			
			
		});
		
		// if anything changes then repopulate the textarea
		$(config.containerDiv).on('change', 'select, input', function(ev){
			$(config.jsonTextarea).val( JSON.stringify(getJson(), null, 2) );
		});
		
		initialise();
		return this;
	
	}
	
	// default classes for the plugin
	$.fn.hierarchySettings.defaults = {
		menuContainerClass:"jq-hierarchy-container",
		optionSelectClass:"jq-hierarchy",
		containerDivID: "hierarchy-menu",
		showOriginalTextarea: false,		// whether to hide the original text area (useful for debugging)
		existingOptions: null,				// if this is set then the data from the original text area won't be shown
		forceChildrenToObjects: true 		// if an item has children then force it to be an object, no matter what the type says
	}
			
	
})( jQuery );
