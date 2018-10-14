<?php

/**
 * @file
 * Contains \Drupal\md_megamenu\AweLib\MegamenuRenderStyle.
 */
namespace Drupal\md_megamenu\AweLib;
use Drupal\Core\StreamWrapper\PublicStream;
use Drupal\awe_builder\AweBuilder\AweBuilderRenderStyle;

class MegamenuRenderStyle extends AweBuilderRenderStyle{

  /**
   * @param $type
   * @param $file_name
   * @return string
   */
  public function saveFileCss($type, $file_name) {
    $css = $this->getCSS();
    $destination_dir = drupal_get_path('module', 'md_megamenu').'/assets/css/custom'; //"public://awe-{$type}-css";
    file_prepare_directory($destination_dir, FILE_CREATE_DIRECTORY);
    $file_name = file_unmanaged_save_data($css, $destination_dir . "/{$file_name}.css", FILE_EXISTS_REPLACE);
    $file_url = '/' . $file_name; // '/' . PublicStream::basePath(). '/' . file_uri_target($file_name);
    return $file_url;
  }

}