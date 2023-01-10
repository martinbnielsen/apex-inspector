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
      const _selOverlay         = '#mbnInspectorOverlay';
      const _htmlInspectorIcon  = '<li role="none">' +
                                  '<button type="button" class="a-Button a-Button--devToolbar" id="mbnInspector" title="APEX Inspector" aria-label="APEX Inspector">' +
                                  '<span class="fa fa-hand-pointer-o" aria-hidden="true"></span>' +
                                  '</button></li>';
      const _htmlOverlay        = '<div id="mbnInspectorOverlay" style="display:none"/>';
      const _selSelectors       = [
                                    {class: 't-Button',       type: 'BUTTON'},
                                    {class: 'text_field',     type: 'ITEM'},
                                    {class: 'apex-item-text', type: 'ITEM'},
                                    {class: 't-Region',       type: 'REGION'},
                                    {class: 't-IRR-region',   type: 'REGION'}
                                  ];

      let _isActive = false;
      let _config = {
        delay: 800,
        output: 'screen',
        overlayHeight: 300,
        overlayWidth: 700,
        overlayScroll: 4,
        shortcutKey: 'I',
        messageTimeout: 1000,
        showMessage: true
      };

      let _lastElement = null;
      let _setTimeoutConst = null;
      let _inspectorOverlay = null;
      let _overlayVisible = false;

      const myStorage = apex.storage.getScopedLocalStorage({ prefix: "APEX Inspector" });

      // Private functions

      /**
       * Stringify JS Object as HTML
       * Based on:
       * https://github.com/JedWatson/html-stringify
       */
      function _htmlStringify(obj, fromRecur) {

        var tag = (fromRecur) ? 'span' : 'div';
        var nextLevel = (fromRecur || 0) + 1;
        
        // strings
        if (typeof obj == 'string') {
          return '<' + tag + ' style="color: #0e4889; cursor: default;">"' + obj + '"</' + tag + '>';
        }
        // booleans, null and undefined
        else if (typeof obj == 'boolean' || obj === null || obj === undefined) {
          return '<' + tag + '><em style="color: #06624b; cursor: default;">' + obj + '</em></' + tag + '>';
        }
        // numbers
        else if (typeof obj == 'number') {
          return '<' + tag + ' style="color: #ca000a; cursor: default;">' + obj + '</' + tag + '>';
        }
        // dates
        else if (Object.prototype.toString.call(obj) == '[object Date]') {
          return '<' + tag + ' style="color: #009f7b; cursor: default;">' + obj + '</' + tag + '>';
        }
        // arrays
        else if (Array.isArray(obj)) {
          
          var rtn = '<' + tag + ' style="color: #666; cursor: default;">: [';
          
          if (!obj.length) {
            return rtn + ']</' + tag + '>';
          }
          
          rtn += '</' + tag + '><div style="padding-left: 20px;">';
          
          for (var i = 0; i < obj.length; i++) {
            rtn += '<span></span>' + _htmlStringify(obj[i], nextLevel); // give the DOM structure has as many elements as an object, for collapse behaviour
            if (i < obj.length - 1) {
              rtn += ', <br>';
            }
          }
        
          return rtn + '</div><' + tag + ' style="color: #666">]</' + tag + '>';
          
        }
        // objects
        else if (obj && typeof obj == 'object') {
          
          var rtn = '',
            len = Object.keys(obj).length;
        
          if (fromRecur && !len) {
            return '<' + tag + ' style="color: #999; cursor: default;">Object: {}</' + tag + '>';
          }
          
          if (fromRecur) {
            rtn += '<' + tag + ' style="color: #0b89b6">{</' + tag + '><div class="_stringify_recur _stringify_recur_level_' + fromRecur + '" style="padding-left: 20px;">';
          }
          
          for (var key in obj) {
            if (typeof obj[key] != 'function') {
              rtn += '<div><span style="padding-right: 5px; cursor: default;">' +key + ':</span>' + _htmlStringify(obj[key], nextLevel) + '</div>';
            }
          }
          
          if (fromRecur) {
            rtn += '</div><' + tag + ' style="color: #0b89b6; cursor: default;">}</' + tag + '>';
          }
          
          return rtn;
          
        }
      
        return '';
      
      }

      /**
       * Handle overlay positioning
       */
      function _positionOverlay(event) {
        let top=0,left=0;
        const offset = 5

        if (event.pageY + _config.overlayHeight > $(window).height()) {
          top = event.pageY - _config.overlayHeight - offset;
        }
        else {
          top = event.pageY + offset;
        }

        if (event.pageX + _config.overlayWidth > $(window).width()) {
          left = event.pageX - _config.overlayWidth - (5*offset);
        }
        else {
          left = event.pageX + offset;
        }

        _inspectorOverlay.css({
          top: top ,
          left: left
        });
      }

      /**
       * Handle overlay scrolling
       */
      function _scrollOverlay(event) {
        let top = _inspectorOverlay.scrollTop();

        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
          // scroll up
          _inspectorOverlay.scrollTop(top-_config.overlayScroll);
        }
        else {
            // scroll down
            _inspectorOverlay.scrollTop(top+_config.overlayScroll);
          }
      }

      /**
       * Toggle the overlay
       */
      function _toggleOverlay(show) {
        if (show) {
          _inspectorOverlay.fadeIn();
          _overlayVisible = true;
          _inspectorOverlay.scrollTop(0);
        }
        else {
          _inspectorOverlay.fadeOut();
          _overlayVisible = false;
        }
      }
    

      /**
       * Dsiplay output
       */
      function _displayOutput(data) {
        if (_config.output == 'console') {
          console.log(_logPrefix);
          data.subObject = {hej: 'test', dato: new Date(), flag: false, liste: [1,2,3,4,{name: 'test', value: 'test2'}]};
          console.table(data);
        }
        else {
          apex.debug.log(_logPrefix, 'Display insepction in window', _inspectorOverlay);
          data.subObject = {hej: 'test', dato: new Date(), flag: false, liste: [1,2,3,4,{name: 'test', value: 'test2'}]};
          _inspectorOverlay.html(_htmlStringify(data));
          _toggleOverlay(true);
        }
      }

      /**
       * Show Inspection output
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
              _displayOutput(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
              // handle error
              apex.debug.log(_logPrefix + 'Server error', jqXHR, textStatus, errorThrown);
            }
        });
        // Add client side information to the objec
      }


      /**
       * Show APEX success message and fadeout
       */
      function _showSuccess(msg) {
        if (!_config.showMessage) return;

        apex.message.showPageSuccess(_logPrefix + msg);
        setTimeout(function() {
          apex.message.hidePageSuccess();
        }, _config.messageTimeout);
      }


      /**
       * Handle togglings of the inspector (on/off)
       */
      function _toggleActive() {
        apex.debug.log(_logPrefix + 'Toggle active');

        if (_isActive) {
          if (_overlayVisible) {
            _inspectorOverlay.fadeOut();
          }
          $(_selInspectorIcon + ' span').removeClass('mbnInspector-active');
          $('.mbnInspector-selected').removeClass('mbnInspector-selected');      
          $(_selHover).off( "mouseenter mouseleave", _hoverHandler);
          console.log(_logPrefix + 'Deactivated');
          _isActive = false;
          myStorage.setItem( 'active', 'no');
          _showSuccess('Deactivated');
        }
        else {
          $(_selInspectorIcon + ' span').addClass('mbnInspector-active');
          $(_selHover).on( "mouseenter mouseleave", _hoverHandler);
          console.log(_logPrefix + 'Activated');
          _isActive = true;
          _lastElement = null;
          myStorage.setItem( 'active', 'yes');
          _showSuccess('Activated');
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
          if (_overlayVisible) {
            _toggleOverlay(false);
          }
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

          // Initialise the inspector overlay
          if (_config.output != 'console') {
            $('body').append(_htmlOverlay);
            _inspectorOverlay = $(_selOverlay);
            _inspectorOverlay.height(_config.overlayHeight);
            _inspectorOverlay.width(_config.overlayWidth);
            $('body').on('mousemove', _positionOverlay);
            $(document).on('mousewheel',_scrollOverlay);
          }

          // TODO: Setup shortcut (configurable) to turn on/off
          if (_config.shortcutKey) {
            apex.debug.log(_logPrefix + 'Settings shortcut to shift-ctrl-' + _config.shortcutKey);       
            $(document).on('keydown', function(e) {
              console.log('keydown', e);
              if (e.ctrlKey && e.shiftKey && e.key == _config.shortcutKey) {
                console.log('toggle');
                _toggleActive();
              }
            });
          }
      };
  
  })();