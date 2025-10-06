<?php

namespace App\Controller;

use App\Kernel;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/', name: 'app_')]
class IndexController extends AbstractController
{

    public function __construct(
        private EntityManagerInterface $entityManager
    )
    {
    }

    #[Route('/', name: 'index')]
    public function index(
        Kernel $kernel,
    ): JsonResponse
    {
        try {
            $this->entityManager->getConnection();
            $isDbConnectionOk = true;
        } catch (\Throwable $th) {
            $isDbConnectionOk = false;
        }
        return $this->json([
            'message' => "That's Secured Whisker's user micro service",
            'status' => 200,
            'isDbConnectionOk' => $isDbConnectionOk,
            'env' => $kernel->getEnvironment()
        ]);
    }
}
