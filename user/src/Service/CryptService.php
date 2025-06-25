<?php

namespace App\Service;

use App\Kernel;
use phpseclib3\Crypt\Common\AsymmetricKey;
use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Crypt\RSA;

class CryptService
{
    // private string $privateKey;
    private RSA\PrivateKey $privateKey;


    public function __construct(private Kernel $kernel)
    {
        $configPath = $this->kernel->getProjectDir() . DIRECTORY_SEPARATOR . "config";

        $privateKeyFile =
            $configPath
            .  DIRECTORY_SEPARATOR
            . "keys"
            . DIRECTORY_SEPARATOR
            . "privateKey.key";

        $this->privateKey = PublicKeyLoader::loadPrivateKey(file_get_contents($privateKeyFile));
    }

    public function decrypt(string $encryptedText): string
    {
        $privateKey = $this->privateKey;
        $decryptedMessage = $privateKey->decrypt(base64_decode($encryptedText)); 
        return $decryptedMessage;
    }
}
