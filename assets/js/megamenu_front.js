// fix for mobile, script run before page loaded completely
function fix_megamenu_flashing_on_mobile(){
    var $ = jQuery,
        window_width = $(window).width();
    $('.js-awemenu-nav-front').each(function(key, item){
        var $navigation= $(item),
            settings = $navigation.attr('data-settings');
        settings = $.parseJSON(settings);
        if(settings.enable_mobile){
            var responsiveWidth = settings.responsive_width ? parseInt(settings.responsive_width) : 768;
            if(window_width <= responsiveWidth){
                var type = settings.type || 'standard',
                    mobileType = settings.m_type || 'standard';
                $navigation.addClass('awemenu-mobile awemenu-mobile-' + mobileType).removeClass('awemenu-' + type);
                if(!$('.awemenu-bars', $navigation).length)
                    $navigation.find('> .awemenu-container').prepend('<div class="awemenu-bars"><span class="amm-bar"></span></div>');
            }
            // remvoe class awemenu-fix-mobile with all screen mode
            $navigation.removeClass('awemenu-fix-mobile');
        }
    });
}
//end fix mobile

(function($){
    $(document).ready(function(){
        $('.js-awemenu-nav-front').each(function(key, item){
            var $navigation= $(item),
                settings = $navigation.attr('data-settings');
            settings = $.parseJSON(settings); //console.log(settings);
            var awemenuSettings = {
                trigger: settings.trigger_override || 'hover',
                direction:settings.direction || 'ltr',  
                style: "awemenu-" + (settings.skin || 'default'),
                type: settings.type || 'standard',
                hoverDelay: settings.hover_time ? parseInt(settings.hover_time) : 0,
                sticky:settings.enable_sticky ? true : false,
                stickyOffset:settings.sticky_offset ? parseInt(settings.sticky_offset) : 0,
                stickyWhenScrollUp: settings.show_scroll_up ? true : false,
                enableAnimation : (settings.animation_type == 'none')? false:true,
                defaultDesktopAnimation:(settings.animation_type !== 'none') ? settings.animation_type : '',
                onePageMode: false,
      //          onePageSettings: {
      //            offset:,
      //            scrollSpeed:,
      //            changeHashURL:
      //          },
                defaultDesktopAnimationDuration: settings.animation_duration ? parseInt(settings.animation_duration) : 300,
                responsiveWidth:settings.responsive_width ? parseInt(settings.responsive_width) : 768,
                mobileTrigger: settings.mobile_trigger || 'click',
                enableMobile :settings.enable_mobile ? true : false,
                mobileType: settings.m_type || 'standard',
                mobileAnimationDuration: settings.mobile_animation_duration ? parseInt(settings.mobile_animation_duration) : 500,
                customMenuBar:'<span></span><span></span><span></span><span></span>',
                customCloseButton:'',
                dropdownDecor:'',                    
                showArrow:settings.enable_arrow_desktop ? true : false,
                showMobileArrow:settings.enable_arrow_mobile ? true : false,
                arrows: {up: "amm-up", down: "amm-down", left: "amm-left", right: "amm-right", mobileClose: "amm-clear"},
                activate:function($item, menu){
                  // show gmap if exist
      //            var gmapItems = $item.find("> .awemenu-submenu .awe-gmap").each(function(){
      //                $(this).mdGMap();
      //            });
      //
      //            // set height if there attribute data-equal-row-height =1
      //            $item.find("[data-equal-row-height]:not(.awe-equal-column)").processEqualRowHeightRender();
      //
      //            // set animation shortcode
      //            $item .find("[data-animation]:not(.awemenu-submenu)").each(function(){
      //              var data = $(this).data("animation");
      //              $(this).addClass(data.type + " animated");
      //              $(this).mdProcessAnimation();
      //            });                                
                },
                beforeDeactivate:function($item, menu){
      //            $item .find("[data-animation]:not(.awemenu-submenu)").each(function(){
      //              var data = $(this).data("animation");
      //              $(this).removeClass(data.type + " animated");
      //            });
                },
                ready: function(menu) {
                    $("li.has-custom-animation, li.has-custom-duration", $navigation).each(function(){
                        var $item = $(this);
                        if($item.hasClass('has-custom-animation')){
                            $item.removeClass('awemenu-' + settings.animation_type + ' has-custom-animation');
                        }
                        if($item.hasClass('has-custom-duration')){
                            $item.find('> .awemenu-submenu').css('transition-duration', $item.attr('data-duration'));
                            $item.removeAttr('data-duration').removeClass('has-custom-duration');
                        }
                    });
                    
                    if($('.awemenu-nav .set-active').length){
                        $('.awemenu-nav .set-active:last > a').addClass('is-active');
                        $('.awemenu-nav .set-active').removeClass('set-active');
                    } 
                    var $currentItem = $('.awemenu > .awemenu-item.show-submenu-current a[data-drupal-link-system-path="'  + drupalSettings.path.currentPath +'"]:first',$navigation);
                    $('.awemenu > .awemenu-item a.is-active:first',$navigation).addClass('ac_active');
                    if($currentItem.length){
                        $currentItem.parent().addClass('awemenu-active');
                        $currentItem.next('.awemenu-submenu').show();
                    }else{
                        $('.awemenu > .awemenu-item.show-submenu-default:first',$navigation).addClass('awemenu-active').find('> .awemenu-submenu').show();
                    }
                }
              };
             
            $navigation.aweMenu(awemenuSettings);
            //fix z-index contextual link
            var contextula_css = {'z-index' : 9999999};
            if(settings.type == 'top'){
                contextula_css.position = 'fixed';
            }
            $navigation.parent().find('> div[data-contextual-id]').css(contextula_css);
        });
    });
})(jQuery);