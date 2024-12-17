<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/', name: 'app_')]
class IndexController extends AbstractController
{
    #[Route('/', name: 'index')]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => "That's Secured Whisker's user micro service",
            'status' => 200
        ]);
    }
}
