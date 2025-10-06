<?php

namespace App\Controller\Protected;

use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

#[Route('/api/qrcodce', name: 'api_qrcoce_')]
class QRCodeController extends AbstractController
{
    #[Route('/qrCodeReceive', name: 'qrCodeReceive', methods: ["POST"])]
    public function qrCodeReceive(
        Request $request,
        CacheInterface $cache
    ): JsonResponse {
        $data = $request->getContent();
        $qrCodeDataRegistrationID = uniqid();
        $cacheKey = md5("user_qrCodeRsaTransmissionId_" . $qrCodeDataRegistrationID);
        $cache->get(
            $cacheKey,
            function (ItemInterface $item) use ($data) {
                $item->expiresAfter(24 * 60 * 60);
                return $data;
            }
        );

        return new JsonResponse([
            "message" => "ok",
            "qrCodeDataRegistrationID" => $qrCodeDataRegistrationID
        ], Response::HTTP_OK);
    }

    #[Route('/getCryptedPrivateKey', name: 'getCryptedPrivateKey', methods: ["POST"])]
    public function getCryptedPrivateKey(
        Request $request,
        CacheItemPoolInterface $cache
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $qrCodeDataRegistrationID = $data['transfertCode'];

        $cacheKey = md5("user_qrCodeRsaTransmissionId_" . $qrCodeDataRegistrationID);

        $item = $cache->getItem($cacheKey);

        if (!$item->isHit()) {
            return new JsonResponse([
                "message" => "Clé non trouvée ou expirée",
                "privateKeyPayload" => null
            ], Response::HTTP_NOT_FOUND);
        }

        $privateKeyPayload = $item->get();
        $cache->deleteItem($cacheKey);

        return new JsonResponse([
            "message" => "ok",
            "privateKeyPayload" => $privateKeyPayload
        ], Response::HTTP_OK);
    }
}
