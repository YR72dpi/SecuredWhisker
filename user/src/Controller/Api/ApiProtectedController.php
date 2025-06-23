<?php

namespace App\Controller\Api;

use App\Entity\Friendship;
use App\Repository\FriendshipRepository;
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
            "identifier" => $user->getFullIdentifier(),
            "username" => $user->getUsername(),
            "id" => $user->getId()
        ]);
    }

    #[Route('/addFriend', name: '_addFriend', methods: ["POST"])]
    public function addFriend(
        UserRepository $userRepository,
        FriendshipRepository $friendshipRepository,
        Request $request,
        Security $security,
        EntityManagerInterface $em
    ): JsonResponse
    {   
        $user = $security->getUser();
        $data = json_decode($request->getContent(), true);
        $splitedIdentifier = explode("_", $data["userIdentifier"]);

        $wantedUser = $userRepository->findOneBy([
            "username" => $splitedIdentifier[0],
            "uniqid" => $splitedIdentifier[1],
        ]);

        if(!$wantedUser) return $this->json([
            'message' => 'User not find',
        ], 404);

        if($wantedUser === $user) return $this->json([
            'message' => 'Why the fuck did u want to add yourself ? Wanna talk \'bout it ? Need friends ?',
        ], 400);

        
        $isFriendShipAlreadyExist = $friendshipRepository->findUserContacts($user);
        if(count($isFriendShipAlreadyExist) > 0) return $this->json([
            'message' => 'Already friend !',
        ], 400);


        $friendShip = (new Friendship())
            ->setRequestFrom($user)
            ->setRequestTo($wantedUser)
            ->setIsAccepted(false)
            ->setCreatedTime(new \DateTimeImmutable("now"));

        $em->persist($friendShip);
        $em->flush();

        return $this->json([
            'message' => 'ok',
        ]);
    }

    #[Route('/contactRequest', name: '_contactRequest')]
    public function contactRequest(
        Security $security,
        FriendshipRepository $friendshipRepository
    ): JsonResponse
    {   
        $user = $security->getUser();
        
        $requestList = $friendshipRepository->findby([
            "isAccepted" => false,
            "requestTo" => $user->getId()
        ]);

        $requestData = [];
        foreach ($requestList as $request) {
            $requestData[] = [
                "id" => $request->getRequestFrom()->getId(), 
                "username" => $request->getRequestFrom()->getUsername(), 
                "uniqid" => $request->getRequestFrom()->getUniqid()
            ];
        }

        return $this->json([
            'message' => 'ok',
            "data" => $requestData
        ]);
    }

        #[Route('/acceptContact', name: '_acceptContact', methods: ["POST"])]
    public function acceptContact(
        Security $security,
        Request $request,
        FriendshipRepository $friendshipRepository,
        UserRepository $userRepository,
        EntityManagerInterface $em
    ): JsonResponse
    {   
        $user = $security->getUser();
        $data = $request->getContent();

        $whoRequest = $userRepository->findOneBy([
            "uniqid" => $data
        ]);

        if(!$whoRequest) return $this->json([
            'message' => 'User not found',
        ], 404);

        $contactrequest = $friendshipRepository->findOneBy([
            "requestFrom" => $whoRequest,
            "requestTo" => $user
        ]);

        if(!$contactrequest) return $this->json([
            'message' => 'Request not found',
        ], 404);

        $contactrequest->setIsAccepted(true);
        $em->persist($contactrequest);
        $em->flush();

        return $this->json([
            'message' => 'ok',
        ]);
    }

     #[Route('/contacts', name: '_contacts')]
    public function contacts(
        Security $security,
        FriendshipRepository $friendshipRepository
    ): JsonResponse
    {   
        $user = $security->getUser();
        
        $contacts = $friendshipRepository->findUserContacts($user);

        $contactList = [];
        foreach ($contacts as $contact) {
            $contactToAdd = [];

            if($contact->getRequestTo() === $user) {
                $contactToAdd = [
                    "id" => $contact->getRequestFrom()->getId(), 
                    "username" => $contact->getRequestFrom()->getUsername(), 
                    "uniqid" => $contact->getRequestFrom()->getUniqid()
                ];
            }

            if($contact->getRequestFrom() === $user) {
                $contactToAdd = [
                    "id" => $contact->getRequestTo()->getId(), 
                    "username" => $contact->getRequestTo()->getUsername(), 
                    "uniqid" => $contact->getRequestTo()->getUniqid()
                ];
            }

            if(!empty($contactToAdd)) $contactList[] = $contactToAdd;

        }

        return $this->json([
            'message' => 'ok',
            "data" => $contactList
        ]);
    }
}
