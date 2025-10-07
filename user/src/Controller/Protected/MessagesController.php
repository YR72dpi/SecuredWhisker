<?php

namespace App\Controller\Protected;

use App\Entity\MessageRegister;
use App\Repository\MessageRegisterRepository;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;

#[Route('/api/messages', name: 'api_messages_')]
class MessagesController extends AbstractController
{

    public function __construct(private string $appSecret) {}

    #[Route('', name: 'saveMessage', methods: ["POST"])]
    public function saveMessage(
        Request $request,
        LoggerInterface $logger,
        EntityManagerInterface $em
    ): JsonResponse {
        try {

            $data = json_decode($request->getContent(), true);

            foreach ($data as $dataForWhom) {
                $payload = $dataForWhom["payload"];
                $roomId = $dataForWhom["room"];
                $forWhom = $dataForWhom["forWhom"];
                $now = new DateTimeImmutable("now");

                // $roomIdHash = hash('sha256', $this->appSecret . $roomId);

                $message = (new MessageRegister())
                    ->setRoomId($roomId)
                    ->setDateTime($now)
                    ->setForWhom($forWhom)
                    ->setMessagePayload(json_encode($payload));

                $em->persist($message);
            }

            $em->flush();
        } catch (\Exception $err) {
            $logger->error("Error when saving message: " . $err->getMessage());
            return new JsonResponse([
                "message" => "not ok"
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return new JsonResponse([
            "message" => "ok"
        ], Response::HTTP_OK);
    }

    #[Route('/{roomId}', name: 'getMessage', methods: ["GET"])]
    public function getMessage(
        string $roomId,
        LoggerInterface $logger,
        MessageRegisterRepository $messageRegisterRepository,
        Security $security
    ): JsonResponse {
        try {

            $user = $security->getUser();
            $userId = (string) $user->getId();

            // $roomIdHash = hash('sha256', $this->appSecret . $roomId);
            $messagesRegistered = $messageRegisterRepository->getMessages($roomId, $userId);
            $messageRegisteredPayloadOnlyStringList = array_column($messagesRegistered, "message_payload");

            $messageRegisterPayload = [];
            foreach($messageRegisteredPayloadOnlyStringList as $messageRegisteredPayloadOnlyString) {
                $messageRegisterPayload[] = json_decode($messageRegisteredPayloadOnlyString);
            }

        } catch (\Exception $err) {
            $logger->error("Error when saving message: " . $err->getMessage());
            return new JsonResponse([
                "message" => $err->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return new JsonResponse([
            "message" => "ok",
            "messagesRegistered" => $messageRegisterPayload
        ], Response::HTTP_OK);
    }
}
