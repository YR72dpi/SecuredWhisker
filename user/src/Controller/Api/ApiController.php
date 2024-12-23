<?php

namespace App\Controller\Api;

use App\Kernel;
use phpseclib3\Crypt\RSA;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

#[Route('/api', name: 'api_')]
class ApiController extends AbstractController
{
    #[Route('/publicKey', name: 'publicKey')]
    public function getServerPublicKey(
        Kernel $kernel,
        CacheInterface $cache
    ): JsonResponse {
        $publicKeyPath =
            $kernel->getProjectDir()
            . DIRECTORY_SEPARATOR
            . "config"
            . DIRECTORY_SEPARATOR
            . "keys"
            . DIRECTORY_SEPARATOR
            . "publicKey.key";

        $privateKeyPath =
            $kernel->getProjectDir()
            . DIRECTORY_SEPARATOR
            . "config"
            . DIRECTORY_SEPARATOR
            . "keys"
            . DIRECTORY_SEPARATOR
            . "privateKey.key";

        return $cache->get(
            md5("api_publicKey" . $publicKeyPath . $privateKeyPath),
            function (ItemInterface $item) use ($publicKeyPath, $privateKeyPath) {
                $item->expiresAfter(5 * 60);

                if (!file_exists($publicKeyPath)) return new JsonResponse([
                    "message" => "Public key file not found"
                ], Response::HTTP_NOT_FOUND);

                $publicKey = file_get_contents($publicKeyPath);

                $message = uniqid();
                try {
                    $private = RSA::loadPrivateKey(file_get_contents($privateKeyPath));
                    $signature = $private->sign($message);
                    $isSignatureValid = $private->getPublicKey()->verify($message, $signature) ?
                        true :
                        false;
                } catch (\Throwable $th) {
                    return new JsonResponse([
                        "message" => "RSA keys invalid"
                    ], Response::HTTP_CONFLICT);
                }

                return new JsonResponse([
                    "message" => "ok",
                    "publicKey" => base64_encode($publicKey)
                ], Response::HTTP_OK);
            }
        );
    }
}
