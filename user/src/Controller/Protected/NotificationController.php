<?php

namespace App\Controller\Protected;

use App\Entity\MessageRegister;
use App\Entity\UserNotificationSubscription;
use App\Repository\MessageRegisterRepository;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\Request;

#[Route('/api/notification', name: 'api_notification_')]
class NotificationController extends AbstractController
{

    #[Route('/addSubscription', name: 'addSubscription', methods: ["POST"])]
    public function saveMessage(
        Request $request,
        LoggerInterface $logger,
        EntityManagerInterface $em,
        Security $security
    ): JsonResponse {
        try {

            $data = json_decode($request->getContent(), true);

            $subscription = (new UserNotificationSubscription())
            ->setUserId($security->getUser())
            ->setSubscription($data["subsciption"])
            ->setDeviceName($data["deviceName"])
            ;

            $em->persist($subscription);
            $em->flush();
        } catch (\Exception $err) {
            $logger->error("Error when saving subscription: " . $err->getMessage());
            return new JsonResponse([
                "message" => "not ok"
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return new JsonResponse([
            "message" => "ok"
        ], Response::HTTP_OK);
    }
}
