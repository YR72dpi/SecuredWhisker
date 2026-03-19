<?php

namespace App\Controller\Protected;

use App\Entity\MessageRegister;
use App\Entity\UserNotificationSubscription;
use App\Entity\User;
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
use Symfony\Component\Security\Http\Attribute\CurrentUser;

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
                ->setUserAgent($data["userAgent"])
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

    #[Route('/removeSubscription', name: 'removeSubscription', methods: ["POST"])]
    public function removeSubscription(
        #[CurrentUser()] User $user,
        Request $request,
        LoggerInterface $logger,
        EntityManagerInterface $em,
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            if (!isset($data['subsciption'])) {
                return new JsonResponse([
                    "message" => "Missing subscription parameter"
                ], Response::HTTP_BAD_REQUEST);
            }

            $subscriptionToRemove = $data['subsciption'];
            $subscriptionToRemoveEntity = null;

            foreach ($user->getUserNotificationSubscriptions() as $subscription) {
                if ($subscription->getSubscription() === $subscriptionToRemove) {
                    $subscriptionToRemoveEntity = $subscription;
                    break;
                }
            }

            if ($subscriptionToRemoveEntity === null) {
                return new JsonResponse([
                    "message" => "No subscription found"
                ], Response::HTTP_NOT_FOUND);
            }

            // ⚠️ Supprimer directement sans appeler removeUserNotificationSubscription
            $em->remove($subscriptionToRemoveEntity);
            $em->flush();

            return new JsonResponse([
                "message" => "Subscription removed successfully"
            ], Response::HTTP_OK);
        } catch (\Exception $err) {
            $logger->error("Error when removing subscription: " . $err->getMessage());
            return new JsonResponse([
                "message" => "An error occurred while removing the subscription"
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
