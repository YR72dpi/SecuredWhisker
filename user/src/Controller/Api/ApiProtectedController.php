<?php

namespace App\Controller\Api;

use App\Entity\Friendship;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;

#[Route('/api/protected', name: 'api_protected_')]
class ApiProtectedController extends AbstractController
{
    #[Route('/data', name: '_data')]
    public function protectedData(): JsonResponse
    {
        return $this->json([
            'message' => 'Données sécurisées',
            'user' => $this->getUser()
        ]);
    }

    #[Route('/selfUserData', name: '_selfUserData',)]
    public function selfUserData(
        Security $security
    ): JsonResponse
    {   
        $user = $security->getUser();

        if(!$user) return $this->json([
            'message' => 'ok',
        ], 404);

        return $this->json([
            'message' => 'ok',
            "identifier" => $user->getFullIdentifier()
        ]);
    }

    #[Route('/addFriend', name: '_addFriend', methods: ["POST"])]
    public function addFriend(
        UserRepository $userRepository,
        Request $request,
        Security $security,
        EntityManagerInterface $em
    ): JsonResponse
    {   

        $data = json_decode($request->getContent(), true);
        $splitedIdentifier = explode("_", $data["userIdentifier"]);

        $wantedUser = $userRepository->findOneBy([
            "username" => $splitedIdentifier[0],
            "uniqid" => $splitedIdentifier[1],
        ]);

        if(!$wantedUser) return $this->json([
            'message' => 'User not find',
        ], 404);

        if($wantedUser === $security->getUser()) return $this->json([
            'message' => 'Why the fuck did u want to add yourself ? Wanna talk \'bout it ? Need friends ?',
        ], 400);
        
        $friendShip = (new Friendship())
            ->setRequestFrom($security->getuser())
            ->setRequestTo($wantedUser)
            ->setIsAccepted(false)
            ->setCreatedTime(new \DateTimeImmutable("now"));

        $em->persist($friendShip);
        $em->flush();



        return $this->json([
            'message' => 'ok',
        ]);
    }
}
