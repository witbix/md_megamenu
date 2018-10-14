<?php

/**
 * @file
 * Contains \Drupal\md_megamenu\Form\AweMegaMenuForm.
 */
namespace Drupal\md_megamenu\Form;

use Drupal\awe_builder\AweBuilder\AweBuilderLibraries;
use Drupal\awe_builder\AweBuilder\AweBuilderRender;
use Drupal\md_megamenu\AweLib\MegamenuRenderStyle;
use Drupal\Component\Serialization\Json;
use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Database\Connection;
use Drupal\md_megamenu\AweLib\AweLib;
use Drupal\menu_link_content\Entity\MenuLinkContent;

class AweMegaMenuForm extends FormBase {

  /**
   * @var int ID of AwePage
   */
  protected $pid;
  
  /**
   * @var \Drupal\Core\Database\Connection
   */
  protected $connection;
  
  protected $aweLib;


  /**
   * AweMegaMenuForm constructor.
   * @param \Drupal\Core\Database\Connection $connection
   */
  public function __construct(Connection $connection) {
    $this->connection = $connection;
    $this->aweLib = new AweLib();
  }


  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('database')
    );
  }


  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'awe_mega_menu';
  }
 

  protected function getAweUrlConfig($pid = NULL) {
    $url_settings = AweBuilderRender::getAweUrlConfig();
    $url_settings['buildPage'] = Url::fromRoute('md_megamenu.content.iframe', [], ['absolute' => TRUE])
      ->toString();
    return $url_settings;
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, $pid = '') {
    $form['#attached']['library'][] = 'md_megamenu/megamenu.admin';
    $form['#attached']['drupalSettings']['md_megamenu_folder_url'] = drupal_get_path('module', 'md_megamenu');
    $form['#attached']['drupalSettings']['getPlaceBlock'] = $this->url('awe_builder.admin.place_block', [], ['absolute' => TRUE]);
    $form['#attached']['drupalSettings']['getListBlock'] = $this->url('awe_builder.admin.list_block', [], ['absolute' => TRUE]);
    $megamenuSkin = $this->aweLib->getMegamenuSkinConfig();
    $form['#attached']['drupalSettings']['megamenuSkin'] = $megamenuSkin;
    if (\Drupal::hasService('iconapi')) {
      $iconapi = \Drupal::service('iconapi');
    }else if (\Drupal::hasService('md_fontello')) {
      $iconapi = \Drupal::service('md_fontello');      
    }
    if(isset($iconapi)){
      $libraries = $iconapi->getListLibraries();
      foreach ($libraries as $library) {
        $form['#attached']['library'][] = $library;
      }
    }
    $menu_name = md_arg(4);
    $form['#attached']['drupalSettings']['editMenuLink'] = 'admin/structure/menu/manage/'.$menu_name;
    $data = \Drupal::config("md_megamenu.settings")->get("{$menu_name}_settings");
    if(!$data){
      $data = $this->aweLib->getBoxMenuSettings();
    }else{
      $data = json_decode($data, true);
    }
    $data['content'] = $this->aweLib->getMenuItemsByMenuName($menu_name);
    
    $form['title'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Menu name'),
      '#maxlength' => 255,
      '#required' => TRUE,
      '#disabled'=>true,
      '#default_value' => $menu_name
    ];
    $form['font'] = [
      '#title' => $this->t('Google font'),
      '#type' => 'hidden',
      '#default_value' => \Drupal::config("md_megamenu.settings")->get('font_' . $menu_name),
      '#attributes' => array('class' => array('awe-google-font')),
    ];
    $form['path_config'] = [
      '#type' => 'hidden',
      '#value' => Json::encode($this->getAweUrlConfig($pid))
    ];
    $form['page_data'] = array(
      '#type' => 'textarea',
      '#title' => t('Content'),
      '#description' => t('content of megamenu'),
      '#default_value' => json_encode($data),
      '#attributes' => array('id' => 'awe-page-content')
    );
    $form['list_deleted'] = [
      '#type' => 'hidden',
      '#default_value' => '',
      '#attributes' => array('id' => 'awe-list-deleted-menu')
    ];
    $form['skin_theme'] = [
      '#type' => 'hidden',
      '#default_value' => json_encode($megamenuSkin)
    ];
    $form['build_button'] = array(     
      '#markup' => '<div class="form-item form-item-bt-build"><a href="#" class="awe-btn-build awe-btn-build-normal">Build megamenu</a></div>',      
    );
    $form['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Submit'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $values = $form_state->getValues();
    $menu_name = md_arg(4);
    $data = Json::decode($values['page_data']);
    $content = $data['content'];    
    $existItems = $this->connection->select('md_megamenu_items', 'm')->fields('m')->execute()->fetchAllAssoc('mid');
    $this->updateMenuItems($content, $existItems);
    
    //delete menu
    $list_deleted = $values['list_deleted'];
    if($list_deleted){
      $list_deleted = explode(',', $list_deleted);
      $this->deleteMenuItems($list_deleted);
      //ksm($list_deleted);
    }
    // Save css file
    $style = new MegamenuRenderStyle($data, "ac_wrap_menu-{$menu_name}");
    $css = $style->saveFileCss('menu', "md_menu_{$menu_name}");
    
    // save libraries
    $library = \Drupal::config("md_megamenu.settings")->get("libraries");
    if(empty($library))
      $library = [];
    else {
      $library = json_decode ($library, true);
      // refresh libraries for this menu_name
      $library[$menu_name] = [];
    }
    
    // add file skin & color
    $settings = json_decode($data['settings'], true);
    $main = $settings['main']['settings'];
    $skinURL =  'assets/css/awemenu/themes';
    $themes = array(
      'default'=> array('awemenu_standard', 'awemenu_left_right', 'awemenu_outleft_outright', 'awemenu-fullscreen'),
      'classic'=>array('awemenu_standard', 'awemenu_left_right', 'awemenu_outleft_outright', 'awemenu-fullscreen')
    );
    $listSkin = $this->getMegamenuSkin($values['skin_theme']);
    // Get libraries of megamenu
    $libraries = new AweBuilderLibraries($data);
    $files = $libraries->getLibraries();
    $library[$menu_name] = $files;
    
    foreach($listSkin[$main['skin']]['skin'] as $index => $skin){
      $library[$menu_name]['css']['theme'][$skin] = [];
    }
    if(isset($listSkin[$main['skin']]['color'][$main['skin_color']]))
      $library[$menu_name]['css']['theme'][$listSkin[$main['skin']]['color'][$main['skin_color']]] = []; 
    $library[$menu_name]['css']['theme'][$css] = [];
    \Drupal::service('config.factory')->getEditable("md_megamenu.settings")->set("libraries", json_encode($library))->save();
    
    // dave nav settings
    unset($data['content']);
    \Drupal::service('config.factory')->getEditable("md_megamenu.settings")->set("{$menu_name}_settings", json_encode($data))->save();
    
    // Clear cache
    \Drupal::service('library.discovery')->clearCachedDefinitions();
    
    $form_state->setRedirect("entity.menu.edit_form", ['menu'=>$menu_name]);
  }
  
  function getMegamenuSkin($skinFromTheme){
    $skinURL =  'assets/css/awemenu/themes';
    $themes = array(
      'default'=> array('awemenu_standard', 'awemenu_left_right', 'awemenu_outleft_outright', 'awemenu-fullscreen'),
      'classic'=>array('awemenu_standard', 'awemenu_left_right', 'awemenu_outleft_outright', 'awemenu-fullscreen')
    );
    $listSkin = array(
      'default'=> 'Default',
      'classic'=> 'Classic'
    );
    if(is_string($skinFromTheme))
      $skinFromTheme = json_decode($skinFromTheme, true);
    foreach($skinFromTheme['data'] as $key =>$skin){
      $listSkin[$key] = $skin['name'];
    }
    $listSkinFiles = array();
    foreach($listSkin as $key =>$name){
      if(in_array($key, array('default', 'classic'))){
        // skin defaultt
        foreach($themes[$key] as $index =>$val){
          $listSkinFiles[$key]['skin'][] = $skinURL.'/'.$key.'/'.$val.'.css';
        }
        for($i = 1; $i<=8; $i++){
            $listSkinFiles[$key]['color'][$i] = $skinURL.'/'.$key.'/colors/color-'.$i.'.css';
        }
      } else {
        // skin from theme
        foreach($skinFromTheme['data'][$key]['skin'] as $index =>$val){
          $listSkinFiles[$key]['skin'][] = '/'.$skinFromTheme['skinURL'].'/'.$val;
        }
        if(isset($skinFromTheme['data'][$key]['color']) && !empty($skinFromTheme['data'][$key]['color'])){
          foreach($skinFromTheme['data'][$key]['color'] as $index =>$val){
            $listSkinFiles[$key]['color'][$index + 1] = '/'.$skinFromTheme['skinURL'].'/'.$val;
          }
        }                    
      }
    }
    
    return $listSkinFiles;
  }
      
  function deleteMenuItems($listIds){
    if(count($listIds)){
      // remove from md_megamenu_items
      $this->connection->delete('md_megamenu_items')->condition('mid', $listIds, 'in')->execute();
      // remove from menu core
      $items = MenuLinkContent::loadMultiple($listIds);     
      \Drupal::entityTypeManager()->getStorage('menu_link_content')->delete($items);
    }
  }
      
  function updateMenuItems($list, $existItems){
    foreach($list as $index => $item){
      $settings = json_decode($item['settings'], true);
      $type = isset($settings['main']['settings']['type']) ? $settings['main']['settings']['type'] : 'normal';
      $data = $item;
      if($type == 'list')
        $data['content'] = [];
      $data = json_encode($data);
      $fields = [
        'title' => $item['title'],
        'type' => $type,
        'mid' => $item['mid'],
        'rendered_style'=>json_encode($item['renderedStyle']),
        'data' => $data
      ];    
      if(!isset($existItems[$fields['mid']])){
        $this->connection->insert('md_megamenu_items')->fields($fields)->execute ();
      }
      else{
        $this->connection->update('md_megamenu_items')->fields($fields)->condition('mid', $fields['mid'])->execute ();
      }
      
      //update menu core
      $menuContent = MenuLinkContent::load($fields['mid']);
      if($menuContent){
        $menuContent->set('title', $fields['title'])->set('weight', $index)->save();
      }
      if(isset($item['contentType']) && $item['contentType'] == 'Menus' && is_array($item['content']) && count($item['content'])){
        $this->updateMenuItems($item['content'], $existItems);
      }
    }
  }
}
