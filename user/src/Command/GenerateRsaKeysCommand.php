<?php

namespace App\Command;

use App\Kernel;
use phpseclib3\Crypt\RSA;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:generate-rsa-keys',
    description: 'Generate public and private keys files',
)]
class GenerateRsaKeysCommand extends Command
{
    public function __construct(private Kernel $kernel)
    {
        
        parent::__construct();
    }

    protected function configure(): void
    {
        // $this
        //     ->addArgument('arg1', InputArgument::OPTIONAL, 'Argument description')
        //     ->addOption('option1', null, InputOption::VALUE_NONE, 'Option description')
        // ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $configPath = $this->kernel->getProjectDir() . DIRECTORY_SEPARATOR . "config";

        try {
            $io->info('Creating keys folder');
            if(!file_exists($configPath . DIRECTORY_SEPARATOR . "keys")) {
                mkdir($configPath . DIRECTORY_SEPARATOR . "keys");
                $io->success("Created");
            } else {
                $io->info('Keys folder alredy exist');
            }
        } catch (\Throwable $th) {
            throw $th;
        }

        try {
            $io->info("Generating RSA keys");
            $keyPair = RSA::createKey(2048);
            $privateKey = $keyPair;
            $publicKey = $keyPair->getPublicKey();
            $io->success("RSA keys generated");
        } catch (\Throwable $th) {
            throw $th;
        }

        try {
            $io->info("Generating public key file");
            $publicKeyFile = fopen(
                $configPath
                .  DIRECTORY_SEPARATOR
                . "keys"
                . DIRECTORY_SEPARATOR
                . "publicKey.key",
                'wr'
            );

            fwrite($publicKeyFile, $publicKey);
            fclose($publicKeyFile);
            $io->success("Public key file generated");
        } catch(\Throwable $th) {
            throw $th;
        }

        try {
            $io->info("Generating public key file");
            $privateKeyFile = fopen(
                $configPath 
                .  DIRECTORY_SEPARATOR
                . "keys"
                . DIRECTORY_SEPARATOR
                . "privateKey.key",
                'wr'
            );
            
            fwrite($privateKeyFile, $privateKey);
            fclose($privateKeyFile);
            $io->success("Private key file generated");
        } catch(\Throwable $th) {
            throw $th;
        }

        return Command::SUCCESS;
    }
}
