<?php
/**
 * @file
 * Contains \Drupal\md_megamenu\Controller\HelloController.
 */
namespace Drupal\md_megamenu\Controller;
use Drupal\Core\Url;
use Drupal\file\Entity\File;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Drupal\Core\Controller\ControllerBase;

class MDMegamenuController extends ControllerBase{
  public function content() {
    return array(
      '#type' => 'markup',
      '#markup' => t('Hello Mr Neo!'),
    );
  }
  
  public function contentIframe(){
    $build['#attached']['library'][] = 'awe_builder/awe_builder.iframe';
    $build['#attached']['library'][] = 'md_megamenu/megamenu.front';
    $build['#attached']['library'][] = 'md_megamenu/megamenu.iframe';
    if (\Drupal::hasService('md_fontello')) {
      $fontello = \Drupal::service('md_fontello');
      $libraries = $fontello->getListLibraries();
      foreach ($libraries as $library) {
        $build['#attached']['library'][] = $library;
      }
    }
    $build['#markup'] = '';
    return $build;
  }
}