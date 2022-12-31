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
      const _selSelectorClasses = ['t-Button','text_field','apex-item-text','t-Region','t-IRR-region'];

      let _isActive = false;
      let _config = {
        localItem: 'Hello'
      };
      
  
      // Private functions

      /**
       * Handle togglings of the inspector (on/off)
       */
      function _toggleActive() {
        apex.debug.log(_logPrefix + 'Toggle active');

        // TODO: Make choice persistent using sessionstorage

        if (_isActive) {
          $(_selInspectorIcon + ' span').removeClass('mbnInspector-active');
          $(_selHover).off( "mouseenter mouseleave", _hoverHandler);
          _isActive = false;
        }
        else {
          $(_selInspectorIcon + ' span').addClass('mbnInspector-active');
          $(_selHover).on( "mouseenter mouseleave", _hoverHandler);
          _isActive = true;
        }
      }

      /**
       * handler called upoj hover events
       */
      function _hoverHandler(event) { 
        let el = null;
    
        for (let i = 0; i < _selSelectorClasses.length; i++) {
          if ($(event.currentTarget).hasClass(_selSelectorClasses[i])) {
            el = $(event.currentTarget);
            break;
          }
        }
        if (!el) {
          for (let i = 0; i < _selSelectorClasses.length; i++) {
            if ($(event.currentTarget).parent('.' + _selSelectorClasses[i]).length > 0) {
              el = $(event.currentTarget).parent('.' + _selSelectorClasses[i]);
              break;
            }
          }
        }

        if (!el) {
          return;
        }
   
        if (event.type == 'mouseenter') {
          $('.mbnInspector-selected').removeClass('mbnInspector-selected');
          el.addClass('mbnInspector-selected');
   
          // TODO: Handle hover information box
        }
        else {
          $('.mbnInspector-selected').removeClass('mbnInspector-selected');      
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
          if (config.initJSCode) {
            _config = config.initJSCode(_config);
          }
          apex.debug.log(_logPrefix + 'Final config', _config);
          
          // Initialize the inspector menu button
          $(_selAPEXToolbar + ' ul').append(_htmlInspectorIcon);
          $(_selAPEXToolbar).width($(_selAPEXToolbar).width() + 40);
          $(_selInspectorIcon).click(function() {
            apex.debug.log(_logPrefix + 'Inspector icon clicked');       
            _toggleActive();
          });

      };
  
  })();