<?php

namespace App\Controller;

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
use App\Service\CryptService;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Lexik\Bundle\JWTAuthenticationBundle\Security\Http\Authentication\AuthenticationSuccessHandler;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\User\UserInterface;

#[Route('/api/user', name: 'api_user_')]
class UserController extends AbstractController
{
    
    #[Route('/validJwtToken', name: 'validJwtToken', methods: ["POST"])]
    public function validJwtToken(
        Security $security
    ): JsonResponse {
        $account = $security->getUser();
        $userUserOk = $account instanceof User || $account instanceof UserInterface;

        if ($userUserOk) return new JsonResponse([
            "message" => "ok",
            "isConnectable" => $userUserOk
        ]);

        return new JsonResponse([
            "message" => "not ok",
            "isConnectable" => $userUserOk
        ]);
    }

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
            return new JsonResponse(["ok" => false, 'message' => 'Username is missing'], Response::HTTP_BAD_REQUEST);
        if (empty($data["password"]))
            return new JsonResponse(["ok" => false, 'message' => 'Password is missing'], Response::HTTP_BAD_REQUEST);
        if (empty($data["publicKey"]))
            return new JsonResponse(["ok" => false, 'message' => 'Public key is missing'], Response::HTTP_BAD_REQUEST);

        $username = htmlentities($data["username"]);
        $password = htmlentities($data["password"]);
        $publicKey = htmlentities($data["publicKey"]);

        $decryptedPassword = (new CryptService($kernel))->decrypt($password);

        if ($userRepository->findOneBy(["username" => $username]))
            return new JsonResponse(["ok" => false, 'message' => 'Something went wrong'], Response::HTTP_INTERNAL_SERVER_ERROR);

        try {
            $user = new User();
            $user->setUsername($username);
            $user->setUniqid(uniqid());

            $hashedPassword = $userPasswordHasherInterface->hashPassword($user, $decryptedPassword);

            $user->setPassword($hashedPassword);
            $user->setPublicKey($publicKey);

            $entityManager->persist($user);
            $entityManager->flush();

            return new JsonResponse(["ok" => true, 'message' => 'User registered successfully'], Response::HTTP_CREATED);
        } catch (\Throwable $err) {
            $logger->error("Error while saving subscribe user", ["exception" => $err->getMessage()]);
            return new JsonResponse(["ok" => false, 'message' => 'Something went wrong'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/login', name: 'login', methods: ["POST"])]
    public function login() {}

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
