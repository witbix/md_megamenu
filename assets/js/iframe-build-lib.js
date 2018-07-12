(function ($) {
    /* 
     * align hoz submenu 
     * $('.awemenu-submenu').alignSubmenu()
     */
    $.fn.alignSubmenu = function(model,align, has_aimation){
        if(!this.length){
            return false;
        }
        
        var self = this, data,
            navSettings = AweBuilderSettings.contentBuilder.getRealSettings(),
            box_menu_type = navSettings.main.type,
            _$ = AweBuilder._jQuery;
        
        if(model){
            data = model.toJSON();
            if(data.level == '1')
                data.realSettings = model.getRealSettings();
        }
        else
            data = $.parseJSON(this.parent().data('datamenu'));
       
        if(data.level == '1'){            
            this.css({'left':'', 'right':''});
            if(box_menu_type == 'standard' || box_menu_type == 'top' || box_menu_type == 'bottom'){
                if(data && !align){
                    align = data.realSettings.submenu.horizontal_align;
                } 
                
                var is_animation = (has_aimation) ? has_aimation : false, duration = this.css('transition-duration');
                this.css('transition-duration','0s');
                if(_$('.awemenu-nav').hasClass('awemenu-animation')){
                    _$('.awemenu-nav').removeClass('awemenu-animation');
                    is_animation = true;
                }
                
                var menu_offset = _$('.awemenu-nav .awemenu-container').offset(),
                    menubar_width = _$('.awemenu-nav .awemenu-container').width(),            
                    li_parent_offset =this.parent().offset(),
                    dropdown_offset = this.offset(),
                    dropdown_width = this.attr('data-width');
                var li_parent_width = this.parent().width();
                // fix not get true width by duration                
                if(!dropdown_width)
                    dropdown_width = this.outerWidth();
                else
                    dropdown_width = parseInt(dropdown_width);
                
                // fix error not offset
                if(li_parent_offset.left == 0 && li_parent_offset.top ==0){
                    setTimeout(function(){
                        self.alignSubmenu(model, align, is_animation);
                    },100);
                    return false;
                }
                if(dropdown_offset.left == 0){
                    this.css('opacity',0).show();
                    dropdown_offset = this.offset();
                    this.css({'opacity':''});
                }                
                var left_menubar_width = li_parent_offset.left - menu_offset.left,
                    right_menubar_width =  menubar_width - left_menubar_width - li_parent_width;   
                var left_submenu,  right_submenu;            
               
                if(data.level == '1' && dropdown_width >= menubar_width && (box_menu_type === 'standard' || box_menu_type === 'top' || box_menu_type === 'bottom')){           
                    left_submenu = left_menubar_width;
                    self.css({'left':'-'+left_submenu+'px','right':'auto'});
                } else {
                    if(!align){
                        // align default
                        align = (navSettings.main.direction === 'ltr')?'align-left':'align-right';
                        self.removeClass('align-left align-right').addClass(align);
                    }
                    
                    switch(align){
                       case 'align-left':               
                           var dropdown_width_auto = right_menubar_width + li_parent_width;
                           if(dropdown_width > dropdown_width_auto){
                               right_submenu = right_menubar_width;
                               self.css({'right':'-'+right_submenu+'px','left':'auto'});
                           }
                           break;
                       case 'align-right':
                           if(dropdown_offset.left < menu_offset.left){
                               left_submenu = left_menubar_width;
                               self.css({'left':'-'+left_submenu+'px','right':'auto'});
                           }
                           break;
                       case 'align-center':
                           var submenu_width = dropdown_width + 10,
                                left_submenu = (submenu_width - li_parent_width)/2;

                            if(left_submenu > left_menubar_width){
                                left_submenu = left_menubar_width;
                            }

                            if(left_submenu <= left_menubar_width && left_submenu <= right_menubar_width){
                                self.css('left','-'+left_submenu+'px');
                            }
                            else if(left_submenu > right_menubar_width){
                                right_submenu = right_menubar_width;
                                self.css({'right':'-'+right_submenu+'px','left':'auto'});
                            }
                           break;
                    }
                }
                if(duration != undefined && parseFloat(duration) > 0){
                    this.css('transition-duration', duration);
                } else{
                    this.css('transition-duration','');
                }
                if(is_animation){
                    _$('.awemenu-nav').addClass('awemenu-animation');
                }
            }
        }
        
    };
    
    $.fn.alignVerticalSubmenu = function(position,level){
        if(!this.length){
            return false;
        }
        
        this.css({top:'',bottom:''});        
        var _self = this,
            _$ = AweBuilder._jQuery,
            navSettings = AweBuilderSettings.contentBuilder.getRealSettings(),
            awemenu_offset =  _$('ul.awemenu').offset(),
            awemenu_height = _$('ul.awemenu').height(),
            menuType = navSettings.main.type;
    
        // check position top of submenu
        function checkLimitPostion(option){
            var submenu_offset= _self.offset(), limit_top, current_top, submenu_height, is_reset = 0;
            if(level > 1 && (menuType == 'standard' || menuType == 'top')){
                limit_top = awemenu_offset.top + awemenu_height;                
            }
            else if($.inArray(menuType,['left','right','outleft','outright']) >= 0)
                limit_top = 23;
            else if(level > 1 && menuType == 'bottom'){  
                if(option && option.submenu_height)
                    submenu_height = option.submenu_height;
                else
                    submenu_height = _self.outerHeight();
                if((submenu_offset.top + submenu_height) > awemenu_offset.top)
                    is_reset = 1;
                else if(submenu_offset.top < 23)
                    is_reset = 2;
            }
                    
            if((limit_top && menuType != 'bottom' && submenu_offset.top <= limit_top) || (menuType == 'bottom' &&  is_reset > 0)){ 
                var parent_offset = _self.parent().offset();
                if(menuType == 'bottom'){
                    var current_bottom;
                    if(is_reset == 1){
                        current_bottom = awemenu_offset.top - parent_offset.top - _self.parent().height();
                        _self.css({top:'auto','bottom':'-'+current_bottom+'px'});
                    } else {
                        var submenu_position = _self.position();
                        if(submenu_position && submenu_position.top){
                            if(submenu_position.top < 0){
                                current_top = submenu_position.top - submenu_offset.top + 23;
                                _self.css({bottom:'auto',top:current_top+'px'});
                            }
                        }
                    }
                }
                else{
                    current_top = parent_offset.top - limit_top ;
                    _self.css({'top':'-'+current_top+'px'});
                }                
                if(position=='align-bottom')
                    _self.css({'bottom':'auto'});
                return true;
            }
            return false;
        }
        
        function setMiddle(){
            if(!(level == '1' && $.inArray(menuType,['top','standard','bottom']) >=0)){                
                var submenu_height = _self.outerHeight(),
                parent_height = _self.parent().height(),
                position_top = (submenu_height - parent_height)/2;
                _self.css({'top':'-'+position_top+'px'});               
                var is_reset = checkLimitPostion({submenu_height:submenu_height});
                if((!is_reset && menuType == 'bottom') || position=='align-bottom')
                    _self.css({'bottom':'auto'});
            }
        }
        
        switch(position){
            case 'align-top':
               checkLimitPostion();
               break;
            case 'align-bottom': 
               if(!(level == '1' && $.inArray(menuType,['top','standard','bottom']) >=0)){ 
                    _self.css({top:'auto',bottom:'0px'});
                }
               checkLimitPostion();
               break;
            case 'align-middle': 
                if(_self.outerHeight()){setMiddle();}
                else {
                    setTimeout(function(){
                        setMiddle();
                    },50); 
                }
               break;
        }
    };
    
    $.fn.alignVerticalSubmenuChildAll = function(){
        this.find('.awemenu-submenu').each(function(){
            var datamenu = $.parseJSON($(this).parent().data('datamenu')); 
            $(this).alignVerticalSubmenu(datamenu.realSettings.submenu.vertical_align, datamenu.level);
        });
    };
    
    /*
     *init width and position
     *
     */
    $.fn.initMegamenuPositionWidth = function(model,width){
        if(!this.length){
            return false;
        }
        
        var data;        
        if(model){
            data = model.toJSON();
            data.realSettings = model.getRealSettings();
        }
        else
            data = $.parseJSON(this.parent().data('datamenu')); 
               
        // reset arrow submenu
        this.resetArrowSubmenu(data);
        
        // set width megamenu
        this.setWidthMegamenuAuto(data,width); 
        
        // set position and width for submenu level 2 and more
        var hasModel = (model == null)?null:1;
        this.setPositionMegamenuAuto(data, hasModel);
    };
    
    /*
     * set width megamenu
     * @param {type} settings
     * @param {type} width
     * @returns {undefined}
     * selector : ul.awemenu-submenu
     */
    $.fn.setWidthMegamenuAuto = function(data,width){
        var navSettings = AweBuilderSettings.contentBuilder.getRealSettings(),
            mainSettings = data.realSettings,
            menuItemType = mainSettings.type;
            _$ = AweBuilder._jQuery;
    
        if(data){      
            if(!width){
                var setFullWidth, submenuWidth,
                    disable_width = false, submenu_fullwidth = 0,
                    dropdown_width = 250, mega_width = 600;
                if(mainSettings.submenu){
                    disable_width = mainSettings.submenu.disable_width || false;
                    submenu_fullwidth = mainSettings.submenu.submenu_fullwidth || false;
                    dropdown_width = mainSettings.submenu.dropdown_width || 250;
                    mega_width = mainSettings.submenu.mega_width || 600;
                }
                if(disable_width){
                    setFullWidth = (menuItemType == 'mega') ? submenu_fullwidth : 0;
                    submenuWidth = (menuItemType == 'mega') ? mega_width : dropdown_width;
                } else {
                    setFullWidth = (menuItemType == 'mega') ? navSettings.mega_submenu.fullwidth : 0;
                    submenuWidth = (menuItemType == 'mega') ? navSettings.mega_submenu.mega_width : navSettings.mega_submenu.dropdown_width;
                }
            
                if(!setFullWidth)
                    width = submenuWidth;
                else
                    width = 'fullwidth';
            }
        }
        
        var menu_offset = _$('.awemenu-nav .awemenu-container').offset(),
            menubar_width = _$('.awemenu-nav .awemenu-container').width(),            
            li_parent_offset =this.parent().offset(),
            megamenu_width, mega_width_auto, mega_width_reverse_auto;
        var li_parent_width = this.parent().width();
        var document_width = _$(document).width(),
            box_menu_type = navSettings.main.type,
            direction = navSettings.main.direction;
        
        this.css('width','');
        if(width && width !== 'fullwidth'){
            megamenu_width = parseInt(width);
        }
        
        if(data && menuItemType == 'mega'){
            if(this.hasClass('position-left-auto')){
                mega_width_auto =  li_parent_offset.left - menu_offset.left;
            }
            else {
                switch(box_menu_type){
                    case 'standard':
                    case 'top':
                    case 'bottom':
                        if(data.level == '1'){ //position-left-auto
                            mega_width_auto = menubar_width;
                        }
                        else{
                            if(direction == 'rtl'){
                                mega_width_auto = li_parent_offset.left - menu_offset.left;
                                mega_width_reverse_auto = menubar_width - (li_parent_offset.left - menu_offset.left) - li_parent_width;
                            } else {
                            mega_width_auto = menubar_width - (li_parent_offset.left - menu_offset.left) - li_parent_width;
                            mega_width_reverse_auto = li_parent_offset.left - menu_offset.left;
                            }
                            
                        }
                        
                        this.css('left','').css('right','');
                        break;
                    case 'left':
                        mega_width_auto = document_width - li_parent_offset.left - li_parent_width;
                        mega_width_reverse_auto = li_parent_offset.left - menu_offset.left;
                        break
                    case 'right':
                        mega_width_auto = li_parent_offset.left;
                        mega_width_reverse_auto = document_width - li_parent_offset.left - li_parent_width; //menubar_width - mega_width_auto - li_parent_width;
                        break;
                    case 'outleft':
                        mega_width_auto = document_width - li_parent_offset.left - li_parent_width;
                        //mega_width_auto = document_width - panel_width -li_parent_width;           
                        mega_width_reverse_auto = li_parent_offset.left;                        
                        break;
                    case 'outright':
                        mega_width_auto = li_parent_offset.left;
                        mega_width_reverse_auto = document_width - mega_width_auto - li_parent_width;
                        break;
                }
            }
           
            if(data.level == '1' && megamenu_width >= menubar_width && (box_menu_type == 'standard' || box_menu_type == 'top' || box_menu_type == 'bottom')){
                width = 'fullwidth';  
            }
            else if(megamenu_width > mega_width_auto)
                    megamenu_width = mega_width_auto;
            if(megamenu_width < 250)
                megamenu_width = width;
        }
        
        if(width === 'fullwidth' || megamenu_width > menubar_width) {
            if(data.level == '1' && (box_menu_type === 'standard' || box_menu_type === 'top' || box_menu_type === 'bottom')){
                megamenu_width = menubar_width;
            }else{
                if(mega_width_auto < 250 && mega_width_reverse_auto >= 250)
                    mega_width_auto = mega_width_reverse_auto;
                if(megamenu_width > mega_width_auto)
                    megamenu_width = mega_width_auto;
            }
        }        
                
        if(megamenu_width > 0){
            this.outerWidth(megamenu_width).attr('data-width',megamenu_width);
        }
        else if(menuItemType == 'mega'){
                this.outerWidth(mega_width_auto).attr('data-width',mega_width_auto);
            }
        
        if(data.level == '1' && width == 'fullwidth' && (box_menu_type == 'standard' || box_menu_type == 'top' || box_menu_type == 'bottom')){
            var left_view = li_parent_offset.left - menu_offset.left;
            this.css({'left':'-'+left_view+'px','right':'auto'});
        }
        
        var right_width_limit = document_width - (li_parent_offset.left + li_parent_width);
        var left_width_limit = li_parent_offset.left;
        
        if(this.hasClass('position-left-auto') && megamenu_width > left_width_limit && megamenu_width > right_width_limit){
            this.outerWidth(left_width_limit).attr('data-width',left_width_limit);
        }  
    };
    
    /*
     * set position submenu
     * @param {type} settings
     * @returns {undefined}
     * selector : ul.awemenu-submenu
     */
    $.fn.setPositionMegamenuAuto = function(data,hasModel){
        var self = this,
            navSettings = AweBuilderSettings.contentBuilder.getRealSettings(),
            _$ = AweBuilder._jQuery,
            mainSettings = data.realSettings,
            menuItemType = mainSettings.type,
            submenu_position = mainSettings.submenu.submenu_position;
        
        if(data.level > 1 && submenu_position == 'auto'){
            var box_menu_type = navSettings.main.type,
                direction = navSettings.main.direction;
            var menu_offset = _$('.awemenu-nav .awemenu-container').offset(),
                menubar_width = _$('.awemenu-nav .awemenu-container').width();  
                       
            var document_width = _$(document).width(),                
                dropdown_offset = this.offset(),
                dropdown_width = this.outerWidth(),
                scrollbar_width,
                left_limit,right_limit;
            
            if(dropdown_offset.top > 0 && (dropdown_offset.left !== 0 || box_menu_type === 'right')){
                var menu_level_1_width = _$('ul.awemenu').width();
                var menu_level_1_offset = _$('ul.awemenu').offset();
               
                switch(box_menu_type){
                    case 'bottom':                       
                    case 'standard':
                    case 'top':                    
                        if(parseInt(data.level) > 1){
                            scrollbar_width = dropdown_offset.left + dropdown_width - document_width; 
                            left_limit = 0;                       
                            if(menuItemType == 'mega'){
                                right_limit = menu_offset.left + menubar_width;
                                left_limit = menu_offset.left;
                            }
                        }else 
                            scrollbar_width = 0;                        
                        break;
                    case 'left':
                        scrollbar_width = dropdown_offset.left + dropdown_width - document_width;
                        left_limit = menu_offset.left + menu_level_1_width;                      
                        break;
                    case 'right':
                        left_limit = 0;
                        right_limit = menu_level_1_offset.left;
                        break;
                    case 'outleft':
                        scrollbar_width = dropdown_offset.left + dropdown_width - document_width; 
                        left_limit = menu_level_1_width;
                        break;
                    case 'outright':
                        left_limit = 0;
                        right_limit = menu_level_1_offset.left;
                        break;
                }
                
                if(scrollbar_width >0 || (right_limit > 0 && (dropdown_offset.left + dropdown_width) > right_limit)){
                    this.addClass('position-left-auto').removeClass('position-right-auto');
                    this.parent().find('> a .awemenu-arrow').removeClass('amm-down amm-up amm-right').addClass('amm-left');
                    if(direction === 'ltr')
                        this.parent().addClass('awemenu-invert');
                    else
                        this.parent().removeClass('awemenu-invert');
                }
                else if(left_limit >= 0 && dropdown_offset.left < left_limit){                        
                    this.addClass('position-right-auto').removeClass('position-left-auto');
                    this.parent().find('> a .awemenu-arrow').removeClass('amm-down amm-up amm-left').addClass('amm-right');
                    if(direction === 'rtl')
                        this.parent().addClass('awemenu-invert');
                    else
                        this.parent().removeClass('awemenu-invert');
                }
            }
        }
    };
    
    $.fn.resetAllSubmenuPosition = function(resetOptions){
        var $listSubmenu = this.find('ul.awemenu-submenu');
        if(!$listSubmenu.length)
            return false;
        
        var options = {
            active:1,
            resetWidthPosition:1,
            alignSubmenu:1,
            removePositionAuto:1
        };
        $.extend(options,resetOptions);
        
        var navSettings = AweBuilderSettings.contentBuilder.getRealSettings(),
            menuType = navSettings.main.type,
            _$ = AweBuilder._jQuery,
            is_animation = false;
    
        if(_$('.awemenu-nav').hasClass('awemenu-animation')){
            _$('.awemenu-nav').removeClass('awemenu-animation');
            is_animation = true;
        }
        //show submenu & remove duration to get position
        $listSubmenu.css({'opacity':'0', 'transition-duration': ''}).show();
        
        $listSubmenu.each(function(){
            var data = $.parseJSON($(this).parent().data('datamenu')),
                mainSettings = data.realSettings,
                horizontal_align = mainSettings.submenu.horizontal_align,
                vertical_align = mainSettings.submenu.vertical_align;
            
            if(menuType === 'standard' || menuType === 'top' || menuType === 'bottom'){
                //$(this).removeClass(vertical_align).addClass(horizontal_align).css('top','');               
            }else{                
                $(this).removeClass(horizontal_align).addClass(vertical_align).css('left','');
            }
            if(options.removePositionAuto)
                $(this).removeClass('position-left-auto position-right-auto').parent().removeClass('awemenu-invert');            
            if(options.resetWidthPosition){
                $(this).initMegamenuPositionWidth();
            }
            if(options.alignSubmenu && data.level < 2){
                $(this).alignSubmenu();
            }
            $(this).alignVerticalSubmenu(vertical_align, data.level);
        });
        
        //hide submenu
        $listSubmenu.css({display:''});
        
        //not show submenu active
        if(!options.active)
            _$('.awemenu-nav .awemenu .awemenu-active').removeClass('awemenu-active');
                
        // show menu active
        if(options.active){
            var activeMenu = _$('.awemenu-nav .awemenu .awemenu-active > .awemenu-submenu');
            if(!activeMenu.length)
                activeMenu = _$('.awemenu-nav .awemenu .js-active > .awemenu-submenu');   
            activeMenu.show();
        }
        
        // set opacity 
        _$('.awemenu-nav ul.awemenu-submenu').css('opacity',1);
        //add duration if menu item has it
        $listSubmenu.each(function(){
            if($(this).attr('data-duration')){
                $(this).css('transition-duration', $(this).attr('data-duration'));
            }
        });
        if(is_animation)
            _$('.awemenu-nav').addClass('awemenu-animation');
    };
    
    /* reset arrow submenu
     * 
     * @param {type} settings
     * @returns {undefined}
     * selector : ul.awemenu-submenu
     */
    $.fn.resetArrowSubmenu = function(data){        
        if(!this.hasClass('position-left-auto') && !this.hasClass('position-right-auto')){
            // reset arrow menu type default
            if(data){
                if($.type(data.settings) === 'string'){
                    data.settings = $.parseJSON(data.settings);
                }
                if(!data.settings.main || !data.realSettings || data.realSettings.type == 'normal'){
                    return;
                }
                
                var navSettings = AweBuilderSettings.contentBuilder.getRealSettings(),
                    mainSettings = data.realSettings,
                    direction = navSettings.main.direction,
                    menuItemType = mainSettings.type,
                    submenu_position = mainSettings.submenu.submenu_position,
                    box_menu_type =navSettings.main.type,
                    ul_parent = this.parent().parent(),
                    positionAuto;
                
                var arrow_select = this.parent().find('> a .awemenu-arrow');
                    
                // set arrow by position value
                if(submenu_position == 'auto'){
                    // set arrow when submenu position auto
                    if(!(data.level == '1' && (box_menu_type == 'standard' || box_menu_type == 'top' || box_menu_type == 'bottom'))){
                        if(box_menu_type == 'right' || box_menu_type == 'outright')
                            arrow_select.removeClass('amm-down amm-up amm-right').addClass('amm-left');
                        else if(box_menu_type == 'left' || box_menu_type == 'outleft'){
                            arrow_select.removeClass('amm-down amm-up amm-left').addClass('amm-right');
                            }
                         else{
                             // apply to h-menu
                            var remove_class = 'amm-down amm-up',
                                add_class = '';                            
                                if(direction === 'ltr'){
                                remove_class += ' amm-left'; add_class = 'amm-right';
                            }else{
                                remove_class += ' amm-right'; add_class = 'amm-left';
                            }
                            arrow_select.removeClass(remove_class).addClass(add_class);
                         }

                    }else{
                        if(box_menu_type == 'bottom')
                            arrow_select.removeClass('amm-down amm-right amm-left').addClass('amm-up');
                        else
                            arrow_select.removeClass('amm-up amm-right amm-left').addClass('amm-down');
                    }

                    // set arrow by position default
                    if(ul_parent.hasClass('position-left-auto') || ul_parent.hasClass('position-left')){
                        this.addClass('position-left-auto');
                        positionAuto = 'left';                        
                    } else if(ul_parent.hasClass('position-right-auto') || ul_parent.hasClass('position-right')){
                        this.addClass('position-right-auto');
                        positionAuto = 'right';                   
                    }
                }
                
                // menu vertical, not invert
                if(jQuery.inArray(box_menu_type, ['standard', 'top', 'bottom']) == -1 && submenu_position !== 'auto'){
                    if(box_menu_type == 'right' || box_menu_type == 'outright')
                        arrow_select.removeClass('amm-down amm-up amm-right').addClass('amm-left');
                    else if(box_menu_type == 'left' || box_menu_type == 'outleft')
                        arrow_select.removeClass('amm-down amm-up amm-left').addClass('amm-right');
                    this.parent().removeClass('position-left position-right');
                } else{
                    if(submenu_position !== 'auto')
                        this.removeClass('position-left position-right').addClass('position-'+submenu_position);
                    // add class invert
                    if(submenu_position === 'left' || positionAuto === 'left'){
                        arrow_select.removeClass('amm-down amm-up amm-right').addClass('amm-left');
                        if(direction === 'ltr')
                            this.parent().addClass('awemenu-invert');
                        else
                            this.parent().removeClass('awemenu-invert');
                    } else if(submenu_position === 'right' || positionAuto === 'right'){
                        arrow_select.removeClass('amm-down amm-up amm-left').addClass('amm-right');
                        if(direction === 'rtl')
                            this.parent().addClass('awemenu-invert');
                        else
                            this.parent().removeClass('awemenu-invert');
                    }
                }
            }
        }
    };
})(jQuery);