<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/user', name: 'api_user_')]
class UserController extends AbstractController
{
    #[Route('/subscribe', name: 'subscribe')]
    public function index(
        Request $request,
        UserPasswordHasherInterface $userPasswordHasherInterface,
        EntityManagerInterface $entityManager
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (
            empty($data["username"])
            || empty($data["password"])
            || empty($data["publicKey"])
        ) {
            return new JsonResponse(['error' => 'Username, password, public key is missing'], 400);
        }

        $username = htmlentities($data["username"]);
        $password = htmlentities($data["password"]);
        $publicKey= htmlentities($data["publicKey"]);

        $user = new User();
        $user->setUsername($username);
         
        $hashedPassword = $userPasswordHasherInterface->hashPassword($user, $password);

        $user->setPassword($hashedPassword);
        $user->setPublicKey($publicKey);

        $entityManager->persist($user);
        $entityManager->flush();
        
        return new JsonResponse(['message' => 'User registered successfully'], 201);
    }

    #[Route('/publicKey/{userId}', name: 'publicKey')]
    public function getPublicKey(
        int $userId,
        UserRepository $userRepository
    ): JsonResponse
    {
        $userData = $userRepository->findOneBy(["id" => $userId]);

        return new JsonResponse([
            'id' => $userData->getId(),
            'username' => $userData->getUsername(),
            'publicKey' => $userData->getPublicKey(),
        ], 200);
    }
}
