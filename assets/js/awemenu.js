(function ($) {
    'use strict';

    var AWEMenu = function ($el, options) {
        this.default_opts = {
            trigger: 'hover', // mouse trigger to show submenu. Value is one of ['hover', 'click', 'toggle']. Default is 'hover'.
            direction: 'ltr', // define language direction used in menu, receives on of ['rtl', 'ltr']. Default is 'ltr'(Left to Right)
            style: 'awemenu-default', // style of menu which decide menu display. Default is 'awemenu-default'.
            type: 'standard', // type of menu on desktop. One of values ['standard', 'top', 'left', 'bottom', 'right', 'outleft', 'outright']. Default is 'standard'.
            hoverDelay: 0, // time to hover active. Default is 0 ms.
            sticky: false, // enable sticky menu. This is boolean value. Default is false.
            stickyOffset: 0, // offset to start enable sticky menu. Default value is 0.
            stickyWhenScrollUp: false, // show sticky menu when scroll up
            enableAnimation: true, // allows use animation show show and hide submenu. Default is true
            defaultDesktopAnimation: 'fadeup', // default animation use when submenu active/deactive.
            onePageMode: false, // use for enable onepage site.
            onePageSettings: {
                offset: 0,
                scrollSpeed: 500,
                changeHashURL: false
            },
            changeWindowURL: false,
            defaultDesktopAnimationDuration: 300, // default duration time by millisecond(ms) for all animation open submenu on desktop mode. If submenu has attribute data-duration, this value is overrided. Default value is 300
            enableMobile:true,
            responsiveWidth: 780, // minimum width of browser to change from desktop mode to mobile mode. Default is 780px.
            mobileTrigger: 'click', // event type to show menu on mobile. Values is one of ['click', 'toggle']. Default is 'click'
            mobileType: 'standard', // type of menu on mobile screen. Value is one of ['standard', 'top', 'bottom', 'outleft', 'outright']. Default is 'standard'.
            mobileAnimationDuration: 500, // duration (ms) to play animation open or close menu. Default value is 500.
            customMenuBar: '<span class="amm-bar"></span>', // html of menu bar
            customCloseButton: false, // html string for close button when menu position is outleft, outright. Default: false
            dropdownDecor: false, // string html for submenu decor. Default is false.
            showArrow: true, // enable arrow to define item has submenu on desktop mode. If this value is false, all arrow is removed. Default value is true.
            showMobileArrow: true, // enable arrow to define item has submenu on mobile mode. If this value is false, all arrow is removed. Default value is true.
            arrows: {// icon class for item arrow
                up: 'amm-up',
                down: 'amm-down',
                left: 'amm-left',
                right: 'amm-right',
                mobileClose: 'amm-clear'
            },
            initialize: function (menu) {},
            ready: function (menu) {},
            beforeActivate: function ($item, menu) {},
            activate: function ($item, menu) {},
            beforeDeactivate: function ($item, menu) {},
            deactivate: function ($item, menu) {},
            destroy: function (menu) {}
        };

        this.$el = $el;
        options.arrows = $.extend({}, this.default_opts.arrows, options.arrows);
        options.onePageSettings = $.extend({}, this.default_opts.onePageSettings, options.onePageSettings);
        this.options = $.extend({}, this.default_opts, options);
        this.isFirst = true;
        if (options.initialize) {
            this.options.initialize = options.initialize;
        }

        // get menu element id
        this.menuID = $el.attr('id');
        if (!this.menuID) {
            this.menuID = 'awemenu-no-' + $('.awemenu-nav').index($el);
            $el.attr('id', this.menuID);
        }

        // implements validate options
        this.validateOptions();

        // call initialize method
        this.initialize();
    }

    AWEMenu.prototype = {
        constructor: AWEMenu,
        initialize: function () {
            this.isMobile = -1;
            this.ww = 0;
            this.stickyActivated = false;
            this.menuTop = this.$el.offset().top;
            this.classes = [];
            this.initializedTrigger = false;
            this.anchors = new Array();
            this.itemsReady = 0;
            this.stickyReplacerID = 'awemenu-scticky-replacer-' + this.getMenuIndex();
            this.initMenu();
            this.initTrigger();
        },
        initMenu: function () {
            var _self = this,
                    opts = this.options;

            // add menu index class
            this.addMenuClasses('awemenu-' + this.getMenuIndex());
            this.addMenuClasses(opts.style);

            // add direction class
            if (opts.direction === 'rtl')
                this.addMenuClasses('awemenu-rtl');

            // add menu bar
            if (!$('.awemenu-bars', this.$el).length) {
                var $bar = $('<div class="awemenu-bars" />').html(opts.customMenuBar);
                $('.awemenu', this.$el).before($bar);
            }

            // process sticky offset data
            this.calculateStickyOffset();

            // remove all item arrow if exist
            if(this.$el.hasClass('not-remove-arrow') && !this.$el.hasClass('awemenu-mobile')){
                //reove arrow from menu level 2
                $('.awemenu-item .awemenu-item i.awemenu-arrow', this.$el).remove();
            } else {
                $('i.awemenu-arrow', this.$el).remove();
            }

            // Hanlder window resize event
            $(window).bind('resize', $.proxy(_self.windowResizeHandler, _self)).trigger('resize');
            $(window).bind('scroll', $.proxy(_self.scrollHandler, _self)).trigger('scroll');
            $(document).bind('click', $.proxy(_self.documentClickHandler, _self));

            // implements custom initialize for menu
            opts.initialize(this);
        },
        documentClickHandler: function (event) {
            this.$el.trigger('documentClick', event);
        },
        scrollHandler: function (event, triggerEvent) {
            if (triggerEvent)
                this.$el.trigger('windowScroll', triggerEvent);
            else
                this.$el.trigger('windowScroll', event);
        },
        windowResizeHandler: function (event) {
            this.onResize(event);
        },
        setOption: function (options) {
            if ($.type(options) == 'object') {
                // re-initialize menu if required
                this.destroy();

                // validate options
                this.options = $.extend({}, this.options, this.validateOptions(options));

                this.initialize();
                this.$el.data('awe-menu', this);
            }
        },
        getObjectProperties: function (obj) {
            var properties = [];

            if (obj && $.type(obj) == 'object') {
                $.each(obj, function (propName, propValue) {
                    properties.push(propName);
                });
            }

            return properties;
        },
        validateOptions: function (options) {
            var _self = this,
                    properties = this.getObjectProperties(this.default_opts);

            if (!options || $.type(options) !== 'object')
                options = this.options;

            $.each(options, function (opt, value) {
                if (!$.inArray(opt, properties) === -1)
                    delete options[opt];
                else {
                    switch (opt) {
                        case 'trigger':
                            if ($.inArray(value, ['click', 'hover', 'hover_intent', 'toggle']) === -1)
                                options[opt] = 'hover';
                            break;

                        case 'mobileTrigger':
                            if ($.inArray(value, ['click', 'toggle']) === -1)
                                options[opt] = 'click';
                            break;

                        case 'type':
                        case 'mobileType':
                            if ($.inArray(value, ['standard', 'top', 'left', 'bottom', 'right', 'outleft', 'outright', 'fullscreen']) === -1) {
                                options[opt] = 'standard';
                            }
                            break;

                        case 'hoverDelay':
                        case 'defaultDesktopAnimationDuration':
                        case 'mobileAnimationDuration':
                        case 'responsiveWidth':
                            value = parseInt(value);
                            options[opt] = value;
                            if (isNaN(value))
                                options[opt] = _self.default_opts[opt];
                            break;

                        case 'initialize':
                        case 'ready':
                        case 'beforeActivate':
                        case 'activate':
                        case 'beforeDeactivate':
                        case 'deactivate':
                        case 'destroy':
                            if ($.type(value) !== 'function')
                                options[opt] = _self.default_opts[opt];
                            break;

                        case 'style':
                            if (value == '')
                                options[opt] = _self.default_opts[opt];
                            break;
                    }
                }
            });

            if (!options || $.type(options) !== 'object')
                this.options = options;

            return options;
        },
        getOption: function (optionName) {
            var opts = JSON.parse(JSON.stringify(this.options));
            if (optionName)
                return opts[optionName]

            return opts;
        },
        destroy: function () {
            // clear interval wait to finish init items
            var _self = this,
                    initItemsInterval = this.$el.data('init-items-interval');
            if (initItemsInterval)
                clearInterval(initItemsInterval);

            // reset flag and data
            this.itemsReady = 0;
            this.isMobile = -1;
            this.stickyActivated = false;
            this.$el.data('awe-menu', false);

            // remove sticky replacer
            $('#' + this.stickyReplacerID).remove();

            // remove all menu classes
            this.$el.removeClass(this.classes.join(' '));
            this.classes = [];

            // unbind click to menu item
            $('.awemenu-item', this.$el).unbind('mouseenter').unbind('mouseleave').unbind('hoverIntent');
            $('.awemenu-item > a', this.$el).unbind('click');
            $('.awemenu-item > a > .awemenu-arrow', this.$el).unbind('click');

            // reset submenu style
            $('.awemenu-submenu', this.$el).each(function () {
                var $submenu = $(this),
                        animation = $submenu.data('animation') ? $submenu.data('animation') : _self.options.defaultDesktopAnimation;

                // remove animation class
                if (animation)
                    $submenu.parent().removeClass('awemenu-' + animation);

                // reset style
                $submenu.removeAttr('style');
            });

            // remove sticky classes
            this.$el.removeClass('awemenu-stickyup awemenu-scrollup awemenu-sticky');

            // unbind window and document events
            this.$el.unbind('windowResize').unbind('documentClick').unbind('windowScroll').unbind('aweMenuReady').undelegate('.awemenu-arrow', 'click');
            $(window).unbind('resize', this.windowResizeHandler).unbind('scroll', this.scrollHandler);

            // destroy menu bar
            $('.awemenu-bars', this.$el).unbind('click').remove();

            // implements custom callback for destroy menu
            this.options.destroy(this);
        },
        detectDevice: function () {
            var _self = this,
                    ww = window.innerWidth,
                    opts = this.options,
                    changed = false;

            // check touch device browser
            this.isTouchDevice = navigator.userAgent.match(/Androi|WebOS|iPod|iPad|Blackberry|Windows Phone/i) ? true : false;
            if (this.isTouchDevice && this.options.trigger == 'hover')
                this.options.trigger = 'click';

            // check responsive width
            if (ww < opts.responsiveWidth && this.options.type !== 'fullscreen') {
                if (!this.isMobile || this.isMobile === -1) {
                    if(opts.enableMobile){
                        changed = true;
                        this.isMobile = true;
                        // add mobile classes
                        this.addMenuClasses(['awemenu-mobile', 'awemenu-mobile-' + opts.mobileType]);

                        // remove desktop mode classes
                        this.removeMenuClasses(['awemenu-' + opts.type]);
                    }else{
                        // add desktop mode classes
                        this.addMenuClasses(['awemenu-' + opts.type]);
                    }
                }
            } else {
                if (this.isMobile || this.isMobile === -1) {
                    this.isMobile = false;
                    changed = true;

                    // remove mobile classes
                    this.removeMenuClasses(['awemenu-mobile', 'awemenu-mobile-' + opts.mobileType]);

                    // add desktop mode classes
                    this.addMenuClasses(['awemenu-' + opts.type]);

                    // add wrapper for fullscreen type
                    if (opts.type === 'fullscreen') {
                        $('ul.awemenu', _self.$el).appendTo($('.awemenu-container', _self.$el));
                        $('.awemenu-fullscreen-wrapper', _self.$el).remove();
                    }
                }
            }

            // process wrapper for fullscreen type
            if (changed) {
                if ((this.isMobile && opts.mobileType === 'fullscreen') || (!this.isMobile && opts.type === 'fullscreen')) {
                    if (!$('.awemenu-fullscreen-wrapper', _self.$el).length) {
                        $('.awemenu-container', _self.$el).append('<div class="awemenu-fullscreen-wrapper"><div class="awemenu-fullscreen-table"><div class="awemenu-fullscreen-cell"></div></div></div>');
                        $('ul.awemenu', _self.$el).appendTo($('.awemenu-fullscreen-cell', _self.$el));
                    }
                } else {
                    $('ul.awemenu', _self.$el).appendTo($('.awemenu-container', _self.$el));
                    $('.awemenu-fullscreen-wrapper', _self.$el).remove();
                }
            }
        },
        resetMenu: function (event) {
            var _self = this,
                isDeactiveSubmenu = true;

            // deactivate all menu item
            if(event && event.type == 'click' && event.currentTarget){
                var target = event.currentTarget.activeElement ? event.currentTarget.activeElement : event.currentTarget,
                    $item = $(target);
                if($item.parents('.awemenu-item:first').length)
                    isDeactiveSubmenu = false;
            }
            $('.awemenu-item.awemenu-active', this.$el).each(function () {
                if(isDeactiveSubmenu)
                    _self.deactivateSubMenu($(this));
            });

            // close mobile menu or outleft, outright
            if (this.$el.hasClass('awemenu-active') && (this.isMobile || $.inArray(this.options.type, ['outleft', 'outright']) > -1)) {
                _self.onMenuBarClick();
                $('body').removeClass('awemenu-' + this.menuIndex + '-mobile-active');
            }
        },
        onMenuBarClick: function () {
            var _self = this,
                    opts = this.options;

            // process class define mobile menu is active
            if (this.isMobile && $.inArray(opts.mobileType, ['standard', 'top', 'bottom']) > -1) {
                $('body').toggleClass('awemenu-' + this.menuIndex + '-mobile-active');

                var $mainMenu = $('ul.awemenu', _self.$el);

                if (!_self.$el.hasClass('awemenu-active')) {
                    $mainMenu.slideDown(opts.mobileAnimationDuration, function () {
                        _self.$el.addClass('awemenu-active');
                    }).css('z-index', 999999);
                } else {
                    $mainMenu.slideUp(opts.mobileAnimationDuration, function () {
                        _self.$el.removeClass('awemenu-active');
                    }).css('z-index', '');
                }
            } else {
                _self.$el.toggleClass('awemenu-active');
            }
        },
        initTrigger: function () {
            var _self = this;

            // wait all init for menu ready
            this.$el.bind('aweMenuReady', function () {
                if (!_self.initializedTrigger) {
                    // init trigger for menu items
                    if (_self.options.trigger === 'hover') {
                        _self.initTriggerHover($(this));
                    } else if(_self.options.trigger === 'hover_intent'){
                        _self.initTriggerHoverIntent($(this));
                    }
                    _self.initTriggerClick($(this));

                    // set flag to define trigger is initialized
                    _self.initializedTrigger = true;

                    // implements custom callback when menu ready
                    _self.options.ready(_self);
                }
            });
        },
        initTriggerHover: function () {
            var _self = this;

            // init hover on menu item
            $('li.awemenu-item', this.$el).bind('mouseenter', function () {
                var $item = $(this),
                        hideTimeout = $item.data('hide-submenu');

                if (!_self.isMobile && _self.isReady) {
                    // reset flag hover out
                    $item.data('hover-out', false);

                    // clear timeout hide submenu
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        $item.data('hide-submenu', false)
                    }

                    if ($('> a', $item).length) {
                        if (_self.options.hoverDelay > 0) {
                            setTimeout(function () {
                                if (!$item.data('hover-out'))
                                    _self.activateSubMenu($item);
                            }, _self.options.hoverDelay);
                        } else {
                            _self.activateSubMenu($item);
                        }
                    }
                }
            }).bind('mouseleave', function () {
                var $item = $(this);

                if (!_self.isMobile) {
                    $item.data('hover-out', true);
                    _self.deactivateSubMenu($item);
                }
            });
        },
        initTriggerHoverIntent: function () {
            var _self = this;

            // init hover on menu item
            $('li.awemenu-item', this.$el).hoverIntent(function(){
                var $item = $(this),
                        hideTimeout = $item.data('hide-submenu');

                if (!_self.isMobile && _self.isReady) {
                    // reset flag hover out
                    $item.data('hover-out', false);

                    // clear timeout hide submenu
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        $item.data('hide-submenu', false)
                    }

                    if ($('> a', $item).length) {
                        if (_self.options.hoverDelay > 0) {
                            setTimeout(function () {
                                if (!$item.data('hover-out'))
                                    _self.activateSubMenu($item);
                            }, _self.options.hoverDelay);
                        } else {
                            _self.activateSubMenu($item);
                        }
                    }
                }
            }, function(){
                var $item = $(this);

                if (!_self.isMobile) {
                    $item.data('hover-out', true);
                    _self.deactivateSubMenu($item);
                }
            });
        },
        initTriggerClick: function () {
            var _self = this,
                    opts = this.options;

            // handle click to menu item
            $('li.awemenu-item > a', this.$el).click(function (event) {
                var $item = $(this).parent(),
                    href = $(this).attr('href');

                // check menu is ready
                if (!_self.isReady) {
                    event.preventDefault();
                    return;
                }

                // process click by status of menu link
                if ((!_self.isMobile && $.inArray(opts.trigger, ['hover', 'hover_intent']) === -1) || _self.isMobile) {
                    if ($item.hasClass('awemenu-active')) {
                        // deactivate submenu of item
                        _self.deactivateSubMenu($item);

                        // break redirect to menu link when in toggle mode
                        if ((!_self.isMobile && opts.trigger == 'toggle') || (_self.isMobile && opts.mobileTrigger == 'toggle')) {
                            event.preventDefault();
                            return;
                        }

                        // reset menu if click to redirect menu link
                        if(href !== '#')
                            _self.resetMenu(event);
                    } else if ($('> .awemenu-submenu', $item).length) {
                        event.preventDefault();
                        _self.activateSubMenu($item);
                        return;
                    }
                }

                // deactivate current active submenu
                //_self.deactivateSubMenu($('li.awemenu-active', this.$el));

                // process scroll to if in the same page
                var hashIndex = href.indexOf('#'),
                        hash = hashIndex > -1 ? href.substring(hashIndex, href.length) : '',
                        url = hashIndex > -1 ? href.substring(0, hashIndex) : href,
                        currentURL = (document.URL.indexOf('#') > -1) ? document.URL.substring(0, document.URL.indexOf('#')) : document.URL;

                if (hash && (url == currentURL || href.indexOf('#') === 0)) {
                    event.preventDefault();
                    var scrollOffset = (hash !== '#' && $(hash).length) ? $(hash).offset().top : 0;

                    $('.awemenu-anchor-active', _self.$el).removeClass('awemenu-anchor-active');

                    // clear timer wait to finish scroll to anchor element
                    if (_self.scrollTimer) {
                        clearTimeout(_self.scrollTimer);
                        _self.scrollTimer = false;
                    }

                    // scroll to hash element
                    _self.scrollByClick = true;
                    $('html, body').stop().animate({
                        scrollTop: scrollOffset
                    }, _self.options.onePageSettings.scrollSpeed);

                    // set timeout wait to finish scroll page
                    _self.scrollTimer = setTimeout(function () {
                        _self.scrollByClick = false;
                        _self.scrollTimer = false;
                    }, _self.options.onePageSettings.scrollSpeed)

                    // change window url with hash
                    _self.changeWindowURL(currentURL, hash);

                    // set item active for anchor
                    $item.addClass('awemenu-anchor-active');
                    _self.inViewportItems = $item;
                }
            });

            // handle click to arrow
            $('i.awemenu-arrow', this.$el).click(function (event) {
                var $item = $(this).parents('li.awemenu-item:first');

                // deactive submenu when click on arrow of active iten
                if (_self.isMobile && $item.hasClass('awemenu-active')) {
                    event.preventDefault();
                    event.stopPropagation();
                    _self.deactivateSubMenu($item);
                }
            });
        },
        initDocumentTouch: function () {
            var _self = this,
                    touch = false;

            $(document).bind('touchstart', function () {
                touch = true;
            });
            $(document).bind('touchmove', function () {
                touch = false;
            });
            $(document).bind('touchend', function (event) {
                if (touch) {
                    _self.onDocumentClick(event);
                }
            });
        },
        initMenuItems: function () {
            var _self = this;

            // set menu is not ready
            this.isReady = false;

            // add close button for outleft, outright
            var desktopCondition = !this.isMobile && $.inArray(this.options.type, ['outleft', 'outright', 'fullscreen']) > -1,
                    mobileCondition = this.isMobile && $.inArray(this.options.mobileType, ['outleft', 'outright']) > -1;

            if ((desktopCondition || mobileCondition)) {
                if (!$('.awemenu-close', this.$el).length) {
                    $('ul.awemenu', this.$el).prepend('<span class="awemenu-close"></span>');
                    if (this.options.customCloseButton)
                        $('.awemenu-close', this.$el).append(this.options.customCloseButton);
                    $('.awemenu-close', this.$el).click(function (event) {
                        event.preventDefault();
                        _self.$el.removeClass('awemenu-active');

                        // deactivate all active menu items
                        $('li.awemenu-active', _self.$el).each(function () {
                            _self.deactivateSubMenu($(this));
                        });
                    });
                }
            } else
                $('.awemenu-close', this.$el).remove();

            // add menu arrow
            if (((!this.isMobile && this.options.showArrow) || (this.isMobile && this.options.showMobileArrow)) && !$('.awemenu-arrow', this.$el).length)
                $('.awemenu-item > a', this.$el).append($('<i class="awemenu-arrow"></i>').addClass(this.options.arrows.down));
            if (this.options.dropdownDecor && !$('.awemenu-decor', this.$el).length) {
                $('ul.awemenu > li.awemenu-item > ul.awemenu-submenu', this.$el).prepend($(this.options.dropdownDecor).addClass('awemenu-decor'));
            }

            // remove sticky replacer if exist
            if (this.stickyReplacer) {
                this.stickyReplacer.remove();
                this.stickyReplacer = null;
            }

            // reset items style
            $('.awemenu-item > a', this.$el).css('transition', 'none');
            this.removeMenuClasses('awemenu-animation');
            $('.awemenu-submenu', this.$el).removeAttr('style').css({display: 'block', opacity: 0, visibility: 'hidden'});

            // add class awemenu-active to wrapper for outleft and outright menu
            $('ul.awemenu', this.$el).removeAttr('style')
            if ($.inArray(this.options.type, ['outleft', 'outright']) > -1) {
                $('ul.awemenu', this.$el).css({transition: 'none', opacity: 0, visibility: 'hidden'});
                this.$el.addClass('awemenu-active');
            }

            // remove transition a a tag of item
            $('.awemenu-item > a', this.$el).css('transition', 'none');

            // implements initialize for menu items
            _self.itemsReady = 0;
            _self.totalItems = $('ul.awemenu-submenu', _self.$el).length;

            $('ul.awemenu > li.awemenu-item', _self.$el).each(function () {
                //implements initialize menu item level 1
                _self.initMenuItem($(this));
            });

            // wait all menu items is initialized
            var waitInitItems = setInterval(function () {
                if (_self.itemsReady >= _self.totalItems) {
                    clearInterval(waitInitItems);
                    _self.$el.data('init-items-interval', false);

                    // implements trigger resize for first initialize
                    if (_self.isFirst) {
                        _self.onResize();
                        _self.isFirst = false;
                    } else {
                        // set flag menu is ready
                        _self.isReady = true;

                        // reset css default
                        $('.awemenu-submenu', _self.$el).css({display: 'none', opacity: '', visibility: ''});

                        // add class awemenu-active to wrapper for outleft and outright menu
                        if ($.inArray(_self.options.type, ['outleft', 'outright']) > -1) {
                            _self.$el.removeClass('awemenu-active');
                            $('ul.awemenu', _self.$el).css({transition: '', opacity: '', visibility: ''});
                        }

                        // reset transition a tag
                        $('.awemenu-item > a', this.$el).css('transition', '');

                        // set max-height for menu in mobile
                        if (_self.isMobile && ($.inArray(_self.options.mobileType, ['top', 'bottom']) > -1 || _self.stickyActivated))
                            _self.setMenuMaxHeight();
                        $('.awemenu-item > a', _self.$el).css('transition', '');

                        // show default item
                        if (_self.$showDefaultItem)
                            _self.$showDefaultItem.addClass('awemenu-default-item');

                        // add class animation
                        if (!_self.isMobile && _self.options.enableAnimation && _self.options.type !== 'fullscreen')
                            _self.addMenuClasses('awemenu-animation');

                        // add class active-trail to parents item
                        $('li.awemenu-item.awemenu-active-trail', this.$el).parents('.awemenu-item').addClass('awemenu-active-trail');

                        // create event define menu is ready
                        _self.height = _self.$el.height();

                        // init document click for touch devices
                        if (_self.isTouchDevice)
                            _self.initDocumentTouch();

                        if (!_self.initializedTrigger) {
                            // handle event window scroll
                            _self.$el.bind('windowScroll', function (event, windowEvent) {
                                _self.onScroll(windowEvent);
                            });
                            _self.prevScroll = $(window).scrollTop();

                            // handle click out menu to close menu
                            _self.$el.bind('documentClick', function (event, clickEvent) {
                                _self.onDocumentClick(clickEvent);
                            });

                            // handle click to menu-bar on mobile
                            $('.awemenu-bars', _self.$el).click(function (event) {
                                event.preventDefault();

                                // only process click when menus is ready
                                if (_self.isReady)
                                    _self.onMenuBarClick();
                            });

                            // init for one page mode
                            if (_self.options.onePageMode)
                                _self.initOnePageMode();
                        }

                        _self.$el.trigger('aweMenuReady');
                    }
                }
            }, 100);

            this.$el.data('init-items-interval', waitInitItems);
        },
        initMenuItem: function ($item) {
            // remove class awemenu-invert
            $item.removeClass('awemenu-invert');

            // check is default menu item
            var url = $("> a", $item).attr('href'),
                    currentURL = window.location.href,
                    showCurrent = $item.data('show-current') && url === currentURL;

            // check menu link is anchor in page
            if (this.options.onePageMode && (url.indexOf('#') === 0 || (window.location.hash && url.indexOf(window.location.host + window.location.pathname) === 0))) {
                var anchor = url.indexOf('#') === 0 ? url : window.location.hash;
                this.anchors.push(Array(anchor, $item));
            }

            if (!this.$showDefaultItem && !$item.parents('.awemenu-item').length && ($item.data('show-default') || showCurrent))
                this.$showDefaultItem = $item;

            // add align right class
            if ($item.data('right-item') && !$.inArray(this.options.type, ['left', 'right', 'outright', 'outleft']) > -1)
                $item.addClass('awemenu-item-right');

            // add class define item has submenu
            if ($('> .awemenu-submenu', $item).length)
                $item.addClass('awemenu-has-children');

            // implements others initialized
            this.initItemArrow($item);
            this.initSubMenuItem($item);
            if (this.options.enableAnimation)
                this.initSubmenuAnimation($item);
        },
        initItemArrow: function ($item) {
            if (((!this.isMobile && this.options.showArrow) || (this.isMobile && this.options.showMobileArrow)) && $('> .awemenu-submenu', $item).length) {
                var opts = this.options,
                        isLevel1 = $item.parents('.awemenu-item').length ? false : true,
                        isRightMenu = ($.inArray(opts.type, ['right', 'outright']) > -1),
                        arrowClass = opts.arrows.right,
                        $arrow;

                // get arrow element
                $arrow = $('> a > .awemenu-arrow', $item).removeClass().show();

                // get arrow class
                if (this.isMobile)
                    arrowClass = opts.arrows.down;
                else {
                    if (isRightMenu)
                        arrowClass = opts.arrows.left;
                    else {
                        if (isLevel1) {
                            switch (opts.type) {
                                case 'standard':
                                case 'top':
                                    arrowClass = opts.arrows.down;
                                    break;

                                case 'right':
                                    arrowClass = opts.arrows.left;
                                    break;

                                case 'bottom':
                                    arrowClass = opts.arrows.up;
                                    break;
                            }
                        }
                    }
                }

                // add class for arrow
                $arrow.addClass('awemenu-arrow').addClass(arrowClass);
            } else {
                $('.awemenu-arrow', $item).hide();
            }
        },
        initSubmenuAnimation: function ($item) {
            if (!this.isMobile && this.options.type !== 'fullscreen' && $('> .awemenu-submenu', $item).length) {
                var $submenu = $('> .awemenu-submenu', $item),
                        animation = $submenu.attr('data-animation') ? $submenu.attr('data-animation') : this.options.defaultDesktopAnimation,
                        duration = $submenu.attr('data-duration');

                if (animation) {
                    // add animation class
                    $item.addClass('awemenu-' + animation);

                    if (!duration)
                        duration = this.options.defaultDesktopAnimationDuration;

                    // process animation duration
                    if (!isNaN(parseInt(duration))) {
                        duration = parseInt(duration) + 'ms';
                        $submenu.css('transition-duration', duration);
                    }
                }
            }
        },
        initSubMenuItem: function ($item) {
            var _self = this,
                    $submenu = $('> .awemenu-submenu', $item);

            // process submenu by type
            if ($submenu.length) {
                if (!this.isMobile) {
                    switch (this.options.type) {
                        case 'standard':
                        case 'top':
                        case 'bottom':
                            this.initNormalSubMenu($item);
                            break;

                        case 'left':
                        case 'outleft':
                        case 'right':
                        case 'outright':
                            this.initEdgeSubMenu($item);
                            break;

                        case 'fullscreen':
                            this.initMobileSubMenu($item);
                            break;
                    }
                    ;
                } else
                    this.initMobileSubMenu($item);

                // init for dropdown menu
                if (!$submenu.hasClass('awemenu-megamenu')) {
                    $('> li.awemenu-item', $submenu).each(function () {
                        _self.initMenuItem($(this));
                    });
                }
            }

            // increase number item is initialized
            this.itemsReady++;
        },
        initNormalSubMenu: function ($item) {
            var $mainMenu = $('.awemenu-container', this.$el),
                    $submenu = $('> .awemenu-submenu', $item),
                    menuOffset = $mainMenu.offset(),
                    menuWidth = $mainMenu.outerWidth(),
                    itemOffset = $item.offset(),
                    subMenuWidth = this.getSubMenuWidth($submenu, false),
                    isLevel1 = $submenu.parents('.awemenu-item').length == 1 ? true : false;

            if (isLevel1) { // process for submenu of top item
                if (subMenuWidth >= menuWidth) {
                    subMenuWidth = menuWidth;
                    $submenu.offset({left: menuOffset.left});
                } else {
                    var left = itemOffset.left,
                            dataAlign = $submenu.attr('data-align'),
                            menuLeft = menuOffset.left,
                            menuRight = menuLeft + menuWidth,
                            itemWidth = $item.outerWidth();

                    // calculate offset left of submenu
                    switch (dataAlign) {
                        case 'left':
                            if (left + subMenuWidth > menuRight)
                                left = menuRight - subMenuWidth;
                            break;

                        case 'center':
                            left = left + itemWidth / 2 - subMenuWidth / 2;

                            if (left < menuLeft)
                                left = menuLeft;
                            else if (left + subMenuWidth > menuRight)
                                left = menuRight - subMenuWidth;
                            break;

                        case 'right':
                            left = left + itemWidth - subMenuWidth;
                            if (left < 0)
                                left = 0;
                            break;

                        default:
                            if (this.options.direction === 'rtl') {
                                left = left + itemWidth - subMenuWidth;
                                if (left < menuLeft)
                                    left = menuLeft;
                            } else if (left + subMenuWidth > menuRight)
                                left = menuRight - subMenuWidth;
                            break;
                    }

                    // set submenu offset left
                    $submenu.offset({left: left});
                }

                // set decor offset
                if (this.options.dropdownDecor) {
                    $('.awemenu-decor', $submenu).offset({left: left + itemWidth / 2 - $('.awemenu-decor', $submenu).outerWidth() / 2});
                }

                // set submenu width
                $submenu.css('width', subMenuWidth);
            } else { // process for submenu in dropdown menu
                var opts = this.options,
                        $itemArrow = $('> a > .awemenu-arrow', $item),
                        orientation = $submenu.attr('data-orientation'),
                        itemWidth = $item.outerWidth(),
                        left = itemOffset.left,
                        arrowClass;

                // remove arrows class
                $itemArrow.removeClass(opts.arrows.up + ' ' + opts.arrows.down + ' ' + opts.arrows.left + ' ' + opts.arrows.right + ' ' + opts.arrows.mobileClose);

                // process vertical align
                this._processSubMenuVerticalAlign($item, $mainMenu, false);

                // process width and horizontal align for submenu
                switch (orientation) {
                    case 'left':
                        arrowClass = opts.arrows.left;
                        if (opts.direction === 'ltr') {
                            $item.addClass('awemenu-invert');
                            $submenu.css('width', subMenuWidth);
                        }
                        break;

                    case 'right':
                        arrowClass = opts.arrows.right;
                        if (opts.direction === 'rtl') {
                            $item.addClass('awemenu-invert');
                            $submenu.css('width', subMenuWidth);
                        }
                        break;

                    default:
                        arrowClass = this._processDropDownSubMenu($item);
                        break;
                }

                // add arrow class
                $itemArrow.addClass(arrowClass);
            }
        },
        initEdgeSubMenu: function ($item) {
            var opts = this.options,
                    $mainMenu = $('.awemenu-container', this.$el),
                    $itemArrow = $('> a > .awemenu-arrow', $item);

            // remove arrows class
            $itemArrow.removeClass(opts.arrows.up + ' ' + opts.arrows.down + ' ' + opts.arrows.left + ' ' + opts.arrows.right + ' ' + opts.arrows.mobileClose);

            // process vertical align
            this._processSubMenuVerticalAlign($item, $mainMenu, false);

            // add arrow class
            var arrowClass = this._processDropDownSubMenu($item);
            $itemArrow.addClass(arrowClass);
        },
        _processDropDownSubMenu: function ($item) {
            var ww = $(window).outerWidth(),
                    opts = this.options,
                    $mainMenu = $('.awemenu-container', this.$el),
                    menuOffset = $mainMenu.offset(),
                    menuWidth = $mainMenu.outerWidth(),
                    itemOffset = $item.offset(),
                    itemWidth = $item.parent().data('real-width') !== undefined ? $item.parent().data('real-width') : $item.parent().outerWidth(),
                    $submenu = $('> .awemenu-submenu', $item),
                    isMegaMenu = $submenu.hasClass('awemenu-megamenu'),
                    parentInverted = $item.parents('.awemenu-item:first').hasClass('awemenu-invert'),
                    isLeftMenu = $.inArray(opts.type, ['left', 'outleft']) > -1,
                    isRightMenu = $.inArray(opts.type, ['right', 'outright']) > -1,
                    subMenuWidth = this.getSubMenuWidth($submenu, (isLeftMenu || isRightMenu)),
                    alignLeft = (opts.direction === 'rtl' && !parentInverted && !isLeftMenu) || (isLeftMenu && parentInverted) || (opts.direction === 'ltr' && parentInverted) || (isRightMenu && !parentInverted),
                    rightCompareVal = isMegaMenu && !isLeftMenu ? menuOffset.left + menuWidth : ww,
                    leftCompareVal = isMegaMenu && !isRightMenu ? menuOffset.left : 0,
                    maxRightWidth = rightCompareVal - (itemOffset.left + itemWidth),
                    maxLeftWidth = itemOffset.left - leftCompareVal,
                    inverted = false,
                    arrowClass;

            if (alignLeft) { // process for default align left
                arrowClass = opts.arrows.left;

                // check invert submenu to align left
                if (itemOffset.left - subMenuWidth < leftCompareVal) {
                    if (maxRightWidth > maxLeftWidth) {
                        inverted = true;
                        arrowClass = opts.arrows.right;
                        // check submenu width
                        if (subMenuWidth > maxRightWidth)
                            subMenuWidth = maxRightWidth;
                    } else
                        subMenuWidth = maxLeftWidth;
                }
            } else { // process for default align right
                arrowClass = opts.arrows.right;

                // check invert to align left
                if (itemOffset.left + itemWidth + subMenuWidth > rightCompareVal) {
                    if (maxLeftWidth > maxRightWidth) {
                        inverted = true;
                        arrowClass = opts.arrows.left;
                        // check submenu width
                        if (subMenuWidth > maxLeftWidth)
                            subMenuWidth = maxLeftWidth;
                    } else {
                        subMenuWidth = maxRightWidth;
                    }
                }
            }

            // set submenu width
            $submenu.data('real-width', subMenuWidth);
            $submenu.css('width', subMenuWidth);

            // set submenu position
            if ((inverted && !parentInverted) || (parentInverted && !inverted))
                $item.addClass('awemenu-invert');

            return arrowClass;
        },
        _processSubMenuVerticalAlign: function ($item, $mainMenu, edgeMenu) {
            var $submenu = $('> .awemenu-submenu', $item),
                    offset = $item.offset(),
                    menuTop = $mainMenu.offset().top,
                    opts = this.options,
                    align = $submenu.attr('data-align') ? $submenu.attr('data-align') : false,
                    top = 0,
                    topCompare = (edgeMenu || opts.type == 'bottom') ? 0 : menuTop + $mainMenu.height();

            // callback process position submenu for bottom type
            function _processBottomSubmenu() {
                if (opts.type === 'bottom') {
                    var bottom = $item.height() / 2 - $submenu.height() / 2;
                    if (offset.top + $item.height() / 2 + $submenu.height() / 2 > menuTop) {
                        bottom = offset.top + $item.height() - menuTop;
                    }
                    $submenu.offset({bottom: bottom});
                }
            }

            //set position middle for menu
            switch (align) {
                case 'top':
                    if (opts.type === 'bottom')
                        _processBottomSubmenu();
                    break;

                case 'middle':
                    if (opts.type === 'bottom')
                        _processBottomSubmenu();
                    else {
                        top = offset.top + $item.height() / 2 - $submenu.height() / 2;
                        if (top < topCompare)
                            top = topCompare - offset.top;
                        $submenu.offset({top: top});
                    }
                    break;

                case 'bottom':
                    if (opts.type !== 'bottom') {
                        top = offset.top + $item.height() - $submenu.height();
                        if (top < topCompare)
                            top = topCompare - offset.top;
                        $submenu.offset({top: top});
                    }
                    break;
            }
        },
        initMobileSubMenu: function ($item) {
            var $itemArrow = $('> a > .awemenu-arrow', $item),
                    $subMenu = $('> .awemenu-submenu', $item),
                    opts = this.options;

            // remove arrows class
            $itemArrow.removeClass(opts.arrows.up + ' ' + opts.arrows.down + ' ' + opts.arrows.left + ' ' + opts.arrows.right + ' ' + opts.arrows.mobileClose);

            if ($subMenu.length)
                $itemArrow.addClass(opts.arrows.down);
        },
        onDocumentClick: function (event) {
            var isActivated = this.$el.hasClass('awemenu-active') || $('.awemenu-active', this.$el).length,
                    desktopCondition = (!this.isMobile && !$(event.target).closest('#' + this.menuID + ' ul.awemenu').length && !$(event.target).closest('#' + this.menuID + ' .awemenu-bars').length),
                    mobileCondition = (this.isMobile && !$(event.target).closest('#' + this.menuID).length);

            if (isActivated && (desktopCondition || mobileCondition)) {
                this.resetMenu(event);
            }
        },
        onResize: function (event) {
            var _self = this,
                    ww = window.innerWidth;

            // detect device mode
            this.detectDevice();

            if (ww != this.ww || _self.isFirst) {
                this.ww = ww;

                // re-calculate custom width
                if (this.resizeTimeout)
                    clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(function () {
                    // reset menu
                    _self.resetMenu(event);
                    _self.initMenuItems();
                    _self.calculateStickyOffset();
                    $(window).trigger('scroll', event);
                    _self.resizeTimeout = 0;
                }, 200);
            }
        },
        onScroll: function (event) {
            var _self = this,
                    opts = this.options,
                    scrollTop = $(window).scrollTop(),
                    stickyClass = opts.stickyWhenScrollUp ? 'awemenu-stickyup' : 'awemenu-sticky',
                    stickyEnabled = opts.sticky || opts.onePageMode,
                    desktopCondition = stickyEnabled && $.inArray(opts.type, ['outleft', 'outright', 'standard']) > -1 && !this.isMobile,
                    mobileCondition = stickyEnabled && $.inArray(opts.mobileType, ['outleft', 'outright', 'standard']) > -1 && this.isMobile;

            this.stickyClass = stickyClass;

            // process sticky menu classes
            if ((scrollTop - this.stickyOffset > 0) && (desktopCondition || mobileCondition)) {
                if (!this.stickyActivated || event.type === 'resize') {
                    // add sticky replacer
                    if (!this.stickyReplacer && this.$el.css('position') !== 'absolute') {
                        this.stickyReplacer = $('<div class="awemenu-scticky-replacer"></div>').height(this.$el.outerHeight()).attr('id', this.stickyReplacerID);
                        this.$el.before(this.stickyReplacer);
                    }

                    // set position for menu by sticky offset
                    this.$el.css({top: 0, "z-index": 999999});

                    // add sticky class
                    this.addMenuClasses(stickyClass);
                    this.stickyActivated = true;

                    // set max-height for menu
                    if (this.isMobile && $.inArray(this.options.mobileType, ['outleft', 'outright']) === -1)
                        this.setMenuMaxHeight();
                }

                // check scroll up
                if (opts.stickyWhenScrollUp) {
                    if (scrollTop < this.prevScroll) {
                        this.$el.addClass('awemenu-scrollup');
                    } else {
                        this.$el.removeClass('awemenu-scrollup');
                    }
                }
            } else if (scrollTop - this.stickyOffset <= 0) {
                if (this.stickyActivated || event.isTrigger === 'resize') {
                    // remove sticky replacer
                    $('#' + this.stickyReplacerID).remove();
                    this.stickyReplacer = null;

                    // remove width in containter
                    //$('.awemenu-container', _self.$el).width('');

                    // remove sticky class
                    this.removeMenuClasses(stickyClass);
                    this.$el.css('top', '');
                    this.stickyActivated = false;

                    // reset max-height for menu
                    this.setMenuMaxHeight(true);
                }
            }

            // save scroll position
            this.prevScroll = scrollTop;
        },
        activateSubMenu: function ($item) {
            var _self = this,
                    hideTimeout = $item.data('hide-timeout'),
                    $subMenu = $('> .awemenu-submenu', $item);

            // clear hide timeout
            if (hideTimeout)
                clearTimeout(hideTimeout);

            // call custom callback before active menu item
            this.options.beforeActivate($item, this);

            // disable show default item
            if (this.$showDefaultItem)
                this.$showDefaultItem.removeClass('awemenu-default-item');

            // deactive others item
            $('.awemenu-item.awemenu-active', _self.$el).data('parent-active', false);
            $item.parents('.awemenu-item').data('parent-active', true);
            
            // remove class ac_hover when parent not have class awemenu-active
            $('.awemenu-item:not(.awemenu-active) > .ac_hover', _self.$el).removeClass('ac_hover');

            // show submenu item
            if ($subMenu.length && this.options.enableAnimation && !this.isMobile && this.options.type !== 'fullscreen') {
                // reset submenu z-index
                $subMenu.css({'z-index': '', display: ''});

                var animationShowTimeout = setTimeout(function () {
                    $item.addClass('awemenu-active');
                    if(_self.options.trigger != 'hover')
                        $item.find('> a').addClass('ac_hover');
                    $item.data('show-timeout', false);
                }, 30);

                $item.data('show-timeout', animationShowTimeout);
            } else {
                $item.addClass('awemenu-active');
                if($subMenu.length)
                     $subMenu.css({'z-index': '', display: ''});
                if(this.options.trigger != 'hover')
                    $item.find('> a').addClass('ac_hover');
            }

            // implements active menu item on mobile
            if (this.isMobile || this.options.type === 'fullscreen') {
                var arrows = this.options.arrows;

                $subMenu.css('display', 'none');
                $subMenu.slideDown(this.options.mobileAnimationDuration);
                $('> a > .awemenu-arrow', $item).removeClass(arrows.down).addClass(arrows.mobileClose);
            }

            // deactivate others active item
            $('.awemenu-item.awemenu-active', _self.$el).each(function () {
                if (!$(this).data('parent-active') && !$(this).is($item)) {
                    // clear timeout to play animation show
                    if (_self.options.enableAnimation) {
                        clearTimeout($(this).data('show-timeout'));
                        $item.data('show-timeout', false);
                    }
                    _self.deactivateSubMenu($(this));
                }
            });

            // implements custom active function
            this.options.activate($item, this);

            // create event active menu item
            this.$el.trigger('aweMenuItemActivated', [$item, this]);
        },
        deactivateSubMenu: function ($item) {
            var durationData = parseInt($('> .awemenu-submenu', $item).attr('data-duration')),
                    duration = !isNaN(durationData) ? durationData : this.options.defaultDesktopAnimationDuration,
                    $subMenu = $('> .awemenu-submenu', $item);

            // implements custom event before deactive menu item
            this.options.beforeDeactivate($item, this);

            if (this.isMobile || this.options.type === 'fullscreen') {
                var arrows = this.options.arrows;

                if ($subMenu.length) {
                    $subMenu.slideUp(this.options.mobileAnimationDuration, function () {
                        $item.removeClass('awemenu-active').find('> a').removeClass('ac_hover');
                    });
                    $('> a > .awemenu-arrow', $item).removeClass(arrows.mobileClose).addClass(arrows.down);
                }
            } else {
                var _self = this,
                        hideTimeout;

                if ($subMenu.length) {
                    // hide submenu item
                    $item.removeClass('awemenu-active').find('> a').removeClass('ac_hover');

                    hideTimeout = setTimeout(function () {
                        if (_self.options.trigger === 'click' || $item.data('hover-out')) {
                            // set z-index submenu is lower than others
                            $subMenu.css({'z-index': -1, 'display': 'none'});
                            $item.data('hide-timeout', false);
                        }

                    }, duration);
                    $item.data('hide-timeout', hideTimeout);
                } else
                    $item.removeClass('awemenu-active').find('> a').removeClass('ac_hover');
            }

            // implements custom callback
            this.options.deactivate($item, this);

            // create event active menu item
            this.$el.trigger('aweMenuItemDeactivated', [$item, this]);
        },
        addMenuClasses: function (classes) {
            var _self = this;

            // callback to add class to list classes
            function addClass(className) {
                if ($.inArray(className, _self.classes) === -1)
                    _self.classes.push(className);
            }

            if ($.type(classes) === 'string') {
                addClass(classes);
            } else if ($.type(classes) === 'array') {
                $.each(classes, function () {
                    addClass(this);
                });
            }

            // add classes to element
            this.$el.addClass(this.classes.join(' '));
        },
        removeMenuClasses: function (removeClasses) {
            var _self = this;

            // callback to remove class from list menu classes
            function removeClass(className) {
                var index = $.inArray(className, _self.classes);
                if (index > -1) {
                    _self.classes.splice(index, 1);
                }
                _self.$el.removeClass(className);
            }

            switch ($.type(removeClasses)) {
                case 'array':
                    $.each(removeClasses, function () {
                        removeClass(this);
                    });
                    break;

                case 'string':
                    removeClass(removeClasses);
                    break;
            }
        },
        setMenuMaxHeight: function (reset) {
            var menuHeight = this.$el.height(),
                    wh = $(window).height();

            if (!reset)
                $('ul.awemenu', this.$el).css('max-height', wh - menuHeight);
            else
                $('ul.awemenu', this.$el).css('max-height', '');
        },
        getMenuIndex: function () {
            if (!this.menuIndex)
                this.menuIndex = $('.awemenu-nav').index(this.$el) + 1;
            return this.menuIndex;
        },
        getSubMenuWidth: function ($submenu, isEdgeMenu) {
            var width = $submenu.data('width'),
                    nativeWidth = $submenu.outerWidth(),
                    $mainMenu = isEdgeMenu ? $('ul.awemenu', this.$el) : $('.awemenu-container', this.$el),
                    menuWidth = $mainMenu.outerWidth();

            if (isEdgeMenu) {
                if ($.inArray(this.options.type, ['left', 'outleft']) > -1) {
                    menuWidth = $(window).outerWidth() - ($mainMenu.offset().left + $mainMenu.outerWidth());
                } else
                    menuWidth = $mainMenu.offset().left;
            }

            switch ($.type(width)) {
                case 'string':
                    if (!isNaN(parseInt(width))) {
                        if (width.indexOf('%') > -1)
                            if (parseInt(width) < 100) {
                                width = Math.round(parseInt(width) * menuWidth / 100);
                            } else {
                                width = menuWidth
                            }
                        else
                            width = parseInt(width);
                    } else
                        width = nativeWidth;
                    break;

                case 'number':
                    break;

                default:
                    if (!isEdgeMenu || !$submenu.hasClass('awemenu-megamenu'))
                        width = nativeWidth;
                    else {
                        width = menuWidth
                    }
                    break;
            }

            return width;
        },
        initOnePageMode: function () {
            var _self = this,
                    lastScroll = 0;

            $.each(this.anchors, function (index) {
                var aweOnePageMenu = function (direction) {
                    var scrollTop = $(window).scrollTop() + _self.height + _self.options.onePageSettings.offset,
                            anchor = _self.anchors[index][0];

                    if ($(anchor).length && !_self.scrollByClick) {
                        var anchorTop = $(anchor).offset().top,
                                anchorBottom = anchorTop + $(anchor).outerHeight();

                        if (anchorTop <= scrollTop && scrollTop <= anchorBottom) {
                            switch (direction) {
                                case 'up':
                                    _self.anchors[index][1].addClass('awemenu-anchor-active');
                                    if (_self.anchors[index + 1])
                                        _self.anchors[index + 1][1].removeClass('awemenu-anchor-active');
                                    break;

                                case 'down':
                                    _self.anchors[index][1].addClass('awemenu-anchor-active');
                                    if (_self.anchors[index - 1])
                                        _self.anchors[index - 1][1].removeClass('awemenu-anchor-active');
                                    break;

                                default:
                                    _self.anchors[index][1].addClass('awemenu-anchor-active');
                                    break
                            }

                            $.each(_self.anchors, function (id) {
                                if (_self.anchors[id][0] !== anchor)
                                    _self.anchors[id][1].removeClass('awemenu-anchor-active')
                            });
                        }
                    }
                }

                // call function for first init
                aweOnePageMenu();

                // Handle window scroll event
                $(window).scroll(function (event) {
                    var scrollTop = $(this).scrollTop() + _self.height + _self.options.onePageSettings.offset,
                            direction = 'down';

                    if (scrollTop < lastScroll)
                        direction = 'up';
                    lastScroll = scrollTop;
                    aweOnePageMenu(direction);
                });
            });
        },
        changeWindowURL: function (basePath, hash) {
            if (this.options.onePageSettings.changeHashURL) {
                // change window url
                if (typeof (history.replaceState) !== undefined)
                    history.replaceState(null, null, hash);
                else
                    window.location.hash = basePath + hash;
            }
        },
        calculateStickyOffset: function () {
            this.removeMenuClasses(this.stickyClass)
            var stickyOffset = parseInt(this.options.stickyOffset);

            if (isNaN(stickyOffset)) {
                stickyOffset = 0;
                var stickyCheck = this.options.stickyOffset.split('|');
                for (var i = 0; i < stickyCheck.length; i++) {
                    if ($(stickyCheck[i]).length) {
                        stickyOffset = $(stickyCheck[i]).offset().top + $(stickyCheck[i]).height();
                        break;
                    }
                }
            } else {
                stickyOffset += this.$el.offset().top;
            }

            this.stickyOffset = stickyOffset;
        }
    }

    $.fn.aweMenu = function (options) {
        var args = Array.prototype.slice.call(arguments, 1),
                returnValue = this;

        this.each(function () {
            var $el = $(this),
                    menu = $el.data('awe-menu');

            switch ($.type(options)) {
                case 'string':
                    var methods = ['option', 'destroy'];

                    if (menu) {
                        if ($.inArray(options, methods) > -1) {
                            switch (options) {
                                case 'option':
                                    var opts = {};

                                    if ($.type(args[0]) == 'object') {
                                        opts = args[0];
                                        menu.setOption(opts);
                                    } else if ($.type(args[0]) == 'string') {
                                        if (args[1] !== undefined) {
                                            opts[args[0]] = args[1];
                                            menu.setOption(opts);
                                        } else
                                            returnValue = menu.getOption(args[0]);
                                    } else if (args[0] === undefined) {
                                        returnValue = menu.getOption();
                                    }
                                    break;

                                case 'destroy':
                                    menu.destroy();
                                    break;
                            }
                        } else
                            throw Error('Error: method "' + options + '" does not exist on aweMenu');
                    } else
                        throw Error('Error: cannot call methods on awrMenu prior to initialization;');
                    break;

                case 'object':
                    if (menu)
                        menu.setOption(options);
                    else {
                        menu = new AWEMenu($el, options);
                        $el.data('awe-menu', menu);
                    }
                    break;
                default:
                    if (!menu) {
                        menu = new AWEMenu($el, {});
                        $el.data('awe-menu', menu);
                    }
                    break;
            }
        });
        return returnValue;
    }
})(jQuery);