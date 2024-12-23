<?php

namespace App\Controller\Api;

use App\Kernel;
use phpseclib3\Crypt\RSA;
use phpseclib3\File\ASN1\Maps\RSAPublicKey;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

#[Route('/api', name: 'api_')]
class ApiController extends AbstractController
{
    #[Route('/publicKey', name: 'publicKey')]
    public function getServerPublicKey(
        Kernel $kernel
    ): JsonResponse
    {
        $publicKeyPath = 
            $kernel->getProjectDir()
            . DIRECTORY_SEPARATOR
            . "config"
            . DIRECTORY_SEPARATOR
            . "keys"
            . DIRECTORY_SEPARATOR
            . "publicKey.key"
        ;

        $privateKeyPath = 
            $kernel->getProjectDir()
            . DIRECTORY_SEPARATOR
            . "config"
            . DIRECTORY_SEPARATOR
            . "keys"
            . DIRECTORY_SEPARATOR
            . "privateKey.key"
        ;

        if(!file_exists($publicKeyPath)) return new JsonResponse([
            "message" => "Public key file not found"
        ], Response::HTTP_NOT_FOUND);

        $publicKey = file_get_contents($publicKeyPath);

        $message = "A message for test";
        $private = RSA::loadPrivateKey(file_get_contents($privateKeyPath));
        $signature = $private->sign($message);
        $isSignatureValid = $private->getPublicKey()->verify($message, $signature) ?
            true :
            false;

        if(!$isSignatureValid) return new JsonResponse([
            "RSA keys invalid"
        ], Response::HTTP_CONFLICT);

        return new JsonResponse([
            "message" => "ok",
            "publicKey" => base64_encode($publicKey)
        ], Response::HTTP_OK);
    }
}
