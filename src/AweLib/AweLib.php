<?php
namespace Drupal\md_megamenu\AweLib;
use Drupal\menu_link_content\Plugin\Menu\MenuLinkContent;
use Drupal\Component\Serialization\Yaml;

class AweLib{
  protected $connection;
  
  function __construct() {
    $this->connection = \Drupal::database();
  }
  
  function getMenuItemsByMenuName($menu_name){
    $menu_tree = \Drupal::menuTree();
    // Build the typical default set of menu tree parameters.
    $parameters = $menu_tree->getCurrentRouteMenuTreeParameters($menu_name);
    // Load the tree based on this set of parameters.
    $tree = $menu_tree->load($menu_name, $parameters);
    // Transform the tree using the manipulators you want.
    $manipulators = array(
      // Only show links that are accessible for the current user.
      array('callable' => 'menu.default_tree_manipulators:checkAccess'),
      // Use the default sorting of menu links.
      array('callable' => 'menu.default_tree_manipulators:generateIndexAndSort'),
    );
    $tree = $menu_tree->transform($tree, $manipulators);
    // Finally, build a renderable array from the transformed tree.
    $menu_tmp = $menu_tree->build($tree);
    $existItems = $this->findAllMenuItems();
    $items = $this->getMenuItemsByList($menu_tmp['#items'], $existItems);
    return $items;
  }
      
  public function getMenuItemsByList($list, $existItems, $level = 1) {   
    $menu = array(); //ksm($list);
    foreach ($list as $item) {
      $href = '#';
      if($item['url']->isExternal()){
        $href = $item['url']->toString();
      } else if ($item['url']->getRouteName() == '<front>') {
       $href = $item['url']->getRouteName();
      } else if($item['url']->getRouteName() != '<none>'){
        $href = $item['url']->toString();
      }      
      
      if($item['original_link'] instanceof MenuLinkContent){
        $uuid = $item['original_link']->getDerivativeId();
        $menuContent = current(\Drupal::entityTypeManager()->getStorage('menu_link_content')->loadByProperties(['uuid' => $uuid]));
        $mid = $menuContent->id();
      }else{        
        $mid = $item['original_link']->getPluginId();
        if(!$mid)
          $mid = 'none';
      }
      $menuItemSetting = array();
      $menuItem = array(
        'title' => $item['title'],
        'level' => $level,
        'url'=>$href,
        'mid'=>$mid,
        'in_active_trail' => isset($item['in_active_trail']) ? $item['in_active_trail'] : false,
        'content' => false,
        'machineName' => 'menu',
        'customStyles' => '{"id":"","classes":"","css":""}',
        'renderedStyle' => array(
          'styles' => array(),
          'flags' => array()
        ),
        'renderedAnimation' => array()
      );      
      if(count($item['below'])){        
        $menuItem['contentType'] = 'Menus';
        $menuItem['content'] = $this->getMenuItemsByList($item['below'], $existItems, $level + 1);
      }
      
      if(isset($existItems[$menuItem['mid']])){        
        $existItem = (array) $existItems[$menuItem['mid']];
        $existItem['data'] = json_decode($existItem['data'], true);
        if(!isset($menuItemSetting['main']['settings']['type']) || $menuItemSetting['main']['settings']['type'] != 'list'){
          $menuItemSetting['main']['settings']['type'] = $existItem['type'];
          if($existItem['type'] == 'mega'){
            $menuItem['content'] = $existItem['data']['content'];
            $menuItem['contentType'] = 'Sections';
          }else {
            
          }
        }
        
        $itemSettings = $existItem['data']['settings'];
        $itemSettings = json_decode($itemSettings, true);
        if(count($item['below']))
          $itemSettings['main']['settings']['type'] = 'list';
        else if(isset($itemSettings['main']['settings']['type']) && $itemSettings['main']['settings']['type'] == 'list' && count($item['below']) == 0)
          $itemSettings['main']['settings']['type'] = 'normal';
        $menuItem['settings'] = (string) json_encode($itemSettings);
        $menuItem['cid'] = $existItem['data']['cid'];
      } else if(count($item['below'])){
        $menuItemSetting['main']['settings']['type'] = 'list';
        $menuItem['settings'] = (string) json_encode($menuItemSetting);
      }
        
      $menu[] = $menuItem;
    }
    return $menu;
  }
  
  function getBoxMenuSettings(){
    $defaultSettings = array(
      'settings' => '{"main":{"settings":{"type":"standard","skin":"default","skin_color":"color-1","trigger_override":"hover","hover_time":0,"enable_sticky":false,"sticky_offset":0,"show_scroll_up":false,"enable_arrow_desktop":true,"animation_type":"fadeup","animation_duration":300,"enable_mobile":false,"m_type":"standard","responsive_width":768,"mobile_trigger":"click","enable_arrow_mobile":true,"mobile_animation_duration":300},"title":"Main"},"menu_bar":{"settings":{"container":"nav","fullwidth":false,"menubar_width":1170},"title":"Menu bar","selector":".awemenu-container"},"top_items":{"settings":{"text_align":"default","item_type":"text-only"},"title":"Top items","selector":"ul.awemenu > .awemenu-item > a"},"mega_submenu":{"settings":{"fullwidth":true,"mega_width":600,"set_height":"auto","mega_height":400},"title":"Mega submenu","selector":".awemenu-megamenu"},"flyout_submenu":{"settings":{"dropdown_width":250,"text_align":"default","item_type":"text-only"},"title":"Flyout submenu","selector":".awemenu-item .awemenu-item > a"}}',
      'title' => 'Menu Box',
      'defaultPart' => 'menu_bar',
      'machineName' => 'menubox',
      'contentType' => 'Menus',
      'customStyles' => '{"id":"","classes":"","css":""}',
      'renderedStyle' => array(
        'styles' => array(),
        'flags' => array()
      ),
      'renderedAnimation' => array()
    );
    
    return $defaultSettings;
  }
  
  public function findAllMenuItems(){    
    return $this->connection->select('md_megamenu_items', 'm')->fields('m')->execute()->fetchAllAssoc('mid');
  }
  
  private function getMegamenuSkinFromTheme($patterm = '', $level = 1){
    $activeTheme = \Drupal::configFactory()->get('system.theme')->get('default');
    $path = drupal_get_path('theme', $activeTheme);
    $skinConfig = glob($path.'/'.$patterm.'megamenu_skin.yml');
    $file = false;
    if(!count($skinConfig) && $level < 5){
      $patterm .= '**/';
      $file = $this->getMegamenuSkinFromTheme($patterm, ++$level);
    } else if(isset($skinConfig[0]))
      $file = $skinConfig[0];
    return $file;
  }
  
  public function getMegamenuSkinConfig(){
    $file = $this->getMegamenuSkinFromTheme();
    $config = array('skinURL'=>'', 'data'=>array());
    if($file){
      $config['skinURL'] = str_replace('/megamenu_skin.yml', '', $file);
      $config['data'] = file_get_contents($file);
      $config['data'] = !empty($config['data']) ? Yaml::decode($config['data']) : array();
    }
    return $config;
  }
}

