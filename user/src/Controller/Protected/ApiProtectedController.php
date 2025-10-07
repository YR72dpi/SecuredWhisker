<?php

namespace App\Controller\Protected;

use App\Entity\Friendship;
use App\Repository\FriendshipRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
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
    ): JsonResponse {
        $user = $security->getUser();

        if (!$user) return $this->json([
            'message' => 'not ok',
        ], JsonResponse::HTTP_UNAUTHORIZED);

        return $this->json([
            'message' => 'ok',
            "identifier" => $user->getUniqid(),
            "username" => $user->getUsername(),
            "id" => $user->getId(),
            "publicKey" => $user->getPublicKey()
        ]);
    }

    #[Route('/addFriend', name: '_addFriend', methods: ["POST"])]
    public function addFriend(
        UserRepository $userRepository,
        FriendshipRepository $friendshipRepository,
        Request $request,
        Security $security,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $security->getUser();
        $uniqid = json_decode($request->getContent(), true)["userIdentifier"];

        $wantedUser = $userRepository->findOneBy([
            "uniqid" => $uniqid,
        ]);

        if (!$wantedUser) return $this->json([
            'message' => 'User not find',
        ], 404);

        if ($wantedUser === $user) return $this->json([
            'message' => 'Why the fuck did u want to add yourself ? Wanna talk \'bout it ? Need friends ?',
        ], 400);

        // TODO : créer une erreur quand on veux plusiurs amie car oneToOne
        $isFriendShipAlreadyExist = $friendshipRepository->findRelation($user, $wantedUser);
        if ($isFriendShipAlreadyExist !== []) return $this->json([
            'message' => 'Already friend !',
        ], 400);


        $friendShip = (new Friendship())
            ->setRequestFrom($user)
            ->setRequestTo($wantedUser)
            ->setAccepted(false);

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
    ): JsonResponse {
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
    ): JsonResponse {
        $user = $security->getUser();
        $data = $request->getContent();

        $whoRequest = $userRepository->findOneBy([
            "uniqid" => $data
        ]);

        if (!$whoRequest) return $this->json([
            'message' => 'User not found',
        ], 404);

        $contactrequest = $friendshipRepository->findOneBy([
            "requestFrom" => $whoRequest,
            "requestTo" => $user
        ]);

        if (!$contactrequest) return $this->json([
            'message' => 'Request not found',
        ], 404);

        $contactrequest->setAccepted(true);
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
    ): JsonResponse {
        $user = $security->getUser();

        $contacts = $friendshipRepository->findUserContacts($user);

        $contactList = [];
        foreach ($contacts as $contact) {
            $contactToAdd = [];

            if ($contact->getRequestTo() === $user) {
                $contactToAdd = [
                    "id" => $contact->getRequestFrom()->getId(),
                    "username" => $contact->getRequestFrom()->getUsername(),
                    "uniqid" => $contact->getRequestFrom()->getUniqid(),
                    "publicKey" => $contact->getRequestFrom()->getPublicKey()
                ];
            }

            if ($contact->getRequestFrom() === $user) {
                $contactToAdd = [
                    "id" => $contact->getRequestTo()->getId(),
                    "username" => $contact->getRequestTo()->getUsername(),
                    "uniqid" => $contact->getRequestTo()->getUniqid(),
                    "publicKey" => $contact->getRequestTo()->getPublicKey()
                ];
            }

            if (!empty($contactToAdd)) $contactList[] = $contactToAdd;
        }

        return $this->json([
            'message' => 'ok',
            "data" => $contactList
        ]);
    }

    #[Route('/translate', name: '_translate', methods: ["POST"])]
    public function translate(
        Request $request,
        ParameterBagInterface $params
    ): JsonResponse {
        $data = $request->getContent();
        $translateApiUrl = $params->get('TRANSLATE_API_URL');
        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => $translateApiUrl . '/translate',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json'
            ),
        ));

        $response = curl_exec($curl);
        curl_close($curl);
        $translatedMessage = json_decode($response, true)['translated'];

        return $this->json([
            'message' => 'ok',
            'translated' => $translatedMessage
        ]);
    }
}
