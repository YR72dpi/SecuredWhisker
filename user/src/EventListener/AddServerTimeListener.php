<?php
// src/EventListener/AddServerTimeListener.php
namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ResponseEvent;


class AddServerTimeListener
{
    public function onKernelResponse(ResponseEvent $event)
    {
        $response = $event->getResponse();

        // Vérifie si la réponse est en JSON
        if (!$response instanceof JsonResponse) {
            return;
        }

        // Récupère les données JSON
        $data = json_decode($response->getContent(), true);

        // Ajoute l'heure du serveur
        $data['server_time'] = (new \DateTime())->format('Y-m-d H:i:s');

        // Redéfinit la réponse avec les nouvelles données
        $response->setData($data);
    }
}
