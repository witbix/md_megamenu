jQuery(document).ready(function ($) {
    var builder, $iframe, resetGoogleFont = true, $iframe_jquery;
    // callback to show node form
    function showNodeForm() {
        jQuery('body').removeClass('awecontent-active').find('.js-awecontent-wrapper').removeClass('awecontent-wrapper');
        jQuery('.awecontent-body-wrapper').children().show();
        // fix for toolbar
        jQuery('#toolbar, #admin-menu').show();
    }

    // callback to hide node form
    function disableNodeForm() {
        jQuery('body').addClass('awecontent-active').find('.js-awecontent-wrapper').addClass('awecontent-wrapper');
        jQuery('.awecontent-body-wrapper').children().hide();
        // fix for toolbar
        jQuery('#toolbar, #admin-menu').hide();
    }


    // main
    var pathConfigurations = jQuery('input[name=path_config]').val().trim();
    pathConfigurations = JSON.parse(pathConfigurations);
    jQuery.extend(AweBuilderSettings.URLs, pathConfigurations);
    // set skin url
    if(drupalSettings.path.baseUrl)
        AweBuilderSettings.skinURL = drupalSettings.path.baseUrl + 'modules/contrib/md_megamenu/assets/css/awemenu/themes';

    // Move all body children in to wrapper
    jQuery('body').append('<div class="awecontent-body-wrapper"></div>');
    jQuery('.awecontent-body-wrapper').append(jQuery('body').children(':not(.awecontent-body-wrapper, .sp-container)'));    

    // Handle click button to active page builder
    jQuery('.awe-btn-build').click(function(event) {
        event.preventDefault();
        //fix drupalSettings path load after builder
        if(!AweBuilderSettings.skinURL)
            AweBuilderSettings.skinURL = drupalSettings.path.baseUrl + 'modules/contrib/md_megamenu/assets/css/awemenu/themes';
        if(drupalSettings.megamenuSkin)
            AweBuilderSettings.megamenuSkin = drupalSettings.megamenuSkin;
        // update private font
        AweBuilderSettings.google_font = $('.awe-google-font').val();
        if (AweBuilderSettings.google_font) {
            var build_font_link = AweBuilderSettings.URLs.fonts;
            if ($.type(AweBuilderSettings.URLs.fonts) == 'string')
                AweBuilderSettings.URLs.fonts = {
                    url: build_font_link,
                    extraData: {google_font: AweBuilderSettings.google_font}
                };
            else
                AweBuilderSettings.URLs.fonts.extraData.google_font = AweBuilderSettings.google_font;
        }
        
        jQuery('body').addClass('awecontent-active');
        disableNodeForm();
        // hide button build from tempate when click button build
        $('.awe-btn-build-template').hide();
    });

    jQuery('body').prepend('<div class="js-awecontent-wrapper"></div>');
    //create builder
    var data = jQuery('#awe-page-content').val().trim();
    // hide button build from tempate
    if(data){
        $('.awe-btn-build-template').hide();
    }

    data = data ? JSON.parse(data) : {}; //console.log(data);

    builder =  new AweBuilder.Builder({
        content:data,
        wrapper: '.js-awecontent-wrapper',
        contentClass:'MenuBox',
        buildButtons: {
            defaultButton: '.awe-btn-build-normal',
            //fromTemplateButton: '.awe-btn-build-template'
        },
        onClose: function(builderData) {
            showNodeForm();
            if(builderData){
                jQuery('#awe-page-content').val(builderData);
                $('#awe-list-deleted-menu').val(AweBuilderSettings.listDeletedMenus.toString());
                $('.awe-mega-menu').submit();
            }
        },
        onReady:function($iframe){
            // remove button save template in toolbar botttom
            $('.js-save-page-tpl-btn').remove();
            //reset indent naavigator tab
            AweBuilderSettings.contentBuilder.setIndent(1);
            $iframe_jquery = $iframe[0].contentWindow.jQuery;
            // disable redirect link
            $iframe_jquery('a').click(function(event){
                if($(this).closest('.ac_element').length || $(this).closest('.ac_row').length){
                    return true;
                } else {
                    event.preventDefault();
                    return false;
                }
            });
            $iframe_jquery('body').addClass('ac_creating');
            $iframe_jquery('#toolbar-administration, .region-content, .awemenu-box-action').remove();
            // not save, redirect to menu page
            $('.js-submit-not-save').click(function(){
                location.href = drupalSettings.path.baseUrl + drupalSettings.editMenuLink;
            });
        }
    });
    
    // auto click;
    $('.awe-btn-build-normal').trigger('click');
});
