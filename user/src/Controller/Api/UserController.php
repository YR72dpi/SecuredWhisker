<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Kernel;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use App\Service\Crypt;

#[Route('/api/user', name: 'api_user_')]
class UserController extends AbstractController
{
    #[Route('/subscribe', name: 'subscribe', methods: ["POST"])]
    public function index(
        Request $request,
        UserPasswordHasherInterface $userPasswordHasherInterface,
        EntityManagerInterface $entityManager,
        UserRepository $userRepository,
        LoggerInterface $logger,
        Kernel $kernel
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (empty($data["username"]))
            return new JsonResponse(['error' => 'Username is missing'], Response::HTTP_BAD_REQUEST);
        if (empty($data["password"]))
            return new JsonResponse(['error' => 'Password is missing'], Response::HTTP_BAD_REQUEST);
        if (empty($data["publicKey"]))
            return new JsonResponse(['error' => 'Public key is missing'], Response::HTTP_BAD_REQUEST);

        $username = htmlentities($data["username"]);
        $password = htmlentities($data["password"]);
        $publicKey = htmlentities($data["publicKey"]);

        $decryptedPassword = (new Crypt($kernel))->decrypt($password);

        if ($userRepository->findOneBy(["username" => $username]))
            return new JsonResponse([
                'message' => 'User already exists'
            ], Response::HTTP_CONFLICT);

        try {
            $user = new User();
            $user->setUsername($username);
    
            $hashedPassword = $userPasswordHasherInterface->hashPassword($user, $decryptedPassword);
    
            $user->setPassword($hashedPassword);
            $user->setPublicKey($publicKey);
    
            $entityManager->persist($user);
            $entityManager->flush();

            return new JsonResponse(['message' => 'User registered successfully'], Response::HTTP_CREATED);
        } catch(\Throwable $err) {
            $logger->error("Error while saving subscribe user", ["exception" => $err->getMessage()]);
            return new JsonResponse(['message' => 'Something went wrong'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

    }

    #[Route('/publicKey/{userId}', name: 'publicKey')]
    public function getPublicKey(
        int $userId,
        UserRepository $userRepository
    ): JsonResponse {
        $userData = $userRepository->findOneBy(["id" => $userId]);

        if (!$userData) return new JSONResponse(["message" => "User public key not find"], Response::HTTP_NOT_FOUND);

        return new JsonResponse([
            'id' => $userData->getId(),
            'username' => $userData->getUsername(),
            'publicKey' => $userData->getPublicKey(),
        ], Response::HTTP_OK);
    }
}
