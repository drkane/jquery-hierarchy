/*
 * hierarchy options plugin v0.1
 * https://github.com/drkane/jquery-hierarchy
 *
 * Copyright (c) 2014 David Kane. All rights reserved. 
 * Released under the GPL
 * 
 * Date: 2014-09-07
 */
(function( $ ) {
		
			$.fn.reverse = [].reverse;
			
			$.fn.hierarchy_settings = function( json_options, settings ){
		
				var main_element = this;
				var opts = $.extend( {}, $.fn.hierarchy_settings.defaults, settings );
				opts["json_options"] = json_options;
				
				var initialise = function(){
				
					var top_level_menu = create_hierarchy_menu( opts.json_options["_children"], opts.existing_options );
					$(main_element).append( top_level_menu );
					$(opts.json_container).val( JSON.stringify(get_json(), null, 2) );
					
				}
				
				var create_hierarchy_menu = function( list, existing_options ){
					
					var hierarchy_menu = $('<ul/>');
					if( !existing_options ){ existing_options = {}; }
					$.each( existing_options, function(k, v){
						if( $.isArray( v ) ){
							$.each( v, function(k2, v2){
								hierarchy_menu.append( create_hierarchy_element( list, k, v2 ) );
							});
						} else {
							hierarchy_menu.append( create_hierarchy_element( list, k, v ) );
						}
					});
					hierarchy_menu.append( create_hierarchy_element( list ) );
					return hierarchy_menu;
					
				}
			
				var create_hierarchy_element = function ( list, key, value ){
				
					var li = $('<li/>');
					var select = $('<select/>');
					var container = $('<span/>');
					container.addClass( opts.menu_container )
					select.addClass( opts.option_select )
					
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
						var selected_option = list[key];
						if(selected_option){
							container.append( create_option_element(selected_option, key, value) );
							select.val( key );
						}
					}
					
					li.append(select);
					li.append(container);
					return li;
				}
				
				var create_option_element = function( option, selected_option, value ){
					
					var new_element = null;
					
					if( option._type=="select" || option._type=="bool" ){
					
						if(option._type=="bool"){
							option._options = [true, false];
						}
						new_element = $('<select/>');
						new_element.attr("name", selected_option);
						new_element.append('<option/>');
						var is_object = !$.isArray(option._options);
						$.each( option._options, function( k, v){
							var new_option = $('<option/>');
							new_option.text( v );
							if( is_object ){
								new_option.attr("value", k);
							}
							new_element.append(new_option);
						});
						
					} else if( option._type=="object"){
					
						new_element = create_hierarchy_menu( option._children, value );
						
					} else {
					
						new_element = $('<input/>');
						new_element.attr("name", selected_option);
						new_element.attr("type", option._type );
						
					}
					
					if( value ){
						new_element.val( value );
					} else if( option._default_value ){
						new_element.val( option._default_value );
					}
					
					return new_element;
				
				}
				
				var get_json = function(){
				
					var list = $(main_element).children('ul');
					return get_json_list( list );
				
				}
				
				var get_json_list = function( list ){
					
					var json_return = {}
					
					$(list).children("li").each( function(){
						var key = $(this).find('.' + opts.option_select).val();
						if( $(this).find('.' + opts.menu_container).find('ul').length > 0 ){
							var value = get_json_list( $(this).children('.' + opts.menu_container).children('ul') );
						} else {
							var value = $(this).children('.' + opts.menu_container).children('input, select').val();
						}
						
						if( json_return[key] ){
							if( !$.isArray(json_return[key]) ){
								json_return[key] = [json_return[key]];
							}
							json_return[key].push( value );
						} else {
							json_return[key] = value;
						}
					});
					
					return json_return;
				}
				
				$(main_element).on( 'change', '.' + opts.option_select, function( ev){
					ev.prevent_default;
					var selected_option = $(this).val();
					
					var options_container = $(this).closest("li").children('.' + opts.menu_container).empty();
					var new_option = $(this).closest("li").clone();
					new_option.children('.' + opts.menu_container).empty();
					
					if( !selected_option){
						var parent_list = $(this).closest("ul");
						parent_list.children("li").each(function(){
							if( $(this).children("."+opts.option_select).val()==""){
								$(this).remove();
							}
						});
						parent_list.append( new_option );
						return;
					}
					
					
					var option = opts.json_options;
					var parents = $(this).parentsUntil(main_element, 'li').reverse().each( function( k, v){
						this_key = $(this).find("select").val();
						option = option["_children"][this_key];
					});
					
					if(!option){
						return;
					}
					
					options_container.append( create_option_element(option, selected_option) );
					$(this).closest("ul").append( new_option );
					
					
				});
				
				$(main_element).on('change', 'select, input', function(ev){
					$(opts.json_container).val( JSON.stringify(get_json(), null, 2) );
				});
				
				initialise();
				return this;
			
			}
			
			$.fn.hierarchy_settings.defaults = {
				menu_container:"jq-hierarchy-container",
				option_select:"jq-hierarchy",
				json_container: "#hierarchy-settings",
				existing_options: {}
			}
			
	
});
				}
				
				var create_option_element = function( option, selected_option, value ){
					
					var new_element = null;
					
					if( option._type=="select" || option._type=="bool" ){
					
						if(option._type=="bool"){
							option._options = [true, false];
						}
						new_element = $('<select/>');
						new_element.attr("name", selected_option);
						new_element.append('<option/>');
						var is_object = !$.isArray(option._options);
						$.each( option._options, function( k, v){
							var new_option = $('<option/>');
							new_option.text( v );
							if( is_object ){
								new_option.attr("value", k);
							}
							new_element.append(new_option);
						});
						
					} else if( option._type=="object"){
					
						new_element = create_hierarchy_menu( option._children, value );
						
					} else {
					
						new_element = $('<input/>');
						new_element.attr("name", selected_option);
						new_element.attr("type", option._type );
						
					}
					
					if( value ){
						new_element.val( value );
					} else if( option._default_value ){
						new_element.val( option._default_value );
					}
					
					return new_element;
				
				}
				
				var get_json = function(){
				
					var list = $(main_element).children('ul');
					return get_json_list( list );
				
				}
				
				var get_json_list = function( list ){
					
					var json_return = {}
					
					$(list).children("li").each( function(){
						var key = $(this).find('.' + opts.option_select).val();
						if( $(this).find('.' + opts.menu_container).find('ul').length > 0 ){
							var value = get_json_list( $(this).children('.' + opts.menu_container).children('ul') );
						} else {
							var value = $(this).children('.' + opts.menu_container).children('input, select').val();
						}
						
						if( json_return[key] ){
							if( !$.isArray(json_return[key]) ){
								json_return[key] = [json_return[key]];
							}
							json_return[key].push( value );
						} else {
							json_return[key] = value;
						}
					});
					
					return json_return;
				}
				
				$(main_element).on( 'change', '.' + opts.option_select, function( ev){
					ev.prevent_default;
					var selected_option = $(this).val();
					
					var options_container = $(this).closest("li").children('.' + opts.menu_container).empty();
					var new_option = $(this).closest("li").clone();
					new_option.children('.' + opts.menu_container).empty();
					
					if( !selected_option){
						var parent_list = $(this).closest("ul");
						parent_list.children("li").each(function(){
							if( $(this).children("."+opts.option_select).val()==""){
								$(this).remove();
							}
						});
						parent_list.append( new_option );
						return;
					}
					
					
					var option = opts.json_options;
					var parents = $(this).parentsUntil(main_element, 'li').reverse().each( function( k, v){
						this_key = $(this).find("select").val();
						option = option["_children"][this_key];
					});
					
					if(!option){
						return;
					}
					
					options_container.append( create_option_element(option, selected_option) );
					$(this).closest("ul").append( new_option );
					
					
				});
				
				$(main_element).on('change', 'select, input', function(ev){
					$(opts.json_container).val( JSON.stringify(get_json(), null, 2) );
				});
				
				initialise();
				return this;
			
			}
			
			$.fn.hierarchy_settings.defaults = {
				menu_container:"jq-hierarchy-container",
				option_select:"jq-hierarchy",
				json_container: "#hierarchy-settings",
				existing_options: {}
			}
			
		//});
