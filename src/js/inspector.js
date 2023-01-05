/**
 * APEX Inspectors
 * Main JavaScript Source File
 */

// namespace for all code
var mbninspector = {};

(function() {
  "use strict";

      // Private variables and constants
      const _logPrefix          = 'APEX Inspector: ';
      const _selAPEXToolbar     = '#apexDevToolbar';
      const _selInspectorIcon   = '#mbnInspector';
      const _selHover           = 'body form *';
      const _htmlInspectorIcon  = '<li role="none">' +
                                  '<button type="button" class="a-Button a-Button--devToolbar" id="mbnInspector" title="APEX Inspector" aria-label="APEX Inspector">' +
                                  '<span class="fa fa-hand-pointer-o" aria-hidden="true"></span>' +
                                  '</button></li>';
      const _selSelectors       = [
                                    {class: 't-Button',       type: 'BUTTON'},
                                    {class: 'text_field',     type: 'ITEM'},
                                    {class: 'apex-item-text', type: 'ITEM'},
                                    {class: 't-Region',       type: 'REGION'},
                                    {class: 't-IRR-region',   type: 'REGION'}
                                  ];

      let _isActive = false;
      let _config = {
        delay: 800
      };
      let _lastElement = null;
      let _setTimeoutConst = null;

      const myStorage = apex.storage.getScopedLocalStorage({ prefix: "APEX Inspector" });

      // Private functions

      /**
       * Show overlay
       */
      function _showInspection(event, el, type) {
        apex.debug.log(_logPrefix + 'Show overlay', event, el, type);

        // Make AJAX call to get server information
        apex.server.plugin(_config.ajaxIdentifier, {
          x01: type,
          x02: el.attr('id')
          }, 
          {
            success: function (data) {
              apex.debug.log(_logPrefix + 'Server response', data);
         
              // Add client side information to the object
              data.type = type;
              data.id = el.attr('id');
              if (type =='ITEM') {
                data.value = apex.items[el.attr('id')].getValue();
              }
              console.log(_logPrefix);
              console.table(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
              // handle error
              apex.debug.log(_logPrefix + 'Server error', jqXHR, textStatus, errorThrown);
            }
        });
        // Add client side information to the objec
      }

      /**
       * Handle togglings of the inspector (on/off)
       */
      function _toggleActive() {
        apex.debug.log(_logPrefix + 'Toggle active');

        if (_isActive) {
          $(_selInspectorIcon + ' span').removeClass('mbnInspector-active');
          $('.mbnInspector-selected').removeClass('mbnInspector-selected');      
          $(_selHover).off( "mouseenter mouseleave", _hoverHandler);
          console.log(_logPrefix + 'Deactivated');
          _isActive = false;
          myStorage.setItem( 'active', 'no');
        }
        else {
          $(_selInspectorIcon + ' span').addClass('mbnInspector-active');
          $(_selHover).on( "mouseenter mouseleave", _hoverHandler);
          console.log(_logPrefix + 'Activated');
          _isActive = true;
          _lastElement = null;
          myStorage.setItem( 'active', 'yes');
        }
      }

      /**
       * handler called upon hover events
       */
      function _hoverHandler(event) { 
        let el = null;
        let type = null;
    
        // Find hover over current element
        for (let i = 0; i < _selSelectors.length; i++) {
          if ($(event.currentTarget).hasClass(_selSelectors[i].class)) {
            el = $(event.currentTarget);
            type = _selSelectors[i].type;
            break;
          }
        }

        // If not found, then look for closest parent
        if (!el) {
          for (let i = 0; i < _selSelectors.length; i++) {
            if ($(event.currentTarget).parent('.' + _selSelectors[i].class).length > 0) {
              el = $(event.currentTarget).parent('.' + _selSelectors[i].class);
              type = _selSelectors[i].type;
              break;
            }
          }
        }
        
        if (!el || el.is(_lastElement)) {
          return; // Hover element is not of interest
        }
   
        if (event.type == 'mouseenter') {
          if (_setTimeoutConst) {
            clearTimeout(_setTimeoutConst);
          }
          $('.mbnInspector-selected').removeClass('mbnInspector-selected');
          el.addClass('mbnInspector-selected');
          _lastElement = el;
          _setTimeoutConst = setTimeout(function() {
            _showInspection(event, el, type);
          }, _config.delay);
        }
        else {
          $('.mbnInspector-selected').removeClass('mbnInspector-selected');      
          if (_setTimeoutConst) {
            clearTimeout(_setTimeoutConst);
          }
        }
      }
  
      // Public functions
  
      /**
      * Initialize the inspector
      */
      mbninspector.init = function(config) {
  
          // Add the inspector icon to the apex developer toolbar
          apex.debug.log(_logPrefix + 'Initializing', config);
  
          // Set the config
          _config = $.extend(_config, config);
          if (config.initJSCode) {
            _config = config.initJSCode(_config);
          }
          
          apex.debug.log(_logPrefix + 'Final config', _config);
          
          // Initialize the inspector menu button
          $(_selAPEXToolbar + ' ul').append(_htmlInspectorIcon);
          $(_selAPEXToolbar).width($(_selAPEXToolbar).width() + 40);
          $(_selInspectorIcon).click(function() {
            apex.debug.message(_logPrefix + 'Inspector icon clicked');       
            _toggleActive();
          });

          if (myStorage.getItem( 'active') == 'yes') {
            _toggleActive();
          }

          // TODO: Setup shortcut (configurable) to turn on/off
      };
  
  })();