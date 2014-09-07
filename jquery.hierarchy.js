/*
 * hierarchy options plugin v0.1.0
 * https://github.com/drkane/jquery-hierarchy
 *
 * Copyright (c) 2014 David Kane. All rights reserved. 
 * Released under the GPL
 * 
 * Date: 2014-09-07
 */
(function( $ ) {
	
	// additional function to reverse an array
	$.fn.reverse = [].reverse;
	
	// Main function
	$.fn.hierarchySettings = function( schema, settings ){

		// get configuration data
		var config = $.extend( {}, $.fn.hierarchySettings.defaults, settings );
		config["schema"] = schema;
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
			var select = $('<select/>');
			var container = $('<span/>');
			container.addClass( config.menuContainerClass )
			select.addClass( config.optionSelectClass )
			
			$(select).append('<option/>');
			
			$.each( list, function( k, v ){
				var option = $('<option>');
				if( v._label ){
					label = v._label;
				} else {
					label = k;
				}
				option.val(k);
				option.text(label);
				$(select).append(option);
			});
			
			if( value ){
				var selectedOption = list[key];
				if(selectedOption){
					container.append( createOptionElement(selectedOption, key, value) );
					select.val( key );
				}
			}
			
			li.append(select);
			li.append(container);
			return li;
		}
		
		// add an element which is used to enter the actual value
		// can either be a form input or select, or a new menu with child options
		var createOptionElement = function( option, selectedOption, value ){
			
			var optionElement = null;
			
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
			
				optionElement = createHierarchyMenu( option._children, value );
			
			// otherwise assume it's an input
			} else {
			
				optionElement = $('<input/>');
				optionElement.attr("name", selectedOption);
				optionElement.attr("type", option._type );
				
			}
			
			// if a value is present then set it
			if( value ){
				optionElement.val( value );
			// otherwise set a default value
			} else if( option._default_value ){
				optionElement.val( option._default_value );
			}
			
			return optionElement;
		
		}
		
		// return the list as json
		var getJson = function(){
		
			var list = $(config.containerDiv).children('ul');
			return getJsonList( list );
		
		}
		
		// turn a single list into json, recursively
		var getJsonList = function( list ){
			
			var jsonReturn = {}
			
			$(list).children("li").each( function(){
				var key = $(this).find('.' + config.optionSelectClass).val();
				if( $(this).find('.' + config.menuContainerClass).find('ul').length > 0 ){
					var value = getJsonList( $(this).children('.' + config.menuContainerClass).children('ul') );
				} else {
					var value = $(this).children('.' + config.menuContainerClass).children('input, select').val();
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
			console.log("HELLO");
			ev.prevent_default;
			var selectedOption = $(this).val();
			
			var optionsContainer = $(this).closest("li").children('.' + config.menuContainerClass).empty();
			var new_option = $(this).closest("li").clone();
			new_option.children('.' + config.menuContainerClass).empty();
			
			// if it's blank then delete all blank ones and add one blank one
			if( !selectedOption){
				var parent_list = $(this).closest("ul");
				parent_list.children("li").each(function(){
					if( $(this).children("."+config.optionSelectClass).val()==""){
						$(this).remove();
					}
				});
				parent_list.append( new_option );
				return;
			}
			
			// find out the options for this key
			var option = config.schema;
			var parents = $(this).parentsUntil(config.containerDiv, 'li').reverse().each( function( k, v){
				this_key = $(this).find("select").val();
				option = option["_children"][this_key];
			});
			
			if(!option){
				return;
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
		showOriginalTextarea: false,
		existingOptions: null
	}
			
	
})( jQuery );
