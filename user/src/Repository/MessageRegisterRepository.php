<?php

namespace App\Repository;

use App\Entity\MessageRegister;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Error;

/**
 * @extends ServiceEntityRepository<MessageRegister>
 */
class MessageRegisterRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MessageRegister::class);
    }

    public function getMessages(string $hashedRoomId, string $userId): array
    {

        $sql = <<<SQL
            SELECT m.message_payload
            FROM message_register as m
            WHERE 
                m.room_id = :hashedRoomId
                AND m.for_whom = :forWhom 
            ORDER BY m.id ASC
        SQL;

        $connection = $this->getEntityManager()->getConnection();
        $statement = $connection->prepare($sql);
        $statement->bindValue("hashedRoomId", $hashedRoomId);
        $statement->bindValue("forWhom", $userId);
        
        $result = $statement->executeQuery();

        return $result->fetchAllAssociative();

    }

    /**
     * Supprime tous les messages dont la date de création est d'un jour ou plus.
     *
     * Renvoie le nombre de lignes supprimées.
     *
     * Note: adapte 'created_at' si ta colonne a un autre nom.
     */
    public function deleteOlderThanOneWeek(string $limiMessagesAge): int
    {
        $cutoff = (new \DateTimeImmutable())->modify($limiMessagesAge)->format('Y-m-d H:i:s');

        if($cutoff >= (new DateTimeImmutable("now"))) throw new Error(
            "You have set a message deletion date in the future: for example,
            this means that you are trying to delete messages that were posted before tomorrow..."
        );

        $connection = $this->getEntityManager()->getConnection();

        $sql = <<<SQL
            DELETE FROM message_register
            WHERE date_time IS NOT NULL
              AND date_time <= :cutoff
        SQL;

        // executeStatement retourne le nombre de lignes affectées (DBAL 3+)
        return $connection->executeStatement($sql, [
            'cutoff' => $cutoff,
        ]);
    }

    //    /**
    //     * @return MessageRegister[] Returns an array of MessageRegister objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('m')
    //            ->andWhere('m.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('m.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?MessageRegister
    //    {
    //        return $this->createQueryBuilder('m')
    //            ->andWhere('m.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
